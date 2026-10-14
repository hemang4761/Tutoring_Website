import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  tone?: "default" | "gold" | "navy";
}) {
  const body = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-all",
        href && "hover:-translate-y-0.5 hover:shadow-md",
        tone === "navy" && "border-transparent bg-navy text-white dark:bg-navy-light",
        tone === "gold" && "border-transparent bg-gold text-navy",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-sm font-medium",
            tone === "default" ? "text-muted-foreground" : tone === "navy" ? "text-white/70" : "text-navy/70",
          )}
        >
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              tone === "default" ? "bg-secondary text-primary" : tone === "navy" ? "bg-white/10 text-gold" : "bg-navy/10 text-navy",
            )}
          >
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "default" ? "text-muted-foreground" : tone === "navy" ? "text-white/60" : "text-navy/70",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
