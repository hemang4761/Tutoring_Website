"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const PALETTE = ["#1a2c4e", "#ffcc00", "#3b5998", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#64748b"];

const axis = { fontSize: 12, fill: "var(--muted-foreground)" };
const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
    color: "var(--popover-foreground)",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
  },
  cursor: { fill: "var(--muted)", opacity: 0.6 },
};

function colorFor(i: number, key: string) {
  // navy reads poorly on dark backgrounds, so the first series uses the chart token
  if (i === 0) return "var(--chart-1)";
  if (key === "Unknown") return "#94a3b8";
  return PALETTE[i % PALETTE.length];
}

export function StackedBarChart({
  data,
  xKey,
  series,
  height = 280,
  legend = true,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: string[];
  height?: number;
  legend?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        {legend && series.length > 1 ? <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} /> : null}
        {series.map((s, i) => (
          <Bar
            key={s}
            dataKey={s}
            stackId="a"
            fill={colorFor(i, s)}
            radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={36}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data,
  xKey,
  yKey,
  height = 260,
  prefix = "",
  color = "var(--chart-1)",
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  height?: number;
  prefix?: string;
  color?: string;
}) {
  const id = `grad-${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `${prefix}${v}`} />
        <Tooltip {...tooltipStyle} formatter={(v) => `${prefix}${Number(v).toLocaleString()}`} />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  labelKey,
  valueKey,
  height,
  color = "var(--chart-1)",
}: {
  data: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey={labelKey} width={150} tick={{ ...axis, fill: "var(--foreground)" }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={valueKey} fill={color} radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: "right", fontSize: 12, fill: "var(--muted-foreground)" }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunnelBars({ data }: { data: Array<{ stage: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        const conv = i > 0 && data[i - 1].count ? Math.round((d.count / data[i - 1].count) * 100) : null;
        return (
          <div key={d.stage}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium">{d.stage}</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{d.count}</span>
                {conv !== null ? <span className="ml-2 text-xs">{conv}% of prev</span> : null}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: i === data.length - 1 ? "#ffcc00" : "var(--chart-1)", opacity: 1 - i * 0.12 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={total ? data : [{ name: "None", value: 1, color: "var(--muted)" }]} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={total ? 2 : 0} stroke="none">
            {(total ? data : [{ color: "var(--muted)" }]).map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          {total ? <Tooltip {...tooltipStyle} /> : null}
        </PieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-bold">{centerValue}</span>
          {centerLabel ? <span className="text-xs text-muted-foreground">{centerLabel}</span> : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: d.color }} />
            {d.name} <span className="font-semibold text-foreground">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
