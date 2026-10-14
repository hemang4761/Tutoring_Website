"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { bulkDeleteClients, bulkSetStatus } from "@/actions/data";
import { format } from "date-fns";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/status-badge";
import { useAdmin, usePanel } from "@/components/admin/admin-context";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ClientRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  students: string[];
  grade: string;
  subjects: string[];
  tutors: Array<{ id: string; name: string }>;
  status: string;
  source: string;
  createdAt: string;
  lastContactAt: string | null;
  followUp: string | null;
  hoursThisMonth: number;
};

const short = (iso: string | null) => (iso ? format(new Date(iso), "MMM d") : "—");

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const panel = usePanel();
  const { tutors } = useAdmin();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("current");
  const [tutor, setTutor] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, current: 0 };
    for (const r of rows) {
      c[r.status] = (c[r.status] ?? 0) + 1;
      if (!["ended", "lost"].includes(r.status)) c.current++;
    }
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    return rows.filter((r) => {
      if (status === "current" && ["ended", "lost"].includes(r.status)) return false;
      if (status !== "current" && status !== "all" && r.status !== status) return false;
      if (tutor && !r.tutors.some((t) => t.id === tutor)) return false;
      if (!needle) return true;
      const hay = [r.name, r.email, ...r.students, ...r.subjects, r.source].join(" ").toLowerCase();
      return hay.includes(needle) || (digits.length >= 3 && r.phone.replace(/\D/g, "").includes(digits));
    });
  }, [rows, q, status, tutor]);

  const chips = ["current", ...LEAD_STATUSES, "all"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Clients</h1>
        <Button variant="ghost" size="sm" asChild>
          <a href="/api/leads/export">
            <Download /> Export CSV
          </a>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border bg-card px-3 sm:max-w-xs">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, subject, phone" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <select value={tutor} onChange={(e) => setTutor(e.target.value)} className="h-9 rounded-lg border bg-card px-2 text-sm">
          <option value="">Any tutor</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn("rounded-full border px-3 py-1 text-xs", status === s ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            {s === "current" ? "Current" : s === "all" ? "Everyone" : LEAD_STATUS_LABELS[s as keyof typeof LEAD_STATUS_LABELS]}
            <span className="ml-1 opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {selected.size ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <select
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value=""
            disabled={pending}
            onChange={(e) => {
              const status = e.target.value;
              if (!status) return;
              start(async () => {
                const res = await bulkSetStatus([...selected], status);
                if (!res.ok) return void toast.error(res.error);
                toast.success(`Updated ${res.data} clients`);
                setSelected(new Set());
              });
            }}
          >
            <option value="">Set status…</option>
            {LEAD_STATUSES.map((st) => (
              <option key={st} value={st}>
                {LEAD_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-rose-600"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Delete ${selected.size} clients and all of their sessions, matches and notes? This can't be undone.`)) return;
              start(async () => {
                const res = await bulkDeleteClients([...selected]);
                if (!res.ok) return void toast.error(res.error);
                toast.success(`Deleted ${res.data} clients`);
                setSelected(new Set());
              });
            }}
          >
            Delete
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto h-8" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="w-10 pl-4">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={shown.length > 0 && shown.every((r) => selected.has(r.id))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(shown.map((r) => r.id)) : new Set())}
                />
              </th>
              <th className="px-3 py-2.5 font-medium">Client</th>
              <th className="px-3 py-2.5 font-medium">Subjects</th>
              <th className="px-3 py-2.5 font-medium">Tutor</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Last contact</th>
              <th className="px-3 py-2.5 font-medium">Follow-up</th>
              <th className="px-3 py-2.5 text-right font-medium">Hours this month</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((r) => (
              <tr key={r.id} onClick={() => panel.open("client", r.id)} className={cn("cursor-pointer hover:bg-muted/40", selected.has(r.id) && "bg-muted/50")}>
                <td className="pl-4" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{[r.students.join(", "), r.grade && `grade ${r.grade}`, r.phone].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="max-w-48 truncate px-3 py-2.5 text-muted-foreground">{r.subjects.join(", ") || "—"}</td>
                <td className="px-3 py-2.5">{r.tutors.map((t) => t.name.split(" ")[0]).join(", ") || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2.5">
                  <LeadStatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{short(r.lastContactAt)}</td>
                <td className={cn("px-3 py-2.5", r.followUp && new Date(r.followUp) <= new Date() ? "font-medium text-violet-700 dark:text-violet-300" : "text-muted-foreground")}>
                  {short(r.followUp)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.hoursThisMonth || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No clients match.</p> : null}
      </div>
    </div>
  );
}
