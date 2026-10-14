"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { assignTutorToLead } from "@/lib/assign";
import { createLeadChannel, postSystemMessage } from "@/lib/channels";
import { purgeLeads } from "@/lib/purge";
import { ActionError, action, requireAdmin, requireStaff } from "@/lib/session";
import { CONTACT_CHANNELS, CONTACT_CHANNEL_LABELS, LEAD_STATUSES, LEAD_STATUS_LABELS, RATE_TIERS, type ContactChannel, type LeadStatus } from "@/lib/constants";
import { Assignment, Lead, Note } from "@/models";

const revalidateLead = (..._ids: Array<string | undefined>) => {
  revalidatePath("/admin", "layout");
  revalidatePath("/tutor", "layout");
};

const STATUS_TIMESTAMPS: Partial<Record<LeadStatus, "contactedAt" | "assignedAt" | "activeAt">> = {
  contacted: "contactedAt",
  matched: "assignedAt",
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
  parentEmail: z.string().trim().email().or(z.literal("")),
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

export async function assignTutor(leadId: string, input: { tutorId: string; studentId?: string; subjects?: string[]; rateTier?: string; rate?: number }) {
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

export async function deleteLead(leadId: string) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    await purgeLeads([lead._id]);
    await logActivity({ actor: admin._id, action: "lead.deleted", entityType: "user", entityId: admin._id, summary: `Deleted client ${lead.parent.name}` });
    revalidateLead();
  }, "Client deleted");
}

// one tap on Text/Call/Email records the touchpoint; new clients move to contacted
export async function logContact(leadId: string, channel: ContactChannel, note?: string) {
  return action(async () => {
    const admin = await requireAdmin();
    if (!CONTACT_CHANNELS.includes(channel)) throw new ActionError("Unknown channel.");
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Client not found.");
    const now = new Date();
    lead.contactLog.push({ by: admin._id, channel, note: note?.trim() || undefined, at: now });
    lead.lastContactAt = now;
    lead.lastActivityAt = now;
    if (lead.status === "new") {
      lead.status = "contacted";
      lead.contactedAt ??= now;
    }
    await lead.save();
    await logActivity({ actor: admin._id, action: "lead.contact", entityType: "lead", entityId: lead._id, summary: `${CONTACT_CHANNEL_LABELS[channel]} ${lead.parent.name}` });
    revalidateLead(leadId);
    return lead.contactLog[lead.contactLog.length - 1]._id.toString();
  }, "Logged");
}

export async function removeContact(leadId: string, entryId: string) {
  return action(async () => {
    await requireAdmin();
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Client not found.");
    lead.contactLog.pull({ _id: entryId });
    lead.lastContactAt = lead.contactLog.length ? lead.contactLog[lead.contactLog.length - 1].at : undefined;
    if (!lead.contactLog.length && lead.status === "contacted") lead.status = "new";
    await lead.save();
    revalidateLead(leadId);
  }, "Removed");
}

export async function setFollowUp(leadId: string, at: string | null, note?: string) {
  return action(async () => {
    await requireAdmin();
    await connectDB();
    const when = at ? new Date(at) : null;
    if (when && Number.isNaN(when.getTime())) throw new ActionError("Invalid date.");
    await Lead.updateOne(
      { _id: leadId },
      when ? { followUp: { at: when, note: note?.trim() || "" } } : { $unset: { followUp: 1 } },
    );
    revalidateLead(leadId);
  }, at ? "Follow-up set" : "Follow-up cleared");
}

export async function dismissQuiet(leadId: string) {
  return action(async () => {
    await requireAdmin();
    await connectDB();
    await Lead.updateOne({ _id: leadId }, { quietDismissedAt: new Date() });
    revalidateLead(leadId);
  });
}

const quickAddSchema = z
  .object({
    name: z.string().trim().min(2, "Add a name"),
    phone: z.string().trim().max(30).optional().default(""),
    email: z.string().trim().email("That email doesn't look right").or(z.literal("")).optional().default(""),
    studentName: z.string().trim().max(100).optional().default(""),
    grade: z.string().trim().max(10).optional().default(""),
    need: z.string().trim().max(500).optional().default(""),
    source: z.string().trim().max(60).optional().default(""),
    contacted: z.boolean().optional().default(false),
  })
  .refine((d) => d.phone || d.email, { message: "Add a phone number or email", path: ["phone"] });

export async function quickAddClient(input: z.input<typeof quickAddSchema>) {
  return action(async () => {
    const admin = await requireAdmin();
    const parsed = quickAddSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0].message);
    const d = parsed.data;
    await connectDB();
    const subjects = d.need ? d.need.split(/[,;]+/).map((x) => x.trim()).filter(Boolean) : [];
    const now = new Date();
    const lead = await Lead.create({
      parent: { name: d.name, email: d.email, phone: d.phone, preferredContact: d.phone ? "text" : "email" },
      students: [{ name: d.studentName || d.name, grade: d.grade, subjects }],
      subjects,
      services: ["Academic Tutoring"],
      source: d.source || "Added by admin",
      message: d.need,
      owner: admin._id,
      status: d.contacted ? "contacted" : "new",
      contactedAt: d.contacted ? now : undefined,
      lastContactAt: d.contacted ? now : undefined,
      contactLog: d.contacted ? [{ by: admin._id, channel: "note", note: "Reached out to us", at: now }] : [],
    });
    const channel = await createLeadChannel(lead, admin._id);
    lead.channel = channel._id;
    await lead.save();
    await postSystemMessage(channel._id, `${admin.name} added ${d.name}${d.need ? ` · ${d.need}` : ""}`);
    await logActivity({ actor: admin._id, action: "lead.created", entityType: "lead", entityId: lead._id, summary: `Added ${d.name}` });
    revalidateLead();
    return lead._id.toString();
  }, "Client added");
}

export async function setFeeStatus(assignmentId: string, status: "due" | "paid" | "waived") {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const a = await Assignment.findById(assignmentId);
    if (!a) throw new ActionError("Match not found.");
    a.set("fee.status", status);
    a.set("fee.paidAt", status === "paid" ? new Date() : undefined);
    await a.save();
    await logActivity({ actor: admin._id, action: "fee." + status, entityType: "lead", entityId: a.lead, summary: `Fee for ${a.studentName} marked ${status}` });
    revalidateLead(a.lead.toString());
  }, status === "paid" ? "Fee marked paid" : "Fee updated");
}
