'use client';

import { HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
};

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.5rem',
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
      {...props}
    />
  );
}

// Table Skeleton
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      {/* Table Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height={16} width="80%" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                height={16}
                width={`${60 + Math.random() * 30}%`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart Skeleton
export function SkeletonChart({
  height = 240,
  className = '',
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-2 h-full" style={{ height: `${height}px` }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const barHeight = 40 + Math.random() * 60; // 40-100% height
          return (
            <div
              key={i}
              className="skeleton flex-1"
              style={{
                height: `${barHeight}%`,
                minWidth: '8px',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// KPI Grid Skeleton (with sparkline)
export function SkeletonKPIGrid({
  count = 4,
  className = '',
  showSparkline = true,
}: {
  count?: number;
  className?: string;
  showSparkline?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="minimal-glass subtle-glow p-6 border-l-2 border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton width={80} height={10} className="mb-2" borderRadius={4} />
              <Skeleton width={120} height={28} className="mb-1" borderRadius={6} />
              <Skeleton width={140} height={10} borderRadius={4} />
            </div>
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10">
              <Skeleton width={20} height={20} borderRadius={4} />
            </div>
          </div>

          {/* Sparkline skeleton */}
          {showSparkline && (
            <div className="mb-3">
              <div className="flex items-end gap-1 h-8">
                {Array.from({ length: 7 }).map((_, barIndex) => {
                  const heights = [16, 20, 18, 24, 22, 28, 26];
                  return (
                    <div
                      key={barIndex}
                      className="skeleton flex-1 rounded-sm"
                      style={{ height: `${heights[barIndex]}px` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Trend indicator skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton width={60} height={12} borderRadius={6} />
            <Skeleton width={100} height={12} borderRadius={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Card Skeleton
export function SkeletonCard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}>
      <Skeleton width="60%" height={20} className="mb-4" />
      <Skeleton width="100%" height={16} className="mb-2" />
      <Skeleton width="100%" height={16} className="mb-2" />
      <Skeleton width="80%" height={16} />
    </div>
  );
}

// List Skeleton
export function SkeletonList({
  items = 5,
  className = '',
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <Skeleton width={48} height={48} borderRadius="50%" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={14} />
          </div>
          <Skeleton width={80} height={32} borderRadius={6} />
        </div>
      ))}
    </div>
  );
}

// Analytics Page Skeleton
export function SkeletonAnalyticsPage({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={32} />
        <div className="flex gap-2">
          <Skeleton width={100} height={40} borderRadius={8} />
          <Skeleton width={100} height={40} borderRadius={8} />
          <Skeleton width={100} height={40} borderRadius={8} />
        </div>
      </div>

      {/* KPI Cards */}
      <SkeletonKPIGrid count={4} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={100} height={36} borderRadius={6} />
        ))}
      </div>

      {/* Content */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}

// Text Skeleton (for inline text placeholders)
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
    </div>
  );
}

// Dashboard Stats Skeleton
export function SkeletonDashboardStats({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width={40} height={40} borderRadius="50%" />
            <Skeleton width={60} height={20} />
          </div>
          <Skeleton width="100%" height={40} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </div>
      ))}
    </div>
  );
}
