import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-gold font-heading text-sm font-bold text-navy shadow-sm",
        className,
      )}
    >
      BC
    </span>
  );
}

export function BrandLogo({ className, href = "/", light }: { className?: string; href?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className={cn("font-heading text-lg font-bold tracking-tight", light ? "text-white" : "text-foreground")}>
        BC<span className="text-gold">Learns</span>
      </span>
    </Link>
  );
}
