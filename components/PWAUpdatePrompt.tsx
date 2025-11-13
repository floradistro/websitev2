"use client";

import { useEffect, useState } from "react";
import { Download, X, RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";

/**
 * Apple-quality PWA update notification
 *
 * Design Philosophy:
 * - Non-intrusive: Appears at top of screen like iOS system notifications
 * - Elegant: Matches Yacht Club glassmorphism aesthetic
 * - Informative: Clear messaging about what's new
 * - Respectful: "Later" option that re-prompts in 1 hour
 * - Smooth: Beautiful spring animations (Apple-style)
 *
 * Behavior:
 * - Appears when new version detected
 * - "Update Now" - Smooth reload with progress indicator
 * - "Later" - Dismisses for 1 hour
 * - Works perfectly in iOS Safari and Android Chrome PWA mode
 * - Respects safe area insets (notched devices)
 */
export default function PWAUpdatePrompt() {
  const { updateAvailable, updateReady, isUpdating, applyUpdate, dismissUpdate } = usePWAUpdate();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(15); // Auto-update after 15 seconds
  const [autoUpdateCancelled, setAutoUpdateCancelled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (updateAvailable && mounted) {
      // Delay appearance for smooth entrance animation
      setTimeout(() => {
        setIsVisible(true);
      }, 500);
    } else {
      setIsVisible(false);
    }
  }, [updateAvailable, mounted]);

  // Auto-update countdown
  useEffect(() => {
    if (!updateAvailable || !updateReady || isUpdating || autoUpdateCancelled) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown reached 0 - auto-update
      applyUpdate();
    }
  }, [countdown, updateAvailable, updateReady, isUpdating, autoUpdateCancelled, applyUpdate]);

  const handleUpdate = () => {
    applyUpdate();
  };

  const handleDismiss = () => {
    setAutoUpdateCancelled(true);
    setIsVisible(false);
    setTimeout(() => {
      dismissUpdate();
    }, 300); // Wait for exit animation
  };

  if (!mounted || !updateAvailable) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[250] pointer-events-none"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Update Banner */}
      <div
        className={`mx-4 mt-4 pointer-events-auto transition-all duration-500 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
        style={{
          transform: isVisible ? "translateY(0)" : "translateY(-150%)",
        }}
      >
        <div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden relative"
          style={{
            boxShadow:
              "0 20px 60px -15px rgba(0,0,0,0.8), 0 0 40px -10px rgba(255,255,255,0.1), 0 0 80px -20px rgba(59, 130, 246, 0.3)",
          }}
        >
          {/* Yacht Club Watermark */}
          <div className="absolute top-3 right-3 opacity-5 pointer-events-none">
            <Image
              src="/yacht-club-logo.png"
              alt=""
              width={48}
              height={48}
              className="object-contain"
            />
          </div>

          {/* Animated gradient border effect */}
          <div className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-20 blur-xl animate-pulse"></div>
          </div>

          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {/* Icon - Animated sparkle */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
                {isUpdating ? (
                  <RefreshCw size={24} className="text-white animate-spin" />
                ) : (
                  <>
                    <Sparkles size={24} className="text-white relative z-10" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1 tracking-tight">
                  {isUpdating ? "Updating WhaleTools..." : "New Version Available"}
                </h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  {isUpdating
                    ? "Please wait while we update to the latest version..."
                    : updateReady && !autoUpdateCancelled
                    ? `Auto-updating in ${countdown} second${countdown !== 1 ? 's' : ''}...`
                    : "A new version of WhaleTools is ready. Update now for the latest features and improvements."}
                </p>

                {/* Action Buttons */}
                {!isUpdating && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-xs uppercase tracking-wider font-medium"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-white hover:bg-white/90 text-black border border-white rounded-xl transition-all duration-300 text-xs uppercase tracking-wider font-medium flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                      <Download size={14} />
                      Update Now
                    </button>
                  </div>
                )}

                {/* Progress indicator when updating */}
                {isUpdating && (
                  <div className="mt-3">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-progress"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dismiss button (only when not updating) */}
              {!isUpdating && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
