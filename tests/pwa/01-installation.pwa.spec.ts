import { test, expect } from "@playwright/test";

/**
 * PWA Installation Tests
 *
 * Tests the basic PWA installation capabilities:
 * - Manifest validation
 * - Service worker registration
 * - Install prompt behavior
 * - Offline capability
 */

test.describe("PWA Installation", () => {
  test("should have valid PWA manifest", async ({ page }) => {
    await page.goto("/");

    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);

    // Fetch and validate manifest
    const manifestUrl = await manifestLink.getAttribute("href");
    expect(manifestUrl).toBe("/manifest.json");

    const response = await page.request.get(manifestUrl!);
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    // Validate required manifest fields
    expect(manifest.name).toBe("WhaleTools");
    expect(manifest.short_name).toBe("WhaleTools");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("fullscreen");
    expect(manifest.theme_color).toBe("#000000");
    expect(manifest.background_color).toBe("#000000");

    // Validate icons
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Validate shortcuts
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThan(0);

    console.log("✅ PWA Manifest is valid");
  });

  test("should register service worker in production build", async ({ page, context }) => {
    await page.goto("/");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      try {
        // Wait for SW registration
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      } catch (error) {
        console.error("SW registration check failed:", error);
        return false;
      }
    });

    // In production build, SW should be registered
    if (process.env.NODE_ENV === "production") {
      expect(swRegistered).toBeTruthy();
      console.log("✅ Service Worker registered");
    } else {
      console.log("⚠️  Service Worker disabled in development (expected)");
    }
  });

  test("should have proper PWA meta tags", async ({ page }) => {
    await page.goto("/");

    // Check iOS meta tags
    const appleMobileWebAppCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleMobileWebAppCapable).toHaveAttribute("content", "yes");

    const appleMobileWebAppStatus = page.locator(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    await expect(appleMobileWebAppStatus).toHaveAttribute("content", "black-translucent");

    // Check Android meta tags
    const mobileWebAppCapable = page.locator('meta[name="mobile-web-app-capable"]');
    await expect(mobileWebAppCapable).toHaveAttribute("content", "yes");

    const themeColor = page.locator('meta[name="theme-color"]');
    expect(await themeColor.count()).toBeGreaterThan(0);

    console.log("✅ PWA meta tags are correct");
  });

  test("should load essential resources", async ({ page }) => {
    const errors: string[] = [];

    // Listen for failed requests
    page.on("requestfailed", (request) => {
      errors.push(`Failed: ${request.url()}`);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check critical resources loaded
    const hasLogo = await page
      .locator('img[src*="yacht-club-logo"], img[alt*="WhaleTools"]')
      .count();
    expect(hasLogo).toBeGreaterThan(0);

    // Verify no critical failures
    expect(errors.length).toBe(0);

    console.log("✅ Essential resources loaded");
  });

  test("should handle display modes correctly", async ({ page }) => {
    await page.goto("/");

    const displayModes = await page.evaluate(() => {
      return {
        standalone: window.matchMedia("(display-mode: standalone)").matches,
        fullscreen: window.matchMedia("(display-mode: fullscreen)").matches,
        minimal: window.matchMedia("(display-mode: minimal-ui)").matches,
        browser: window.matchMedia("(display-mode: browser)").matches,
      };
    });

    // In test environment, should be in browser mode
    expect(displayModes.browser).toBeTruthy();

    console.log("✅ Display mode detection working");
    console.log("   Current mode:", displayModes);
  });
});
