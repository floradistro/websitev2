"use client";

import { useState } from "react";
import {
  GripVertical,
  MoreVertical,
  Trash2,
  RefreshCw,
  Maximize2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface KPIWidgetProps {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  visualization?: "number" | "chart" | "progress" | "list";
  data?: any;
  onDelete?: () => void;
  onRefresh?: () => void;
}

export function KPIWidget({
  id,
  title,
  value,
  change,
  changeLabel,
  subtitle,
  visualization = "number",
  data,
  onDelete,
  onRefresh,
}: KPIWidgetProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all duration-300">
      {/* Drag Handle */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
        <GripVertical size={16} className="text-white/40" />
      </div>

      {/* Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg"
        >
          <MoreVertical size={16} className="text-white/60" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 min-w-[160px]">
            {onRefresh && (
              <button
                onClick={() => {
                  onRefresh();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh Data
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} />
                Remove Widget
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-8">
        <div className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">
          {title}
        </div>

        <div className="flex items-end justify-between mb-2">
          <div
            className="text-5xl font-black text-white"
            style={{ fontWeight: 900 }}
          >
            {value}
          </div>

          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {change >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {subtitle && <div className="text-white/40 text-sm">{subtitle}</div>}

        {changeLabel && (
          <div className="text-white/40 text-xs mt-1">{changeLabel}</div>
        )}
      </div>

      {/* Visualization Area */}
      {visualization !== "number" && data && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {visualization === "progress" && (
            <div className="space-y-2">
              {data.map((item: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {visualization === "list" && (
            <div className="space-y-2">
              {data.slice(0, 5).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-white/80">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
