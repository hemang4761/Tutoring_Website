import Link from "next/link";
import { timeAgo } from "@/lib/format";

type Item = {
  _id: { toString(): string };
  summary: string;
  createdAt: Date | string;
  entityType?: string;
  entityId?: { toString(): string };
  actor?: { name?: string } | null;
};

const HREF: Record<string, (id: string) => string> = {
  lead: (id) => `/admin/clients?client=${id}`,
  tutor: (id) => `/admin/tutors/${id}`,
  assignment: () => `/admin/clients`,
  application: () => `/admin/tutors?tab=applications`,
  request: () => `/admin`,
};

export function ActivityFeed({ items, showEntityLinks }: { items: Item[]; showEntityLinks?: boolean }) {
  if (!items.length) {
    return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="divide-y">
      {items.map((item) => {
        const href =
          showEntityLinks && item.entityType && item.entityId
            ? HREF[item.entityType]?.(item.entityId.toString())
            : undefined;
        const inner = (
          <>
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{item.summary}</p>
              <p className="text-xs text-muted-foreground">
                {item.actor?.name ? `${item.actor.name} · ` : ""}
                {timeAgo(item.createdAt)}
              </p>
            </div>
          </>
        );
        return (
          <li key={item._id.toString()}>
            {href ? (
              <Link href={href} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                {inner}
              </Link>
            ) : (
              <div className="flex items-start gap-3 px-5 py-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
