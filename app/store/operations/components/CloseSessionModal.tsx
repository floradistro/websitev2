"use client";

import { useState } from "react";
import { X, DollarSign, AlertCircle } from "@/lib/icons";

interface CloseSessionModalProps {
  sessionId: string;
  sessionNumber: string;
  totalSales: number;
  totalCash: number;
  openingCash: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloseSessionModal({
  sessionId,
  sessionNumber,
  totalSales,
  totalCash,
  openingCash,
  onClose,
  onSuccess,
}: CloseSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closingCash, setClosingCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const expectedCash = openingCash + totalCash;
  const cashDifference = closingCash ? parseFloat(closingCash) - expectedCash : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pos/sessions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          closingCash: parseFloat(closingCash),
          closingNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to close session");
      }
    } catch (err) {
      console.error("Error closing session:", err);
      setError("Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-white/[0.12] rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Close Shift</h2>
            <p className="text-sm text-white/60 mt-1">{sessionNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 p-4 bg-white/[0.03] rounded-lg border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-medium text-white/70">Session Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Sales</span>
              <span className="font-medium text-white">${totalSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Opening Cash</span>
              <span className="font-medium text-white">${openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Cash Sales</span>
              <span className="font-medium text-white">${totalCash.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-white/[0.08] flex justify-between text-sm">
              <span className="text-white/60">Expected Cash</span>
              <span className="font-semibold text-white">${expectedCash.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Counted Cash in Drawer *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="number"
                step="0.01"
                required
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Cash Difference Alert */}
          {closingCash && cashDifference !== 0 && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-3 ${
                cashDifference > 0
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 mt-0.5 ${cashDifference > 0 ? "text-yellow-500" : "text-red-500"}`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    cashDifference > 0 ? "text-yellow-500" : "text-red-500"
                  }`}
                >
                  {cashDifference > 0 ? "Cash Over" : "Cash Short"}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Difference: ${Math.abs(cashDifference).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Closing Notes (Optional)
            </label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Any issues or notes about this shift..."
              rows={3}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.12] rounded-lg text-white/70 hover:bg-white/[0.08] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Closing..." : "Close Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
