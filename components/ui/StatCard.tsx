import { LucideIcon } from "lucide-react";
import { Sparkline, SparklineBars } from "./Sparkline";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel: string;
  icon: LucideIcon;
  delay?: string;
  loading?: boolean;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  sparklineData?: number[];
  sparklineType?: "line" | "bars";
  showSparkline?: boolean;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  delay = "0s",
  loading = false,
  trend,
  sparklineData,
  sparklineType = "line",
  showSparkline = true,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl">
        <div className="skeleton h-4 w-24 mb-4"></div>
        <div className="skeleton h-10 w-32 mb-2"></div>
        <div className="skeleton h-3 w-20"></div>
      </div>
    );
  }

  return (
    <div className="minimal-glass subtle-glow p-3 md:p-6 rounded-xl md:rounded-2xl hover:bg-white/[0.03] transition-all duration-300 group">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <span className="text-label text-[8px] md:text-[9px]">{label}</span>
        <Icon
          size={12}
          className="text-white/20 group-hover:text-white/30 transition-all duration-300 md:hidden"
          strokeWidth={1.5}
        />
        <Icon
          size={16}
          className="text-white/20 group-hover:text-white/30 transition-all duration-300 hidden md:block"
          strokeWidth={1.5}
        />
      </div>
      <div className="text-xl md:text-3xl font-light text-white/90 mb-1 md:mb-2">{value}</div>

      {/* Sparkline - Apple-style trend visualization */}
      {showSparkline && sparklineData && sparklineData.length > 0 && (
        <div className="my-2 md:my-3">
          {sparklineType === "bars" ? (
            <SparklineBars
              data={sparklineData}
              width={120}
              height={24}
              gap={2}
              className="hidden md:block"
            />
          ) : (
            <Sparkline
              data={sparklineData}
              width={120}
              height={24}
              showGradient={true}
              animate={true}
              className="hidden md:block"
            />
          )}
          {/* Mobile version - smaller */}
          {sparklineType === "bars" ? (
            <SparklineBars
              data={sparklineData}
              width={80}
              height={16}
              gap={1}
              className="md:hidden"
            />
          ) : (
            <Sparkline
              data={sparklineData}
              width={80}
              height={16}
              showGradient={true}
              animate={true}
              className="md:hidden"
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sublabel text-[8px] md:text-[9px]">{sublabel}</div>
        {trend && (
          <div
            className={`text-[9px] md:text-[10px] font-light ${trend.direction === "up" ? "text-green-400" : "text-red-400"}`}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
