"use client";

import { CheckCircle, XCircle, AlertCircle, Clock } from "@/lib/icons";

interface ProcessorStatusBarProps {
  stores: Array<{
    name: string;
    processor: {
      name: string;
      type: string;
      isActive: boolean;
      lastTested: string | null;
      lastTestStatus: "success" | "failed" | null;
    } | null;
  }>;
}

export function ProcessorStatusBar({ stores }: ProcessorStatusBarProps) {
  // Calculate overall health
  const totalProcessors = stores.filter((s) => s.processor).length;
  const healthyProcessors = stores.filter(
    (s) => s.processor?.isActive && s.processor?.lastTestStatus === "success"
  ).length;
  const failedProcessors = stores.filter((s) => s.processor?.lastTestStatus === "failed").length;

  const overallStatus =
    failedProcessors > 0 ? "error" : healthyProcessors === totalProcessors ? "success" : "warning";

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      text: "All payment processors connected",
    },
    warning: {
      icon: AlertCircle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      text: "Some processors not tested recently",
    },
    error: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: `${failedProcessors} processor${failedProcessors > 1 ? "s" : ""} offline`,
    },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <div
      className={`mb-6 p-4 rounded-lg border ${config.bg} ${config.border} transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
          <div>
            <p className={`font-medium ${config.color}`}>{config.text}</p>
            <p className="text-sm text-white/60 mt-0.5">
              {healthyProcessors} of {totalProcessors} processors connected
            </p>
          </div>
        </div>

        {/* Processor details */}
        <div className="flex items-center gap-4 text-sm">
          {stores.map((store) =>
            store.processor ? (
              <div key={store.name} className="flex items-center gap-2">
                <span className="text-white/70">{store.name}:</span>
                <span className={`font-medium ${config.color}`}>{store.processor.name}</span>
                {store.processor.lastTested && (
                  <span className="text-white/50 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatLastTested(store.processor.lastTested)}
                  </span>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

function formatLastTested(timestamp: string): string {
  const now = new Date();
  const tested = new Date(timestamp);
  const diff = now.getTime() - tested.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
