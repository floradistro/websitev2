"use client";

import { useEffect, useState } from "react";
import { X, Star, Gift, Heart, Check } from "lucide-react";

interface Notification {
  id: string;
  type: "points" | "success" | "info" | "tier";
  title: string;
  message: string;
  icon?: React.ReactNode;
}

let notificationCallbacks: ((notification: Notification) => void)[] = [];

export function showNotification(notification: Omit<Notification, "id">) {
  const fullNotification: Notification = {
    ...notification,
    id: Date.now().toString() + Math.random(),
  };
  
  notificationCallbacks.forEach((callback) => callback(fullNotification));
}

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const callback = (notification: Notification) => {
      setNotifications((prev) => [...prev, notification]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    notificationCallbacks.push(callback);

    return () => {
      notificationCallbacks = notificationCallbacks.filter((cb) => cb !== callback);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case "points":
        return <Star size={18} className="text-amber-400" fill="currentColor" />;
      case "tier":
        return <Gift size={18} className="text-amber-400" />;
      case "success":
        return <Check size={18} className="text-green-400" />;
      default:
        return <Heart size={18} className="text-white/60" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "points":
      case "tier":
        return "from-amber-500/10 to-amber-600/10 border-amber-500/30";
      case "success":
        return "from-green-500/10 to-green-600/10 border-green-500/30";
      default:
        return "from-white/5 to-white/10 border-white/20";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-gradient-to-br ${getBgColor(notification.type)} border backdrop-blur-xl p-4 shadow-2xl animate-slideIn`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              {getIcon(notification)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white mb-1">{notification.title}</h4>
              <p className="text-xs text-white/70 leading-relaxed">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/40 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

