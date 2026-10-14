import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { LeadStatusBadge, StatusPill } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { leadStats } from "@/lib/queries/stats";
import { DAYS, FORMATS, RATE_TIERS, TIME_BLOCKS } from "@/lib/constants";
import { fmtDate, fmtDateTime, hours, money, timeAgo } from "@/lib/format";
import { ActivityLog, Assignment, ClaimRequest, Lead, Note, Session, User } from "@/models";
import {
  AssignForm,
  ClaimDecision,
  DeleteLeadButton,
  InviteFamilyButton,
  NoteActions,
  NoteForm,
  StatusSelect,
} from "./lead-actions";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const lead = await Lead.findById(id)
    .populate("assignedTutors", "name email")
    .populate("familyUser", "name email status onboarding")
    .lean();
  if (!lead) notFound();

  const [claims, assignments, notes, activity, sessions, tutors, stats] = await Promise.all([
    ClaimRequest.find({ lead: id }).sort({ createdAt: -1 }).populate("tutor", "name email").lean(),
    Assignment.find({ lead: id }).sort({ createdAt: -1 }).populate("tutor", "name").lean(),
    Note.find({ entityType: "lead", entityId: id }).sort({ pinned: -1, createdAt: -1 }).populate("author", "name").lean(),
    ActivityLog.find({ entityType: "lead", entityId: id }).sort({ createdAt: -1 }).limit(20).populate("actor", "name").lean(),
    Session.find({ lead: id }).sort({ start: -1 }).limit(12).lean(),
    User.find({ role: "tutor", status: { $ne: "disabled" } }).select("name").sort({ name: 1 }).lean(),
    leadStats(id),
  ]);

  const format = FORMATS.find((f) => f.key === lead.format)?.label ?? lead.format;
  const family = lead.familyUser as { name: string; email: string; status: string; onboarding?: { status?: string } } | null;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/leads", label: "All leads" }}
        title={lead.parent.name}
        description={`${lead.students.map((s) => s.name).join(", ") || "No student yet"} · ${lead.subjects.slice(0, 3).join(", ")}`}
        actions={
          <>
            <LeadStatusBadge status={lead.status} />
            <StatusSelect leadId={id} status={lead.status} />
            {lead.channel ? (
              <Button variant="outline" asChild>
                <Link href={`/admin/chat?c=${lead.channel}`}>
                  <MessageSquare /> Thread
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions held" value={stats.sessions} hint={hours((stats.hours || 0) * 60)} />
        <StatCard label="Hours" value={Math.round((stats.hours || 0) * 10) / 10} hint={`${stats.upcoming} upcoming`} />
        <StatCard label="Estimated billed" value={money(stats.billed)} hint={`${stats.noShow} no-shows`} />
        <StatCard
          label="Attendance"
          value={stats.attendance == null ? "—" : `${Math.round(stats.attendance * 100)}%`}
          hint={stats.nextSession ? `Next ${fmtDateTime(stats.nextSession)}` : "No upcoming session"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel title="Family">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Parent</dt>
                <dd className="font-medium">{lead.parent.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>
                  <a className="underline" href={`mailto:${lead.parent.email}`}>
                    {lead.parent.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{lead.parent.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred contact</dt>
                <dd className="capitalize">{lead.parent.preferredContact}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Format</dt>
                <dd>
                  {format}
                  {lead.location ? ` · ${lead.location}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd>{lead.source || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Goals</dt>
                <dd>{lead.goals || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Availability</dt>
                <dd>
                  {lead.availability?.length
                    ? lead.availability
                        .map((a) => `${DAYS[a.day ?? 0]} ${TIME_BLOCKS.find((b) => b.key === a.block)?.label}`)
                        .join(", ")
                    : lead.availabilityNotes || "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Students">
            <div className="space-y-3">
              {lead.students.map((s) => (
                <div key={s._id.toString()} className="rounded-lg border p-3">
                  <p className="font-semibold">
                    {s.name} <span className="font-normal text-muted-foreground">· grade {s.grade}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{s.school || "School not listed"}</p>
                  <p className="mt-1 text-sm">{s.subjects.join(", ") || "No subjects"}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Assignments">
            {assignments.length ? (
              <ul className="space-y-3">
                {assignments.map((a) => {
                  const tutor = a.tutor as unknown as { name: string };
                  return (
                    <li key={a._id.toString()} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div>
                        <p className="font-medium">
                          {a.studentName} · {tutor?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.subjects.join(", ")} · ${a.rate}/hr · {RATE_TIERS.find((r) => r.key === a.rateTier)?.label}
                        </p>
                      </div>
                      <StatusPill status={a.status} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No tutor assigned yet" description="Approve a claim or assign someone below." />
            )}
          </Panel>

          <Panel title="Claims">
            {claims.length ? (
              <ul className="space-y-3">
                {claims.map((c) => {
                  const tutor = c.tutor as unknown as { name: string };
                  return (
                    <li key={c._id.toString()} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{tutor?.name}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</p>
                          {c.message ? <p className="mt-1 text-sm">{c.message}</p> : null}
                        </div>
                        <StatusPill status={c.status} />
                      </div>
                      {c.status === "pending" ? <div className="mt-3"><ClaimDecision claimId={c._id.toString()} /></div> : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No claims yet.</p>
            )}
          </Panel>

          <Panel title="Sessions" bodyClassName="p-0">
            {sessions.length ? (
              <ul className="divide-y">
                {sessions.map((s) => (
                  <li key={s._id.toString()} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">{fmtDateTime(s.start)}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                    <StatusPill status={s.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState title="No sessions yet" />
              </div>
            )}
          </Panel>

          <Panel title="Notes">
            <NoteForm entityType="lead" entityId={id} />
            <ul className="mt-4 space-y-3">
              {notes.map((n) => {
                const author = n.author as unknown as { name: string };
                return (
                  <li key={n._id.toString()} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {author?.name} · {timeAgo(n.createdAt)}
                        {n.pinned ? " · pinned" : ""}
                      </p>
                      <NoteActions noteId={n._id.toString()} pinned={!!n.pinned} />
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Assign a tutor">
            <AssignForm
              leadId={id}
              tutors={plain(tutors).map((t) => ({ _id: String(t._id), name: t.name }))}
              students={lead.students.map((s) => ({ _id: s._id.toString(), name: s.name }))}
            />
            <div className="mt-4 space-y-2 border-t pt-4">
              <InviteFamilyButton leadId={id} disabled={!assignments.length} />
              {family ? (
                <p className="text-xs text-muted-foreground">
                  Portal: {family.email} · {family.status}
                  {family.onboarding?.status === "complete" ? " · onboarded" : " · onboarding"}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Family has no portal account until you invite them.</p>
              )}
            </div>
          </Panel>
          <Panel title="Timeline" bodyClassName="p-0">
            <ActivityFeed items={activity as never} />
          </Panel>
          <div className="flex justify-end">
            <DeleteLeadButton leadId={id} />
          </div>
          <p className="text-xs text-muted-foreground">Created {fmtDate(lead.createdAt)}</p>
        </div>
      </div>
    </>
  );
}
