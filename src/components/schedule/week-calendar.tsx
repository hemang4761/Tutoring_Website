"use client";

import { useMemo, useState, useTransition } from "react";
import { addDays, addMinutes, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createSession, moveSession, updateSessionStatus } from "@/actions/sessions";
import { toastResult } from "@/lib/toast";
import { SESSION_STATUS_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type CalSession = {
  _id: string;
  studentName: string;
  subject?: string;
  start: string;
  end: string;
  status: string;
  tutor?: string;
  tutorId?: string;
  assignmentId?: string;
};
export type CalAssignment = { _id: string; studentName: string; tutorId: string; subjects: string[] };
export type CalResource = { id: string; name: string };

const START_HOUR = 8;
const END_HOUR = 21;
const SLOT = 30;

function toLocalInput(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function WeekCalendar({
  sessions,
  resources,
  assignments,
  canCreate,
  readOnly,
}: {
  sessions: CalSession[];
  resources?: CalResource[];
  assignments: CalAssignment[];
  canCreate?: boolean;
  readOnly?: boolean;
}) {
  const [cursor, setCursor] = useState(new Date());
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: ((END_HOUR - START_HOUR) * 60) / SLOT }, (_, i) => START_HOUR + (i * SLOT) / 60);
  const rows = resources?.length ? resources : [{ id: "me", name: "Schedule" }];
  const [open, setOpen] = useState<null | { start?: Date; session?: CalSession }>(null);

  const byDay = useMemo(() => {
    return days.map((day) => sessions.filter((s) => isSameDay(new Date(s.start), day)));
  }, [days, sessions]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setCursor(addDays(cursor, -7))}>
            <ChevronLeft />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button size="icon" variant="outline" onClick={() => setCursor(addDays(cursor, 7))}>
            <ChevronRight />
          </Button>
          <p className="font-heading font-bold">{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}</p>
        </div>
        {canCreate && !readOnly ? (
          <Button size="sm" onClick={() => setOpen({ start: new Date() })}>
            <Plus /> New session
          </Button>
        ) : null}
      </div>
      <div className="overflow-auto rounded-xl border bg-card">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b bg-muted/40 text-xs font-semibold">
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="px-2 py-2 text-center">
                {format(d, "EEE d")}
              </div>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.id} className="border-b last:border-0">
              {resources?.length ? <p className="bg-muted/20 px-3 py-1 text-xs font-semibold">{row.name}</p> : null}
              <div className="grid grid-cols-[72px_repeat(7,1fr)]">
                <div className="text-[0.65rem] text-muted-foreground">
                  {hours.filter((_, i) => i % 2 === 0).map((h) => (
                    <div key={h} className="h-10 px-1 pt-0.5">{`${Math.floor(h)}:00`}</div>
                  ))}
                </div>
                {days.map((day, di) => (
                  <div key={day.toISOString()} className="relative border-l">
                    {hours.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          if (readOnly) return;
                          const start = new Date(day);
                          start.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
                          setOpen({ start });
                        }}
                        className="block h-5 w-full border-b border-dashed border-border/60 hover:bg-gold/10"
                      />
                    ))}
                    {byDay[di]
                      .filter((s) => !resources?.length || s.tutorId === row.id)
                      .map((s) => {
                        const start = new Date(s.start);
                        const end = new Date(s.end);
                        const top = ((start.getHours() + start.getMinutes() / 60 - START_HOUR) * 60) / SLOT * 20;
                        const height = Math.max(20, ((end.getTime() - start.getTime()) / 60000 / SLOT) * 20);
                        return (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => setOpen({ session: s })}
                            className="absolute right-1 left-1 overflow-hidden rounded-md px-1 py-0.5 text-left text-[0.7rem] text-white"
                            style={{ top, height, background: SESSION_STATUS_COLORS[s.status as keyof typeof SESSION_STATUS_COLORS] ?? "#3b5998" }}
                          >
                            <span className="block truncate font-semibold">{s.studentName}</span>
                            <span className="block truncate opacity-80">{format(start, "h:mm")}</span>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <SessionDialog
        open={open}
        onClose={() => setOpen(null)}
        assignments={assignments}
        readOnly={readOnly}
      />
    </div>
  );
}

function SessionDialog({
  open,
  onClose,
  assignments,
  readOnly,
}: {
  open: { start?: Date; session?: CalSession } | null;
  onClose: () => void;
  assignments: CalAssignment[];
  readOnly?: boolean;
}) {
  const [pending, start] = useTransition();
  const session = open?.session;
  const defaultStart = open?.start ?? (session ? new Date(session.start) : new Date());
  const defaultEnd = session ? new Date(session.end) : addMinutes(defaultStart, 60);

  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session ? session.studentName : "New session"}</DialogTitle>
        </DialogHeader>
        {session && readOnly ? (
          <p className="text-sm text-muted-foreground">
            {format(new Date(session.start), "PPpp")} – {format(new Date(session.end), "p")}
          </p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                if (session) {
                  const moved = await moveSession(session._id, String(fd.get("start")), String(fd.get("end")));
                  toastResult(moved, "Updated");
                  if (moved.ok) onClose();
                } else {
                  const created = await createSession({
                    assignmentId: String(fd.get("assignmentId")),
                    start: String(fd.get("start")),
                    end: String(fd.get("end")),
                    subject: String(fd.get("subject") || ""),
                    location: String(fd.get("location") || ""),
                    meetingLink: String(fd.get("meetingLink") || ""),
                    recurrenceWeeks: Number(fd.get("weeks") || 1),
                  });
                  toastResult(created);
                  if (created.ok) onClose();
                }
              });
            }}
          >
            {!session ? (
              <div className="space-y-1">
                <Label>Student</Label>
                <select name="assignmentId" required className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  {assignments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.studentName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input type="datetime-local" name="start" defaultValue={toLocalInput(defaultStart)} required />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input type="datetime-local" name="end" defaultValue={toLocalInput(defaultEnd)} required />
              </div>
            </div>
            {!session ? (
              <>
                <Input name="subject" placeholder="Subject" />
                <Input name="location" placeholder="Location or library" />
                <Input name="meetingLink" placeholder="Meeting link" />
                <div className="space-y-1">
                  <Label>Repeat weekly</Label>
                  <Input name="weeks" type="number" min={1} max={24} defaultValue={1} />
                </div>
              </>
            ) : null}
            <div className="flex justify-end gap-2">
              {session ? (
                <Select
                  defaultValue={session.status}
                  onValueChange={(v) =>
                    start(async () => {
                      toastResult(await updateSessionStatus(session._id, v as "scheduled" | "completed" | "canceled" | "no_show"));
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="no_show">No-show</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              <Button type="submit" disabled={pending}>
                {session ? "Save" : "Create"}
              </Button>
            </div>
          </form>
        )}
        {session && !readOnly ? (
          <form
            className="space-y-2 border-t pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () =>
                toastResult(
                  await updateSessionStatus(session._id, session.status as "scheduled", String(fd.get("notes") || ""), String(fd.get("privateNotes") || "")),
                  "Notes saved",
                ),
              );
            }}
          >
            <Textarea name="notes" rows={2} placeholder="Shared notes for the family" />
            <Textarea name="privateNotes" rows={2} placeholder="Private notes" />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              Save notes
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
