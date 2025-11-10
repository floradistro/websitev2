'use client';

import { useEffect, useState, useRef } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

type KPICardProps = {
  label: string;
  value: number | string;
  format?: 'currency' | 'number' | 'percentage' | 'none';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: LucideIcon;
  iconColor?: string;
  tooltip?: string;
  sparklineData?: number[];
  compareValue?: number;
  loading?: boolean;
  className?: string;
};

export function KPICard({
  label,
  value,
  format = 'none',
  trend,
  trendValue,
  icon: Icon,
  iconColor = 'text-blue-500',
  tooltip,
  sparklineData,
  compareValue,
  loading = false,
  className = '',
}: KPICardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const prevValueRef = useRef(0);

  // Animated number count-up
  useEffect(() => {
    if (loading) return;

    const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(numValue)) return;

    const start = prevValueRef.current;
    const end = numValue;
    const duration = 800; // ms
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeProgress;

      setAnimatedValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, loading]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'number':
        return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return typeof value === 'string' ? value : val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      case 'neutral':
        return <Minus className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      case 'neutral':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return <KPICardSkeleton className={className} />;
  }

  return (
    <div
      className={`
        group relative bg-white/5 backdrop-blur-sm rounded-xl p-5
        border border-white/10 hover:border-white/20
        transition-all duration-200 ease-out
        hover:shadow-lg hover:shadow-white/5
        hover:-translate-y-0.5
        ${className}
      `}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        {Icon && (
          <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Trend Badge */}
        {trend && trendValue !== undefined && (
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
              ${getTrendColor()} bg-current/10
            `}
          >
            {getTrendIcon()}
            {format === 'percentage' ? `${trendValue.toFixed(1)}%` : `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}%`}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="text-white text-3xl font-semibold tracking-tight leading-none">
          {typeof value === 'number' ? formatValue(animatedValue) : value}
        </div>
      </div>

      {/* Label with Tooltip */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-white/50 text-xs uppercase tracking-wider font-medium">
          {label}
        </div>
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-10 animate-in fade-in slide-in-from-bottom-1 duration-150">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-12 -mx-1 mb-2">
          <Sparkline data={sparklineData} color={getTrendColor()} />
        </div>
      )}

      {/* Comparison */}
      {compareValue !== undefined && (
        <div className="text-xs text-white/40">
          vs. {formatValue(compareValue)} previous period
        </div>
      )}
    </div>
  );
}

// Sparkline Component
function Sparkline({ data, color = 'text-blue-400' }: { data: number[]; color?: string }) {
  const width = 100;
  const height = 48;
  const padding = 2;

  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="opacity-60 group-hover:opacity-100 transition-opacity"
    >
      {/* Fill gradient */}
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#sparkline-gradient)"
        className={color}
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  );
}

// Skeleton Loader
function KPICardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="w-16 h-6 rounded-md bg-white/10 animate-pulse" />
      </div>
      <div className="mb-2">
        <div className="h-9 w-32 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-3" />
      <div className="h-12 rounded bg-white/10 animate-pulse" />
    </div>
  );
}

// Export skeleton separately for use elsewhere
export { KPICardSkeleton };
