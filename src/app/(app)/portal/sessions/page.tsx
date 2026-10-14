import { PageHeader } from "@/components/page-header";
import { WeekCalendar } from "@/components/schedule/week-calendar";
import { requireUser } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { Session } from "@/models";

export const metadata = { title: "Sessions" };

export default async function PortalSessionsPage() {
  const user = await requireUser(["family"]);
  await connectDB();
  const sessions = user.lead
    ? await Session.find({ lead: user.lead, start: { $gte: new Date(Date.now() - 21 * 864e5) } }).lean()
    : [];
  return (
    <>
      <PageHeader title="Sessions" description="Your upcoming and recent tutoring sessions. Ask an admin if you need to reschedule." />
      <WeekCalendar
        readOnly
        sessions={plain(sessions).map((s) => ({
          _id: String(s._id),
          studentName: s.studentName,
          subject: s.subject ?? "",
          start: new Date(s.start).toISOString(),
          end: new Date(s.end).toISOString(),
          status: s.status,
        }))}
        assignments={[]}
      />
    </>
  );
}
