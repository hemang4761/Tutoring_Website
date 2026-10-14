import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { DonutChart, FunnelBars, HorizontalBarChart, StackedBarChart, TrendAreaChart } from "@/components/charts";
import { requireAdmin } from "@/lib/session";
import { attendance, hoursByTutorWeek, leadFunnel, leadsByWeek, medianDaysToAssign, revenueByMonth, sourceBreakdown, subjectDemand } from "@/lib/queries/stats";
import { money } from "@/lib/format";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireAdmin();
  const [trend, funnel, subjects, sources, hours, revenue, att, median] = await Promise.all([
    leadsByWeek(12),
    leadFunnel(),
    subjectDemand(),
    sourceBreakdown(),
    hoursByTutorWeek(8),
    revenueByMonth(6),
    attendance(90),
    medianDaysToAssign(),
  ]);
  return (
    <>
      <PageHeader title="Reports" description="Lead flow, hours, estimated revenue, and attendance." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Median days to assign" value={median == null ? "—" : median.toFixed(1)} />
        <StatCard label="Attendance (90d)" value={att.rate == null ? "—" : `${Math.round(att.rate * 100)}%`} hint={`${att.noShow} no-shows · ${att.canceled} canceled`} />
        <StatCard label="Billed last 6 months" value={money(revenue.reduce((n, r) => n + r.revenue, 0))} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Leads by week">
          <StackedBarChart data={trend.data} xKey="week" series={trend.sources} />
        </Panel>
        <Panel title="Funnel">
          <FunnelBars data={funnel} />
        </Panel>
        <Panel title="Subject demand">
          <HorizontalBarChart data={subjects.map((s) => ({ name: s.subject, count: s.count }))} labelKey="name" valueKey="count" />
        </Panel>
        <Panel title="Sources">
          <DonutChart
            data={sources.map((s, i) => ({ name: s.source, value: s.count, color: ["#1a2c4e", "#ffcc00", "#3b5998", "#10b981", "#f97316", "#8b5cf6"][i % 6] }))}
            centerValue={String(sources.reduce((n, s) => n + s.count, 0))}
            centerLabel="leads"
          />
        </Panel>
        <Panel title="Hours by tutor">
          <StackedBarChart data={hours.data} xKey="week" series={hours.series} />
        </Panel>
        <Panel title="Estimated revenue">
          <TrendAreaChart data={revenue} xKey="month" yKey="revenue" prefix="$" color="#ffcc00" />
        </Panel>
      </div>
    </>
  );
}
