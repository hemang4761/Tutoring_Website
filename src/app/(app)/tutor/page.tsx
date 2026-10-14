import Link from "next/link";
import { CalendarClock, Hand, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Panel } from "@/components/panel";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { firstName, fmtDateTime } from "@/lib/format";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { Assignment, Lead, Session } from "@/models";

export const metadata = { title: "Tutor home" };

export default async function TutorHome() {
  const user = await requireUser(["tutor"]);
  await connectDB();
  const now = new Date();
  const [open, students, upcoming, todo] = await Promise.all([
    Lead.countDocuments({ status: { $in: CLAIMABLE_STATUSES } }),
    Assignment.countDocuments({ tutor: user._id, status: "active" }),
    Session.find({ tutor: user._id, status: "scheduled", start: { $gte: now } }).sort({ start: 1 }).limit(6).lean(),
    Session.find({ tutor: user._id, status: "scheduled", end: { $lt: now } }).sort({ end: -1 }).limit(5).lean(),
  ]);
  return (
    <>
      <PageHeader title={`Hi, ${firstName(user.name)}`} description="Your students, upcoming sessions, and open leads." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="navy" label="Open on the board" value={open} icon={Hand} href="/tutor/claim-board" />
        <StatCard label="My students" value={students} icon={Users} href="/tutor/students" />
        <StatCard label="Upcoming" value={upcoming.length} icon={CalendarClock} href="/tutor/schedule" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Next sessions" bodyClassName="p-0">
          {upcoming.length ? (
            <ul className="divide-y">
              {upcoming.map((s) => (
                <li key={s._id.toString()} className="px-5 py-3 text-sm">
                  <p className="font-medium">{s.studentName}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(s.start)} · {s.subject}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5"><EmptyState title="Nothing scheduled" /></div>
          )}
        </Panel>
        <Panel
          title="Needs a log"
          description="Sessions that already happened"
          actions={<Button size="sm" variant="ghost" asChild><Link href="/tutor/schedule">Open schedule</Link></Button>}
        >
          {todo.length ? (
            <ul className="space-y-2 text-sm">
              {todo.map((s) => (
                <li key={s._id.toString()}>{s.studentName} · {fmtDateTime(s.start)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">You're caught up.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
