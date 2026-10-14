"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, LayoutGrid, List, Search } from "lucide-react";
import { updateLeadStatus } from "@/actions/leads";
import { toastResult } from "@/lib/toast";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_STYLES, type LeadStatus } from "@/lib/constants";
import { fmtDate, timeAgo } from "@/lib/format";
import { LeadStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export type LeadRow = {
  _id: string;
  parent: { name: string; email: string; phone?: string };
  students: Array<{ name: string; grade?: string }>;
  subjects: string[];
  status: string;
  source?: string;
  location?: string;
  createdAt: string;
  assignedTutors: Array<{ _id: string; name: string }>;
};

export function LeadsToolbar({
  q,
  status,
  view,
  counts,
}: {
  q: string;
  status: string;
  view: "table" | "board";
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={q}
            placeholder="Search name, email, subject..."
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
            }}
          />
        </div>
        <Select value={status || "all"} onValueChange={(v) => set("status", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABELS[s]} {counts[s] ? `(${counts[s]})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border p-0.5">
          <Button size="sm" variant={view === "table" ? "secondary" : "ghost"} onClick={() => set("view", "table")}>
            <List /> Table
          </Button>
          <Button size="sm" variant={view === "board" ? "secondary" : "ghost"} onClick={() => set("view", "board")}>
            <LayoutGrid /> Board
          </Button>
        </div>
        <Button size="sm" variant="outline" asChild>
          <a href={`/api/leads/export?${params.toString()}`}>
            <Download /> CSV
          </a>
        </Button>
      </div>
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  if (!leads.length) return <EmptyState title="No leads match" description="Try a different search or add a lead." />;
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Family</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l._id} className="cursor-pointer">
              <TableCell>
                <Link href={`/admin/leads/${l._id}`} className="block">
                  <p className="font-medium">{l.parent.name}</p>
                  <p className="text-xs text-muted-foreground">{l.parent.email}</p>
                </Link>
              </TableCell>
              <TableCell className="text-sm">
                {l.students.map((s) => `${s.name}${s.grade ? ` · ${s.grade}` : ""}`).join(", ") || "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm">{l.subjects.slice(0, 3).join(", ") || "—"}</TableCell>
              <TableCell>
                <LeadStatusBadge status={l.status} />
              </TableCell>
              <TableCell className="text-sm">{l.assignedTutors.map((t) => t.name.split(" ")[0]).join(", ") || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{fmtDate(l.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function LeadsBoard({ leads }: { leads: LeadRow[] }) {
  const [pending, start] = useTransition();
  const grouped = useMemo(() => {
    const map = Object.fromEntries(LEAD_STATUSES.map((s) => [s, [] as LeadRow[]])) as Record<LeadStatus, LeadRow[]>;
    for (const l of leads) map[l.status as LeadStatus]?.push(l);
    return map;
  }, [leads]);

  const [drag, setDrag] = useState<string | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {LEAD_STATUSES.map((status) => (
        <div
          key={status}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (!drag || drag.split(":")[1] === status) return;
            const id = drag.split(":")[0];
            start(async () => {
              toastResult(await updateLeadStatus(id, status));
              setDrag(null);
            });
          }}
          className="w-72 shrink-0 rounded-xl border bg-muted/30"
        >
          <div className={cn("flex items-center justify-between rounded-t-xl px-3 py-2 text-xs font-semibold", LEAD_STATUS_STYLES[status])}>
            <span>{LEAD_STATUS_LABELS[status]}</span>
            <span>{grouped[status].length}</span>
          </div>
          <div className="space-y-2 p-2">
            {grouped[status].map((l) => (
              <Link
                key={l._id}
                href={`/admin/leads/${l._id}`}
                draggable
                onDragStart={() => setDrag(`${l._id}:${status}`)}
                className="block rounded-lg border bg-card p-3 shadow-xs hover:border-primary/40"
              >
                <p className="text-sm font-semibold">{l.parent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.students[0]?.name}
                  {l.students[0]?.grade ? ` · ${l.students[0].grade}` : ""}
                </p>
                <p className="mt-1 truncate text-xs">{l.subjects.slice(0, 2).join(", ")}</p>
                <p className="mt-2 text-[0.7rem] text-muted-foreground">{timeAgo(l.createdAt)}</p>
              </Link>
            ))}
            {!grouped[status].length ? <p className="px-1 py-6 text-center text-xs text-muted-foreground">Empty</p> : null}
          </div>
        </div>
      ))}
      {pending ? <span className="sr-only">Updating</span> : null}
    </div>
  );
}
