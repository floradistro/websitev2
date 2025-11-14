"use client";

import Link from "next/link";
import { ChevronRight, Home, LogOut, DollarSign, Clock, Monitor } from "lucide-react";
import { usePOSSession } from "@/context/POSSessionContext";
import { useState } from "react";
import { showConfirm } from "@/components/NotificationToast";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface POSBreadcrumbProps {
  items: BreadcrumbItem[];
  showSessionInfo?: boolean;
}

export function POSBreadcrumb({ items, showSessionInfo = true }: POSBreadcrumbProps) {
  const { session, endSession } = usePOSSession();
  const [isEnding, setIsEnding] = useState(false);

  const handleEndSession = async () => {
    await showConfirm({
      title: "End Session",
      message: `Are you sure you want to end session ${session?.session_number}?\n\nYou can start a new session immediately after.`,
      confirmText: "End Session",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        try {
          setIsEnding(true);
          await endSession();
          // Don't redirect - let the page handle showing register selector
          // The session context will trigger a re-render
        } catch (error) {
          alert("Failed to end session. Please try again.");
        } finally {
          setIsEnding(false);
        }
      },
    });
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
            {/* Home/Dashboard Link */}
            <Link
              href="/vendor/apps"
              className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors"
            >
              <Home size={14} />
              <span>Dashboard</span>
            </Link>

            {/* Breadcrumb Items */}
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight size={12} className="text-white/20" />
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white/80 font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Session Info & End Session Button */}
          {showSessionInfo && session && (
            <div className="flex items-center gap-4">
              {/* Session Info - Compact & Elegant */}
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/60 text-[10px] uppercase tracking-[0.15em]">
                    {session.session_number}
                  </span>
                </div>
                
                <div className="h-4 w-px bg-white/10" />
                
                <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
                  <DollarSign size={10} />
                  <span>${session.total_sales.toFixed(2)}</span>
                </div>
                
                <div className="h-4 w-px bg-white/10" />
                
                <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
                  <Clock size={10} />
                  <span>{formatDuration(session.opened_at)}</span>
                </div>

                {session.register_name && (
                  <>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
                      <Monitor size={10} />
                      <span>{session.register_name}</span>
                    </div>
                  </>
                )}
              </div>

              {/* End Session Button - Apple-style minimal */}
              <button
                onClick={handleEndSession}
                disabled={isEnding}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-[10px] uppercase tracking-[0.15em] font-black disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 900 }}
              >
                <LogOut size={12} strokeWidth={2.5} />
                <span>{isEnding ? "Ending..." : "End Session"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
