import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { hours, money } from "@/lib/format";
import { attendance, hoursByTutorWeek } from "@/lib/queries/stats";
import { Assignment, Session, TutorProfile, User } from "@/models";
import { NoteForm } from "../../leads/[id]/lead-actions";
import { TutorAdminControls } from "../tutor-actions";
import { StackedBarChart } from "@/components/charts";

export default async function TutorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user || user.role !== "tutor") notFound();
  const [profile, assignments, upcoming, att, trend] = await Promise.all([
    TutorProfile.findOne({ user: id }).lean(),
    Assignment.find({ tutor: id }).sort({ status: 1 }).populate("lead", "parent").lean(),
    Session.find({ tutor: id, status: "scheduled", start: { $gte: new Date() } }).sort({ start: 1 }).limit(8).lean(),
    attendance(90, { tutor: user._id }),
    hoursByTutorWeek(8, user._id),
  ]);
  const completed = await Session.aggregate<{ hours: number; revenue: number }>([
    { $match: { tutor: user._id, status: "completed" } },
    { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
    { $group: { _id: null, hours: { $sum: { $divide: [{ $subtract: ["$end", "$start"] }, 3600000] } }, revenue: { $sum: { $multiply: [{ $divide: [{ $subtract: ["$end", "$start"] }, 3600000] }, { $ifNull: [{ $first: "$a.rate" }, 0] }] } } } },
  ]);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/tutors", label: "All tutors" }}
        title={user.name}
        description={profile?.headline || user.email}
        actions={<StatusPill status={user.status === "disabled" ? "inactive" : user.onboarding?.status === "complete" ? "active" : user.status} />}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active students" value={assignments.filter((a) => a.status === "active").length} />
        <StatCard label="Lifetime hours" value={Math.round((completed[0]?.hours ?? 0) * 10) / 10} hint={money(completed[0]?.revenue ?? 0)} />
        <StatCard label="Attendance" value={att.rate == null ? "—" : `${Math.round(att.rate * 100)}%`} hint={`${att.noShow} no-shows`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel title="Hours by week">
            <StackedBarChart data={trend.data} xKey="week" series={trend.series} legend={false} />
          </Panel>
          <Panel title="Students">
            {assignments.length ? (
              <ul className="space-y-2">
                {assignments.map((a) => {
                  const lead = a.lead as unknown as { _id: { toString(): string }; parent?: { name: string } };
                  return (
                    <li key={a._id.toString()} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <Link href={`/admin/leads/${lead?._id}`} className="font-medium hover:underline">
                        {a.studentName}
                      </Link>
                      <StatusPill status={a.status} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No assignments" />
            )}
          </Panel>
          <Panel title="Upcoming">
            {upcoming.length ? (
              <ul className="space-y-2 text-sm">
                {upcoming.map((s) => (
                  <li key={s._id.toString()}>
                    {new Date(s.start).toLocaleString()} · {s.studentName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            )}
          </Panel>
          <Panel title="Notes">
            <NoteForm entityType="tutor" entityId={id} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Profile">
            <p className="text-sm">{profile?.bio || "No bio yet."}</p>
            <p className="mt-3 text-sm"><span className="text-muted-foreground">Subjects: </span>{profile?.subjects.join(", ") || "—"}</p>
            <p className="text-sm"><span className="text-muted-foreground">Cap: </span>{profile?.maxStudents ?? 4} students</p>
          </Panel>
          <Panel title="Admin">
            <TutorAdminControls
              userId={id}
              status={user.status}
              showOnSite={!!profile?.showOnSite}
              invited={user.status === "invited"}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
