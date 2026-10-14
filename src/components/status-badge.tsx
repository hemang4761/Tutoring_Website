import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  REQUEST_TYPE_LABELS,
  SESSION_STATUS_LABELS,
  type LeadStatus,
  type RequestType,
  type SessionStatus,
} from "@/lib/constants";

const pill = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

export function LeadStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as LeadStatus;
  return (
    <span className={cn(pill, LEAD_STATUS_STYLES[s] ?? "bg-muted text-muted-foreground", className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {LEAD_STATUS_LABELS[s] ?? status}
    </span>
  );
}

const SESSION_STYLES: Record<SessionStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  canceled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  no_show: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

export function SessionStatusBadge({ status }: { status: string }) {
  const s = status as SessionStatus;
  return <span className={cn(pill, SESSION_STYLES[s])}>{SESSION_STATUS_LABELS[s] ?? status}</span>;
}

const GENERIC: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  open: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  declined: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  disabled: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  withdrawn: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  paused: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  ended: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  inactive: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  skipped: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  invited: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  onboarding: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  normal: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
};

export function StatusPill({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span className={cn(pill, GENERIC[status] ?? "bg-muted text-muted-foreground", className)}>
      {label ?? status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

export function RequestTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn(pill, "bg-secondary text-secondary-foreground")}>
      {REQUEST_TYPE_LABELS[type as RequestType] ?? type}
    </span>
  );
}
