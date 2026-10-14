import { Megaphone } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getOpenClients, getTodo, getTrends, getWeekAgenda } from "@/lib/queries/dashboard";
import { AnnounceForm } from "@/components/admin/top-bar";
import { TrendCharts, WeekAgenda } from "./dashboard-parts";
import { WorkBox } from "./work-box";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin();
  const { range: raw } = await searchParams;
  const range = ["3", "6", "12"].includes(raw ?? "") ? raw! : "3";
  const [todo, open, week, trends] = await Promise.all([getTodo(), getOpenClients(), getWeekAgenda(), getTrends(Number(range))]);

  return (
    <div className="space-y-8">
      <TrendCharts trends={trends} range={range} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-3">
          <h2 className="font-heading text-lg font-bold">Work</h2>
          <WorkBox items={todo} open={open} />
        </div>
        <div className="min-w-0 space-y-6">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
              <Megaphone className="size-4" /> Message everyone
            </h2>
            <div className="rounded-xl border bg-card p-4">
              <AnnounceForm compact />
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold">This week</h2>
            <WeekAgenda sessions={week} />
          </section>
        </div>
      </div>
    </div>
  );
}
