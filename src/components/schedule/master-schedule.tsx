"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addDays, addMinutes, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, Search, Trash2 } from "lucide-react";
import { deleteSession, moveSession, updateSessionStatus } from "@/actions/sessions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SessionStatusBadge } from "@/components/status-badge";
import { NewSessionDialog, type AssignmentOption } from "@/components/admin/dialogs";
import { cn } from "@/lib/utils";

export type ScheduleSession = {
  id: string;
  start: string;
  end: string;
  status: string;
  student: string;
  subject: string;
  tutorId: string;
  tutor: string;
  leadId: string;
  location: string;
  notes: string;
  privateNotes: string;
};
export type ScheduleTutor = { id: string; name: string };

const START = 8;
const END = 21;
const ROW = 22; // px per half hour
const COLORS = ["#1a2c4e", "#c48a00", "#3b5998", "#059669", "#ea580c", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#475569"];

const minutesFrom = (d: Date) => (d.getHours() - START) * 60 + d.getMinutes();

// side-by-side lanes for sessions that overlap on the same day
function layout(items: ScheduleSession[]) {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const lanes: string[] = [];
  const placed = sorted.map((s) => {
    let lane = lanes.findIndex((end) => end <= s.start);
    if (lane === -1) {
      lanes.push(s.end);
      lane = lanes.length - 1;
    } else lanes[lane] = s.end;
    return { s, lane };
  });
  return placed.map((p) => ({ ...p, lanes: Math.max(1, lanes.length) }));
}

export function MasterSchedule({
  sessions,
  tutors,
  assignments,
  mode,
}: {
  sessions: ScheduleSession[];
  tutors: ScheduleTutor[];
  assignments: AssignmentOption[];
  mode: "admin" | "tutor";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<"week" | "list">("week");
  const [q, setQ] = useState("");
  const [needsLogging, setNeedsLogging] = useState(params.get("filter") === "unlogged");
  const [showCancelled, setShowCancelled] = useState(false);
  const [creating, setCreating] = useState<Date | null>(null);
  const [opened, setOpened] = useState<ScheduleSession | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setView("list");
  }, []);

  const selected = useMemo(() => (params.get("tutors") ?? "").split(",").filter(Boolean), [params]);
  const color = useMemo(() => new Map(tutors.map((t, i) => [t.id, COLORS[i % COLORS.length]])), [tutors]);

  const setTutors = (ids: string[]) => {
    const next = new URLSearchParams(params.toString());
    if (ids.length) next.set("tutors", ids.join(","));
    else next.delete("tutors");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const now = new Date();
  const filtered = sessions.filter((s) => {
    if (selected.length && !selected.includes(s.tutorId)) return false;
    if (!showCancelled && s.status === "canceled") return false;
    if (needsLogging && !(s.status === "scheduled" && new Date(s.end) < now)) return false;
    if (q && !`${s.student} ${s.subject} ${s.tutor}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const slots = Array.from({ length: (END - START) * 2 }, (_, i) => i);
  const unloggedCount = sessions.filter((s) => s.status === "scheduled" && new Date(s.end) < now && (!selected.length || selected.includes(s.tutorId))).length;

  const drop = (day: Date, slot: number) => {
    const s = sessions.find((x) => x.id === dragId);
    setDragId(null);
    if (!s || s.status !== "scheduled") return;
    const begin = new Date(day);
    begin.setHours(START, 0, 0, 0);
    const newStart = addMinutes(begin, slot * 30);
    const length = (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000;
    start(async () => {
      const res = await moveSession(s.id, newStart.toISOString(), addMinutes(newStart, length).toISOString());
      if (res.ok) toast.success(`Moved to ${format(newStart, "EEE h:mm a")}`);
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-2 font-heading text-2xl font-bold">Schedule</h1>
          <Button size="icon" variant="outline" className="size-8" onClick={() => setCursor(addDays(cursor, view === "week" ? -7 : -14))} aria-label="Previous">
            <ChevronLeft />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button size="icon" variant="outline" className="size-8" onClick={() => setCursor(addDays(cursor, view === "week" ? 7 : 14))} aria-label="Next">
            <ChevronRight />
          </Button>
          <p className="ml-1 text-sm font-medium">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, view === "week" ? 6 : 13), "MMM d")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <button type="button" onClick={() => setView("week")} className={cn("rounded-md px-2 py-1", view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground")} aria-label="Week view">
              <CalendarDays className="size-4" />
            </button>
            <button type="button" onClick={() => setView("list")} className={cn("rounded-md px-2 py-1", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")} aria-label="List view">
              <List className="size-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setCreating(new Date())} disabled={!assignments.length}>
            <Plus /> Session
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mode === "admin" ? (
          <>
            <button
              type="button"
              onClick={() => setTutors([])}
              className={cn("rounded-full border px-3 py-1 text-xs", !selected.length ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              Everyone
            </button>
            {tutors.map((t) => {
              const on = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTutors(on ? selected.filter((x) => x !== t.id) : [...selected, t.id])}
                  className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", on ? "border-foreground/40 bg-muted font-medium" : "text-muted-foreground hover:bg-muted")}
                >
                  <span className="size-2 rounded-full" style={{ background: color.get(t.id) }} />
                  {t.name.split(" ")[0]}
                </button>
              );
            })}
          </>
        ) : null}
        <label className="flex h-8 items-center gap-2 rounded-full border bg-card px-3">
          <Search className="size-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Student or subject" className="w-36 bg-transparent text-xs outline-none" />
        </label>
        <button
          type="button"
          onClick={() => setNeedsLogging((v) => !v)}
          className={cn("rounded-full border px-3 py-1 text-xs", needsLogging ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" : "text-muted-foreground hover:bg-muted")}
        >
          Needs logging {unloggedCount ? `· ${unloggedCount}` : ""}
        </button>
        <button
          type="button"
          onClick={() => setShowCancelled((v) => !v)}
          className={cn("rounded-full border px-3 py-1 text-xs", showCancelled ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted")}
        >
          Show cancelled
        </button>
      </div>

      {needsLogging ? (
        <ListView sessions={filtered} color={color} onOpen={setOpened} showTutor={mode === "admin"} empty="Everything's logged." />
      ) : view === "week" ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b text-xs">
              <div />
              {days.map((d) => (
                <div key={d.toISOString()} className={cn("border-l px-2 py-2 text-center", isToday(d) && "bg-gold/10 font-semibold")}>
                  {format(d, "EEE d")}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[56px_repeat(7,1fr)]">
              <div>
                {slots.map((i) => (
                  <div key={i} className="pr-1.5 text-right text-[0.65rem] text-muted-foreground" style={{ height: ROW }}>
                    {i % 2 === 0 ? format(new Date(2000, 0, 1, START + i / 2), "h a") : ""}
                  </div>
                ))}
              </div>
              {days.map((day) => {
                const items = layout(filtered.filter((s) => isSameDay(new Date(s.start), day)));
                return (
                  <div key={day.toISOString()} className="relative border-l">
                    {slots.map((i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Add at ${format(addMinutes(new Date(day).setHours(START, 0, 0, 0), i * 30), "EEE h:mm a")}`}
                        onClick={() => {
                          const at = new Date(day);
                          at.setHours(START, 0, 0, 0);
                          setCreating(addMinutes(at, i * 30));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => drop(day, i)}
                        className={cn("block w-full hover:bg-gold/10", i % 2 === 1 ? "border-b" : "border-b border-dashed border-border/50")}
                        style={{ height: ROW }}
                      />
                    ))}
                    {items.map(({ s, lane, lanes }) => {
                      const begin = new Date(s.start);
                      const end = new Date(s.end);
                      const top = (minutesFrom(begin) / 30) * ROW;
                      const height = Math.max(ROW, ((end.getTime() - begin.getTime()) / 60000 / 30) * ROW - 2);
                      const unlogged = s.status === "scheduled" && end < now;
                      const c = color.get(s.tutorId) ?? "#3b5998";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          draggable={s.status === "scheduled"}
                          onDragStart={() => setDragId(s.id)}
                          onClick={() => setOpened(s)}
                          className={cn(
                            "absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[0.7rem] leading-tight text-white shadow-sm",
                            s.status === "canceled" && "line-through opacity-40",
                            s.status === "no_show" && "opacity-60",
                            unlogged && "ring-2 ring-amber-400",
                          )}
                          style={{
                            top,
                            height,
                            left: `calc(${(lane / lanes) * 100}% + 2px)`,
                            width: `calc(${100 / lanes}% - 4px)`,
                            background: c,
                          }}
                        >
                          <span className="block truncate font-semibold">{s.student}</span>
                          <span className="block truncate opacity-80">
                            {format(begin, "h:mm")}
                            {mode === "admin" ? ` · ${s.tutor.split(" ")[0]}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <ListView
          sessions={filtered.filter((s) => new Date(s.start) >= weekStart && new Date(s.start) < addDays(weekStart, 14))}
          color={color}
          onOpen={setOpened}
          showTutor={mode === "admin"}
          empty="Nothing scheduled these two weeks."
        />
      )}

      {creating ? <NewSessionDialog open onOpenChange={(v) => !v && setCreating(null)} assignments={assignments} start={creating} /> : null}
      {opened ? <SessionDialog session={opened} mode={mode} onClose={() => setOpened(null)} /> : null}
    </div>
  );
}

function ListView({
  sessions,
  color,
  onOpen,
  showTutor,
  empty,
}: {
  sessions: ScheduleSession[];
  color: Map<string, string>;
  onOpen: (s: ScheduleSession) => void;
  showTutor: boolean;
  empty: string;
}) {
  const groups: Array<{ day: Date; items: ScheduleSession[] }> = [];
  for (const s of [...sessions].sort((a, b) => a.start.localeCompare(b.start))) {
    const d = new Date(s.start);
    const g = groups.find((x) => isSameDay(x.day, d));
    if (g) g.items.push(s);
    else groups.push({ day: d, items: [s] });
  }
  if (!groups.length) return <p className="rounded-xl border border-dashed px-5 py-6 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="divide-y rounded-xl border bg-card">
      {groups.map((g) => (
        <div key={g.day.toISOString()} className="px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{format(g.day, "EEEE, MMM d")}</p>
          <ul className="space-y-1">
            {g.items.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onOpen(s)} className="flex w-full items-center gap-3 rounded-md px-1 py-1 text-left text-sm hover:bg-muted/60">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: color.get(s.tutorId) }} />
                  <span className="w-16 shrink-0 text-xs text-muted-foreground tabular-nums sm:w-28 sm:text-sm">
                    {format(new Date(s.start), "h:mm a")}
                    <span className="hidden sm:inline">–{format(new Date(s.end), "h:mm a")}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{s.student}</span>
                    {showTutor ? <span className="text-muted-foreground"> · {s.tutor.split(" ")[0]}</span> : null}
                  </span>
                  <span className="shrink-0">
                    {s.status === "scheduled" && new Date(s.end) < new Date() ? (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Not logged</span>
                    ) : s.status !== "scheduled" ? (
                      <SessionStatusBadge status={s.status} />
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const toLocal = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");

function SessionDialog({ session: s, mode, onClose }: { session: ScheduleSession; mode: "admin" | "tutor"; onClose: () => void }) {
  const [pending, start] = useTransition();
  const past = new Date(s.end) < new Date();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, close = true) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong");
      toast.success(msg);
      if (close) onClose();
    });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{s.student}</DialogTitle>
        </DialogHeader>
        <div className="-mt-2 space-y-0.5 text-sm text-muted-foreground">
          <p>
            {format(new Date(s.start), "EEEE, MMM d · h:mm")}–{format(new Date(s.end), "h:mm a")}
          </p>
          <p>{[mode === "admin" ? `with ${s.tutor}` : "", s.subject, s.location].filter(Boolean).join(" · ")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SessionStatusBadge status={s.status} />
          {s.status === "scheduled" && past ? <span className="text-xs font-medium text-amber-700 dark:text-amber-400">How did it go?</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending || s.status === "completed"} onClick={() => run(() => updateSessionStatus(s.id, "completed"), "Logged as held")}>
            Held
          </Button>
          <Button size="sm" variant="outline" disabled={pending || s.status === "no_show"} onClick={() => run(() => updateSessionStatus(s.id, "no_show"), "Logged as no-show")}>
            No-show
          </Button>
          <Button size="sm" variant="outline" disabled={pending || s.status === "canceled"} onClick={() => run(() => updateSessionStatus(s.id, "canceled"), "Cancelled")}>
            Cancelled
          </Button>
          {s.status !== "scheduled" ? (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => updateSessionStatus(s.id, "scheduled"), "Reset")}>
              Undo
            </Button>
          ) : null}
        </div>

        {s.status === "scheduled" ? (
          <form
            className="grid grid-cols-2 gap-2 border-t pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(() => moveSession(s.id, new Date(String(fd.get("start"))).toISOString(), new Date(String(fd.get("end"))).toISOString()), "Moved");
            }}
          >
            <Input type="datetime-local" name="start" defaultValue={toLocal(s.start)} />
            <Input type="datetime-local" name="end" defaultValue={toLocal(s.end)} />
            <Button type="submit" size="sm" variant="outline" disabled={pending} className="col-span-2">
              Move
            </Button>
          </form>
        ) : null}

        <form
          className="space-y-2 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => updateSessionStatus(s.id, s.status as "scheduled", String(fd.get("notes") || ""), String(fd.get("privateNotes") || "")), "Notes saved", false);
          }}
        >
          <Textarea name="notes" rows={2} defaultValue={s.notes} placeholder="What you covered, homework" />
          <Textarea name="privateNotes" rows={2} defaultValue={s.privateNotes} placeholder="Private notes (only staff see these)" />
          <div className="flex items-center justify-between">
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              Save notes
            </Button>
            <div className="flex items-center gap-2">
              {mode === "admin" ? (
                <Link href={`/admin/schedule?client=${s.leadId}`} className="text-sm text-muted-foreground hover:underline" onClick={onClose}>
                  Open client
                </Link>
              ) : null}
              {s.status !== "completed" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-rose-600"
                  disabled={pending}
                  onClick={() => confirm("Delete this session?") && run(() => deleteSession(s.id), "Deleted")}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
