import Link from "next/link";
import { addDays } from "date-fns";
import { AlertTriangle, CalendarClock, Clock, DollarSign, Hand, Inbox, LifeBuoy, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { StackedBarChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { LeadStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { NewLeadDialog } from "./leads/new-lead-dialog";
import { requireAdmin } from "@/lib/session";
import { getKpis, leadsByWeek } from "@/lib/queries/stats";
import { firstName, fmtDateTime, fmtTimeRange, money, timeAgo } from "@/lib/format";
import { ActivityLog, AdminRequest, ClaimRequest, Lead, Session } from "@/models";

export const metadata = { title: "Dashboard" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const now = new Date();
  const [kpis, trend, claims, requests, staleLeads, upcoming, activity] = await Promise.all([
    getKpis(),
    leadsByWeek(10),
    ClaimRequest.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate<{ tutor: { name: string } }>("tutor", "name")
      .populate<{ lead: { _id: string; parent: { name: string }; subjects: string[] } }>("lead", "parent subjects")
      .lean(),
    AdminRequest.find({ status: { $in: ["open", "in_progress"] } })
      .sort({ priority: -1, createdAt: 1 })
      .limit(4)
      .populate<{ requester: { name: string } }>("requester", "name")
      .lean(),
    Lead.find({ status: "new", createdAt: { $lt: new Date(now.getTime() - 24 * 3600_000) } })
      .sort({ createdAt: 1 })
      .limit(5)
      .lean(),
    Session.find({ status: "scheduled", start: { $gte: now, $lt: addDays(now, 7) } })
      .sort({ start: 1 })
      .limit(8)
      .populate<{ tutor: { name: string } }>("tutor", "name")
      .lean(),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate<{ actor: { name: string } | null }>("actor", "name").lean(),
  ]);

  const delta = kpis.newThisWeek - kpis.newLastWeek;
  const attentionCount = claims.length + requests.length + staleLeads.length;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)}
        title={`${greeting()}, ${firstName(user.name)}`}
        description="Here's what's happening across BCLearns."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/schedule">
                <CalendarClock /> Schedule
              </Link>
            </Button>
            <NewLeadDialog
              trigger={
                <Button>
                  <Plus /> New lead
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="navy"
          label="New leads this week"
          value={kpis.newThisWeek}
          icon={Inbox}
          href="/admin/leads"
          hint={delta === 0 ? "Same as last week" : `${delta > 0 ? "+" : ""}${delta} vs last week`}
        />
        <StatCard label="Open on claim board" value={kpis.openLeads} icon={Hand} href="/admin/leads?status=open" hint={`${kpis.pendingClaims} claims awaiting review`} />
        <StatCard label="Active students" value={kpis.activeStudents} icon={Users} href="/admin/assignments" hint={`${kpis.activeTutors} active tutors`} />
        <StatCard
          tone="gold"
          label="Billed this month"
          value={money(kpis.revenueThisMonth)}
          icon={DollarSign}
          href="/admin/reports"
          hint={`${Math.round(kpis.hoursThisMonth * 10) / 10} hours tutored`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Lead volume"
          description="New leads per week, by source"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/reports">Full report</Link>
            </Button>
          }
        >
          <StackedBarChart data={trend.data} xKey="week" series={trend.sources} />
        </Panel>

        <Panel
          title="Needs attention"
          description={attentionCount ? `${attentionCount} items waiting on an admin` : "You're all caught up"}
          bodyClassName="p-0"
        >
          {attentionCount === 0 ? (
            <div className="p-5">
              <EmptyState title="Nothing waiting" description="New claims, requests, and stale leads show up here." />
            </div>
          ) : (
            <ul className="divide-y">
              {claims.map((c) => (
                <li key={c._id.toString()}>
                  <Link href="/admin/claims" className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                      <Hand className="size-4" />
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">
                        {c.tutor?.name} claimed {c.lead?.parent?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.lead?.subjects?.slice(0, 2).join(", ")} · {timeAgo(c.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {requests.map((r) => (
                <li key={r._id.toString()}>
                  <Link href={`/admin/requests?open=${r._id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      <LifeBuoy className="size-4" />
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.requester?.name} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {staleLeads.map((l) => (
                <li key={l._id.toString()}>
                  <Link href={`/admin/leads/${l._id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{l.parent.name} not contacted yet</p>
                      <p className="text-xs text-muted-foreground">Submitted {timeAgo(l.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Coming up this week"
          description={`${kpis.upcoming} sessions in the next 7 days`}
          bodyClassName="p-0"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/schedule">Open schedule</Link>
            </Button>
          }
        >
          {upcoming.length ? (
            <ul className="divide-y">
              {upcoming.map((s) => (
                <li key={s._id.toString()} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-36 shrink-0">
                    <p className="text-sm font-semibold">{fmtDateTime(s.start).split(" · ")[0]}</p>
                    <p className="text-xs text-muted-foreground">{fmtTimeRange(s.start, s.end)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.studentName} <span className="font-normal text-muted-foreground">· {s.subject}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">with {s.tutor?.name}</p>
                  </div>
                  <Link href={`/admin/leads/${s.lead}`} className="text-xs font-medium text-primary hover:underline">
                    Client
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState icon={Clock} title="No sessions scheduled" description="Sessions tutors add to the schedule appear here." />
            </div>
          )}
        </Panel>
        <Panel title="Recent activity" bodyClassName="p-0">
          <ActivityFeed items={activity as never} showEntityLinks />
        </Panel>
      </div>

      {staleLeads.length === 0 && kpis.openLeads > 0 ? (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed p-4 text-sm">
          <span className="flex items-center gap-2">
            <LeadStatusBadge status="open" /> {kpis.openLeads} leads are waiting for a tutor to claim them.
          </span>
          <Link href="/admin/leads?view=board" className="font-medium text-primary hover:underline">
            View pipeline
          </Link>
        </div>
      ) : null}
    </>
  );
}
