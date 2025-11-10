/**
 * UNIFIED STAT CARD COMPONENT
 * Works across all dashboards
 */

import { LucideIcon } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  delay?: string;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function Stat({
  label,
  value,
  sublabel,
  icon: Icon,
  delay,
  className = "",
  trend,
}: StatProps) {
  return (
    <div
      className={`
        bg-white/[0.02] 
        backdrop-filter backdrop-blur-[20px] 
        border border-white/5 
        rounded-[14px] 
        shadow-[0_0_30px_rgba(255,255,255,0.02)] 
        p-6 
        hover:bg-white/[0.03] 
        transition-all duration-300 
        group 
       
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
          {label}
        </span>
        {Icon && (
          <Icon
            size={16}
            className="text-white/20 group-hover:text-white/30 transition-all duration-300"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-thin text-white/90">{value}</div>
        {trend && (
          <span
            className={`text-xs font-medium ${trend.isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      {sublabel && (
        <div className="text-white/30 text-[10px] font-light tracking-wider uppercase mt-2">
          {sublabel}
        </div>
      )}
    </div>
  );
}
