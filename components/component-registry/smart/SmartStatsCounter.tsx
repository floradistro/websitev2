/**
 * Smart Component: SmartStatsCounter
 * Displays real-time statistics with animated counters
 */

"use client";

import React from "react";
import { Text } from "../atomic/Text";
import { Icon } from "../atomic/Icon";

export interface SmartStatsCounterProps {
  vendorId: string;

  // Stats Data
  stats: Array<{
    label: string;
    value: string | number;
    icon?: string;
  }>;

  // Display Options
  layout?: "horizontal" | "vertical" | "grid";
  animate?: boolean;

  className?: string;
}

export function SmartStatsCounter({
  vendorId,
  stats,
  layout = "horizontal",
  animate = true,
  className = "",
}: SmartStatsCounterProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  const layoutClasses: Record<string, string> = {
    horizontal: "flex flex-wrap justify-center gap-12",
    vertical: "flex flex-col gap-6",
    grid: "grid grid-cols-2 md:grid-cols-4 gap-8",
  };

  return (
    <div className={`py-8 ${className}`}>
      <div className={layoutClasses[layout]}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            {stat.icon && (
              <div className="mb-2">
                <Icon name={stat.icon} size="2xl" />
              </div>
            )}

            <Text
              content={String(stat.value)}
              variant="headline"
              size="4xl"
              weight="bold"
              align="center"
              className={animate ? "animate-fade-in-up" : ""}
            />

            <Text
              content={stat.label}
              variant="label"
              size="sm"
              align="center"
              color="rgba(255,255,255,0.6)"
              className="uppercase tracking-[0.12em] mt-2 font-black"
              font_weight="900"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
