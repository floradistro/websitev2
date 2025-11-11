"use client";

import { useState, useEffect } from "react";
import {
  Monitor,
  Check,
  Users,
  DollarSign,
  Clock,
  X,
  Home,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { CloseCashDrawerModal } from "@/app/pos/register/components/CloseCashDrawerModal";

import { logger } from "@/lib/logger";
interface Register {
  id: string;
  register_number: string;
  register_name: string;
  device_name: string;
  status: string;
  processor_type?: string;
  allow_card: boolean;
  payment_processor_id?: string;
  payment_processor?: {
    id: string;
    processor_name: string;
    processor_type: string;
    is_active: boolean;
  };
  current_session?: {
    id: string;
    session_number: string;
    total_sales: number;
    total_cash: number;
    opening_cash: number;
    started_at: string;
    user_name?: string;
  };
}

interface POSRegisterSelectorProps {
  locationId: string;
  locationName: string;
  onRegisterSelected: (
    registerId: string,
    sessionId?: string,
    hasPaymentProcessor?: boolean,
  ) => void;
  onBackToLocationSelector?: () => void;
}

export function POSRegisterSelector({
  locationId,
  locationName,
  onRegisterSelected,
  onBackToLocationSelector,
}: POSRegisterSelectorProps) {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingAll, setClosingAll] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<{
    id: string;
    sessionNumber: string;
    totalSales: number;
    totalCash: number;
    openingCash: number;
  } | null>(null);

  useEffect(() => {
    // Initial load
    loadRegisters();

    // Aggressive polling every 2 seconds - fast enough to prevent duplicate sessions
    const interval = setInterval(() => {
      loadRegisters();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [locationId]);

  const loadRegisters = async () => {
    try {
      const response = await fetch(`/api/pos/registers?locationId=${locationId}`);

      if (response.ok) {
        const data = await response.json();

        setRegisters(data.registers || []);
      } else {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Failed to load registers:", response.status);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading registers:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegister = async (register: Register) => {
    try {
      // Check if register has active payment processor
      const hasPaymentProcessor = !!(
        register.payment_processor_id && register.payment_processor?.is_active === true
      );

      // Pass register selection to parent - let parent handle session creation
      // If there's an existing session, pass its ID
      // If no session, parent will show opening cash modal
      onRegisterSelected(
        register.id,
        register.current_session?.id,
        hasPaymentProcessor
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error selecting register:", error);
      }
      alert("Failed to select register");
    }
  };

  const handleCloseSession = async (e: React.MouseEvent, register: Register) => {
    e.stopPropagation(); // Prevent selecting the register

    if (!register.current_session) return;

    // Show the closing cash count modal
    setSessionToClose({
      id: register.current_session.id,
      sessionNumber: register.current_session.session_number,
      totalSales: register.current_session.total_sales,
      totalCash: register.current_session.total_cash,
      openingCash: register.current_session.opening_cash,
    });
    setShowCloseModal(true);
  };

  const handleCloseModalSubmit = async (closingCash: number, notes: string) => {
    if (!sessionToClose) return;

    try {
      const response = await fetch("/api/pos/sessions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionToClose.id,
          closingCash,
          closingNotes: notes,
        }),
      });

      if (response.ok) {
        setShowCloseModal(false);
        setSessionToClose(null);
        loadRegisters(); // Reload to show updated status
      } else {
        const error = await response.json();
        alert(`Failed to close session: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error closing session:", error);
      }
      alert("Failed to close session");
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleForceEndAllSessions = async () => {
    const confirmed = confirm(
      `⚠️ Force end ALL active sessions?\n\nThis will close all sessions for all registers at this location.\n\nAre you sure?`,
    );

    if (!confirmed) return;

    setClosingAll(true);

    try {
      // Get all active sessions
      const activeSessions = registers
        .filter((r) => r.current_session)
        .map((r) => r.current_session!.id);

      if (activeSessions.length === 0) {
        alert("No active sessions to close");
        setClosingAll(false);
        return;
      }

      // Close each session
      const closePromises = activeSessions.map((sessionId) =>
        fetch("/api/pos/sessions/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            closingCash: 0,
            closingNotes: "Force closed from register selector",
          }),
        }),
      );

      await Promise.all(closePromises);

      alert(`✅ Closed ${activeSessions.length} session(s)`);
      loadRegisters();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error force closing sessions:", error);
      }
      alert("Failed to close some sessions");
    } finally {
      setClosingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Breadcrumbs and Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/vendor/apps"
              className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]"
            >
              <Home size={16} />
              <span>Dashboard</span>
            </Link>
            <ChevronRight size={16} className="text-white/20" />
            <span className="text-white/60 uppercase tracking-[0.15em]">POS</span>
            <ChevronRight size={16} className="text-white/20" />
            <span className="text-white uppercase tracking-[0.15em]">Select Register</span>
          </nav>

          {/* Back to Location Selector Button */}
          {onBackToLocationSelector && (
            <button
              onClick={() => {
                // Clear localStorage so location selector shows
                localStorage.removeItem("pos_selected_location");
                onBackToLocationSelector();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-xs uppercase tracking-[0.15em] text-white/60 hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Change Location</span>
            </button>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-black text-white uppercase tracking-tight mb-2"
            style={{ fontWeight: 900 }}
          >
            Select Register
          </h1>
          <p className="text-white/60 text-sm uppercase tracking-[0.15em]">{locationName}</p>
        </div>

        {/* Register Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {registers.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-white/40 text-sm uppercase tracking-[0.15em] mb-4">
                No registers found
              </p>
              <p className="text-white/60 text-xs">Registers loaded: {registers.length}</p>
            </div>
          ) : (
            registers.map((register) => (
              <button
                key={register.id}
                onClick={() => handleSelectRegister(register)}
                className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 hover:border-white/30 hover:bg-white/10 transition-all duration-300 text-left relative group"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all">
                  <Monitor size={24} className="text-white/60" />
                </div>

                {/* Info */}
                <div className="mb-4">
                  <div
                    className="text-white font-black text-lg uppercase tracking-tight mb-1"
                    style={{ fontWeight: 900 }}
                  >
                    {register.register_name}
                  </div>
                  <div className="text-white/40 text-xs uppercase tracking-[0.15em]">
                    {register.register_number}
                  </div>
                  <div className="text-white/60 text-xs mt-2">{register.device_name}</div>
                </div>

                {/* Status */}
                {register.current_session ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-green-400 uppercase tracking-[0.15em] font-black">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Session Active
                    </div>
                    <div className="text-[10px] text-white/60 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={10} />${register.current_session.total_sales.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} />
                        {formatDuration(register.current_session.started_at)}
                      </div>
                      {register.current_session.user_name && (
                        <div className="flex items-center gap-1.5">
                          <Users size={10} />
                          {register.current_session.user_name}
                        </div>
                      )}
                    </div>
                    {/* Close Session Button */}
                    <div
                      onClick={(e) => handleCloseSession(e, register)}
                      className="mt-3 w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 text-[10px] uppercase tracking-[0.15em] font-black transition-all text-center cursor-pointer"
                    >
                      End Session
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.15em]">
                    Available
                  </div>
                )}

                {/* Select Indicator */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check size={16} strokeWidth={3} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-white/40 text-xs uppercase tracking-[0.15em]">
          <p>Select any register to begin</p>
          <p className="mt-2 text-white/20">You can switch registers anytime</p>
        </div>

        {/* Force End All Sessions Button */}
        {registers.some((r) => r.current_session) && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleForceEndAllSessions}
              disabled={closingAll}
              className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 900 }}
            >
              {closingAll ? "Closing All Sessions..." : "⚠️ Force End All Sessions"}
            </button>
          </div>
        )}
      </div>

      {/* Close Cash Drawer Modal */}
      {showCloseModal && sessionToClose && (
        <CloseCashDrawerModal
          sessionId={sessionToClose.id}
          sessionNumber={sessionToClose.sessionNumber}
          totalSales={sessionToClose.totalSales}
          totalCash={sessionToClose.totalCash}
          openingCash={sessionToClose.openingCash}
          onSubmit={handleCloseModalSubmit}
          onCancel={() => {
            setShowCloseModal(false);
            setSessionToClose(null);
          }}
        />
      )}
    </div>
  );
}
