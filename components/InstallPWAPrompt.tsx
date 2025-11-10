"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

/**
 * Shows a prompt to iOS Safari users to install the PWA for fullscreen experience
 */
export default function InstallPWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const isDismissed =
      sessionStorage.getItem("pwa-prompt-dismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Detect if user is on iOS Safari (not in standalone mode)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode =
      "standalone" in window.navigator && (window.navigator as any).standalone;
    const isInPWAMode = window.matchMedia("(display-mode: standalone)").matches;

    // Show prompt only if on iOS Safari and NOT in PWA mode
    if (isIOS && !isInStandaloneMode && !isInPWAMode) {
      // Wait 2 seconds before showing prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (dismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-none">
      <div
        className="mx-4 mb-4 pointer-events-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          marginBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} className="text-white" />
        </button>

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Smartphone size={24} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base mb-1">
                Install WhaleTools
              </h3>
              <p className="text-white/70 text-sm mb-3 leading-relaxed">
                Install this app on your home screen for a fullscreen experience
                without the browser bar.
              </p>

              {/* Instructions */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex-shrink-0 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-white/80 font-bold">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-white/90">Share</strong>{" "}
                    button below
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex-shrink-0 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-white/80 font-bold">
                    2
                  </span>
                  <span>
                    Select{" "}
                    <strong className="text-white/90">
                      "Add to Home Screen"
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex-shrink-0 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-white/80 font-bold">
                    3
                  </span>
                  <span>
                    Tap <strong className="text-white/90">"Add"</strong> to
                    confirm
                  </span>
                </div>
              </div>

              {/* Visual indicator */}
              <div className="flex items-center gap-2 text-xs text-blue-300">
                <Download size={14} />
                <span className="font-medium">
                  Look for the Share icon in Safari toolbar
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
