/**
 * PWA Reinstall Prompt
 *
 * Shows a prominent alert when the installed PWA version is outdated.
 * Guides users through the reinstall process (iOS requirement).
 */

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, Download, X } from "lucide-react";
import {
  APP_VERSION,
  getInstalledVersion,
  needsReinstall,
  saveInstalledVersion,
  isPWA,
  getVersionChangeType,
} from "@/lib/pwa-version";

export default function PWAReinstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [oldVersion, setOldVersion] = useState<string | null>(null);
  const [changeType, setChangeType] = useState<"major" | "minor" | "patch" | "none">("none");
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Only check in PWA mode
    if (!isPWA()) return;

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIOS) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    // Check if reinstall needed
    if (needsReinstall()) {
      const installed = getInstalledVersion();
      if (installed) {
        setOldVersion(installed);
        setChangeType(getVersionChangeType(installed, APP_VERSION));
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    // Update version in storage (user acknowledged)
    saveInstalledVersion();
    setShowPrompt(false);
  };

  const handleReinstall = () => {
    // Update version first
    saveInstalledVersion();

    // Provide platform-specific instructions
    if (platform === "ios") {
      alert(
        "To reinstall:\n\n" +
          "1. Long-press the WhaleTools icon on your home screen\n" +
          "2. Tap 'Remove App'\n" +
          "3. Open Safari and go to Settings\n" +
          "4. Follow the install instructions\n\n" +
          "This ensures you get the latest version!"
      );
    } else {
      alert(
        "To reinstall:\n\n" +
          "1. Remove the current app from your device\n" +
          "2. Reload this page\n" +
          "3. Install again when prompted\n\n" +
          "This ensures you get the latest version!"
      );
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-3xl p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} className="text-white" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle size={32} className="text-orange-300" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h2 className="text-white text-xl font-light text-center mb-2">
          App Update Required
        </h2>

        {/* Version info */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-white/40 text-sm">v{oldVersion}</span>
          <span className="text-white/60">→</span>
          <span className="text-green-400 text-sm font-medium">v{APP_VERSION}</span>
          {changeType !== "none" && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                changeType === "major"
                  ? "bg-red-500/20 text-red-300"
                  : changeType === "minor"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-blue-500/20 text-blue-300"
              }`}
            >
              {changeType}
            </span>
          )}
        </div>

        {/* Message */}
        <p className="text-white/70 text-sm text-center mb-6 leading-relaxed">
          A new version is available. {platform === "ios" ? "On iOS/iPadOS" : "On your device"}, you
          need to reinstall the app to get the latest features and fixes.
        </p>

        {/* Instructions */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6">
          <h3 className="text-white/80 text-xs uppercase tracking-wider mb-3 font-light">
            Reinstall Steps
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-red-300 text-xs font-bold">1</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Trash2 size={14} className="text-red-400/60" strokeWidth={1.5} />
                <span>
                  {platform === "ios"
                    ? "Long-press app icon → Remove App"
                    : "Uninstall current app"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-300 text-xs font-bold">2</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Download size={14} className="text-blue-400/60" strokeWidth={1.5} />
                <span>
                  {platform === "ios"
                    ? "Open Safari → Settings → Install"
                    : "Reload and install again"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleReinstall}
            className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 hover:border-orange-400/50 px-6 py-3 rounded-xl transition-all text-orange-200 font-light text-sm"
          >
            Show Reinstall Instructions
          </button>
          <button
            onClick={handleDismiss}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-6 py-3 rounded-xl transition-all text-white/60 hover:text-white/80 font-light text-sm"
          >
            I'll Do It Later
          </button>
        </div>

        {/* Fine print */}
        <p className="text-white/30 text-[10px] text-center mt-4">
          Version mismatches can cause unexpected behavior. Reinstalling ensures compatibility.
        </p>
      </div>
    </div>
  );
}
