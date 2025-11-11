"use client";

import { useState } from "react";
import { DollarSign, AlertCircle } from "@/lib/icons";

interface CloseCashDrawerModalProps {
  sessionId: string;
  sessionNumber: string;
  totalSales: number;
  totalCash: number;
  openingCash: number;
  onSubmit: (closingCash: number, notes: string) => void;
  onCancel: () => void;
}

export function CloseCashDrawerModal({
  sessionId,
  sessionNumber,
  totalSales,
  totalCash,
  openingCash,
  onSubmit,
  onCancel,
}: CloseCashDrawerModalProps) {
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");

  const expectedCash = openingCash + totalCash;
  const cashDifference = closingCash ? parseFloat(closingCash) - expectedCash : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(closingCash || "0"), notes);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-2xl font-black text-white uppercase tracking-tight mb-2"
            style={{ fontWeight: 900 }}
          >
            Count Cash Drawer
          </h2>
          <p className="text-white/60 text-sm">
            Count all cash in the drawer to close your shift
          </p>
        </div>

        {/* Session Summary */}
        <div className="mb-6 p-4 bg-white/[0.05] border border-white/20 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wide">
            Shift Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Sales</span>
              <span className="font-black text-white" style={{ fontWeight: 900 }}>
                ${totalSales.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Opening Cash</span>
              <span className="font-black text-white" style={{ fontWeight: 900 }}>
                ${openingCash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Cash Sales</span>
              <span className="font-black text-white" style={{ fontWeight: 900 }}>
                ${totalCash.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/20 flex justify-between">
              <span className="text-sm font-bold text-white/70 uppercase tracking-wide">
                Expected Cash
              </span>
              <span className="text-lg font-black text-white" style={{ fontWeight: 900 }}>
                ${expectedCash.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h3 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
            Before You Close
          </h3>
          <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
            <li>Count all bills and coins in the drawer</li>
            <li>Compare to expected cash above</li>
            <li>Note any differences</li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-white/70 mb-3 uppercase tracking-wide font-bold">
              Closing Cash Count *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full bg-white/[0.05] border-2 border-white/20 rounded-xl pl-14 pr-4 py-4 text-white text-3xl font-black placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                style={{ fontWeight: 900 }}
              />
            </div>
          </div>

          {/* Cash Difference Alert */}
          {closingCash && cashDifference !== 0 && (
            <div
              className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                cashDifference > 0
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <AlertCircle
                className={`w-6 h-6 mt-0.5 ${cashDifference > 0 ? "text-yellow-400" : "text-red-400"}`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-black uppercase tracking-wide ${
                    cashDifference > 0 ? "text-yellow-400" : "text-red-400"
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  {cashDifference > 0 ? "⚠️ Cash Over" : "❌ Cash Short"}
                </p>
                <p className="text-xs text-white/60 mt-1 font-bold">
                  Difference: ${Math.abs(cashDifference).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-white/70 mb-2 uppercase tracking-wide font-bold">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the closing count or shift..."
              rows={2}
              className="w-full bg-white/[0.05] border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 bg-white/[0.05] border border-white/20 rounded-xl text-white/70 font-bold uppercase tracking-wide hover:bg-white/[0.08] transition-all"
              style={{ fontWeight: 900 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-blue-700 transition-all"
              style={{ fontWeight: 900 }}
            >
              Close Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
