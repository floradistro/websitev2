/**
 * PWA Settings Section
 *
 * Comprehensive PWA management interface for settings page:
 * - Live update detection with automatic refresh
 * - Install status and prompt
 * - Cache management and storage info
 * - Service worker controls
 * - Platform-specific information
 */

"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  Download,
  RefreshCw,
  Trash2,
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Tag
} from "lucide-react";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { APP_VERSION, getInstalledVersion, needsReinstall, getVersionChangeType } from "@/lib/pwa-version";

export function PWASettingsSection() {
  // PWA Update Hook
  const { updateAvailable, updateReady, isUpdating, applyUpdate, dismissUpdate } = usePWAUpdate();

  // State
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "unknown">("unknown");
  const [storageInfo, setStorageInfo] = useState<{
    usage: number;
    quota: number;
    usageMB: string;
    quotaMB: string;
    percentUsed: string;
  } | null>(null);
  const [swStatus, setSWStatus] = useState<"active" | "waiting" | "installing" | "none">("none");
  const [cacheInfo, setCacheInfo] = useState<{
    count: number;
    names: string[];
  } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [clearing, setClearing] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [versionMismatch, setVersionMismatch] = useState(false);

  // Detect PWA mode
  useEffect(() => {
    const checkPWA = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const fullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
      setIsPWA(standalone || fullscreen);
    };
    checkPWA();
  }, []);

  // Detect platform (including iPad Pro fix)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) ||
                  // iPad Pro detection (reports as Mac)
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                  // iOS 13+ iPad detection
                  (navigator.platform === 'iPad');

    if (isIOS) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get storage info
  useEffect(() => {
    const getStorageInfo = async () => {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setStorageInfo({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            usageMB: ((estimate.usage || 0) / 1024 / 1024).toFixed(2),
            quotaMB: ((estimate.quota || 0) / 1024 / 1024).toFixed(2),
            percentUsed: (((estimate.usage || 0) / (estimate.quota || 1)) * 100).toFixed(1),
          });
        } catch (err) {
          console.error("Error getting storage estimate:", err);
        }
      }
    };
    getStorageInfo();

    // Refresh every 10 seconds
    const interval = setInterval(getStorageInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get service worker status
  useEffect(() => {
    const checkSWStatus = async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.active) setSWStatus("active");
          else if (registration.waiting) setSWStatus("waiting");
          else if (registration.installing) setSWStatus("installing");
        }
      }
    };
    checkSWStatus();

    // Check every 5 seconds
    const interval = setInterval(checkSWStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get cache info
  useEffect(() => {
    const getCacheInfo = async () => {
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          setCacheInfo({
            count: cacheNames.length,
            names: cacheNames,
          });
        } catch (err) {
          console.error("Error getting cache info:", err);
        }
      }
    };
    getCacheInfo();

    // Refresh every 10 seconds
    const interval = setInterval(getCacheInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Check version on mount and periodically
  useEffect(() => {
    const checkVersion = () => {
      const installed = getInstalledVersion();
      setInstalledVersion(installed);
      setVersionMismatch(needsReinstall());
    };
    checkVersion();

    // Check every 30 seconds for version changes
    const interval = setInterval(checkVersion, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear all caches
  const handleClearCaches = async () => {
    if (!confirm("Clear all caches? This will delete offline data and require re-downloading.")) {
      return;
    }

    try {
      setClearing(true);
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      setCacheInfo({ count: 0, names: [] });
      alert("All caches cleared successfully. Reload to re-download.");
    } catch (err) {
      console.error("Error clearing caches:", err);
      alert("Failed to clear caches");
    } finally {
      setClearing(false);
    }
  };

  // Trigger install
  const handleInstall = async () => {
    if (!installPrompt) {
      alert("Install prompt not available. Add to home screen manually.");
      return;
    }

    try {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } catch (err) {
      console.error("Error installing PWA:", err);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone size={18} className="text-white/40" strokeWidth={1.5} />
          <h2 className="text-white/70 text-sm font-light uppercase tracking-[0.15em]">
            Progressive Web App
          </h2>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Update Available Alert */}
      {(updateAvailable || updateReady) && (
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-400/20 flex items-center justify-center flex-shrink-0">
              <RefreshCw size={16} className="text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-blue-200 text-sm font-light mb-1">
                {updateReady ? "Update Ready to Install" : "New Version Available"}
              </div>
              <p className="text-blue-300/60 text-[11px] font-light mb-3">
                {updateReady
                  ? "A new version has been downloaded and is ready to activate."
                  : "A new version is available and will be downloaded soon."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyUpdate}
                  disabled={isUpdating || !updateReady}
                  className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <Loader2 size={14} className="text-blue-300 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <CheckCircle size={14} className="text-blue-300" strokeWidth={1.5} />
                  )}
                  <span className="text-blue-200 text-[10px] uppercase tracking-wider font-light">
                    {isUpdating ? "Updating..." : "Update Now"}
                  </span>
                </button>
                <button
                  onClick={dismissUpdate}
                  className="text-blue-300/60 hover:text-blue-200 text-[10px] uppercase tracking-wider font-light transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Installation Status */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {isPWA ? (
              <CheckCircle size={14} className="text-green-400/60" strokeWidth={1.5} />
            ) : (
              <AlertCircle size={14} className="text-yellow-400/60" strokeWidth={1.5} />
            )}
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-light">
              Installation
            </span>
          </div>
          <div className="text-white/70 text-lg font-light">
            {isPWA ? "Installed" : "Browser"}
          </div>
          <div className="text-white/30 text-[10px] mt-1">{platform.toUpperCase()}</div>
        </div>

        {/* Version */}
        <div className={`bg-white/[0.02] border rounded-2xl p-4 ${
          versionMismatch ? "border-orange-400/30 bg-orange-500/5" : "border-white/[0.04]"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {versionMismatch ? (
              <AlertCircle size={14} className="text-orange-400/60" strokeWidth={1.5} />
            ) : (
              <Tag size={14} className="text-white/40" strokeWidth={1.5} />
            )}
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-light">
              Version
            </span>
          </div>
          <div className="text-white/70 text-lg font-light">v{APP_VERSION}</div>
          {versionMismatch && installedVersion ? (
            <div className="text-orange-400/60 text-[10px] mt-1">
              v{installedVersion} → v{APP_VERSION}
            </div>
          ) : (
            <div className="text-white/30 text-[10px] mt-1">Up to date</div>
          )}
        </div>

        {/* Service Worker */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-white/40" strokeWidth={1.5} />
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-light">
              Service Worker
            </span>
          </div>
          <div className="text-white/70 text-lg font-light capitalize">{swStatus}</div>
          {cacheInfo && (
            <div className="text-white/30 text-[10px] mt-1">
              {cacheInfo.count} {cacheInfo.count === 1 ? "cache" : "caches"}
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-white/40" strokeWidth={1.5} />
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-light">
              Storage Used
            </span>
          </div>
          {storageInfo ? (
            <>
              <div className="text-white/70 text-lg font-light">
                {storageInfo.usageMB} MB
              </div>
              <div className="text-white/30 text-[10px] mt-1">
                {storageInfo.percentUsed}% of {storageInfo.quotaMB} MB
              </div>
            </>
          ) : (
            <div className="text-white/40 text-sm">Calculating...</div>
          )}
        </div>
      </div>

      {/* Install Instructions (iOS - always show if not PWA) */}
      {!isPWA && platform === "ios" && (
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-400/20 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-blue-200 text-sm font-light mb-2">
                Install WhaleTools on iPad
              </div>
              <div className="space-y-2 text-[11px] text-blue-300/80">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-200 text-[9px] font-bold flex-shrink-0">
                    1
                  </div>
                  <span>Tap the <strong>Share</strong> button <span className="text-blue-200">(⬆︎)</span> in Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-200 text-[9px] font-bold flex-shrink-0">
                    2
                  </div>
                  <span>Select <strong>"Add to Home Screen"</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-200 text-[9px] font-bold flex-shrink-0">
                    3
                  </div>
                  <span>Tap <strong>"Add"</strong> in the top right</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Install Button (Android/Desktop only - iOS uses manual) */}
        {!isPWA && platform !== "ios" && (
          <button
            onClick={handleInstall}
            disabled={!installPrompt}
            className="group flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] px-6 py-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download
              size={16}
              className="text-white/40 group-hover:text-white/60 transition-colors"
              strokeWidth={1.5}
            />
            <span className="text-white/60 group-hover:text-white/80 text-[10px] uppercase tracking-wider font-light transition-colors">
              Install App
            </span>
          </button>
        )}

        {/* Clear Cache */}
        <button
          onClick={handleClearCaches}
          disabled={clearing || !cacheInfo || cacheInfo.count === 0}
          className="group flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] px-6 py-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {clearing ? (
            <Loader2
              size={16}
              className="text-white/40 animate-spin"
              strokeWidth={1.5}
            />
          ) : (
            <Trash2
              size={16}
              className="text-white/40 group-hover:text-white/60 transition-colors"
              strokeWidth={1.5}
            />
          )}
          <span className="text-white/60 group-hover:text-white/80 text-[10px] uppercase tracking-wider font-light transition-colors">
            {clearing ? "Clearing..." : "Clear Cache"}
          </span>
        </button>

        {/* Reload App */}
        <button
          onClick={() => window.location.reload()}
          className="group flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] px-6 py-3 rounded-xl transition-all"
        >
          <RefreshCw
            size={16}
            className="text-white/40 group-hover:text-white/60 transition-colors"
            strokeWidth={1.5}
          />
          <span className="text-white/60 group-hover:text-white/80 text-[10px] uppercase tracking-wider font-light transition-colors">
            Reload App
          </span>
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-white/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="text-white/40 text-[11px] font-light leading-relaxed">
            {isPWA ? (
              <>
                <strong className="text-white/60">Installed PWA:</strong> You're running the installed app version.
                Updates will download automatically in the background and you'll be notified when ready to install.
              </>
            ) : (
              <>
                <strong className="text-white/60">Browser Mode:</strong> Install this app to your home screen for
                faster access, offline support, and automatic updates. {platform === "ios" && "On iOS, tap the Share button and select 'Add to Home Screen'."}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
