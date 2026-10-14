import "server-only";
import type { Types } from "mongoose";
import { addDays, subDays } from "date-fns";
import { connectDB } from "@/lib/db";
import { Assignment, Session, User } from "@/models";
import type { ScheduleSession, ScheduleTutor } from "@/components/schedule/master-schedule";
import type { AssignmentOption } from "@/components/admin/dialogs";

// everything the schedule needs; pass a tutor id to lock it to one person
export async function getScheduleData(tutorId?: Types.ObjectId) {
  await connectDB();
  const now = new Date();
  const own = tutorId ? { tutor: tutorId } : {};
  const [sessions, tutors, assignments] = await Promise.all([
    Session.find({ ...own, start: { $gte: subDays(now, 120), $lt: addDays(now, 180) } })
      .sort({ start: 1 })
      .populate<{ tutor: { _id: unknown; name: string } }>("tutor", "name")
      .lean(),
    User.find({ role: "tutor", status: { $ne: "disabled" }, ...(tutorId ? { _id: tutorId } : {}) })
      .select("name")
      .sort({ name: 1 })
      .lean(),
    Assignment.find({ ...own, status: "active" })
      .populate<{ tutor: { _id: unknown; name: string } }>("tutor", "name")
      .sort({ studentName: 1 })
      .lean(),
  ]);
  return {
    sessions: sessions.map(
      (s): ScheduleSession => ({
        id: String(s._id),
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        status: s.status,
        student: s.studentName,
        subject: s.subject ?? "",
        tutorId: String(s.tutor?._id ?? ""),
        tutor: s.tutor?.name ?? "",
        leadId: String(s.lead),
        location: s.location || s.meetingLink || "",
        notes: s.notes ?? "",
        privateNotes: s.privateNotes ?? "",
      }),
    ),
    tutors: tutors.map((t): ScheduleTutor => ({ id: String(t._id), name: t.name })),
    assignments: assignments.map(
      (a): AssignmentOption => ({
        id: String(a._id),
        student: a.studentName,
        tutor: a.tutor?.name ?? "",
        tutorId: String(a.tutor?._id ?? ""),
        subject: a.subjects?.[0] ?? "",
        leadId: String(a.lead),
      }),
    ),
  };
}
