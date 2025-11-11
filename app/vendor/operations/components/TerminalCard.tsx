"use client";

import { DollarSign, ShoppingCart, User, Clock, MoreVertical, Trash2, CreditCard, Play, Square as StopIcon, Edit2, Zap } from "@/lib/icons";
import { useState, useRef, useEffect } from "react";
import { DeleteTerminalModal } from "./DeleteTerminalModal";
import { CloseSessionModal } from "./CloseSessionModal";
import { EditTerminalModal } from "./EditTerminalModal";
import { OpenSessionModal } from "./OpenSessionModal";

interface Terminal {
  id: string;
  registerNumber: string;
  registerName: string;
  deviceName: string | null;
  hardwareModel: string | null;
  status: string;
  allowCash: boolean;
  allowCard: boolean;
  paymentProcessor: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
  } | null;
  currentSession: {
    id: string;
    sessionNumber: string;
    totalSales: number;
    totalTransactions: number;
    totalCash: number;
    totalCard: number;
    openingCash: number;
    openedAt: string;
    employee: {
      name: string;
      email: string;
    } | null;
  } | null;
  lastTransaction: {
    processedAt: string;
    amount: number;
  } | null;
  lastActiveAt: string | null;
}

interface TerminalCardProps {
  terminal: Terminal;
  storeName: string;
  locationId: string;
}

export function TerminalCard({ terminal, storeName, locationId }: TerminalCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [testing, setTesting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = terminal.status === "active" && terminal.currentSession !== null;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showContextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleStartShift = () => {
    setShowOpenSessionModal(true);
  };

  const handleTestProcessor = async () => {
    if (!terminal.paymentProcessor) {
      alert("No payment processor configured for this terminal");
      return;
    }

    setTesting(true);
    setShowContextMenu(false);

    try {
      const response = await fetch("/api/vendor/payment-processors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          id: terminal.paymentProcessor.id,
        }),
        credentials: "include", // Include auth cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Test failed - HTTP error:", response.status, errorText);
        alert(`❌ Connection test failed\n\nHTTP ${response.status}: ${errorText || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      console.log("Test response:", data);

      if (data.success) {
        alert("✅ Connection test successful!\n\nThe payment processor is working correctly.\n\nA $0.01 transaction was sent to the terminal.");
      } else {
        const errorDetails = data.error || "Unknown error";
        console.error("Test failed - API error:", data);
        alert(`❌ Connection test failed\n\n${errorDetails}\n\nCheck that:\n• Terminal is powered on\n• Terminal is connected to network\n• Credentials are correct`);
      }
    } catch (error) {
      console.error("Error testing processor:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      alert(`❌ Connection test failed\n\n${errorMsg}\n\nUnable to reach payment processor API`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {showDeleteModal && (
        <DeleteTerminalModal
          terminalId={terminal.id}
          terminalName={terminal.registerName}
          storeName={storeName}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showEditModal && (
        <EditTerminalModal
          terminal={{
            id: terminal.id,
            registerName: terminal.registerName,
            registerNumber: terminal.registerNumber,
            deviceName: terminal.deviceName,
            hardwareModel: terminal.hardwareModel,
            allowCash: terminal.allowCash,
            allowCard: terminal.allowCard,
            paymentProcessorId: terminal.paymentProcessor?.id || null,
          }}
          locationId={locationId}
          storeName={storeName}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showOpenSessionModal && (
        <OpenSessionModal
          terminalId={terminal.id}
          terminalName={terminal.registerName}
          locationId={locationId}
          onClose={() => setShowOpenSessionModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showCloseSessionModal && terminal.currentSession && (
        <CloseSessionModal
          sessionId={terminal.currentSession.id}
          sessionNumber={terminal.currentSession.sessionNumber}
          totalSales={terminal.currentSession.totalSales}
          totalCash={terminal.currentSession.totalCash}
          openingCash={terminal.currentSession.openingCash}
          onClose={() => setShowCloseSessionModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-[#1c1c1e] border border-white/[0.08] rounded-lg shadow-2xl py-1 z-50 min-w-[180px]"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => {
              setShowContextMenu(false);
              setShowEditModal(true);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.05] flex items-center gap-3"
          >
            <Edit2 className="w-4 h-4" />
            Edit Terminal
          </button>
          {terminal.paymentProcessor && (
            <button
              onClick={handleTestProcessor}
              disabled={testing}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.05] flex items-center gap-3 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {testing ? "Testing..." : "Test Connection"}
            </button>
          )}
          {!terminal.currentSession && (
            <button
              onClick={() => {
                setShowContextMenu(false);
                setShowDeleteModal(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/[0.05] flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4" />
              Delete Terminal
            </button>
          )}
        </div>
      )}

      <div
        onContextMenu={handleContextMenu}
        className={`relative group border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-br from-white/[0.04] to-white/[0.02]"
            : "bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
      >
        {/* Subtle glow for active terminals */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />
        )}

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {terminal.registerName}
                </h3>
                {isActive && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.06] rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-white/60">Active</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/40 font-mono">{terminal.registerNumber}</p>
              {(terminal.deviceName || terminal.hardwareModel) && (
                <p className="text-xs text-white/30 mt-1">
                  {terminal.deviceName || terminal.hardwareModel}
                </p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e as any);
              }}
              className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {/* Active Session Info */}
          {terminal.currentSession ? (
            <div className="space-y-4">
              {/* Employee */}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-white/30" />
                <span className="text-white/70">
                  {terminal.currentSession.employee?.name || "Unknown"}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/40">Sales</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    ${terminal.currentSession.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/40">Transactions</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {terminal.currentSession.totalTransactions}
                  </p>
                </div>
              </div>

              {/* Last Transaction */}
              {terminal.lastTransaction && (
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Clock className="w-3 h-3" />
                  <span>Last sale: {formatTimeSince(terminal.lastTransaction.processedAt)}</span>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => setShowCloseSessionModal(true)}
                className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-sm font-medium text-white/80 transition-colors flex items-center justify-center gap-2"
              >
                <StopIcon className="w-3.5 h-3.5" />
                Close Shift
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-white/30 text-center py-6">No active session</p>
              <button
                onClick={handleStartShift}
                className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                Start Shift
              </button>
            </div>
          )}

          {/* Payment Processor */}
          {terminal.paymentProcessor && (
            <div className="mt-4 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs text-white/40">
                  {terminal.paymentProcessor.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatTimeSince(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
