"use client";

import { useEffect, useState } from "react";
import { Activity, Wifi, WifiOff, Download, RefreshCw, X, Smartphone, Monitor } from "lucide-react";
import { iosHandler } from "@/lib/pwa-ios-handler";
import { androidHandler } from "@/lib/pwa-android-handler";

interface PWAStatus {
  isInstalled: boolean;
  platform: "ios" | "android" | "desktop" | "unknown";
  version: number | null;
  serviceWorkerStatus: "active" | "installing" | "waiting" | "none";
  isOnline: boolean;
  cacheSize: string;
  lastUpdate: Date | null;
}

/**
 * PWA Debug Panel for Staff
 *
 * Floating debug panel that shows:
 * - Platform detection (iOS/Android/Desktop)
 * - Service worker status
 * - Cache information
 * - Update availability
 * - Network status
 * - Manual controls (clear cache, force update, etc.)
 *
 * Access: Triple-tap bottom-right corner in PWA mode
 */
export default function PWADebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    platform: "unknown",
    version: null,
    serviceWorkerStatus: "none",
    isOnline: true,
    cacheSize: "0 MB",
    lastUpdate: null,
  });

  // Triple-tap detection to open panel
  useEffect(() => {
    let tapCount = 0;
    let tapTimeout: NodeJS.Timeout;

    const handleClick = (e: MouseEvent) => {
      // Only detect clicks in bottom-right corner
      const isBottomRight =
        e.clientX > window.innerWidth - 100 && e.clientY > window.innerHeight - 100;

      if (!isBottomRight) {
        tapCount = 0;
        return;
      }

      tapCount++;

      if (tapCount === 3) {
        setIsOpen(true);
        tapCount = 0;
      }

      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        tapCount = 0;
      }, 500);
    };

    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
      clearTimeout(tapTimeout);
    };
  }, []);

  // Update status periodically
  useEffect(() => {
    const updateStatus = async () => {
      const newStatus: PWAStatus = {
        isInstalled:
          window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches ||
          (window.navigator as any).standalone === true,
        platform: iosHandler.isIOS()
          ? "ios"
          : androidHandler.isAndroid()
            ? "android"
            : "desktop",
        version: iosHandler.isIOS()
          ? iosHandler.getIOSVersion()
          : androidHandler.getAndroidVersion(),
        serviceWorkerStatus: "none",
        isOnline: navigator.onLine,
        cacheSize: "0 MB",
        lastUpdate: null,
      };

      // Check service worker status
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            if (registration.active) {
              newStatus.serviceWorkerStatus = "active";
            } else if (registration.installing) {
              newStatus.serviceWorkerStatus = "installing";
            } else if (registration.waiting) {
              newStatus.serviceWorkerStatus = "waiting";
            }
          }
        } catch (error) {
          console.error("[PWA Debug] SW check failed:", error);
        }
      }

      // Estimate cache size
      if ("storage" in navigator && "estimate" in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const sizeMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
          newStatus.cacheSize = `${sizeMB} MB`;
        } catch (error) {
          console.error("[PWA Debug] Cache size check failed:", error);
        }
      }

      setStatus(newStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    if (!("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      alert("Cache cleared successfully! Please reload the app.");
    } catch (error) {
      alert(`Failed to clear cache: ${error}`);
    }
  };

  const handleForceUpdate = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        alert("Update check initiated. If an update is available, you'll see a notification.");
      }
    } catch (error) {
      alert(`Failed to check for updates: ${error}`);
    }
  };

  const handleUnregisterSW = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        alert("Service worker unregistered. Please reload the app.");
      }
    } catch (error) {
      alert(`Failed to unregister service worker: ${error}`);
    }
  };

  const getPlatformIcon = () => {
    switch (status.platform) {
      case "ios":
        return <Smartphone className="text-white" size={20} />;
      case "android":
        return <Smartphone className="text-green-400" size={20} />;
      default:
        return <Monitor className="text-blue-400" size={20} />;
    }
  };

  const getStatusColor = (serviceWorkerStatus: string) => {
    switch (serviceWorkerStatus) {
      case "active":
        return "text-green-400";
      case "installing":
        return "text-yellow-400";
      case "waiting":
        return "text-orange-400";
      default:
        return "text-red-400";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="relative bg-[#1a1a1a] border border-white/20 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-400" size={24} />
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                PWA Debug Panel
              </h3>
              <p className="text-white/50 text-xs">Staff Diagnostic Tool</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="text-white" size={16} />
          </button>
        </div>

        {/* Status Info */}
        <div className="p-6 space-y-4">
          {/* Platform */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Platform</span>
            <div className="flex items-center gap-2">
              {getPlatformIcon()}
              <span className="text-white text-sm font-medium">
                {status.platform.toUpperCase()}
                {status.version ? ` ${status.version}` : ""}
              </span>
            </div>
          </div>

          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Installed as PWA</span>
            <span className={`text-sm font-medium ${status.isInstalled ? "text-green-400" : "text-yellow-400"}`}>
              {status.isInstalled ? "Yes" : "No"}
            </span>
          </div>

          {/* Service Worker */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Service Worker</span>
            <span className={`text-sm font-medium ${getStatusColor(status.serviceWorkerStatus)}`}>
              {status.serviceWorkerStatus.toUpperCase()}
            </span>
          </div>

          {/* Network Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Network</span>
            <div className="flex items-center gap-2">
              {status.isOnline ? (
                <Wifi className="text-green-400" size={16} />
              ) : (
                <WifiOff className="text-red-400" size={16} />
              )}
              <span className={`text-sm font-medium ${status.isOnline ? "text-green-400" : "text-red-400"}`}>
                {status.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Cache Size */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Cache Size</span>
            <span className="text-white text-sm font-medium">{status.cacheSize}</span>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={handleForceUpdate}
              className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Check for Updates
            </button>

            <button
              onClick={handleClearCache}
              className="w-full px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Clear Cache
            </button>

            <button
              onClick={handleUnregisterSW}
              className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <X size={16} />
              Unregister Service Worker
            </button>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs leading-relaxed">
              <strong className="text-white/60">Tip:</strong> If updates aren't appearing, try
              "Check for Updates" first. If that doesn't work, use "Clear Cache" and reload the
              app. As a last resort, use "Unregister Service Worker" and reinstall the PWA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
