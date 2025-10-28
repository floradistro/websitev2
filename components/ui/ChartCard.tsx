/**
 * UNIFIED CHART CARD
 * Container for charts with title, subtitle, trend
 */

import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  delay?: string;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  trend,
  icon: Icon,
  delay,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`minimal-glass ${className}`}
     
    >
      <div className="border-b border-white/5 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-white/30 text-[10px] font-light uppercase">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-2">
            {trend.isPositive ? (
              <TrendingUp size={16} className="text-green-500" />
            ) : (
              <TrendingDown size={16} className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
        {Icon && !trend && (
          <Icon size={16} className="text-white/40" />
        )}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

