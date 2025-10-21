"use client";

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void;
  submitText?: string;
  cancelText?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  maxWidth = 'lg'
}: AdminModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/10 backdrop-blur-xl"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={onClose}
    >
      <div 
        className={`bg-[#0a0a0a] border border-white/20 w-full ${widthClasses[maxWidth]} shadow-2xl shadow-black/50`}
        style={{ 
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between border-b border-white/10 p-6 flex-shrink-0 bg-[#0a0a0a]">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl text-white font-medium">{title}</h2>
            {description && (
              <p className="text-white/60 text-sm mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable with custom scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-white/10 p-6 flex gap-3 flex-shrink-0 bg-[#0a0a0a]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-transparent border border-white/20 text-white hover:bg-white/5 transition-all text-sm uppercase tracking-wider"
          >
            {cancelText}
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2.5 bg-white text-black hover:bg-white/90 transition-all text-sm uppercase tracking-wider font-medium"
          >
            {submitText}
          </button>
        </div>
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

  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}

