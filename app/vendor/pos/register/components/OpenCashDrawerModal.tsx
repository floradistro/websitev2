"use client";

import { useState } from "react";
import { DollarSign } from "@/lib/icons";

interface OpenCashDrawerModalProps {
  onSubmit: (openingCash: number, notes: string) => void;
  onCancel: () => void;
}

export function OpenCashDrawerModal({ onSubmit, onCancel }: OpenCashDrawerModalProps) {
  const [openingCash, setOpeningCash] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(openingCash || "0"), notes);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="bg-[#0a0a0a] border-2 border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full my-8">
        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-2xl font-black text-white uppercase tracking-tight mb-2"
            style={{ fontWeight: 900 }}
          >
            Count Cash Drawer
          </h2>
          <p className="text-white/60 text-sm">
            Count all cash in the drawer before starting your shift
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h3 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
            Before You Start
          </h3>
          <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
            <li>Count all bills and coins in the drawer</li>
            <li>Include any change from previous shift</li>
            <li>Enter the total amount below</li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-white/70 mb-3 uppercase tracking-wide font-bold">
              Opening Cash Count *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full bg-white/[0.05] border-2 border-white/20 rounded-xl pl-14 pr-4 py-4 text-white text-3xl font-black placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                style={{ fontWeight: 900 }}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 100, 200, 300].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setOpeningCash(amount.toString())}
                className="py-3 bg-white/[0.05] border border-white/20 text-white/70 rounded-lg hover:bg-white/[0.08] hover:border-white/30 text-sm font-bold uppercase tracking-wide transition-all"
                style={{ fontWeight: 900 }}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-white/70 mb-2 uppercase tracking-wide font-bold">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the opening count..."
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
              Start Shift
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
