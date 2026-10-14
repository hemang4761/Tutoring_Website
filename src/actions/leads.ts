"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { assignTutorToLead } from "@/lib/assign";
import { createLeadChannel, postSystemMessage } from "@/lib/channels";
import { sendInvite } from "@/lib/invites";
import { ActionError, action, requireAdmin, requireStaff } from "@/lib/session";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, RATE_TIERS, type LeadStatus } from "@/lib/constants";
import { Assignment, Channel, ClaimRequest, Lead, Message, Note, Session, User } from "@/models";

const revalidateLead = (id?: string) => {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/tutor", "layout");
};

const STATUS_TIMESTAMPS: Partial<Record<LeadStatus, "contactedAt" | "assignedAt" | "activeAt">> = {
  contacted: "contactedAt",
  assigned: "assignedAt",
  active: "activeAt",
};

export async function updateLeadStatus(leadId: string, status: string, reason?: string) {
  return action(async () => {
    const admin = await requireAdmin();
    if (!LEAD_STATUSES.includes(status as LeadStatus)) throw new ActionError("Unknown status.");
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    const from = lead.status;
    if (from === status) return;
    lead.status = status as LeadStatus;
    const stamp = STATUS_TIMESTAMPS[status as LeadStatus];
    if (stamp && !lead[stamp]) lead[stamp] = new Date();
    if (status === "lost") lead.lostReason = reason || lead.lostReason;
    lead.lastActivityAt = new Date();
    await lead.save();
    const summary = `Status changed from ${LEAD_STATUS_LABELS[from]} to ${LEAD_STATUS_LABELS[status as LeadStatus]}${reason ? ` (${reason})` : ""}`;
    await logActivity({ actor: admin._id, action: "lead.status", entityType: "lead", entityId: lead._id, summary, meta: { from, to: status } });
    await postSystemMessage(lead.channel, `${admin.name}: ${summary}`);
    revalidateLead(leadId);
  }, "Status updated");
}

const leadEditSchema = z.object({
  parentName: z.string().trim().min(2),
  parentEmail: z.string().trim().email(),
  parentPhone: z.string().trim().max(30).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  goals: z.string().trim().max(2000).optional().default(""),
  rateTier: z.enum(RATE_TIERS.map((r) => r.key) as [string, ...string[]]).optional(),
  tags: z.string().optional().default(""),
  source: z.string().trim().max(60).optional().default(""),
});

export async function updateLeadDetails(leadId: string, input: z.input<typeof leadEditSchema>) {
  return action(async () => {
    const admin = await requireAdmin();
    const data = leadEditSchema.parse(input);
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    lead.parent.name = data.parentName;
    lead.parent.email = data.parentEmail;
    lead.parent.phone = data.parentPhone;
    lead.location = data.location;
    lead.goals = data.goals;
    if (data.rateTier) lead.rateTier = data.rateTier as typeof lead.rateTier;
    lead.source = data.source;
    lead.tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    await lead.save();
    await logActivity({ actor: admin._id, action: "lead.updated", entityType: "lead", entityId: lead._id, summary: "Lead details updated" });
    revalidateLead(leadId);
  }, "Lead saved");
}

const studentEditSchema = z.object({
  name: z.string().trim().min(1),
  grade: z.string().trim().min(1),
  school: z.string().trim().optional().default(""),
  subjects: z.array(z.string()).default([]),
  notes: z.string().trim().optional().default(""),
});

export async function upsertStudent(leadId: string, studentId: string | null, input: z.input<typeof studentEditSchema>) {
  return action(async () => {
    await requireAdmin();
    const data = studentEditSchema.parse(input);
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    if (studentId) {
      const s = lead.students.id(studentId);
      if (!s) throw new ActionError("Student not found.");
      s.set(data);
    } else {
      lead.students.push(data);
    }
    lead.subjects = [...new Set(lead.students.flatMap((s) => s.subjects))];
    await lead.save();
    revalidateLead(leadId);
  }, "Student saved");
}

export async function addNote(entityType: "lead" | "tutor" | "assignment", entityId: string, body: string) {
  return action(async () => {
    const user = await requireStaff();
    const text = body.trim();
    if (!text) throw new ActionError("Note can't be empty.");
    if (text.length > 5000) throw new ActionError("Note is too long.");
    if (user.role !== "admin") {
      // tutors can only add notes to leads they are assigned to
      const ok = entityType === "lead" && (await Lead.exists({ _id: entityId, assignedTutors: user._id }));
      if (!ok) throw new ActionError("Not allowed.");
    }
    await connectDB();
    await Note.create({ entityType, entityId, author: user._id, body: text });
    if (entityType === "lead") await Lead.updateOne({ _id: entityId }, { lastActivityAt: new Date() });
    revalidateLead(entityType === "lead" ? entityId : undefined);
    revalidatePath(`/admin/tutors/${entityId}`);
    revalidatePath(`/tutor/students`);
  }, "Note added");
}

export async function toggleNotePin(noteId: string) {
  return action(async () => {
    await requireAdmin();
    const note = await Note.findById(noteId);
    if (!note) throw new ActionError("Note not found.");
    note.pinned = !note.pinned;
    await note.save();
    revalidatePath("/admin", "layout");
  });
}

