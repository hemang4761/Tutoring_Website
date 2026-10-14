import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { SessionStatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { firstName, fmtDateTime, hours, money } from "@/lib/format";
import { leadStats } from "@/lib/queries/stats";
import { Assignment, Lead, Session, TutorProfile } from "@/models";

export const metadata = { title: "Family portal" };

export default async function PortalHome() {
  const user = await requireUser(["family"]);
  await connectDB();
  if (!user.lead) {
    return <PageHeader title="Welcome" description="Your account isn't linked to a student yet. Email us at contact.bclearns@gmail.com." />;
  }
  const [lead, assignments, upcoming, recent] = await Promise.all([
    Lead.findById(user.lead).lean(),
    Assignment.find({ lead: user.lead, status: { $ne: "ended" } }).populate("tutor", "name email phone").lean(),
    Session.find({ lead: user.lead, status: "scheduled", start: { $gte: new Date() } }).sort({ start: 1 }).limit(5).lean(),
    Session.find({ lead: user.lead, status: { $in: ["completed", "canceled", "no_show"] } }).sort({ start: -1 }).limit(5).lean(),
  ]);
  const stats = await leadStats(user.lead);
  const tutorIds = assignments.map((a) => {
    const t = a.tutor as unknown;
    if (t && typeof t === "object" && "_id" in t) return String((t as { _id: { toString(): string } })._id);
    return String(t);
  });
  const profiles = await TutorProfile.find({ user: { $in: tutorIds } }).lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  return (
    <>
      <PageHeader title={`Hi, ${firstName(user.name)}`} description={`You're working with BCLearns${lead ? ` for ${lead.students.map((s) => s.name).join(", ")}` : ""}.`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Hours so far" value={Math.round((stats.hours || 0) * 10) / 10} hint={`${stats.sessions} sessions`} />
        <StatCard label="Upcoming" value={stats.upcoming} />
        <StatCard label="Attendance" value={stats.attendance == null ? "—" : `${Math.round(stats.attendance * 100)}%`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Your tutor">
          {assignments.length ? (
            <div className="space-y-4">
              {assignments.map((a) => {
                const tutor = a.tutor as unknown as { _id: { toString(): string }; name: string; email: string; phone?: string };
                const p = profileByUser.get(tutor?._id?.toString());
                return (
                  <div key={a._id.toString()} className="flex gap-4">
                    {p?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="size-16 rounded-xl object-cover" />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-xl bg-navy font-heading text-lg font-bold text-gold">
                        {tutor?.name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{tutor?.name}</p>
                      <p className="text-sm text-muted-foreground">{p?.headline}</p>
                      <p className="mt-1 text-sm">{a.subjects.join(", ")} · {money(a.rate)}/hr</p>
                      <p className="text-xs text-muted-foreground">{tutor?.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No tutor assigned yet" />
          )}
        </Panel>
        <Panel title="Coming up">
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map((s) => (
                <li key={s._id.toString()} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{s.studentName}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(s.start)}</p>
                  </div>
                  <SessionStatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No upcoming sessions" />
          )}
        </Panel>
      </div>
      <Panel className="mt-6" title="Recent sessions">
        {recent.length ? (
          <ul className="space-y-3">
            {recent.map((s) => (
              <li key={s._id.toString()} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{fmtDateTime(s.start)}</p>
                  <SessionStatusBadge status={s.status} />
                </div>
                {s.notes ? <p className="mt-1 text-muted-foreground">{s.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Session notes will appear here after your first meeting.</p>
        )}
      </Panel>
    </>
  );
}
