"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Hand, Loader2 } from "lucide-react";
import { claimLead, withdrawClaim } from "@/actions/claims";
import { updateSessionStatus } from "@/actions/sessions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { fmtDateTime, timeAgo } from "@/lib/format";

export type OpenStudent = {
  id: string;
  student: string;
  grade: string;
  subjects: string[];
  need: string;
  hours: string;
  comments: string;
  createdAt: string;
  claimId: string | null;
};
export type TutorSession = { id: string; start: string; end: string; student: string; location: string };

export function Unlogged({ sessions }: { sessions: TutorSession[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const log = (id: string, status: "completed" | "no_show" | "canceled") =>
    start(async () => {
      const res = await updateSessionStatus(id, status);
      if (!res.ok) return void toast.error(res.error);
      setDone((d) => new Set(d).add(id));
    });
  const left = sessions.filter((s) => !done.has(s.id));
  if (!left.length) return <p className="text-sm text-muted-foreground">All logged. Thanks!</p>;
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {left.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <p className="font-semibold">{s.student}</p>
            <p className="text-muted-foreground">{fmtDateTime(s.start)}</p>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" className="h-8" disabled={pending} onClick={() => log(s.id, "completed")}>
              <Check /> Held
            </Button>
            <Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => log(s.id, "no_show")}>
              No-show
            </Button>
            <Button size="sm" variant="ghost" className="h-8" disabled={pending} onClick={() => log(s.id, "canceled")}>
              Cancelled
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OpenStudents({ students }: { students: OpenStudent[] }) {
  if (!students.length) return <p className="rounded-xl border border-dashed px-5 py-6 text-sm text-muted-foreground">No one is waiting right now. New students show up here.</p>;
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {students.map((s) => (
        <li key={s.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 text-sm">
            <p>
              <span className="font-semibold">{s.student}</span>
              {s.grade ? <span className="text-muted-foreground"> · grade {s.grade}</span> : null}
              <span className="text-muted-foreground"> · {timeAgo(s.createdAt)}</span>
            </p>
            <p>{s.need || s.subjects.join(", ")}</p>
            {s.hours ? <p className="text-muted-foreground">About {s.hours} h a week</p> : null}
            {s.comments ? <p className="mt-1 text-muted-foreground">“{s.comments}”</p> : null}
          </div>
          <ClaimButton leadId={s.id} claimId={s.claimId} />
        </li>
      ))}
    </ul>
  );
}

function ClaimButton({ leadId, claimId }: { leadId: string; claimId: string | null }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  if (claimId) {
    return (
      <div className="flex shrink-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground">Requested, waiting on the admin</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-8"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await withdrawClaim(claimId);
              if (!res.ok) toast.error(res.error);
            })
          }
        >
          Withdraw
        </Button>
      </div>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="h-8 shrink-0">
          <Hand /> I&apos;ll take them
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2">
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the admin should know? (optional)" autoFocus />
        <Button
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await claimLead(leadId, note);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Sent to the admin for approval");
              setOpen(false);
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : null} Request this student
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function TutorAgenda({ sessions }: { sessions: TutorSession[] }) {
  return (
    <div className="rounded-xl border bg-card">
      {sessions.length ? (
        <ul className="divide-y">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-40 shrink-0 text-muted-foreground">{format(new Date(s.start), "EEE, MMM d · h:mm a")}</span>
              <span className="font-medium">{s.student}</span>
              {s.location ? <span className="ml-auto truncate text-xs text-muted-foreground">{s.location}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nothing scheduled this week.</p>
      )}
      <div className="border-t px-4 py-2.5">
        <Link href="/tutor/schedule" className="text-sm font-medium hover:underline">
          Full schedule →
        </Link>
      </div>
    </div>
  );
}
