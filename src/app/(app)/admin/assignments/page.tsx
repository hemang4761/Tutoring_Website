import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-badge";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { money } from "@/lib/format";
import { Assignment } from "@/models";

export const metadata = { title: "Assignments" };

export default async function AssignmentsPage() {
  await requireAdmin();
  await connectDB();
  const rows = await Assignment.find()
    .sort({ status: 1, createdAt: -1 })
    .populate("tutor", "name")
    .populate("lead", "parent")
    .lean();
  return (
    <>
      <PageHeader title="Assignments" description="Every tutor–student pairing and the rate that applies." />
      {rows.length ? (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Family</th>
                <th className="px-4 py-2 font-medium">Tutor</th>
                <th className="px-4 py-2 font-medium">Subjects</th>
                <th className="px-4 py-2 font-medium">Rate</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((a) => {
                const tutor = a.tutor as unknown as { name: string };
                const lead = a.lead as unknown as { _id: { toString(): string }; parent?: { name: string } };
                return (
                  <tr key={a._id.toString()}>
                    <td className="px-4 py-3 font-medium">{a.studentName}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead?._id}`} className="hover:underline">
                        {lead?.parent?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{tutor?.name}</td>
                    <td className="px-4 py-3">{a.subjects.join(", ")}</td>
                    <td className="px-4 py-3">{money(a.rate)}/hr</td>
                    <td className="px-4 py-3">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No assignments" />
      )}
    </>
  );
}
