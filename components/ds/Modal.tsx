"use client";

import { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { ds, cn } from "@/lib/design-system";
import { IconButton } from "@/components/ui/Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
  footer?: ReactNode;
}

/**
 * 🎯 Standardized Modal Component
 *
 * Compact, professional, saves space
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showClose = true,
  footer,
}: ModalProps) {
  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-[95vw] sm:max-w-4xl",
    full: "max-w-[95vw] sm:max-w-7xl",
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  "w-full transform overflow-hidden",
                  sizeStyles[size],
                  ds.colors.bg.primary,
                  ds.colors.border.default,
                  "border",
                  ds.effects.radius.xl,
                  ds.effects.shadow.xl,
                  "transition-all",
                )}
              >
                {/* Header - Compact */}
                {(title || showClose) && (
                  <div
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5",
                      ds.colors.border.default,
                      "border-b",
                    )}
                  >
                    {title && (
                      <Dialog.Title
                        className={cn(
                          ds.typography.size.sm,
                          ds.typography.weight.light,
                          ds.colors.text.secondary,
                          ds.typography.tracking.tight,
                        )}
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {showClose && (
                      <IconButton
                        icon={<X size={14} />}
                        size="sm"
                        onClick={onClose}
                        className="ml-auto"
                        aria-label="Close modal"
                      />
                    )}
                  </div>
                )}

                {/* Content - Compact padding */}
                <div className="p-3 sm:p-4 max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
                  {children}
                </div>

                {/* Footer - Compact */}
                {footer && (
                  <div
                    className={cn(
                      "flex items-center justify-end gap-2 px-4 py-2.5",
                      ds.colors.border.default,
                      "border-t",
                    )}
                  >
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
