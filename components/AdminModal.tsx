"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  variant?: "default" | "form" | "confirmation";
  hideFooter?: boolean;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  maxWidth = "lg",
  variant = "default",
  hideFooter = false,
}: AdminModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        animation: "fade-in 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className={`bg-black/95 backdrop-blur-xl border border-white/10 w-full ${widthClasses[maxWidth]} shadow-2xl rounded-2xl overflow-hidden`}
        style={{
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          animation: "fade-in 0.3s ease-out",
          boxShadow: "0 0 60px rgba(255,255,255,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 flex-shrink-0 bg-black">
          <div className="flex-1 min-w-0 pr-4">
            <h2
              className="text-xs uppercase tracking-[0.15em] text-white mb-2 font-black"
              style={{ fontWeight: 900 }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-white/40 text-[10px] uppercase tracking-wider">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable with custom scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>

        {/* Footer - Fixed */}
        {!hideFooter &&
          (onSubmit ? (
            <div className="border-t border-white/5 p-6 flex items-center justify-between flex-shrink-0 bg-black">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-black/20 border border-white/5 text-white/60 hover:bg-white/5 hover:text-white transition-colors rounded-xl text-[10px] uppercase tracking-[0.15em] font-black"
                  style={{ fontWeight: 900 }}
                >
                  {cancelText}
                </button>
                <button
                  onClick={onSubmit}
                  className="px-8 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-xl text-[10px] uppercase tracking-[0.15em] font-black"
                  style={{ fontWeight: 900 }}
                >
                  {submitText}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/5 p-6 flex justify-end flex-shrink-0 bg-black">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-xl text-[10px] uppercase tracking-[0.15em] font-black"
                style={{ fontWeight: 900 }}
              >
                Close
              </button>
            </div>
          ))}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null;
}
