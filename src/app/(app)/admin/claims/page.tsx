import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-badge";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { ClaimRequest } from "@/models";
import { ClaimDecision } from "../leads/[id]/lead-actions";

export const metadata = { title: "Claims" };

export default async function ClaimsPage() {
  await requireAdmin();
  await connectDB();
  const claims = await ClaimRequest.find()
    .sort({ status: 1, createdAt: 1 })
    .populate("tutor", "name email")
    .populate("lead", "parent subjects students status")
    .lean();
  const pending = claims.filter((c) => c.status === "pending");
  const rest = claims.filter((c) => c.status !== "pending");

  return (
    <>
      <PageHeader title="Claims" description="Tutors who want a student. Approve to create the assignment." />
      {!claims.length ? (
        <EmptyState title="No claims yet" description="When tutors claim from the board, they land here." />
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">{pending.length} pending</h2>
              {pending.map((c) => (
              <ClaimCard key={c._id.toString()} claim={c as never} />
            ))}
            {!pending.length ? <p className="text-sm text-muted-foreground">Nothing waiting.</p> : null}
          </section>
          {rest.length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">History</h2>
              {rest.slice(0, 30).map((c) => (
                <ClaimCard key={c._id.toString()} claim={c as never} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

function ClaimCard({
  claim,
}: {
  claim: {
    _id: { toString(): string };
    status: string;
    message?: string | null;
    createdAt: Date;
    tutor?: { name?: string; email?: string } | null;
    lead?: { _id?: { toString(): string }; parent?: { name: string }; subjects?: string[]; students?: Array<{ name: string; grade?: string }> } | null;
  };
}) {
  const lead = claim.lead;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{claim.tutor?.name} wants this student</p>
          <p className="text-sm text-muted-foreground">
            {lead?.students?.[0]?.name}
            {lead?.students?.[0]?.grade ? ` · grade ${lead.students[0].grade}` : ""} · {lead?.subjects?.slice(0, 3).join(", ")}
          </p>
          {claim.message ? <p className="mt-2 text-sm">{claim.message}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">{timeAgo(claim.createdAt)}</p>
        </div>
        <StatusPill status={claim.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {lead?._id ? (
          <Link href={`/admin/leads/${lead._id}`} className="text-sm font-medium text-primary hover:underline">
            Open lead
          </Link>
        ) : null}
        {claim.status === "pending" ? <ClaimDecision claimId={claim._id.toString()} /> : null}
      </div>
    </div>
  );
}
