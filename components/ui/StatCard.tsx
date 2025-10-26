/**
 * UNIFIED STAT CARD WITH FULL CONTENT
 * Handles icon, value, label, sublabel, trend - everything!
 */

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
  delay,
  loading = false,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in ${className}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
          {label}
        </span>
        <Icon
          size={16}
          className="text-white/20 group-hover:text-white/30 transition-all duration-300"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-thin text-white/90 mb-2">
          {loading ? '—' : value}
        </div>
        {trend && !loading && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {sublabel && (
        <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">
          {sublabel}
        </div>
      )}
    </div>
  );
}

