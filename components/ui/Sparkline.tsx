"use client";

import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showGradient?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Apple-Quality Sparkline Component
 *
 * Inspired by:
 * - Apple Stocks app sparklines
 * - Apple Health app charts
 * - iOS Activity rings
 *
 * Features:
 * - Smooth bezier curves
 * - Gradient fill
 * - Entrance animation
 * - Responsive sizing
 */
export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = "rgba(255, 255, 255, 0.6)",
  fillColor = "rgba(255, 255, 255, 0.1)",
  showGradient = true,
  animate = true,
  className = "",
}: SparklineProps) {
  // Calculate path for sparkline
  const { path, fillPath, isEmpty } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", fillPath: "", isEmpty: true };
    }

    // Filter out invalid data points
    const validData = data.filter((d) => d !== null && d !== undefined && !isNaN(d));
    if (validData.length === 0) {
      return { path: "", fillPath: "", isEmpty: true };
    }

    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1; // Avoid division by zero

    // Calculate points
    const points = validData.map((value, index) => {
      const x = (index / (validData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return { x, y };
    });

    // Create smooth bezier curve using cardinal spline
    const createSmoothPath = (points: { x: number; y: number }[]) => {
      if (points.length < 2) return "";

      let path = `M ${points[0].x},${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const prev = points[i - 1] || current;
        const afterNext = points[i + 2] || next;

        // Calculate control points for smooth curve
        const cp1x = current.x + (next.x - prev.x) / 6;
        const cp1y = current.y + (next.y - prev.y) / 6;
        const cp2x = next.x - (afterNext.x - current.x) / 6;
        const cp2y = next.y - (afterNext.y - current.y) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
      }

      return path;
    };

    const linePath = createSmoothPath(points);

    // Create filled area path
    const filledPath = showGradient
      ? `${linePath} L ${width},${height} L 0,${height} Z`
      : "";

    return {
      path: linePath,
      fillPath: filledPath,
      isEmpty: false,
    };
  }, [data, width, height, showGradient]);

  // Determine trend direction
  const trendDirection = useMemo(() => {
    if (!data || data.length < 2) return "neutral";
    const first = data[0];
    const last = data[data.length - 1];
    if (last > first) return "up";
    if (last < first) return "down";
    return "neutral";
  }, [data]);

  // Dynamic colors based on trend
  const dynamicColor = useMemo(() => {
    if (trendDirection === "up") return "rgba(52, 199, 89, 0.8)"; // iOS Green
    if (trendDirection === "down") return "rgba(255, 69, 58, 0.8)"; // iOS Red
    return color;
  }, [trendDirection, color]);

  const dynamicFillColor = useMemo(() => {
    if (trendDirection === "up") return "rgba(52, 199, 89, 0.15)";
    if (trendDirection === "down") return "rgba(255, 69, 58, 0.15)";
    return fillColor;
  }, [trendDirection, fillColor]);

  if (isEmpty) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-px bg-white/5" />
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      preserveAspectRatio="none"
    >
      {/* Gradient definition */}
      {showGradient && (
        <defs>
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={dynamicFillColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={dynamicFillColor} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      {/* Filled area with gradient */}
      {showGradient && fillPath && (
        <path
          d={fillPath}
          fill="url(#sparkline-gradient)"
          className={animate ? "animate-sparkline-fill" : ""}
        />
      )}

      {/* Line path */}
      <path
        d={path}
        stroke={dynamicColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "animate-sparkline-stroke" : ""}
        style={{
          vectorEffect: "non-scaling-stroke",
        }}
      />

      {/* Animations */}
      <style jsx>{`
        @keyframes sparkline-stroke {
          from {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          to {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes sparkline-fill {
          from {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            opacity: 1;
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }

        .animate-sparkline-stroke {
          animation: sparkline-stroke 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .animate-sparkline-fill {
          animation: sparkline-fill 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </svg>
  );
}

/**
 * Simple Bar Chart Sparkline (Alternative Style)
 * Like Apple Screen Time weekly view
 */
export function SparklineBars({
  data,
  width = 100,
  height = 32,
  gap = 2,
  className = "",
}: Omit<SparklineProps, "color" | "fillColor" | "showGradient" | "animate">) {
  const isEmpty = !data || data.length === 0;

  if (isEmpty) {
    return (
      <div className={`flex items-end gap-${gap} ${className}`} style={{ width, height }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 h-2 bg-white/5 rounded-sm" />
        ))}
      </div>
    );
  }

  const max = Math.max(...data.filter((d) => d !== null && !isNaN(d)));
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <div className={`flex items-end gap-${gap} ${className}`} style={{ width, height }}>
      {data.map((value, index) => {
        const barHeight = max > 0 ? (value / max) * height : 0;
        const isPositive = value > (data[index - 1] || 0);

        return (
          <div
            key={index}
            className={`rounded-sm transition-all duration-300 ${
              isPositive ? "bg-[#34C759]" : "bg-white/20"
            }`}
            style={{
              width: barWidth,
              height: Math.max(barHeight, 2), // Min 2px height
              opacity: 0.6 + (barHeight / height) * 0.4, // Dynamic opacity based on value
            }}
          />
        );
      })}
    </div>
  );
}
