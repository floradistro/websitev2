"use client";

import { useState } from "react";
import { X, DollarSign } from "@/lib/icons";

interface OpenSessionModalProps {
  terminalId: string;
  terminalName: string;
  locationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpenSessionModal({
  terminalId,
  terminalName,
  locationId,
  onClose,
  onSuccess,
}: OpenSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pos/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: locationId,
          registerId: terminalId,
          openingCash: parseFloat(openingCash || "0"),
          openingNotes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to open shift");
      }
    } catch (err) {
      console.error("Error opening session:", err);
      setError("Failed to open shift");
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
            <h2 className="text-xl font-bold text-white">Open Shift</h2>
            <p className="text-sm text-white/60 mt-1">{terminalName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-400 mb-2">Before You Start</h3>
          <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
            <li>Count all cash in the drawer</li>
            <li>Enter the total amount below</li>
            <li>Keep the count slip for end-of-shift reconciliation</li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Opening Cash Count *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg pl-10 pr-4 py-3 text-white text-2xl font-bold placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              This is the cash in your drawer before any sales
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 100, 200, 300].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setOpeningCash(amount.toString())}
                className="py-2 bg-white/[0.05] border border-white/[0.08] text-white/70 rounded-lg hover:bg-white/[0.08] hover:border-white/[0.12] text-sm font-medium transition-colors"
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Opening Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the opening cash count..."
              rows={2}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/30 resize-none"
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
              {loading ? "Opening..." : "Open Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
