"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Zap, Image, TrendingUp } from "lucide-react";

interface ProcessingItem {
  id: string;
  name: string;
  status: "pending" | "processing" | "success" | "error";
  progress?: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface ProcessingMonitorProps {
  isOpen: boolean;
  title: string;
  items: ProcessingItem[];
  onClose: () => void;
}

export default function ProcessingMonitor({
  isOpen,
  title,
  items,
  onClose,
}: ProcessingMonitorProps) {
  const [animatedItems, setAnimatedItems] = useState<ProcessingItem[]>(items);

  useEffect(() => {
    setAnimatedItems(items);
  }, [items]);

  if (!isOpen) return null;

  const totalItems = items.length;
  const completed = items.filter((i) => i.status === "success" || i.status === "error").length;
  const successful = items.filter((i) => i.status === "success").length;
  const failed = items.filter((i) => i.status === "error").length;
  const processing = items.filter((i) => i.status === "processing").length;
  const progressPercentage = (completed / totalItems) * 100;

  const avgTime =
    items
      .filter((i) => i.endTime && i.startTime)
      .reduce((acc, i) => acc + (i.endTime! - i.startTime!) / 1000, 0) / successful || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-white/20" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-[#0a0a0a] border border-white/10 w-full max-w-3xl max-h-[85vh] flex flex-col"
        style={{ margin: "auto" }}
      >
        {/* Header with Live Stats */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl text-white font-light mb-1">{title}</h2>
              <p className="text-white/60 text-sm">
                {completed}/{totalItems} processed
              </p>
            </div>
            <div className="flex items-center gap-2">
              {processing > 0 && (
                <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2">
                  <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-blue-500 text-sm font-medium">{processing} processing</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/60">
              <span>{progressPercentage.toFixed(0)}% complete</span>
              {avgTime > 0 && <span>{avgTime.toFixed(1)}s avg</span>}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-600/10 border border-green-500/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-white/60 text-xs uppercase tracking-wider">Success</span>
              </div>
              <div className="text-2xl font-light text-green-500">{successful}</div>
            </div>
            <div className="bg-red-600/10 border border-red-500/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-white/60 text-xs uppercase tracking-wider">Failed</span>
              </div>
              <div className="text-2xl font-light text-red-500">{failed}</div>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-white/60 text-xs uppercase tracking-wider">Total</span>
              </div>
              <div className="text-2xl font-light text-blue-500">{totalItems}</div>
            </div>
          </div>
        </div>

        {/* Items List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {animatedItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 border transition-all duration-300 ${
                item.status === "success"
                  ? "bg-green-600/5 border-green-500/20"
                  : item.status === "error"
                    ? "bg-red-600/5 border-red-500/20"
                    : item.status === "processing"
                      ? "bg-blue-600/5 border-blue-500/20 animate-pulse"
                      : "bg-white/5 border-white/10"
              }`}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
              }}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{item.name}</div>
                {item.error && (
                  <div className="text-red-400 text-xs mt-1 truncate">{item.error}</div>
                )}
                {item.status === "processing" && (
                  <div className="text-blue-400 text-xs mt-1">AI processing...</div>
                )}
              </div>

              {/* Time */}
              {item.endTime && item.startTime && (
                <div className="text-white/40 text-xs">
                  {((item.endTime - item.startTime) / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {completed === totalItems && (
          <div className="p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full bg-white text-black px-6 py-3 text-sm uppercase tracking-wider hover:bg-white/90 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
