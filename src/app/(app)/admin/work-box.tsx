"use client";

import { useMemo, useState } from "react";
import { AlarmClock, CalendarPlus, CircleDollarSign, Clock, Hand, Inbox, LifeBuoy, Users } from "lucide-react";
import type { OpenClient, TodoItem } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import { TodoList } from "./todo-list";
import { OpenClients } from "./dashboard-parts";

type Section = {
  key: string;
  label: string;
  hint: string;
  icon: typeof Inbox;
  kinds?: TodoItem["kind"][];
  empty: string;
};

// each kind of work gets its own clearly named tab so nothing blends together
const SECTIONS: Section[] = [
  { key: "leads", label: "New leads", hint: "Requests nobody has reached out to yet", icon: Inbox, kinds: ["new"], empty: "No new leads." },
  { key: "claims", label: "Tutor claims", hint: "Tutors asking to take a student. Approve to match them.", icon: Hand, kinds: ["claim"], empty: "No claims waiting." },
  { key: "open", label: "Needs a tutor", hint: "Clients who still aren't matched with anyone", icon: Users, empty: "Everyone has a tutor." },
  { key: "schedule", label: "To schedule", hint: "Matched, but no first session on the calendar", icon: CalendarPlus, kinds: ["first_session"], empty: "Every match has a session booked." },
  { key: "log", label: "Sessions to log", hint: "Past sessions the tutor hasn't marked yet", icon: Clock, kinds: ["unlogged"], empty: "Everything's logged." },
  { key: "follow", label: "Follow-ups", hint: "Check-ins you scheduled, and families who've gone quiet", icon: AlarmClock, kinds: ["follow_up", "quiet"], empty: "No follow-ups due." },
  { key: "requests", label: "Tutor requests", hint: "Time off, reassignments and questions from tutors", icon: LifeBuoy, kinds: ["request"], empty: "No open requests." },
  { key: "fees", label: "Fees", hint: "First-session fees tutors owe BCLearns", icon: CircleDollarSign, kinds: ["fee"], empty: "No fees outstanding." },
];

export function WorkBox({ items, open }: { items: TodoItem[]; open: OpenClient[] }) {
  const unmatched = useMemo(() => open.filter((c) => !c.tutors.length), [open]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of SECTIONS) c[s.key] = s.kinds ? items.filter((i) => s.kinds!.includes(i.kind)).length : unmatched.length;
    return c;
  }, [items, unmatched]);
  const [tab, setTab] = useState(() => SECTIONS.find((s) => counts[s.key])?.key ?? "leads");
  const current = SECTIONS.find((s) => s.key === tab)!;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex gap-1 overflow-x-auto border-b bg-muted/30 p-1.5">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const n = counts[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                tab === s.key ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground",
                !n && tab !== s.key && "opacity-60",
              )}
            >
              <Icon className="size-4" />
              {s.label}
              {n ? (
                <span className={cn("rounded-full px-1.5 text-xs leading-5", tab === s.key ? "bg-primary text-primary-foreground" : "bg-muted")}>{n}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="border-b px-4 py-2 text-xs text-muted-foreground">{current.hint}</p>
      <div className="max-h-[520px] overflow-y-auto">
        {current.kinds ? (
          <TodoList key={current.key} items={items.filter((i) => current.kinds!.includes(i.kind))} empty={current.empty} />
        ) : (
          <OpenClients clients={unmatched} />
        )}
      </div>
    </section>
  );
}
