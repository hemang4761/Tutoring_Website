"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { findConflicts } from "@/lib/conflicts";
import { connectDB } from "@/lib/db";
import { ActionError, action, requireStaff, requireUser } from "@/lib/session";
import { SESSION_STATUSES, type SessionStatus } from "@/lib/constants";
import { Assignment, Session, TutorProfile } from "@/models";

const refresh = () => {
  revalidatePath("/admin/schedule");
  revalidatePath("/tutor/schedule");
  revalidatePath("/portal");
  revalidatePath("/portal/sessions");
  revalidatePath("/admin", "layout");
  revalidatePath("/tutor", "layout");
};

const sessionSchema = z.object({
  assignmentId: z.string(),
  start: z.string(),
  end: z.string(),
  subject: z.string().optional().default(""),
  location: z.string().optional().default(""),
  meetingLink: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  recurrenceWeeks: z.number().int().min(1).max(24).optional(),
});

function parseRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) throw new ActionError("Invalid date.");
  if (e <= s) throw new ActionError("End time must be after the start.");
  if (e.getTime() - s.getTime() > 6 * 3600_000) throw new ActionError("Sessions can't be longer than 6 hours.");
  return { start: s, end: e };
}

async function assertCanEdit(userId: string, role: string, assignmentId: string) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ActionError("Assignment not found.");
  if (role !== "admin" && assignment.tutor.toString() !== userId) throw new ActionError("Not allowed.");
  return assignment;
}

export async function createSession(input: z.input<typeof sessionSchema>) {
  return action(async () => {
    const user = await requireStaff();
    const data = sessionSchema.parse(input);
    await connectDB();
    const assignment = await assertCanEdit(user._id.toString(), user.role, data.assignmentId);
    const { start, end } = parseRange(data.start, data.end);
    const conflicts = await findConflicts(assignment.tutor, start, end);
    if (conflicts.length) {
      throw new ActionError(`Conflicts with ${conflicts[0].studentName} at that time.`);
    }
    const weeks = data.recurrenceWeeks ?? 1;
    const recurrenceId = weeks > 1 ? crypto.randomUUID() : undefined;
    const created = [];
    for (let i = 0; i < weeks; i++) {
      const s = new Date(start.getTime() + i * 7 * 864e5);
      const e = new Date(end.getTime() + i * 7 * 864e5);
      if (i > 0) {
        const clash = await findConflicts(assignment.tutor, s, e);
        if (clash.length) continue;
      }
      created.push(
        await Session.create({
          assignment: assignment._id,
          lead: assignment.lead,
          tutor: assignment.tutor,
          studentName: assignment.studentName,
          subject: data.subject || assignment.subjects[0],
          start: s,
          end: e,
          location: data.location,
          meetingLink: data.meetingLink,
          notes: data.notes,
          recurrenceId,
          createdBy: user._id,
        }),
      );
    }
    if (!created.length) throw new ActionError("Couldn't create any sessions (all conflicted).");
    await logActivity({
      actor: user._id,
      action: "session.created",
      entityType: "session",
      entityId: created[0]._id,
      summary: `Scheduled ${assignment.studentName} × ${created.length}`,
    });
    refresh();
    return created[0]._id.toString();
  }, "Session scheduled");
}

export async function moveSession(sessionId: string, start: string, end: string) {
  return action(async () => {
    const user = await requireStaff();
    await connectDB();
    const session = await Session.findById(sessionId);
    if (!session) throw new ActionError("Session not found.");
    if (user.role !== "admin" && session.tutor.toString() !== user._id.toString()) throw new ActionError("Not allowed.");
    if (session.status !== "scheduled") throw new ActionError("Only upcoming sessions can be moved.");
    const range = parseRange(start, end);
    const conflicts = await findConflicts(session.tutor, range.start, range.end, session._id);
    if (conflicts.length) throw new ActionError(`Conflicts with ${conflicts[0].studentName}.`);
    session.start = range.start;
    session.end = range.end;
    await session.save();
    refresh();
  }, "Session moved");
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus, notes?: string, privateNotes?: string) {
  return action(async () => {
    const user = await requireStaff();
    if (!SESSION_STATUSES.includes(status)) throw new ActionError("Unknown status.");
    await connectDB();
    const session = await Session.findById(sessionId);
    if (!session) throw new ActionError("Session not found.");
    if (user.role !== "admin" && session.tutor.toString() !== user._id.toString()) throw new ActionError("Not allowed.");
    session.status = status;
    if (notes !== undefined) session.notes = notes;
    if (privateNotes !== undefined) session.privateNotes = privateNotes;
    await session.save();
    refresh();
    revalidatePath(`/admin/leads/${session.lead}`);
    revalidatePath("/tutor/students");
  }, "Session updated");
}

export async function deleteSession(sessionId: string) {
  return action(async () => {
    const user = await requireStaff();
    await connectDB();
    const session = await Session.findById(sessionId);
    if (!session) throw new ActionError("Session not found.");
    if (user.role !== "admin" && session.tutor.toString() !== user._id.toString()) throw new ActionError("Not allowed.");
    if (session.status === "completed") throw new ActionError("Completed sessions stay on the record.");
    await session.deleteOne();
    refresh();
  }, "Session removed");
}

const slotSchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function saveAvailability(slots: z.input<typeof slotSchema>[]) {
  return action(async () => {
    const user = await requireUser(["tutor"]);
    const parsed = z.array(slotSchema).parse(slots);
    for (const s of parsed) {
      if (s.end <= s.start) throw new ActionError("Each window needs an end after its start.");
    }
    await connectDB();
    await TutorProfile.findOneAndUpdate({ user: user._id }, { $set: { availability: parsed } }, { upsert: true });
    revalidatePath("/tutor/schedule");
    revalidatePath("/tutor/profile");
    revalidatePath("/onboarding");
    revalidatePath("/admin/schedule");
  }, "Availability saved");
}
