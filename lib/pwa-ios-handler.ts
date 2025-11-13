/**
 * iOS Safari PWA Edge Case Handler
 *
 * iOS Safari has many quirks with PWAs that need special handling:
 * 1. Service workers sometimes don't update properly
 * 2. Cache API has size limits (50MB per origin)
 * 3. Must be added to home screen to be a "real" PWA
 * 4. localStorage can be cleared without warning
 * 5. Background tasks are severely limited
 * 6. No push notifications support
 * 7. Service worker scope issues
 */

export class IOSPWAHandler {
  private static instance: IOSPWAHandler;

  private constructor() {}

  static getInstance(): IOSPWAHandler {
    if (!IOSPWAHandler.instance) {
      IOSPWAHandler.instance = new IOSPWAHandler();
    }
    return IOSPWAHandler.instance;
  }

  /**
   * Detect if running on iOS
   */
  isIOS(): boolean {
    if (typeof window === "undefined") return false;

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Detect if running as installed PWA on iOS
   */
  isIOSPWA(): boolean {
    if (!this.isIOS()) return false;

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Get iOS version
   */
  getIOSVersion(): number | null {
    if (!this.isIOS()) return null;

    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (!match) return null;

    return parseInt(match[1], 10);
  }

  /**
   * Check if iOS version supports service workers properly
   * Service workers were buggy before iOS 11.3
   */
  supportsServiceWorkers(): boolean {
    const version = this.getIOSVersion();
    return version !== null && version >= 11;
  }

  /**
   * Clear iOS cache when it gets too large (iOS has 50MB limit)
   */
  async clearCacheIfNeeded(): Promise<void> {
    if (!this.isIOS() || !("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      // Estimate cache size (rough estimate)
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length * 1024; // Rough estimate: 1KB per entry
      }

      // If estimated size > 40MB, clear old caches
      const MAX_SIZE = 40 * 1024 * 1024; // 40MB (leave headroom)
      if (totalSize > MAX_SIZE) {
        console.log("[iOS] Cache size exceeded threshold, cleaning up...");

        // Keep only the latest 2 caches
        const cachesToKeep = cacheNames.slice(0, 2);
        const cachesToDelete = cacheNames.filter((name) => !cachesToKeep.includes(name));

        for (const cacheName of cachesToDelete) {
          await caches.delete(cacheName);
          console.log(`[iOS] Deleted cache: ${cacheName}`);
        }
      }
    } catch (error) {
      console.error("[iOS] Cache cleanup failed:", error);
    }
  }

  /**
   * iOS Safari: Force service worker update on visibility change
   * iOS sometimes doesn't update SW properly, so we force it
   */
  setupVisibilityChangeHandler(): void {
    if (!this.isIOSPWA()) return;

    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden && "serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            console.log("[iOS] Checking for updates on visibility change...");
            await registration.update();
          }
        } catch (error) {
          console.error("[iOS] Update check failed:", error);
        }
      }
    });
  }

  /**
   * iOS Safari: Handle page show event (back/forward cache)
   * iOS uses bfcache which can cause stale content
   */
  setupPageShowHandler(): void {
    if (!this.isIOSPWA()) return;

    window.addEventListener("pageshow", (event) => {
      // If page is coming from bfcache, reload to get fresh content
      if (event.persisted) {
        console.log("[iOS] Page restored from bfcache, reloading...");
        window.location.reload();
      }
    });
  }

  /**
   * iOS Safari: Persist critical data to localStorage
   * iOS can clear cache without warning, so keep critical data in localStorage
   */
  persistCriticalData(key: string, data: any): void {
    if (!this.isIOSPWA()) return;

    try {
      localStorage.setItem(`pwa_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("[iOS] Failed to persist data:", error);
    }
  }

  /**
   * iOS Safari: Restore critical data from localStorage
   */
  restoreCriticalData(key: string): any | null {
    if (!this.isIOSPWA()) return null;

    try {
      const data = localStorage.getItem(`pwa_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("[iOS] Failed to restore data:", error);
      return null;
    }
  }

  /**
   * iOS Safari: Monitor cache quota
   */
  async checkCacheQuota(): Promise<void> {
    if (!this.isIOS()) return;

    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

        console.log(
          `[iOS] Storage: ${(estimate.usage || 0) / 1024 / 1024}MB / ${(estimate.quota || 0) / 1024 / 1024}MB (${percentUsed.toFixed(1)}%)`
        );

        // Warn if approaching iOS limit
        if (percentUsed > 80) {
          console.warn("[iOS] Storage quota approaching limit!");
          await this.clearCacheIfNeeded();
        }
      }
    } catch (error) {
      console.error("[iOS] Quota check failed:", error);
    }
  }

  /**
   * iOS Safari: Initialize all iOS-specific handlers
   */
  initialize(): void {
    if (!this.isIOS()) {
      console.log("[iOS] Not running on iOS, skipping iOS handlers");
      return;
    }

    console.log("[iOS] Initializing iOS PWA handlers...");
    console.log(`[iOS] Version: ${this.getIOSVersion()}`);
    console.log(`[iOS] PWA Mode: ${this.isIOSPWA()}`);
    console.log(`[iOS] SW Support: ${this.supportsServiceWorkers()}`);

    // Set up event handlers
    this.setupVisibilityChangeHandler();
    this.setupPageShowHandler();

    // Check cache quota periodically (every 5 minutes)
    setInterval(() => {
      this.checkCacheQuota();
    }, 5 * 60 * 1000);

    // Initial quota check
    this.checkCacheQuota();

    console.log("[iOS] iOS PWA handlers initialized");
  }
}

// Export singleton instance
export const iosHandler = IOSPWAHandler.getInstance();
