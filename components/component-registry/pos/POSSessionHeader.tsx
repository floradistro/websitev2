"use client";

import { useEffect, useState, useCallback } from "react";
import { POSModal } from "./POSModal";
import { POSCashDrawer } from "./POSCashDrawer";
import { DollarSign } from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import Image from "next/image";

import { logger } from "@/lib/logger";
interface POSSession {
  id: string;
  session_number: string;
  status: string;
  opening_cash: number;
  total_sales: number;
  total_transactions: number;
  walk_in_sales: number;
  pickup_orders_fulfilled: number;
  opened_at: string;
}

interface CashMovementSummary {
  opening: number;
  sales: number;
  refunds: number;
  no_sales: number;
  paid_in: number;
  paid_out: number;
  current_balance: number;
  movement_count: number;
}

interface POSSessionHeaderProps {
  locationId: string;
  locationName: string;
  userId?: string;
  userName?: string;
  vendorId?: string;
  registerId?: string;
}

export function POSSessionHeader({
  locationId,
  locationName,
  userId,
  userName = "Staff",
  vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf", // Flora Distro - will be passed from parent
  registerId,
}: POSSessionHeaderProps) {
  const { vendor, refreshUserData } = useAppAuth();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [showCashDrawer, setShowCashDrawer] = useState(false);
  const [cashSummary, setCashSummary] = useState<CashMovementSummary | null>(null);

  // Refresh vendor data on mount to get latest logo/POS status
  useEffect(() => {
    if (vendor) {
      refreshUserData();
    }
  }, []); // Only run once on mount

  // Debug vendor data
  useEffect(() => {
    if (vendor) {
    }
  }, [vendor]);

  const loadActiveSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/pos/sessions/active?locationId=${locationId}`);

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);

        // Load cash movements if session exists
        if (data.session) {
          loadCashMovements(data.session.id);
        }
      } else {
        setSession(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading session:", error);
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const loadCashMovements = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/pos/cash-movements?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCashSummary(data.summary);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading cash movements:", error);
      }
    }
  }, []);

  // Load active session and refresh every 30 seconds
  useEffect(() => {
    loadActiveSession();

    // Refresh session data every 30 seconds
    const interval = setInterval(() => {
      loadActiveSession();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadActiveSession]);

  const openSession = async () => {
    const openingCash = prompt("Enter opening cash amount:", "200.00");
    if (!openingCash) return;

    try {
      const response = await fetch("/api/pos/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          userId,
          openingCash: parseFloat(openingCash),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setModal({
          isOpen: true,
          title: "Session Opened",
          message: "POS session started successfully!",
          type: "success",
        });
      } else {
        const error = await response.json();
        setModal({
          isOpen: true,
          title: "Error",
          message: error.error || "Failed to open session",
          type: "error",
        });
      }
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: "Error",
        message: error.message || "Failed to open session",
        type: "error",
      });
    }
  };

  const closeSession = async () => {
    if (!session) return;

    // Show confirmation modal
    setModal({
      isOpen: true,
      title: "Close Session",
      message: `Session: ${session.session_number}\nTotal Sales: $${session.total_sales}\nTransactions: ${session.total_transactions}\n\nEnter closing cash amount:`,
      type: "info",
      confirmText: "Close Session",
      cancelText: "Cancel",
      onConfirm: () => {
        const closingCash = prompt("Enter closing cash amount:", session.opening_cash.toString());
        if (!closingCash) return;
        performCloseSession(parseFloat(closingCash));
      },
    });
  };

  const performCloseSession = async (closingCash: number) => {
    if (!session) return;

    try {
      const response = await fetch("/api/pos/sessions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          closingCash: closingCash,
        }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          title: "Session Closed",
          message: "Session closed successfully!",
          type: "success",
        });
        setSession(null);
      } else {
        const error = await response.json();
        setModal({
          isOpen: true,
          title: "Error",
          message: error.error || "Failed to close session",
          type: "error",
        });
      }
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: "Error",
        message: error.message || "Failed to close session",
        type: "error",
      });
    }
  };

  const getSessionDuration = () => {
    if (!session) return "0h 0m";
    const start = new Date(session.opened_at);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-48"></div>
      </div>
    );
  }

  const handleCashMovementRecorded = () => {
    // Reload cash movements and session
    if (session) {
      loadCashMovements(session.id);
      loadActiveSession();
    }
  };

  return (
    <>
      <POSModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
      />

      {/* Cash Drawer Modal */}
      {showCashDrawer && session && userId && (
        <POSCashDrawer
          sessionId={session.id}
          registerId={registerId}
          userId={userId}
          locationId={locationId}
          vendorId={vendorId}
          currentBalance={cashSummary?.current_balance || session.opening_cash}
          onMovementRecorded={handleCashMovementRecorded}
          onClose={() => setShowCashDrawer(false)}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Vendor Logo, Location & Staff */}
        <div className="flex items-center gap-4">
          {/* Vendor Logo */}
          {vendor?.logo_url && (
            <>
              <div className="relative w-10 h-10 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden">
                <Image
                  src={vendor.logo_url}
                  alt={vendor.store_name || "Vendor Logo"}
                  fill
                  className="object-contain p-1"
                  priority
                  unoptimized
                />
              </div>
              <div className="h-6 w-px bg-white/10"></div>
            </>
          )}

          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Location</div>
            <div className="text-white font-black text-xs" style={{ fontWeight: 900 }}>
              {locationName}
            </div>
          </div>

          <div className="h-6 w-px bg-white/10"></div>

          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Staff</div>
            <div className="text-white font-black text-xs" style={{ fontWeight: 900 }}>
              {userName}
            </div>
          </div>
        </div>

        {/* Center: Session Info */}
        {session ? (
          <div className="flex items-center gap-4">
            {/* Cash Balance */}
            <button
              onClick={() => setShowCashDrawer(true)}
              className="text-center hover:bg-white/5 rounded-xl px-3 py-1 transition-all group"
            >
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] flex items-center gap-1">
                <DollarSign size={10} />
                Cash Drawer
              </div>
              <div
                className="text-white font-black text-sm group-hover:text-green-400 transition-colors"
                style={{ fontWeight: 900 }}
              >
                ${(cashSummary?.current_balance || session.opening_cash).toFixed(2)}
              </div>
            </button>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="text-center">
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Sales</div>
              <div className="text-white font-black text-sm" style={{ fontWeight: 900 }}>
                ${session.total_sales.toFixed(2)}
              </div>
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="text-center">
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                Transactions
              </div>
              <div className="text-white font-black text-xs" style={{ fontWeight: 900 }}>
                {session.total_transactions}
              </div>
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="text-center">
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Time</div>
              <div className="text-white font-black text-xs" style={{ fontWeight: 900 }}>
                {getSessionDuration()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
            No active session
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex gap-2">
          {session ? (
            <>
              {/* Context-aware navigation button */}
              {typeof window !== "undefined" && window.location.pathname === "/pos/orders" ? (
                <a
                  href="/pos/register"
                  className="px-4 py-2.5 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center"
                  style={{ fontWeight: 900 }}
                >
                  Register
                </a>
              ) : (
                <a
                  href="/pos/orders"
                  className="px-4 py-2.5 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center"
                  style={{ fontWeight: 900 }}
                >
                  Orders
                </a>
              )}
              <button
                onClick={closeSession}
                className="px-4 py-2.5 border border-white/10 text-red-400 rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center"
                style={{ fontWeight: 900 }}
              >
                End Session
              </button>
            </>
          ) : (
            <button
              onClick={openSession}
              className="px-5 py-2.5 bg-white/10 text-white border-2 border-white/20 rounded-2xl hover:bg-white/20 hover:border-white/30 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center"
              style={{ fontWeight: 900 }}
            >
              Open Session
            </button>
          )}
        </div>
      </div>
    </>
  );
}
