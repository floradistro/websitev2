"use client";

import { useState } from "react";
import { X, AlertTriangle } from "@/lib/icons";

interface DeleteTerminalModalProps {
  terminalId: string;
  terminalName: string;
  storeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteTerminalModal({
  terminalId,
  terminalName,
  storeName,
  onClose,
  onSuccess,
}: DeleteTerminalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vendor/terminals?id=${terminalId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to delete terminal");
      }
    } catch (err) {
      console.error("Error deleting terminal:", err);
      setError("Failed to delete terminal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-red-500/20 rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Delete Terminal</h2>
            <p className="text-sm text-white/60 mt-1">This action cannot be undone</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-3">
          <p className="text-white/80">
            Are you sure you want to delete this terminal?
          </p>
          <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.08]">
            <div className="text-sm text-white/60 mb-1">Terminal</div>
            <div className="font-semibold text-white">{terminalName}</div>
            <div className="text-sm text-white/50 mt-2">{storeName}</div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">
              Any active sessions on this terminal will be closed. Transaction history
              will be preserved.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.12] rounded-lg text-white/70 hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Terminal"}
          </button>
        </div>
      </div>
    </div>
  );
}
