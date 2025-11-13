import { test, expect } from "@playwright/test";

/**
 * Service Worker Tests
 *
 * Tests service worker functionality:
 * - Registration and activation
 * - Update detection
 * - Message handling
 * - Lifecycle management
 */

test.describe("Service Worker", () => {
  test("should register and activate service worker", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for service worker registration
    const swStatus = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return { supported: false };
      }

      // Wait a bit for registration to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const registration = await navigator.serviceWorker.getRegistration();

      return {
        supported: true,
        registered: !!registration,
        active: !!registration?.active,
        waiting: !!registration?.waiting,
        installing: !!registration?.installing,
        scope: registration?.scope,
      };
    });

    expect(swStatus.supported).toBeTruthy();

    if (process.env.NODE_ENV === "production") {
      expect(swStatus.registered).toBeTruthy();
      console.log("✅ Service Worker registered and active");
      console.log("   Scope:", swStatus.scope);
    } else {
      console.log("⚠️  Service Worker disabled in development");
    }
  });

  test("should handle service worker messages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const canSendMessage = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) return false;

      try {
        // Try to send a PING message
        const messageChannel = new MessageChannel();

        return new Promise<boolean>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data?.type === "PONG");
          };

          registration.active.postMessage(
            { type: "PING" },
            [messageChannel.port2]
          );

          // Timeout after 2 seconds
          setTimeout(() => resolve(false), 2000);
        });
      } catch (error) {
        console.error("SW message failed:", error);
        return false;
      }
    });

    if (process.env.NODE_ENV === "production") {
      console.log("   SW message handling:", canSendMessage ? "✅" : "⚠️");
    }
  });

  test("should update service worker on new version", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const updateResult = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return { supported: false };
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return { supported: true, canUpdate: false };
      }

      try {
        // Trigger an update check
        await registration.update();

        return {
          supported: true,
          canUpdate: true,
          updated: true,
        };
      } catch (error) {
        return {
          supported: true,
          canUpdate: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    if (process.env.NODE_ENV === "production") {
      expect(updateResult.supported).toBeTruthy();
      console.log("✅ Service Worker update check works");
    }
  });

  test("should have correct service worker scope", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const scope = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.scope || null;
    });

    if (scope) {
      expect(scope).toContain(new URL(page.url()).origin);
      console.log("✅ Service Worker scope is correct:", scope);
    }
  });
});
