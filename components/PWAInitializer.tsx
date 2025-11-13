"use client";

import { useEffect } from "react";
import { iosHandler } from "@/lib/pwa-ios-handler";
import { androidHandler } from "@/lib/pwa-android-handler";

/**
 * PWA Initializer Component
 *
 * Initializes all PWA-related handlers for iOS and Android
 * Should be included in root layout
 *
 * This component:
 * - Detects platform (iOS/Android)
 * - Initializes platform-specific handlers
 * - Sets up edge case management
 * - Runs silently in background
 */
export default function PWAInitializer() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Only run in production or PWA mode
    const isPWAMode =
      process.env.NODE_ENV === "production" ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true;

    if (!isPWAMode) {
      console.log("[PWA] Skipping PWA initialization (not in PWA mode)");
      return;
    }

    console.log("[PWA] Initializing PWA handlers...");

    // Initialize iOS handlers
    if (iosHandler.isIOS()) {
      iosHandler.initialize();
    }

    // Initialize Android handlers
    if (androidHandler.isAndroid()) {
      androidHandler.initialize();
    }

    console.log("[PWA] PWA handlers initialized successfully");
  }, []);

  // This component renders nothing
  return null;
}
