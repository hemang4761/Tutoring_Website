import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-badge";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Assignment, Lead } from "@/models";

export const metadata = { title: "My students" };

export default async function TutorStudentsPage() {
  const user = await requireUser(["tutor"]);
  await connectDB();
  const assignments = await Assignment.find({ tutor: user._id }).sort({ status: 1 }).lean();
  const leads = await Lead.find({ _id: { $in: assignments.map((a) => a.lead) } }).lean();
  const byId = new Map(leads.map((l) => [l._id.toString(), l]));
  return (
    <>
      <PageHeader title="My students" description="Families assigned to you." />
      {assignments.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((a) => {
            const lead = byId.get(a.lead.toString());
            return (
              <article key={a._id.toString()} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between">
                  <h2 className="font-heading text-lg font-bold">{a.studentName}</h2>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-sm">{a.subjects.join(", ")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Parent: {lead?.parent.name} · {lead?.parent.email}
                  {lead?.parent.phone ? ` · ${lead.parent.phone}` : ""}
                </p>
                <Link href="/tutor/schedule" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                  Schedule a session
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No students yet" description="Claim a lead or wait for an admin to assign you one." />
      )}
    </>
  );
}
