import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { WeekCalendar } from "@/components/schedule/week-calendar";
import { AvailabilityEditor } from "@/components/schedule/availability-editor";
import { requireUser } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { Assignment, Session, TutorProfile } from "@/models";

export const metadata = { title: "Schedule" };

export default async function TutorSchedulePage() {
  const user = await requireUser(["tutor"]);
  await connectDB();
  const [sessions, assignments, profile] = await Promise.all([
    Session.find({ tutor: user._id, start: { $gte: new Date(Date.now() - 14 * 864e5) } }).lean(),
    Assignment.find({ tutor: user._id, status: { $ne: "ended" } }).lean(),
    TutorProfile.findOne({ user: user._id }).lean(),
  ]);
  return (
    <>
      <PageHeader title="Your schedule" description="Add sessions, log ones that already happened, and keep your weekly availability current." />
      <WeekCalendar
        canCreate
        sessions={plain(sessions).map((s) => ({
          _id: String(s._id),
          studentName: s.studentName,
          subject: s.subject ?? "",
          start: new Date(s.start).toISOString(),
          end: new Date(s.end).toISOString(),
          status: s.status,
          assignmentId: String(s.assignment),
        }))}
        assignments={plain(assignments).map((a) => ({
          _id: String(a._id),
          studentName: a.studentName,
          tutorId: user._id.toString(),
          subjects: a.subjects,
        }))}
      />
      <div className="mt-8">
        <Panel title="Weekly availability">
          <AvailabilityEditor slots={plain(profile?.availability ?? [])} />
        </Panel>
      </div>
    </>
  );
}
