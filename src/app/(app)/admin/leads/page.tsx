import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/session";
import { connectDB, plain } from "@/lib/db";
import { Lead } from "@/models";
import { statusCounts } from "@/lib/queries/stats";
import { NewLeadDialog } from "./new-lead-dialog";
import { LeadsBoard, LeadsTable, LeadsToolbar, type LeadRow } from "./leads-client";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}) {
  await requireAdmin();
  const { q = "", status = "", view = "table" } = await searchParams;
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { "parent.name": rx },
      { "parent.email": rx },
      { "students.name": rx },
      { subjects: rx },
      { tags: rx },
    ];
  }
  const [leads, counts] = await Promise.all([
    Lead.find(filter).sort({ lastActivityAt: -1, createdAt: -1 }).limit(400).populate("assignedTutors", "name").lean(),
    statusCounts(),
  ]);
  const rows = plain(leads) as unknown as LeadRow[];

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every family from the onboarding form and anything you add by hand."
        actions={
          <NewLeadDialog
            trigger={
              <Button>
                <Plus /> New lead
              </Button>
            }
          />
        }
      />
      <LeadsToolbar q={q} status={status} view={view === "board" ? "board" : "table"} counts={counts} />
      {view === "board" ? <LeadsBoard leads={rows} /> : <LeadsTable leads={rows} />}
    </>
  );
}
