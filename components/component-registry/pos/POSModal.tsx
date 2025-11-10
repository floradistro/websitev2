"use client";

import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export function POSModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText,
  cancelText,
  onConfirm,
}: POSModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle size={24} className="text-green-400" />,
    error: <AlertTriangle size={24} className="text-red-400" />,
    warning: <AlertTriangle size={24} className="text-yellow-400" />,
    info: <Info size={24} className="text-blue-400" />,
  };

  const borderColors = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    warning: "border-yellow-500/30",
    info: "border-blue-500/30",
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className={`bg-[#0a0a0a] border ${borderColors[type]} rounded-2xl p-6 max-w-md w-full`}>
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="flex-1">
            <h3
              className="text-xs uppercase tracking-[0.15em] text-white font-black mb-2"
              style={{ fontWeight: 900 }}
            >
              {title}
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          {cancelText && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
              style={{ fontWeight: 900 }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-2xl hover:bg-white/20 hover:border-white/30 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300"
            style={{ fontWeight: 900 }}
          >
            {confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
