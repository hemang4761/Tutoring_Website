"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/status-badge";
import { ContactButtons } from "@/components/admin/contact-buttons";
import { AssignDialog } from "@/components/admin/dialogs";
import { usePanel } from "@/components/admin/admin-context";
import type { AgendaSession, OpenClient, Trends } from "@/lib/queries/dashboard";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

const waited = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return days < 1 ? "today" : days === 1 ? "1 day" : `${days} days`;
};

export function OpenClients({ clients }: { clients: OpenClient[] }) {
  const panel = usePanel();
  if (!clients.length) return <p className="px-5 py-8 text-sm text-muted-foreground">Nobody waiting on a tutor.</p>;
  return (
    <ul className="divide-y">
      {clients.map((c) => (
        <li key={c.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
          <button type="button" onClick={() => panel.open("client", c.id)} className="min-w-0 flex-1 text-left text-sm">
            <p className="flex items-center gap-2">
              <span className="truncate font-semibold">{c.name}</span>
              <LeadStatusBadge status={c.status} />
            </p>
            <p className="truncate text-muted-foreground" suppressHydrationWarning>
              {[c.grade && `Grade ${c.grade}`, c.subjects.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "No details yet"}
              {" · "}
              {c.tutors.length ? `with ${c.tutors.join(", ")}` : c.claims.length ? `${c.claims.map((x) => x.tutor).join(", ")} interested` : `waiting ${waited(c.createdAt)}`}
            </p>
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            {!c.tutors.length ? (
              <AssignDialog
                client={c}
                trigger={
                  <Button size="sm" variant="outline" className="h-8">
                    <UserPlus /> Assign
                  </Button>
                }
              />
            ) : null}
            <ContactButtons client={c} size="sm" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WeekAgenda({ sessions }: { sessions: AgendaSession[] }) {
  const panel = usePanel();
  const days: Array<{ day: Date; items: AgendaSession[] }> = [];
  for (const s of sessions) {
    const d = new Date(s.start);
    const bucket = days.find((x) => isSameDay(x.day, d));
    if (bucket) bucket.items.push(s);
    else days.push({ day: d, items: [s] });
  }
  return (
    <div className="rounded-xl border bg-card">
      {days.length ? (
        <div className="divide-y">
          {days.map(({ day, items }) => (
            <div key={day.toISOString()} className="px-4 py-3">
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{format(day, "EEEE, MMM d")}</p>
              <ul className="space-y-1">
                {items.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => panel.open("client", s.leadId)} className="flex w-full items-baseline gap-3 rounded-md px-1 py-0.5 text-left text-sm hover:bg-muted/60">
                      <span className="w-16 shrink-0 text-muted-foreground tabular-nums">{format(new Date(s.start), "h:mm a")}</span>
                      <span className={cn("truncate font-medium", s.status !== "scheduled" && "text-muted-foreground line-through")}>{s.student}</span>
                      <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">{s.tutor.split(" ")[0]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nothing on the schedule this week.</p>
      )}
      <div className="border-t px-4 py-2.5">
        <Link href="/admin/schedule" className="text-sm font-medium hover:underline">
          Full schedule →
        </Link>
      </div>
    </div>
  );
}

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" },
};

function Chart({ title, now, children }: { title: string; now: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="font-heading text-sm font-bold">{title}</h3>
        <span className="text-xs text-muted-foreground">{now}</span>
      </header>
      <div className="h-36">{children}</div>
    </section>
  );
}

function Spark({ data, color, unit = "" }: { data: Array<{ label: string; value: number }>; color: string; unit?: string }) {
  const gid = `g-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip {...tip} separator="" formatter={(v) => [`${v}${unit}`, ""]} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gid})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const RANGES = [
  { v: "3", label: "3 mo" },
  { v: "6", label: "6 mo" },
  { v: "12", label: "1 yr" },
];

export function TrendCharts({ trends, range }: { trends: Trends; range: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const last = <T,>(a: T[]) => a[a.length - 1];
  const thisMonth = last(trends.money);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Overview</h2>
        <div className="flex rounded-lg border p-0.5 text-xs">
          {RANGES.map((r) => (
            <button
              key={r.v}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.set("range", r.v);
                router.replace(`/admin?${next.toString()}`, { scroll: false });
              }}
              className={cn("rounded-md px-2.5 py-1", range === r.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Chart title="New leads per week" now={`${last(trends.requests)?.value ?? 0} this week`}>
          <Spark data={trends.requests} color="#3b5998" />
        </Chart>
        <Chart title="Active clients per week" now={`${last(trends.activeClients)?.value ?? 0} this week`}>
          <Spark data={trends.activeClients} color="#10b981" />
        </Chart>
        <Chart title="Hours tutored per week" now={`${last(trends.hours)?.value ?? 0} h this week`}>
          <Spark data={trends.hours} color="#1a2c4e" unit=" h" />
        </Chart>
        <Chart title="Tutoring and fees" now={`${money(thisMonth?.tutoring ?? 0)} · ${money(thisMonth?.fees ?? 0)} fees`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.money} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={48} />
              <Tooltip {...tip} formatter={(v, n) => [money(Number(v)), n === "fees" ? "BCLearns fees" : "Paid to tutors"]} />
              <Line type="monotone" dataKey="tutoring" stroke="#1a2c4e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fees" stroke="#e6b800" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      </div>
    </div>
  );
}
