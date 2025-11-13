"use client";

import { useEffect, useState, useCallback } from "react";

interface PWAUpdateState {
  updateAvailable: boolean;
  updateReady: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Apple-quality PWA update detection hook
 *
 * Features:
 * - Silent background update checks every 60 seconds
 * - Detects when new version is available
 * - Handles both iOS Safari and Android Chrome quirks
 * - Preserves app state during update
 * - Smooth reload experience
 */
export function usePWAUpdate() {
  const [state, setState] = useState<PWAUpdateState>({
    updateAvailable: false,
    updateReady: false,
    isUpdating: false,
    registration: null,
  });

  // Check for updates periodically (every 60 seconds)
  const checkForUpdate = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
    } catch (error) {
      console.error("[PWA] Update check failed:", error);
    }
  }, [state.registration]);

  // Apply the update (install new service worker)
  const applyUpdate = useCallback(async () => {
    if (!state.registration || !state.registration.waiting) {
      console.warn("[PWA] No update available to apply");
      return;
    }

    setState((prev) => ({ ...prev, isUpdating: true }));

    // Tell the waiting service worker to skip waiting and activate
    state.registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Wait for the new service worker to take control
    // Then reload the page to get the new version
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          window.location.reload();
        }, 300);
      });
    }
  }, [state.registration]);

  // Dismiss update notification (user clicked "Later")
  const dismissUpdate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      updateAvailable: false,
    }));

    // Show again in 1 hour
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        updateAvailable: true,
      }));
    }, 60 * 60 * 1000); // 1 hour
  }, []);

  // Initialize service worker listeners
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Only run in production or when explicitly testing PWA
    const isPWAMode =
      process.env.NODE_ENV === "production" ||
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (!isPWAMode) {
      return;
    }

    const setupServiceWorker = async () => {
      try {
        // Get current registration
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          console.log("[PWA] No service worker registered");
          return;
        }

        console.log("[PWA] Service worker registered");
        setState((prev) => ({ ...prev, registration }));

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          console.log("[PWA] Update found - downloading...");
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available!
                console.log("[PWA] Update available");
                setState((prev) => ({
                  ...prev,
                  updateAvailable: true,
                  updateReady: true,
                }));
              }
            });
          }
        });

        // Check for existing waiting worker
        if (registration.waiting) {
          console.log("[PWA] Update already waiting");
          setState((prev) => ({
            ...prev,
            updateAvailable: true,
            updateReady: true,
          }));
        }

        // Check for updates immediately
        await registration.update();
      } catch (error) {
        console.error("[PWA] Service worker setup failed:", error);
      }
    };

    setupServiceWorker();
  }, []);

  // Set up periodic update checks (every 60 seconds)
  useEffect(() => {
    if (!state.registration) return;

    const interval = setInterval(() => {
      checkForUpdate();
    }, 60 * 1000); // 60 seconds

    return () => clearInterval(interval);
  }, [state.registration, checkForUpdate]);

  // iOS Safari: Check for update when app comes to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.registration) {
        checkForUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.registration, checkForUpdate]);

  // Android: Check for update when app regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (state.registration) {
        checkForUpdate();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [state.registration, checkForUpdate]);

  return {
    updateAvailable: state.updateAvailable,
    updateReady: state.updateReady,
    isUpdating: state.isUpdating,
    applyUpdate,
    dismissUpdate,
    checkForUpdate,
  };
}
