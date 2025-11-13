/**
 * Android Chrome PWA Edge Case Handler
 *
 * Android Chrome has different quirks than iOS:
 * 1. Better service worker support but different lifecycle
 * 2. Can show install prompts (beforeinstallprompt)
 * 3. Supports push notifications
 * 4. Background sync capabilities
 * 5. Can have splash screens
 * 6. Better cache management
 * 7. Supports WebAPK (native-like install)
 */

export class AndroidPWAHandler {
  private static instance: AndroidPWAHandler;
  private deferredPrompt: any = null;

  private constructor() {}

  static getInstance(): AndroidPWAHandler {
    if (!AndroidPWAHandler.instance) {
      AndroidPWAHandler.instance = new AndroidPWAHandler();
    }
    return AndroidPWAHandler.instance;
  }

  /**
   * Detect if running on Android
   */
  isAndroid(): boolean {
    if (typeof window === "undefined") return false;

    return /Android/i.test(navigator.userAgent);
  }

  /**
   * Detect if running as installed PWA on Android
   */
  isAndroidPWA(): boolean {
    if (!this.isAndroid()) return false;

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches
    );
  }

  /**
   * Detect if running in Chrome on Android
   */
  isAndroidChrome(): boolean {
    if (!this.isAndroid()) return false;

    return /Chrome/i.test(navigator.userAgent) && !/Edge|Edg/i.test(navigator.userAgent);
  }

  /**
   * Get Android version
   */
  getAndroidVersion(): number | null {
    if (!this.isAndroid()) return null;

    const match = navigator.userAgent.match(/Android\s([0-9.]*)/i);
    if (!match) return null;

    return parseFloat(match[1]);
  }

  /**
   * Check if device supports PWA features
   */
  supportsPWAFeatures(): {
    installPrompt: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
  } {
    return {
      installPrompt: "BeforeInstallPromptEvent" in window,
      pushNotifications: "PushManager" in window,
      backgroundSync: "SyncManager" in window,
    };
  }

  /**
   * Capture beforeinstallprompt event for later use
   */
  setupInstallPromptHandler(onPromptCaptured?: () => void): void {
    if (!this.isAndroid()) return;

    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("[Android] beforeinstallprompt event captured");

      // Prevent the default mini-infobar
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e;

      // Notify that prompt is available
      onPromptCaptured?.();
    });
  }

  /**
   * Show the install prompt (if available)
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log("[Android] No install prompt available");
      return false;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log(`[Android] Install prompt outcome: ${outcome}`);

      // Clear the deferred prompt
      this.deferredPrompt = null;

      return outcome === "accepted";
    } catch (error) {
      console.error("[Android] Install prompt failed:", error);
      return false;
    }
  }

  /**
   * Detect app installed event
   */
  setupAppInstalledHandler(onInstalled: () => void): void {
    if (!this.isAndroid()) return;

    window.addEventListener("appinstalled", () => {
      console.log("[Android] App installed successfully");
      onInstalled();
    });
  }

  /**
   * Android: Handle orientation changes (important for tablets)
   */
  setupOrientationHandler(): void {
    if (!this.isAndroidPWA()) return;

    // Use ScreenOrientation API if available
    if ("orientation" in screen && "lock" in screen.orientation) {
      console.log(`[Android] Current orientation: ${screen.orientation.type}`);

      screen.orientation.addEventListener("change", () => {
        console.log(`[Android] Orientation changed to: ${screen.orientation.type}`);

        // Trigger resize event to help components adapt
        window.dispatchEvent(new Event("resize"));
      });
    }
  }

  /**
   * Android: Handle display mode changes (fullscreen <-> standalone)
   */
  setupDisplayModeHandler(): void {
    if (!this.isAndroidPWA()) return;

    // Monitor display mode changes
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    fullscreenQuery.addEventListener("change", (e) => {
      if (e.matches) {
        console.log("[Android] Entered fullscreen mode");
        document.body.classList.add("pwa-fullscreen");
      } else {
        console.log("[Android] Exited fullscreen mode");
        document.body.classList.remove("pwa-fullscreen");
      }
    });

    standaloneQuery.addEventListener("change", (e) => {
      if (e.matches) {
        console.log("[Android] Running in standalone mode");
        document.body.classList.add("pwa-standalone");
      }
    });

    // Set initial state
    if (fullscreenQuery.matches) {
      document.body.classList.add("pwa-fullscreen");
    }
    if (standaloneQuery.matches) {
      document.body.classList.add("pwa-standalone");
    }
  }

  /**
   * Android: Handle back button in PWA mode
   */
  setupBackButtonHandler(): void {
    if (!this.isAndroidPWA()) return;

    // Detect back button press (when browser history is at start)
    let lastPopState = Date.now();

    window.addEventListener("popstate", () => {
      const now = Date.now();

      // If back button pressed twice within 2 seconds, ask to exit
      if (now - lastPopState < 2000) {
        console.log("[Android] Double back press detected");

        // Show "Press back again to exit" message
        const event = new CustomEvent("android-back-double-press");
        window.dispatchEvent(event);
      }

      lastPopState = now;
    });
  }

  /**
   * Android: Prevent pull-to-refresh in PWA mode
   */
  setupPullToRefreshPrevention(): void {
    if (!this.isAndroidPWA()) return;

    // Already handled in CSS, but add JS backup
    let lastTouchY = 0;
    let isAtTop = false;

    document.addEventListener(
      "touchstart",
      (e) => {
        lastTouchY = e.touches[0].clientY;
        isAtTop = window.scrollY === 0;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - lastTouchY;

        // If scrolling down at top of page, prevent default
        if (isAtTop && deltaY > 0) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  /**
   * Android: Monitor network status
   */
  setupNetworkMonitoring(): void {
    if (!this.isAndroid()) return;

    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        console.log("[Android] Network: Online");
        document.body.classList.remove("pwa-offline");
        document.body.classList.add("pwa-online");
      } else {
        console.log("[Android] Network: Offline");
        document.body.classList.remove("pwa-online");
        document.body.classList.add("pwa-offline");
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Set initial state
    updateOnlineStatus();
  }

  /**
   * Android: Check if running in WebAPK (native-like install)
   */
  isWebAPK(): boolean {
    if (!this.isAndroid()) return false;

    return document.referrer.includes("android-app://");
  }

  /**
   * Android: Initialize all Android-specific handlers
   */
  initialize(): void {
    if (!this.isAndroid()) {
      console.log("[Android] Not running on Android, skipping Android handlers");
      return;
    }

    console.log("[Android] Initializing Android PWA handlers...");
    console.log(`[Android] Version: ${this.getAndroidVersion()}`);
    console.log(`[Android] PWA Mode: ${this.isAndroidPWA()}`);
    console.log(`[Android] Chrome: ${this.isAndroidChrome()}`);
    console.log(`[Android] WebAPK: ${this.isWebAPK()}`);
    console.log(`[Android] PWA Features:`, this.supportsPWAFeatures());

    // Set up event handlers
    this.setupInstallPromptHandler();
    this.setupAppInstalledHandler(() => {
      console.log("[Android] App installation complete!");
    });
    this.setupOrientationHandler();
    this.setupDisplayModeHandler();
    this.setupBackButtonHandler();
    this.setupPullToRefreshPrevention();
    this.setupNetworkMonitoring();

    console.log("[Android] Android PWA handlers initialized");
  }
}

// Export singleton instance
export const androidHandler = AndroidPWAHandler.getInstance();
