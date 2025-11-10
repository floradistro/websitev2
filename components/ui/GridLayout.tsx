"use client";

import { ReactNode } from "react";
import { Grid3x3, List, Check } from "lucide-react";

interface GridLayoutProps {
  children: ReactNode;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  selectedCount?: number;
  onClearSelection?: () => void;
  bulkActions?: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  columns?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export function GridLayout({
  children,
  viewMode = "grid",
  onViewModeChange,
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  emptyState,
  loading = false,
  columns = { sm: 2, md: 3, lg: 4, xl: 5 },
}: GridLayoutProps) {
  const gridClasses = `grid gap-4 grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!children && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                <Check size={16} className="text-white" />
              </div>
              <span
                className="text-white text-xs uppercase tracking-[0.15em] font-black"
                style={{ fontWeight: 900 }}
              >
                {selectedCount} Selected
              </span>
            </div>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] font-black transition-colors"
                style={{ fontWeight: 900 }}
              >
                Clear
              </button>
            )}
          </div>
          {bulkActions && (
            <div className="flex items-center gap-2">{bulkActions}</div>
          )}
        </div>
      )}

      {/* Grid/List Toggle */}
      {onViewModeChange && (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white/10 text-white border border-white/20"
                : "bg-transparent text-white/40 hover:text-white/60"
            }`}
            aria-label="Grid view"
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-white/10 text-white border border-white/20"
                : "bg-transparent text-white/40 hover:text-white/60"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      )}

      {/* Grid Content */}
      <div className={viewMode === "grid" ? gridClasses : "space-y-2"}>
        {children}
      </div>
    </div>
  );
}

// Reusable Grid Item/Card Component
interface GridItemProps {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  className?: string;
  selectable?: boolean;
}

export function GridItem({
  children,
  selected = false,
  onSelect,
  onClick,
  className = "",
  selectable = false,
}: GridItemProps) {
  return (
    <div
      className={`bg-[#0a0a0a] border ${selected ? "border-white/30" : "border-white/5"} hover:border-white/10 rounded-2xl transition-all overflow-hidden group relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {selectable && onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="w-5 h-5 bg-black/40 backdrop-blur-sm border border-white/20 rounded cursor-pointer checked:bg-white/20 transition-all"
          />
        </div>
      )}
      {children}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl">
      {icon && (
        <div className="flex justify-center mb-4 text-white/10">{icon}</div>
      )}
      <h3
        className="text-white text-xs uppercase tracking-[0.15em] mb-2 font-black"
        style={{ fontWeight: 900 }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
