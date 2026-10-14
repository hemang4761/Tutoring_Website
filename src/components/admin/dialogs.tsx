"use client";

import { useMemo, useState, useTransition } from "react";
import { addMinutes, format } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { assignTutor } from "@/actions/leads";
import { decideClaim } from "@/actions/claims";
import { createSession } from "@/actions/sessions";
import { quickAddClient } from "@/actions/leads";
import { toastResult } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { rankTutors, useAdmin, usePanel } from "./admin-context";

const field = "h-9 w-full rounded-md border bg-background px-2.5 text-sm";

function RateInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { rateTiers } = useAdmin();
  return (
    <div className="space-y-1.5">
      <Label>Rate</Label>
      <div className="flex flex-wrap gap-1.5">
        {rateTiers.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.rate)}
            className={cn("rounded-full border px-2.5 py-1 text-xs", value === t.rate ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {t.label} · ${t.rate}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">$</span>
        <Input type="number" min={0} className="h-9 w-24" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span className="text-sm text-muted-foreground">/ hr, paid to the tutor</span>
      </div>
    </div>
  );
}

export function AssignDialog({
  client,
  trigger,
}: {
  client: { id: string; name: string; subjects: string[]; grade: string; rateTier?: string };
  trigger: React.ReactNode;
}) {
  const { tutors, rateTiers } = useAdmin();
  const [open, setOpen] = useState(false);
  const [tutorId, setTutorId] = useState("");
  const [rate, setRate] = useState(rateTiers.find((t) => t.key === client.rateTier)?.rate ?? rateTiers[1]?.rate ?? 30);
  const [pending, start] = useTransition();
  const ranked = useMemo(() => rankTutors(tutors, client.subjects, client.grade), [tutors, client.subjects, client.grade]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a tutor to {client.name}</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          {[client.grade && `Grade ${client.grade}`, client.subjects.join(", ")].filter(Boolean).join(" · ")}
        </p>
        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {ranked.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTutorId(t.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left",
                tutorId === t.id ? "border-primary ring-1 ring-primary" : "hover:bg-muted/60",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.subjects.slice(0, 4).join(", ") || "No subjects listed"}</span>
              </span>
              <span className={cn("shrink-0 text-xs", t.students >= t.max ? "text-rose-600" : "text-muted-foreground")}>
                {t.students}/{t.max} students
              </span>
            </button>
          ))}
        </div>
        <RateInput value={rate} onChange={setRate} />
        <div className="flex justify-end">
          <Button
            disabled={!tutorId || pending}
            onClick={() =>
              start(async () => {
                const res = await assignTutor(client.id, { tutorId, rate });
                toastResult(res);
                if (res.ok) setOpen(false);
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Check />} Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ApproveClaim({ claimId, tutor, rate: initial }: { claimId: string; tutor: string; rate: number }) {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="h-8">
          <Check /> Approve
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <p className="text-sm font-medium">Match with {tutor}</p>
        <RateInput value={rate} onChange={setRate} />
        <Button
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await decideClaim(claimId, "approved", undefined, rate);
              toastResult(res);
              if (res.ok) setOpen(false);
            })
          }
        >
          Approve at ${rate}/hr
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export type AssignmentOption = { id: string; student: string; tutor: string; tutorId: string; subject: string; leadId: string };

export function NewSessionDialog({
  open,
  onOpenChange,
  assignments,
  assignmentId,
  start: initialStart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assignments: AssignmentOption[];
  assignmentId?: string;
  start?: Date;
}) {
  const startAt = initialStart ?? nextHalfHour();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(assignmentId ?? "");
  const options = assignments.filter((a) => `${a.student} ${a.tutor}`.toLowerCase().includes(query.toLowerCase()));
  const current = assignments.find((a) => a.id === (picked || assignmentId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{current ? `Schedule ${current.student}` : "Schedule a session"}</DialogTitle>
        </DialogHeader>
        <form
          key={`${assignmentId}-${startAt.toISOString()}`}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const day = String(fd.get("day"));
            const time = String(fd.get("time"));
            const begin = new Date(`${day}T${time}`);
            const end = addMinutes(begin, Number(fd.get("length")));
            start(async () => {
              const res = await createSession({
                assignmentId: picked || assignmentId || "",
                start: begin.toISOString(),
                end: end.toISOString(),
                subject: current?.subject ?? "",
                location: String(fd.get("location") || ""),
                recurrenceWeeks: Number(fd.get("weeks") || 1),
              });
              toastResult(res);
              if (res.ok) onOpenChange(false);
            });
          }}
        >
          {!assignmentId ? (
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Input placeholder="Search students or tutors" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {options.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setPicked(a.id)}
                    className={cn("flex w-full justify-between rounded-md px-2.5 py-1.5 text-left text-sm", picked === a.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    <span>{a.student}</span>
                    <span className="opacity-70">{a.tutor}</span>
                  </button>
                ))}
                {!options.length ? <p className="px-2 py-1 text-sm text-muted-foreground">No matches. Assign a tutor first.</p> : null}
              </div>
            </div>
          ) : current ? (
            <p className="-mt-1 text-sm text-muted-foreground">with {current.tutor}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Input type="date" name="day" defaultValue={format(startAt, "yyyy-MM-dd")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" name="time" step={900} defaultValue={format(startAt, "HH:mm")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Length</Label>
              <select name="length" defaultValue="60" className={field}>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Repeat</Label>
              <select name="weeks" defaultValue="1" className={field}>
                <option value="1">Just once</option>
                <option value="4">Weekly, 4 weeks</option>
                <option value="8">Weekly, 8 weeks</option>
                <option value="12">Weekly, 12 weeks</option>
                <option value="16">Weekly, 16 weeks</option>
              </select>
            </div>
          </div>
          <Input name="location" placeholder="Where (library, home, or a meeting link)" />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !(picked || assignmentId)}>
              {pending ? <Loader2 className="animate-spin" /> : null} Add to schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function nextHalfHour() {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d;
}

export function QuickAddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, start] = useTransition();
  const panel = usePanel();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a client</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await quickAddClient({
                name: String(fd.get("name") || ""),
                phone: String(fd.get("phone") || ""),
                email: String(fd.get("email") || ""),
                studentName: String(fd.get("student") || ""),
                grade: String(fd.get("grade") || ""),
                need: String(fd.get("need") || ""),
                source: String(fd.get("source") || ""),
                contacted: fd.get("contacted") === "on",
              });
              toastResult(res);
              if (res.ok && res.data) {
                onOpenChange(false);
                panel.open("client", res.data);
              }
            });
          }}
        >
          <Input name="name" placeholder="Parent or student name" autoFocus required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="phone" type="tel" placeholder="Phone" />
            <Input name="email" type="email" placeholder="Email" />
          </div>
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <Input name="student" placeholder="Student name (if different)" />
            <Input name="grade" placeholder="Grade" />
          </div>
          <Textarea name="need" rows={2} placeholder="What they need, e.g. AP Chem, SAT" />
          <Input name="source" placeholder="How they found us (optional)" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="contacted" defaultChecked className="size-4" /> They reached out to me directly
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Add client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
