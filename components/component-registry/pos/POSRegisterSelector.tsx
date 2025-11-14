"use client";

import { useState, useEffect } from "react";
import {
  Monitor,
  Check,
  Users,
  DollarSign,
  Clock,
  X,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { CloseCashDrawerModal } from "@/app/vendor/pos/register/components/CloseCashDrawerModal";
import { useAppAuth } from "@/context/AppAuthContext";
import Image from "next/image";

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
    registerData?: Register,
  ) => void;
  onBackToLocationSelector?: () => void;
}

export function POSRegisterSelector({
  locationId,
  locationName,
  onRegisterSelected,
  onBackToLocationSelector,
}: POSRegisterSelectorProps) {
  const { vendor } = useAppAuth();
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
  
  // Real-time payment processor health status
  const [processorHealth, setProcessorHealth] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    // Initial load
    loadRegisters();
    checkProcessorHealth();

    // Aggressive polling every 2 seconds for register/session updates
    const registerInterval = setInterval(() => {
      loadRegisters();
    }, 2000);

    // Health check every 5 seconds for terminal status (mission critical)
    const healthInterval = setInterval(() => {
      checkProcessorHealth();
    }, 5000);

    return () => {
      clearInterval(registerInterval);
      clearInterval(healthInterval);
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

  /**
   * Check real-time health of all payment processors
   * This is MISSION CRITICAL - updates every 5 seconds
   */
  const checkProcessorHealth = async () => {
    try {
      const response = await fetch(
        `/api/pos/payment-processors/health?locationId=${locationId}`
      );

      if (response.ok) {
        const data = await response.json();
        const healthMap = new Map<string, boolean>();

        data.results?.forEach((result: any) => {
          healthMap.set(result.processor_id, result.is_live);
        });

        setProcessorHealth(healthMap);

        // Log any terminals that went offline
        data.results?.forEach((result: any) => {
          if (!result.is_live && result.error) {
            if (process.env.NODE_ENV === "development") {
              logger.warn(`⚠️ Payment processor offline:`, {
                processor: result.processor_id,
                error: result.error,
              });
            }
          }
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error checking processor health:", error);
      }
    }
  };

  const handleSelectRegister = async (register: Register) => {
    console.log("🔵 handleSelectRegister called", { 
      registerId: register.id, 
      hasSession: !!register.current_session,
      sessionId: register.current_session?.id 
    });
    
    try {
      // Check if register has active payment processor
      const hasPaymentProcessor = !!(
        register.payment_processor_id && register.payment_processor?.is_active === true
      );

      console.log("🔵 Calling onRegisterSelected with:", {
        registerId: register.id,
        sessionId: register.current_session?.id,
        hasPaymentProcessor,
        registerName: register.register_name
      });

      // Pass register selection to parent - let parent handle session creation
      // If there's an existing session, pass its ID
      // If no session, parent will show opening cash modal
      onRegisterSelected(
        register.id,
        register.current_session?.id,
        hasPaymentProcessor,
        register
      );
      
      console.log("🔵 onRegisterSelected completed");
    } catch (error) {
      console.error("❌ Error in handleSelectRegister:", error);
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
    <div className="h-full w-full bg-black text-white flex flex-col overflow-y-auto overflow-x-hidden">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          {/* Back to Location Selector Button */}
          {onBackToLocationSelector && (
            <div className="mb-6 flex justify-end">
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
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            {/* Vendor Logo */}
            {vendor?.logo_url && (
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                  <Image
                    src={vendor.logo_url}
                    alt={vendor.name || "Vendor"}
                    fill
                    className="object-contain p-2"
                    priority
                  />
                </div>
              </div>
            )}
            <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
              Select Register
            </h1>
            <p className="text-white/60 text-sm uppercase tracking-[0.15em] font-medium">{locationName}</p>
          </div>

          {/* Register Grid - Responsive with dynamic columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto px-2">
          {registers.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-white/40 text-sm uppercase tracking-[0.15em] mb-4">
                No registers found
              </p>
              <p className="text-white/60 text-xs">Registers loaded: {registers.length}</p>
            </div>
          ) : (
            registers.map((register) => (
              <div
                key={register.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left relative group"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all">
                  <Monitor size={24} className="text-white/60" />
                </div>

                {/* Info */}
                <div className="mb-4">
                  <div className="text-white font-semibold text-lg tracking-tight mb-1">
                    {register.register_name}
                  </div>
                  <div className="text-white/40 text-xs uppercase tracking-[0.15em]">
                    {register.register_number}
                  </div>
                  <div className="text-white/60 text-xs mt-2">{register.device_name}</div>
                  
                  {/* Payment Terminal Status - Real-time */}
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {register.payment_processor ? (
                      (() => {
                        // Check real-time health status
                        const isLive = processorHealth.get(register.payment_processor.id);
                        const hasHealthData = processorHealth.has(register.payment_processor.id);
                        
                        // Show real-time status if available, fallback to database status
                        const terminalLive = hasHealthData ? isLive : register.payment_processor.is_active;
                        
                        if (terminalLive) {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <CreditCard size={10} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-white/60 uppercase tracking-[0.15em]">
                                  {register.payment_processor.processor_name}
                                </span>
                                <span className="text-[9px] text-green-400/80 uppercase tracking-[0.15em] flex items-center gap-1">
                                  Live
                                  {hasHealthData && (
                                    <span className="text-[8px] text-green-400/60">●</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-red-400/60">
                                <div className="w-1.5 h-1.5 bg-red-400/60 rounded-full"></div>
                                <CreditCard size={10} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase tracking-[0.15em]">
                                  {register.payment_processor.processor_name}
                                </span>
                                <span className="text-[9px] text-red-400/60 uppercase tracking-[0.15em]">
                                  Offline
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })()
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                          <X size={10} />
                          <CreditCard size={10} />
                        </div>
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.15em]">
                          No Terminal
                        </span>
                      </div>
                    )}
                  </div>
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
                    <button
                      onClick={(e) => handleCloseSession(e, register)}
                      className="mt-3 w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 text-[10px] uppercase tracking-[0.15em] font-black transition-all text-center"
                      style={{ fontWeight: 900 }}
                    >
                      End Session
                    </button>
                    {/* Join Session Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRegister(register);
                      }}
                      className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white text-[10px] uppercase tracking-[0.15em] font-black transition-all text-center"
                      style={{ fontWeight: 900 }}
                    >
                      Join Session
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.15em]">
                      Available
                    </div>
                    {/* Select Register Button */}
                    <button
                      onClick={() => handleSelectRegister(register)}
                      className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white text-[10px] uppercase tracking-[0.15em] font-black transition-all text-center"
                      style={{ fontWeight: 900 }}
                    >
                      Select Register
                    </button>
                  </div>
                )}

                {/* Select Indicator */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Check size={16} strokeWidth={3} />
                </div>
              </div>
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
                className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-[10px] font-semibold uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {closingAll ? "Closing All Sessions..." : "⚠️ Force End All Sessions"}
              </button>
            </div>
          )}
        </div>
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
