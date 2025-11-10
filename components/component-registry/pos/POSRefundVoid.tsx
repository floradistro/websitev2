"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

import { logger } from "@/lib/logger";
interface Transaction {
  id: string;
  transaction_number: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface POSRefundVoidProps {
  transaction: Transaction;
  type: "refund" | "void";
  onComplete: () => void;
  onCancel: () => void;
}

export function POSRefundVoid({ transaction, type, onComplete, onCancel }: POSRefundVoidProps) {
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const isToday = new Date(transaction.created_at).toDateString() === new Date().toDateString();
  const canVoid = type === "void" && isToday;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return; // Form validation prevents empty reason
    }

    setProcessing(true);

    try {
      const endpoint = type === "void" ? "/api/pos/sales/void" : "/api/pos/sales/refund";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process");
      }

      const result = await response.json();
      onComplete(); // Success - let parent handle UI
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Refund/void error:", error);
      }
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h3
              className="text-xs uppercase tracking-[0.15em] text-white font-black"
              style={{ fontWeight: 900 }}
            >
              {type === "void" ? "Void Transaction" : "Process Refund"}
            </h3>
          </div>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Warning */}
        {type === "void" && !canVoid && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <div className="text-red-400 text-xs uppercase tracking-[0.15em] font-black mb-2">
              Cannot Void
            </div>
            <div className="text-white/60 text-[10px]">
              Transactions can only be voided on the same day. Use refund instead.
            </div>
          </div>
        )}

        {/* Transaction Details */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">Order</span>
            <span className="text-white font-black text-xs" style={{ fontWeight: 900 }}>
              {transaction.order_number}
            </span>
          </div>

          <div className="space-y-2 mb-3">
            {transaction.items.map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-white/60">
                  {item.quantity}× {item.productName}
                </span>
                <span className="text-white font-black" style={{ fontWeight: 900 }}>
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/5">
            <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Total</span>
            <span className="text-white font-black text-lg" style={{ fontWeight: 900 }}>
              ${transaction.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for refund/void..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all placeholder-white/40 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 transition-all"
            style={{ fontWeight: 900 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || !reason.trim() || (type === "void" && !canVoid)}
            className="flex-1 px-4 py-3 bg-red-500/20 border-2 border-red-500/40 text-red-400 rounded-2xl hover:bg-red-500/30 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ fontWeight: 900 }}
          >
            {processing ? "Processing..." : type === "void" ? "Void" : "Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}
