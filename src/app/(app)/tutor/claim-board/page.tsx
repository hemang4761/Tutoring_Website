"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { claimLead, withdrawClaim } from "@/actions/claims";
import { toastResult } from "@/lib/toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LeadStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DAYS, TIME_BLOCKS } from "@/lib/constants";

type Card = {
  _id: string;
  parent: { name: string };
  students: Array<{ name: string; grade?: string }>;
  subjects: string[];
  format?: string;
  location?: string;
  goals?: string;
  availability?: Array<{ day: number; block: string }>;
  status: string;
  myClaimId?: string;
};

export default function ClaimBoardPage() {
  const [leads, setLeads] = useState<Card[] | null>(null);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/claim-board")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []));
  }, []);

  return (
    <>
      <PageHeader title="Claim board" description="Open families looking for a tutor. Claiming notifies an admin." />
      {!leads ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !leads.length ? (
        <EmptyState title="No open leads" description="New families from the onboarding form show up here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {leads.map((l) => (
            <article key={l._id} className="rounded-xl border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-bold">
                    {l.students[0]?.name ?? l.parent.name}
                    {l.students[0]?.grade ? <span className="font-normal text-muted-foreground"> · grade {l.students[0].grade}</span> : null}
                  </h2>
                  <p className="text-sm">{l.subjects.join(", ")}</p>
                </div>
                <LeadStatusBadge status={l.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{l.goals || "No goals listed."}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {l.format}
                {l.location ? ` · ${l.location}` : ""}
                {l.availability?.length
                  ? ` · ${l.availability.map((a) => `${DAYS[a.day]} ${TIME_BLOCKS.find((b) => b.key === a.block)?.label}`).join(", ")}`
                  : ""}
              </p>
              {l.myClaimId ? (
                <Button
                  className="mt-4"
                  variant="outline"
                  disabled={pending}
                  onClick={() => start(async () => toastResult(await withdrawClaim(l.myClaimId!), "Withdrawn"))}
                >
                  Withdraw claim
                </Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Why you're a good fit (optional)"
                    value={note[l._id] ?? ""}
                    onChange={(e) => setNote((n) => ({ ...n, [l._id]: e.target.value }))}
                  />
                  <Button
                    disabled={pending}
                    onClick={() => start(async () => toastResult(await claimLead(l._id, note[l._id])))}
                  >
                    {pending ? <Loader2 className="animate-spin" /> : null}
                    Claim this student
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
