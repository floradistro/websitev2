"use client";

import { useEffect, useState } from "react";
import {
  X,
  Star,
  Gift,
  Heart,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";

interface Notification {
  id: string;
  type: "points" | "success" | "info" | "tier" | "error" | "warning";
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
}

interface ConfirmDialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: "danger" | "warning" | "info";
}

let notificationCallbacks: ((notification: Notification) => void)[] = [];
let confirmCallbacks: ((dialog: ConfirmDialog) => void)[] = [];

export function showNotification(notification: Omit<Notification, "id">) {
  const fullNotification: Notification = {
    ...notification,
    id: Date.now().toString() + Math.random(),
    duration: notification.duration || 5000,
  };

  notificationCallbacks.forEach((callback) => callback(fullNotification));
}

// Helper functions
export function showSuccess(message: string, title: string = "Success") {
  showNotification({
    type: "success",
    title,
    message,
  });
}

export function showError(message: string, title: string = "Error") {
  showNotification({
    type: "error",
    title,
    message,
  });
}

export function showInfo(message: string, title: string = "Info") {
  showNotification({
    type: "info",
    title,
    message,
  });
}

export function showWarning(message: string, title: string = "Warning") {
  showNotification({
    type: "warning",
    title,
    message,
  });
}

export function showConfirm(options: Omit<ConfirmDialog, "id">): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog: ConfirmDialog = {
      ...options,
      id: Date.now().toString() + Math.random(),
      confirmText: options.confirmText || "Confirm",
      cancelText: options.cancelText || "Cancel",
      onConfirm: () => {
        options.onConfirm?.();
        resolve(true);
      },
      onCancel: () => {
        options.onCancel?.();
        resolve(false);
      },
    };

    confirmCallbacks.forEach((callback) => callback(dialog));
  });
}

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialogs, setConfirmDialogs] = useState<ConfirmDialog[]>([]);

  useEffect(() => {
    const notifCallback = (notification: Notification) => {
      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, notification.duration || 5000);
    };

    const confirmCallback = (dialog: ConfirmDialog) => {
      setConfirmDialogs((prev) => [...prev, dialog]);
    };

    notificationCallbacks.push(notifCallback);
    confirmCallbacks.push(confirmCallback);

    return () => {
      notificationCallbacks = notificationCallbacks.filter((cb) => cb !== notifCallback);
      confirmCallbacks = confirmCallbacks.filter((cb) => cb !== confirmCallback);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const removeConfirm = (id: string) => {
    setConfirmDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleConfirm = (dialog: ConfirmDialog) => {
    dialog.onConfirm?.();
    removeConfirm(dialog.id);
  };

  const handleCancel = (dialog: ConfirmDialog) => {
    dialog.onCancel?.();
    removeConfirm(dialog.id);
  };

  const getIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;

    switch (notification.type) {
      case "points":
        return <Star size={18} className="text-amber-400" fill="currentColor" />;
      case "tier":
        return <Gift size={18} className="text-purple-400" />;
      case "success":
        return <CheckCircle size={18} className="text-green-400" />;
      case "error":
        return <AlertCircle size={18} className="text-red-400" />;
      case "warning":
        return <AlertTriangle size={18} className="text-yellow-400" />;
      case "info":
        return <Info size={18} className="text-blue-400" />;
      default:
        return <Heart size={18} className="text-white/60" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "points":
        return "from-amber-500/10 to-amber-600/10 border-amber-500/30 shadow-amber-500/20";
      case "tier":
        return "from-purple-500/10 to-purple-600/10 border-purple-500/30 shadow-purple-500/20";
      case "success":
        return "from-green-500/10 to-green-600/10 border-green-500/30 shadow-green-500/20";
      case "error":
        return "from-red-500/10 to-red-600/10 border-red-500/30 shadow-red-500/20";
      case "warning":
        return "from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 shadow-yellow-500/20";
      case "info":
        return "from-blue-500/10 to-blue-600/10 border-blue-500/30 shadow-blue-500/20";
      default:
        return "from-white/5 to-white/10 border-white/20 shadow-white/10";
    }
  };

  const getDialogColor = (type?: string) => {
    switch (type) {
      case "danger":
        return "border-red-500/30";
      case "warning":
        return "border-yellow-500/30";
      default:
        return "border-white/20";
    }
  };

  return (
    <>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[200] space-y-3 max-w-md pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-gradient-to-br ${getBgColor(notification.type)} border backdrop-blur-xl shadow-2xl animate-slideIn pointer-events-auto`}
            style={{
              boxShadow: `0 20px 60px -15px rgba(0,0,0,0.8), 0 0 40px -10px currentColor`,
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Yacht Club Watermark */}
              <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
                <Image
                  src="/yacht-club-logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>

              <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                {getIcon(notification)}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-medium text-white mb-1 tracking-tight uppercase"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {notification.title}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-white/40 hover:text-white transition-colors flex-shrink-0 hover:bg-white/10 rounded p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Dialogs */}
      {confirmDialogs.length > 0 && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            style={{ transition: "opacity 0.3s ease-out" }}
            onClick={() => handleCancel(confirmDialogs[0])}
          />

          {/* Dialog */}
          <div
            className={`relative bg-[#1a1a1a] border ${getDialogColor(confirmDialogs[0].type)} max-w-md w-full shadow-2xl`}
            style={{
              boxShadow: "0 25px 100px -20px rgba(0,0,0,0.9)",
              transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
            }}
          >
            {/* Yacht Club Branding */}
            <div className="absolute top-4 right-4 opacity-5">
              <Image
                src="/yacht-club-logo.png"
                alt=""
                width={48}
                height={48}
                className="object-contain"
              />
            </div>

            <div className="p-8">
              <h3 className="text-xl text-white mb-4 font-light uppercase tracking-wider">
                {confirmDialogs[0].title}
              </h3>
              <div className="h-[1px] w-12 bg-gradient-to-r from-white/30 to-transparent mb-6"></div>
              <p className="text-sm text-white/70 leading-relaxed mb-8 font-light">
                {confirmDialogs[0].message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleCancel(confirmDialogs[0])}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-xs uppercase tracking-wider font-medium"
                >
                  {confirmDialogs[0].cancelText}
                </button>
                <button
                  onClick={() => handleConfirm(confirmDialogs[0])}
                  className={`flex-1 px-6 py-3 transition-all duration-300 text-xs uppercase tracking-wider font-medium ${
                    confirmDialogs[0].type === "danger"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50"
                      : confirmDialogs[0].type === "warning"
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 hover:border-yellow-500/50"
                        : "bg-white hover:bg-white/90 text-black border border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  }`}
                >
                  {confirmDialogs[0].confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
