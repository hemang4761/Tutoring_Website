"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { purgeLeads, purgeTutor } from "@/lib/purge";
import { ActionError, action, requireAdmin } from "@/lib/session";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/constants";
import { Assignment, Lead, Session, User } from "@/models";

const refresh = () => {
  revalidatePath("/admin", "layout");
  revalidatePath("/tutor", "layout");
  revalidatePath("/");
};

export async function bulkSetStatus(ids: string[], status: string) {
  return action(async () => {
    const admin = await requireAdmin();
    if (!LEAD_STATUSES.includes(status as LeadStatus)) throw new ActionError("Unknown status.");
    await connectDB();
    const res = await Lead.updateMany({ _id: { $in: ids } }, { status, lastActivityAt: new Date() });
    await logActivity({ actor: admin._id, action: "lead.bulk_status", entityType: "user", entityId: admin._id, summary: `Set ${res.modifiedCount} clients to ${status}` });
    refresh();
    return res.modifiedCount;
  }, "Updated");
}

export async function bulkDeleteClients(ids: string[]) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const n = await purgeLeads(ids);
    await logActivity({ actor: admin._id, action: "lead.bulk_delete", entityType: "user", entityId: admin._id, summary: `Deleted ${n} clients` });
    refresh();
    return n;
  }, "Deleted");
}

export async function deleteTutor(userId: string) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const user = await User.findOne({ _id: userId, role: "tutor" });
    if (!user) throw new ActionError("Tutor not found.");
    await purgeTutor(user._id);
    await logActivity({ actor: admin._id, action: "tutor.deleted", entityType: "user", entityId: user._id, summary: `Deleted tutor ${user.name}` });
    refresh();
  }, "Tutor deleted");
}

// removes a match entirely, including its sessions; use End instead to keep the history
export async function deleteAssignment(assignmentId: string) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const a = await Assignment.findById(assignmentId);
    if (!a) throw new ActionError("Match not found.");
    await Session.deleteMany({ assignment: a._id });
    await a.deleteOne();
    const still = await Assignment.exists({ lead: a.lead, tutor: a.tutor });
    if (!still) await Lead.updateOne({ _id: a.lead }, { $pull: { assignedTutors: a.tutor } });
    await logActivity({ actor: admin._id, action: "assignment.deleted", entityType: "lead", entityId: a.lead, summary: `Removed match for ${a.studentName}` });
    refresh();
  }, "Match removed");
}

export async function removeStudent(leadId: string, studentId: string) {
  return action(async () => {
    await requireAdmin();
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Client not found.");
    if (lead.students.length <= 1) throw new ActionError("A client needs at least one student. Delete the client instead.");
    lead.students.pull({ _id: studentId });
    lead.subjects = [...new Set(lead.students.flatMap((s) => s.subjects))];
    await lead.save();
    refresh();
  }, "Student removed");
}

export async function demoDataCounts() {
  await requireAdmin();
  await connectDB();
  const [clients, sessions] = await Promise.all([
    Lead.countDocuments({ tags: "demo" }),
    Session.countDocuments({ lead: { $in: await Lead.find({ tags: "demo" }).distinct("_id") } }),
  ]);
  return { clients, sessions };
}

// clears every made-up family and their sessions; real tutors and anything you added stay
export async function purgeDemoData() {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const ids = await Lead.find({ tags: "demo" }).distinct("_id");
    const n = await purgeLeads(ids);
    await logActivity({ actor: admin._id, action: "demo.purged", entityType: "user", entityId: admin._id, summary: `Removed ${n} demo clients` });
    refresh();
    return n;
  }, "Demo data removed");
}
