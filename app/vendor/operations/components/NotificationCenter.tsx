"use client";

import { AlertCircle, XCircle, Info, CheckCircle, X } from "@/lib/icons";
import { useState } from "react";

interface Notification {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  storeId?: string;
  terminalId?: string;
  timestamp: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (notifications.length === 0 || notifications.every((n) => dismissed.has(n.id))) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissed(new Set(dismissed).add(id));
  };

  const visibleNotifications = notifications.filter((n) => !dismissed.has(n.id));

  return (
    <div className="mb-6 space-y-3">
      {visibleNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const typeConfig = {
    error: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    warning: {
      icon: AlertCircle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={`p-4 rounded-lg border ${config.bg} ${config.border} transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${config.color} mb-1`}>{notification.title}</p>
            <p className="text-sm text-white/70">{notification.message}</p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-white/40 hover:text-white/60 transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
