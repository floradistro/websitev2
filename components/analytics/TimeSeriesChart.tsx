/**
 * Time Series Chart Component
 * Beautiful, performant chart for analytics data visualization
 */

"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  formatCurrency,
  formatNumber,
  formatDate,
} from "@/lib/analytics-utils";
import type { TimeSeriesDataPoint } from "@/types/analytics";

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  activeMetric?: "sent" | "opened" | "clicked" | "revenue";
  height?: number;
  showLegend?: boolean;
  className?: string;
}

const metricConfig = {
  sent: {
    label: "Sent",
    color: "#60a5fa", // blue-400
    fillOpacity: 0.1,
  },
  opened: {
    label: "Opened",
    color: "#34d399", // green-400
    fillOpacity: 0.1,
  },
  clicked: {
    label: "Clicked",
    color: "#a78bfa", // purple-400
    fillOpacity: 0.1,
  },
  revenue: {
    label: "Revenue",
    color: "#fbbf24", // yellow-400
    fillOpacity: 0.1,
  },
};

export function TimeSeriesChart({
  data,
  activeMetric = "revenue",
  height = 300,
  showLegend = false,
  className = "",
}: TimeSeriesChartProps) {
  // Format data for display
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: formatDate(d.date, "short"),
    }));
  }, [data]);

  const config = metricConfig[activeMetric];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const value = payload[0].value;

    return (
      <div className="bg-black/90 border border-white/20 rounded-lg p-3 backdrop-blur-sm">
        <p className="text-white/60 text-xs mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold text-lg">
            {activeMetric === "revenue"
              ? formatCurrency(value, { decimals: 0 })
              : formatNumber(value)}
          </span>
          <span className="text-white/40 text-xs">{config.label}</span>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white/20"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm">No data available</p>
          <p className="text-white/20 text-xs mt-1">
            Data will appear here once you have campaign activity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={`gradient-${activeMetric}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="displayDate"
            stroke="rgba(255, 255, 255, 0.2)"
            style={{
              fontSize: "11px",
              fontFamily: "inherit",
              fill: "rgba(255, 255, 255, 0.4)",
            }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="rgba(255, 255, 255, 0.2)"
            style={{
              fontSize: "11px",
              fontFamily: "inherit",
              fill: "rgba(255, 255, 255, 0.4)",
            }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              activeMetric === "revenue"
                ? formatCurrency(value, { decimals: 0, compact: true })
                : formatNumber(value, { compact: true })
            }
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: config.color, strokeWidth: 1 }}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey={activeMetric}
            stroke={config.color}
            strokeWidth={2}
            fill={`url(#gradient-${activeMetric})`}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Multi-Metric Time Series Chart
 * Shows multiple metrics on the same chart
 */
interface MultiMetricChartProps {
  data: TimeSeriesDataPoint[];
  metrics: Array<"sent" | "opened" | "clicked" | "revenue">;
  height?: number;
  className?: string;
}

export function MultiMetricChart({
  data,
  metrics = ["sent", "opened", "clicked"],
  height = 300,
  className = "",
}: MultiMetricChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: formatDate(d.date, "short"),
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-black/90 border border-white/20 rounded-lg p-3 backdrop-blur-sm min-w-[150px]">
        <p className="text-white/60 text-xs mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const metric = entry.dataKey as keyof typeof metricConfig;
            const config = metricConfig[metric];

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-white/60 text-xs">{config.label}</span>
                </div>
                <span className="text-white font-bold text-sm">
                  {metric === "revenue"
                    ? formatCurrency(entry.value, { decimals: 0 })
                    : formatNumber(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-white/40 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {metrics.map((metric) => {
              const config = metricConfig[metric];
              return (
                <linearGradient
                  key={metric}
                  id={`gradient-${metric}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={config.color}
                    stopOpacity={0.2}
                  />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="displayDate"
            stroke="rgba(255, 255, 255, 0.2)"
            style={{
              fontSize: "11px",
              fontFamily: "inherit",
              fill: "rgba(255, 255, 255, 0.4)",
            }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="rgba(255, 255, 255, 0.2)"
            style={{
              fontSize: "11px",
              fontFamily: "inherit",
              fill: "rgba(255, 255, 255, 0.4)",
            }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatNumber(value, { compact: true })}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.6)",
              paddingTop: "20px",
            }}
          />

          {metrics.map((metric) => {
            const config = metricConfig[metric];
            return (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={config.label}
                stroke={config.color}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
