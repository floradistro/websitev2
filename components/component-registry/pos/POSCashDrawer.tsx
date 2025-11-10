"use client";

import { useState } from "react";
import { DollarSign, Plus, Minus, Unlock, X } from "lucide-react";

interface POSCashDrawerProps {
  sessionId: string;
  registerId?: string;
  userId: string;
  locationId: string;
  vendorId: string;
  currentBalance: number;
  onMovementRecorded?: () => void;
  onClose?: () => void;
}

type MovementType = "no_sale" | "paid_in" | "paid_out";

export function POSCashDrawer({
  sessionId,
  registerId,
  userId,
  locationId,
  vendorId,
  currentBalance,
  onMovementRecorded,
  onClose,
}: POSCashDrawerProps) {
  const [selectedType, setSelectedType] = useState<MovementType | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movementTypes = [
    {
      type: "no_sale" as MovementType,
      label: "No Sale",
      description: "Open drawer to make change",
      icon: Unlock,
      color: "blue",
      needsAmount: false,
    },
    {
      type: "paid_in" as MovementType,
      label: "Paid In",
      description: "Add cash to drawer",
      icon: Plus,
      color: "green",
      needsAmount: true,
      reasonPlaceholder: "e.g., Bank change, Float adjustment",
    },
    {
      type: "paid_out" as MovementType,
      label: "Paid Out",
      description: "Remove cash from drawer",
      icon: Minus,
      color: "red",
      needsAmount: true,
      reasonPlaceholder: "e.g., Staff tips, Petty cash, Customer change",
    },
  ];

  const handleSubmit = async () => {
    if (!selectedType) return;

    const selectedMovement = movementTypes.find((m) => m.type === selectedType);
    if (!selectedMovement) return;

    // Validation
    if (selectedMovement.needsAmount && (!amount || parseFloat(amount) <= 0)) {
      setError("Please enter a valid amount");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const movementAmount = selectedMovement.needsAmount
        ? selectedType === "paid_out"
          ? -Math.abs(parseFloat(amount))
          : Math.abs(parseFloat(amount))
        : 0;

      const response = await fetch("/api/pos/cash-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          registerId,
          userId,
          locationId,
          vendorId,
          movementType: selectedType,
          amount: movementAmount,
          reason: reason.trim(),
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record movement");
      }

      const result = await response.json();

      // Success - reset form
      setSelectedType(null);
      setAmount("");
      setReason("");
      setNotes("");

      // Notify parent
      if (onMovementRecorded) {
        onMovementRecorded();
      }

      // Show success briefly then close for no-sale
      if (selectedType === "no_sale") {
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || "Failed to record cash movement");
    } finally {
      setProcessing(false);
    }
  };

  const selectedMovement = movementTypes.find((m) => m.type === selectedType);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2
              className="text-xl font-black text-white uppercase tracking-tight"
              style={{ fontWeight: 900 }}
            >
              Cash Drawer
            </h2>
            <p className="text-white/40 text-xs uppercase tracking-[0.15em] mt-1">
              Current Balance: ${currentBalance.toFixed(2)}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
            >
              <X size={16} className="text-white/60" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select Operation */}
          {!selectedType ? (
            <div className="space-y-3">
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-4">
                Select Operation
              </div>
              {movementTypes.map((movement) => {
                const Icon = movement.icon;
                return (
                  <button
                    key={movement.type}
                    onClick={() => setSelectedType(movement.type)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 bg-${movement.color}-500/10 rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon size={20} className={`text-${movement.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-white font-black text-sm uppercase tracking-tight"
                          style={{ fontWeight: 900 }}
                        >
                          {movement.label}
                        </div>
                        <div className="text-white/60 text-xs mt-0.5">{movement.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Step 2: Enter Details */
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedType(null);
                  setAmount("");
                  setReason("");
                  setNotes("");
                  setError(null);
                }}
                className="text-white/40 text-xs uppercase tracking-[0.15em] hover:text-white/60 transition-colors"
              >
                ← Back
              </button>

              {/* Selected Type Header */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 bg-${selectedMovement?.color}-500/10 rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    {selectedMovement && (
                      <selectedMovement.icon
                        size={20}
                        className={`text-${selectedMovement.color}-400`}
                      />
                    )}
                  </div>
                  <div>
                    <div
                      className="text-white font-black text-sm uppercase tracking-tight"
                      style={{ fontWeight: 900 }}
                    >
                      {selectedMovement?.label}
                    </div>
                    <div className="text-white/60 text-xs">{selectedMovement?.description}</div>
                  </div>
                </div>
              </div>

              {/* Amount Input (if needed) */}
              {selectedMovement?.needsAmount && (
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                  placeholder={selectedMovement?.reasonPlaceholder || "Enter reason"}
                  autoFocus={!selectedMovement?.needsAmount}
                />
              </div>

              {/* Notes Input (Optional) */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all resize-none"
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="w-full bg-white/10 text-white border-2 border-white/20 rounded-2xl py-3 text-sm font-black uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 900 }}
              >
                {processing ? "Recording..." : "Record Movement"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