export async function deleteNote(noteId: string) {
  return action(async () => {
    const user = await requireStaff();
    const note = await Note.findById(noteId);
    if (!note) throw new ActionError("Note not found.");
    if (user.role !== "admin" && note.author.toString() !== user._id.toString()) throw new ActionError("Not allowed.");
    await note.deleteOne();
    revalidatePath("/admin", "layout");
    revalidatePath("/tutor", "layout");
  }, "Note deleted");
}

const manualLeadSchema = z.object({
  parentName: z.string().trim().min(2, "Parent name is required"),
  parentEmail: z.string().trim().email("Valid email required"),
  parentPhone: z.string().trim().max(30).optional().default(""),
  studentName: z.string().trim().min(1, "Student name is required"),
  grade: z.string().min(1, "Grade is required"),
  subjects: z.array(z.string()).min(1, "Pick at least one subject"),
  source: z.string().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

export async function createManualLead(input: z.input<typeof manualLeadSchema>) {
  return action(async () => {
    const admin = await requireAdmin();
    const parsed = manualLeadSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0].message);
    const d = parsed.data;
    await connectDB();
    const lead = await Lead.create({
      parent: { name: d.parentName, email: d.parentEmail, phone: d.parentPhone },
      students: [{ name: d.studentName, grade: d.grade, subjects: d.subjects }],
      subjects: d.subjects,
      services: ["Academic tutoring"],
      source: d.source,
      message: d.notes,
      owner: admin._id,
      status: "new",
    });
    const channel = await createLeadChannel(lead, admin._id);
    lead.channel = channel._id;
    await lead.save();
    await postSystemMessage(channel._id, `${admin.name} added this lead manually: ${d.studentName} (grade ${d.grade}) · ${d.subjects.join(", ")}`);
    await logActivity({ actor: admin._id, action: "lead.created", entityType: "lead", entityId: lead._id, summary: `Lead added manually by ${admin.name}` });
    revalidateLead();
    return lead._id.toString();
  }, "Lead created");
}

export async function assignTutor(leadId: string, input: { tutorId: string; studentId?: string; subjects?: string[]; rateTier?: string }) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    await assignTutorToLead({ leadId, actorId: admin._id, ...input, studentId: input.studentId || undefined });
    revalidateLead(leadId);
  }, "Tutor assigned");
}

export async function updateAssignment(assignmentId: string, input: { status?: string; rateTier?: string; rate?: number; subjects?: string[] }) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const a = await Assignment.findById(assignmentId);
    if (!a) throw new ActionError("Assignment not found.");
    if (input.status && ["active", "paused", "ended"].includes(input.status)) {
      a.status = input.status as typeof a.status;
      if (input.status === "ended") a.endDate = new Date();
    }
    if (input.rateTier) a.rateTier = input.rateTier as typeof a.rateTier;
    if (typeof input.rate === "number" && input.rate >= 0) a.rate = input.rate;
    if (input.subjects) a.subjects = input.subjects;
    await a.save();
    if (a.status === "ended") {
      const stillActive = await Assignment.exists({ lead: a.lead, tutor: a.tutor, status: { $ne: "ended" } });
      if (!stillActive) await Lead.updateOne({ _id: a.lead }, { $pull: { assignedTutors: a.tutor } });
    }
    await logActivity({ actor: admin._id, action: "assignment.updated", entityType: "lead", entityId: a.lead, summary: `Assignment for ${a.studentName} updated (${a.status}, $${a.rate}/hr)` });
    revalidateLead(a.lead.toString());
  }, "Assignment updated");
}

export async function inviteFamily(leadId: string) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    if (!(await Assignment.exists({ lead: lead._id, status: { $ne: "ended" } }))) {
      throw new ActionError("Assign a tutor before creating the family's portal account.");
    }
    let user = lead.familyUser ? await User.findById(lead.familyUser) : await User.findOne({ email: lead.parent.email });
    if (user && user.role !== "family") throw new ActionError("That email already belongs to a staff account.");
    if (user && user.status === "active") throw new ActionError("This family already has an active account.");
    if (!user) {
      user = await User.create({
        name: lead.parent.name,
        email: lead.parent.email,
        phone: lead.parent.phone,
        role: "family",
        status: "invited",
        lead: lead._id,
      });
    }
    lead.familyUser = user._id;
    if (["assigned", "claimed", "open", "contacted", "new"].includes(lead.status)) lead.status = "onboarding";
    await lead.save();
    await sendInvite(user);
    await logActivity({ actor: admin._id, action: "family.invited", entityType: "lead", entityId: lead._id, summary: `Portal invite sent to ${user.email}` });
    await postSystemMessage(lead.channel, `${admin.name} sent the family portal invite.`);
    revalidateLead(leadId);
  }, "Invite sent");
}

export async function deleteLead(leadId: string) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    if (await Session.exists({ lead: lead._id })) throw new ActionError("This lead has sessions. Mark it lost instead of deleting.");
    const channels = await Channel.find({ lead: lead._id }).select("_id");
    await Message.deleteMany({ channel: { $in: channels.map((c) => c._id) } });
    await Channel.deleteMany({ lead: lead._id });
    await Promise.all([
      ClaimRequest.deleteMany({ lead: lead._id }),
      Assignment.deleteMany({ lead: lead._id }),
      Note.deleteMany({ entityType: "lead", entityId: lead._id }),
    ]);
    await lead.deleteOne();
    await logActivity({ actor: admin._id, action: "lead.deleted", entityType: "lead", entityId: lead._id, summary: `Deleted lead for ${lead.parent.name}` });
    revalidateLead();
  }, "Lead deleted");
}
