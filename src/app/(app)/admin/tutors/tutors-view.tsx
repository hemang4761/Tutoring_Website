"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { addTutor } from "@/actions/tutors";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/status-badge";
import { usePanel } from "@/components/admin/admin-context";
import { money, timeAgo } from "@/lib/format";
import { toastResult } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ApplicationActions } from "./tutor-actions";

export type TutorRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  gradeLevels: string[];
  students: number;
  max: number;
  hoursThisMonth: number;
  earnedThisMonth: number;
  feesDue: number;
  availability: number[];
  status: string;
};

export type ApplicantRow = { id: string; name: string; email: string; school: string; subjects: string[]; experience: string; createdAt: string };

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function TutorsView({ rows, applicants }: { rows: TutorRow[]; applicants: ApplicantRow[] }) {
  const panel = usePanel();
  const [tab, setTab] = useState<"tutors" | "applicants">("tutors");
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => (showInactive || r.status !== "inactive") && (!needle || [r.name, r.email, ...r.subjects].join(" ").toLowerCase().includes(needle)));
  }, [rows, q, showInactive]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Tutors</h1>
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add tutor
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-0.5 text-sm">
          {(
            [
              ["tutors", `Tutors ${rows.filter((r) => r.status !== "inactive").length}`],
              ["applicants", `Applicants ${applicants.length}`],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1", tab === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {label}
            </button>
          ))}
        </div>
        {tab === "tutors" ? (
          <>
            <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border bg-card px-3 sm:max-w-xs">
              <Search className="size-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or subject" className="flex-1 bg-transparent text-sm outline-none" />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
            </label>
          </>
        ) : null}
      </div>

      {tab === "tutors" ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tutor</th>
                <th className="px-3 py-2.5 font-medium">Subjects</th>
                <th className="px-3 py-2.5 font-medium">Students</th>
                <th className="px-3 py-2.5 font-medium">Available</th>
                <th className="px-3 py-2.5 text-right font-medium">Hours this month</th>
                <th className="px-3 py-2.5 text-right font-medium">Earned this month</th>
                <th className="px-3 py-2.5 text-right font-medium">Fees due</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((r) => (
                <tr key={r.id} onClick={() => panel.open("tutor", r.id)} className={cn("cursor-pointer hover:bg-muted/40", r.status === "inactive" && "opacity-50")}>
                  <td className="px-4 py-2.5">
                    <p className="flex items-center gap-2 font-medium">
                      {r.name}
                      {r.status !== "active" ? <StatusPill status={r.status} /> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.phone || r.email}</p>
                  </td>
                  <td className="max-w-56 truncate px-3 py-2.5 text-muted-foreground">{r.subjects.join(", ") || "—"}</td>
                  <td className={cn("px-3 py-2.5 tabular-nums", r.students >= r.max && "text-rose-600")}>
                    {r.students}/{r.max}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex gap-0.5">
                      {DAYS.map((d, i) => (
                        <span
                          key={i}
                          className={cn(
                            "flex size-5 items-center justify-center rounded text-[0.6rem]",
                            r.availability.includes(i) ? "bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" : "text-muted-foreground/50",
                          )}
                        >
                          {d}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.hoursThisMonth || "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.earnedThisMonth ? money(r.earnedThisMonth) : "—"}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums", r.feesDue && "font-medium text-amber-700 dark:text-amber-400")}>{r.feesDue ? money(r.feesDue) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No tutors match.</p> : null}
        </div>
      ) : applicants.length ? (
        <ul className="space-y-3">
          {applicants.map((a) => (
            <li key={a.id} className="space-y-2 rounded-xl border bg-card p-4">
              <div>
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[a.email, a.school, timeAgo(a.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-sm">{a.subjects.join(", ")}</p>
              {a.experience ? <p className="line-clamp-3 text-sm text-muted-foreground">{a.experience}</p> : null}
              <ApplicationActions id={a.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed px-5 py-6 text-sm text-muted-foreground">No applications waiting.</p>
      )}

      <AddTutorDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function AddTutorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, start] = useTransition();
  const panel = usePanel();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a tutor</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await addTutor({
                name: String(fd.get("name") || ""),
                email: String(fd.get("email") || ""),
                phone: String(fd.get("phone") || ""),
                subjects: String(fd.get("subjects") || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                invite: fd.get("invite") === "on",
              });
              toastResult(res);
              if (res.ok && res.data) {
                onOpenChange(false);
                panel.open("tutor", res.data);
              }
            });
          }}
        >
          <Input name="name" placeholder="Full name" required autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" type="tel" placeholder="Phone" />
          </div>
          <Input name="subjects" placeholder="Subjects, comma separated" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="invite" defaultChecked className="size-4" /> Email them an invite to log in
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Add tutor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
