import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { LoadingSpinner } from "@/components/common";
import {
  TrendingUp,
  Calendar,
  CalendarDays,
  BarChart3,
} from "lucide-react";

const CHART_CONFIGS = [
  {
    key: "pipeline",
    title: "Pipeline Value",
    dataKeys: [
      { key: "pipeline_value", name: "Weighted Value", color: "#10b981", type: "area" },
      { key: "total_deals", name: "Open Deals", color: "#6ee7b7", type: "line" },
    ],
    yAxisFormatter: (v) => `₦${(v / 1_000_000).toFixed(1)}M`,
    tooltipFormatter: (v, name) =>
      name === "Weighted Value" ? `₦${v.toLocaleString()}` : v,
  },
  {
    key: "inventory",
    title: "Inventory Health",
    dataKeys: [
      { key: "stock_value", name: "Stock Value", color: "#f59e0b", type: "area" },
      { key: "expiry_risks", name: "Expiry Risks", color: "#ef4444", type: "bar" },
    ],
    yAxisFormatter: (v) => `₦${(v / 1_000_000).toFixed(1)}M`,
    tooltipFormatter: (v, name) =>
      name === "Stock Value" ? `₦${v.toLocaleString()}` : `${v} SKUs`,
  },
  {
    key: "programs",
    title: "Meal Mate Impact",
    dataKeys: [
      { key: "meals_delivered", name: "Meals Delivered", color: "#a3e635", type: "area" },
      { key: "active_schools", name: "Active Schools", color: "#84cc16", type: "line" },
    ],
    yAxisFormatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v),
    tooltipFormatter: (v, name) => v.toLocaleString(),
  },
  {
    key: "engagement",
    title: "Social & Insights",
    dataKeys: [
      { key: "engagement_rate", name: "Engagement %", color: "#3b82f6", type: "area" },
      { key: "open_gaps", name: "Open Gaps", color: "#a855f7", type: "bar" },
    ],
    yAxisFormatter: (v) => v,
    tooltipFormatter: (v, name) =>
      name === "Engagement %" ? `${v}%` : v,
  },
];

function MiniChart({ config, data }) {
  const isEmpty = !data || data.length === 0;
  const chartData = isEmpty ? [{ label: "—", pipeline_value: 0, total_deals: 0, stock_value: 0, expiry_risks: 0, meals_delivered: 0, active_schools: 0, engagement_rate: 0, open_gaps: 0 }] : data;

  return (
    <div className="bg-[#0e2a2c]/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 relative overflow-hidden">
      <h4 className="text-sm font-semibold text-slate-300 mb-3">
        {config.title}
      </h4>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-sm text-slate-500 bg-slate-900/70 px-4 py-2 rounded-lg">
            Awaiting data…
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            {config.dataKeys
              .filter((dk) => dk.type === "area")
              .map((dk) => (
                <linearGradient
                  key={dk.key}
                  id={`grad-${dk.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                </linearGradient>
              ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={{ stroke: "#475569" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={config.yAxisFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,.4)",
            }}
            labelStyle={{ color: "#e2e8f0", fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: "#cbd5e1", fontSize: 13 }}
            formatter={config.tooltipFormatter}
          />
          {config.dataKeys.map((dk) => {
            if (dk.type === "area") {
              return (
                <Area
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.name}
                  stroke={dk.color}
                  strokeWidth={2}
                  fill={`url(#grad-${dk.key})`}
                  dot={false}
                  activeDot={{ r: 4, fill: dk.color }}
                />
              );
            }
            if (dk.type === "bar") {
              return (
                <Bar
                  key={dk.key}
                  dataKey={dk.key}
                  name={dk.name}
                  fill={dk.color}
                  opacity={0.6}
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              );
            }
            return (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardTimeline({ timeline, loading }) {
  const [period, setPeriod] = useState("weekly");

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const data = period === "weekly" ? timeline?.weekly : timeline?.monthly;

  return (
    <div className="flex flex-col gap-5">
      {/* Period Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <TrendingUp size={16} className="text-brand-lime" />
          <span>Historical performance across all operations</span>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setPeriod("weekly")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === "weekly"
                ? "bg-brand-lime text-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar size={14} />
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === "monthly"
                ? "bg-brand-lime text-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CalendarDays size={14} />
            Monthly
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {CHART_CONFIGS.map((config) => (
          <MiniChart key={config.key} config={config} data={data} />
        ))}
      </div>
    </div>
  );
}
