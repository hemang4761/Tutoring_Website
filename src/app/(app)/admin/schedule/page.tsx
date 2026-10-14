import { PageHeader } from "@/components/page-header";
import { WeekCalendar } from "@/components/schedule/week-calendar";
import { requireAdmin } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { Assignment, Session, User } from "@/models";

export const metadata = { title: "Master schedule" };

export default async function AdminSchedulePage() {
  await requireAdmin();
  await connectDB();
  const [sessions, tutors, assignments] = await Promise.all([
    Session.find({ start: { $gte: new Date(Date.now() - 14 * 864e5) } }).sort({ start: 1 }).lean(),
    User.find({ role: "tutor", status: { $ne: "disabled" } }).select("name").sort({ name: 1 }).lean(),
    Assignment.find({ status: { $ne: "ended" } }).lean(),
  ]);
  return (
    <>
      <PageHeader title="Master schedule" description="Every tutor's week in one place. Click a slot to add or move a session." />
      <WeekCalendar
        canCreate
        resources={tutors.map((t) => ({ id: t._id.toString(), name: t.name }))}
        sessions={plain(sessions).map((s) => ({
          _id: String(s._id),
          studentName: s.studentName,
          subject: s.subject ?? "",
          start: new Date(s.start).toISOString(),
          end: new Date(s.end).toISOString(),
          status: s.status,
          tutorId: String(s.tutor),
          assignmentId: String(s.assignment),
        }))}
        assignments={plain(assignments).map((a) => ({
          _id: String(a._id),
          studentName: a.studentName,
          tutorId: String(a.tutor),
          subjects: a.subjects,
        }))}
      />
    </>
  );
}
