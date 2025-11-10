/**
 * UNIFIED STATS GRID
 * Quick wrapper for stat cards with automatic layout
 */

import { ReactNode } from "react";

interface StatsGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function StatsGrid({
  children,
  cols = 4,
  className = "",
}: StatsGridProps) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 lg:grid-cols-6",
  };

  return (
    <div className={`grid ${colsClass[cols]} gap-3 mb-8 ${className}`}>
      {children}
    </div>
  );
}
