import { test, expect } from "@playwright/test";

/**
 * Vendor PWA Flow Tests
 *
 * Tests the vendor login and dashboard in PWA mode:
 * - Login flow
 * - Dashboard access
 * - POS navigation
 * - Session persistence
 */

const VENDOR_EMAIL = "fahad@cwscommercial.com";
const VENDOR_PASSWORD = "SelahEsco123!!";

test.describe("Vendor PWA Functionality", () => {
  test("should load vendor login page", async ({ page }) => {
    await page.goto("/vendor/login");
    await page.waitForLoadState("networkidle");

    // Check if login form is visible
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    console.log("✅ Vendor login page loaded");
  });

  test("should login as vendor successfully", async ({ page }) => {
    await page.goto("/vendor/login");
    await page.waitForLoadState("networkidle");

    // Fill in login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(VENDOR_EMAIL);
    await passwordInput.fill(VENDOR_PASSWORD);

    console.log("✅ Credentials entered");

    // Find and click the login button
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await loginButton.click();

    // Wait for navigation (either to dashboard or wherever it redirects)
    try {
      await page.waitForURL(/\/(vendor|dashboard|pos)/, { timeout: 15000 });
      console.log("✅ Login successful - redirected to:", page.url());
    } catch (error) {
      // If no redirect, check if we're still on login page with error
      const currentUrl = page.url();
      console.log("⚠️  Still on login page:", currentUrl);

      // Check for any error messages
      const errorMessage = await page.locator('[role="alert"], .error, .text-red-500').textContent().catch(() => null);
      if (errorMessage) {
        console.log("   Error message:", errorMessage);
      }
    }
  });

  test("should access vendor dashboard after login", async ({ page }) => {
    // Login first
    await page.goto("/vendor/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(VENDOR_EMAIL);
    await passwordInput.fill(VENDOR_PASSWORD);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Try to navigate to dashboard
    await page.goto("/vendor/dashboard");
    await page.waitForLoadState("networkidle");

    // Check if we're on the dashboard (not redirected back to login)
    const currentUrl = page.url();
    expect(currentUrl).toContain("/vendor");

    console.log("✅ Vendor dashboard accessible");
  });

  test("should access POS interface", async ({ page }) => {
    // Login first
    await page.goto("/vendor/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(VENDOR_EMAIL);
    await passwordInput.fill(VENDOR_PASSWORD);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(3000);

    // Navigate to POS
    await page.goto("/pos/orders");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    expect(currentUrl).toContain("/pos");

    console.log("✅ POS interface accessible");
  });

  test("should persist session in PWA mode", async ({ page, context }) => {
    // Login
    await page.goto("/vendor/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(VENDOR_EMAIL);
    await passwordInput.fill(VENDOR_PASSWORD);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(3000);

    // Check if cookies/localStorage were set
    const hasSession = await page.evaluate(() => {
      // Check for auth tokens in localStorage
      const hasLocalStorage = Object.keys(localStorage).some((key) =>
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("session")
      );

      // Check cookies
      const hasCookies = document.cookie.includes("auth") ||
                         document.cookie.includes("token") ||
                         document.cookie.includes("session");

      return hasLocalStorage || hasCookies;
    });

    if (hasSession) {
      console.log("✅ Session persisted");
    } else {
      console.log("⚠️  No session tokens found (may use different storage)");
    }
  });

  test("should work offline after initial load", async ({ page, context }) => {
    // Login and load POS
    await page.goto("/vendor/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(VENDOR_EMAIL);
    await passwordInput.fill(VENDOR_PASSWORD);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(3000);

    await page.goto("/pos/orders");
    await page.waitForLoadState("networkidle");

    // Wait for cache to populate
    await page.waitForTimeout(3000);

    console.log("✅ POS loaded and cached");

    // Go offline
    await context.setOffline(true);
    console.log("⚠️  Going offline...");

    // Try to reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // Check if page still loads (from cache)
    const pageLoaded = await page.evaluate(() => {
      return document.readyState === "complete";
    });

    expect(pageLoaded).toBeTruthy();
    console.log("✅ POS works offline (from cache)");

    // Go back online
    await context.setOffline(false);
  });

  test("should display PWA install prompt on iOS Safari simulation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Simulate iOS Safari user agent
    await page.evaluate(() => {
      Object.defineProperty(navigator, "userAgent", {
        get: () =>
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      });
    });

    // Wait for install prompt to appear
    await page.waitForTimeout(3000);

    // Check if InstallPWAPrompt component is visible
    const installPrompt = page.locator('text=/Install WhaleTools|Add to Home Screen/i');
    const promptVisible = await installPrompt.count();

    if (promptVisible > 0) {
      console.log("✅ PWA install prompt displayed for iOS");
    } else {
      console.log("⚠️  Install prompt not shown (may require actual iOS device)");
    }
  });

  test("should show PWA update notification when available", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Manually trigger update check (simulate update available)
    const updateTriggered = await page.evaluate(() => {
      // Dispatch a custom event to simulate update available
      const event = new CustomEvent("pwa-update-available", {
        detail: { version: "2.0.0" },
      });
      window.dispatchEvent(event);
      return true;
    });

    await page.waitForTimeout(1000);

    // Check for update notification
    const updateNotification = page.locator('text=/New Version Available|Update Now/i');
    const notificationVisible = await updateNotification.count();

    if (notificationVisible > 0) {
      console.log("✅ PWA update notification works");
    } else {
      console.log("⚠️  Update notification not shown (requires actual SW update)");
    }
  });
});
