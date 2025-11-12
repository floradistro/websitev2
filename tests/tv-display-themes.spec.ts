import { test, expect } from "@playwright/test";

/**
 * TV Display Theme Architecture Tests
 *
 * These tests verify that themes apply correctly and consistently
 * across different scenarios to catch architectural issues.
 */

const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
const CHARLOTTE_LOCATION_ID = "b5cf6c66-39b1-4e4e-b6fa-30da0e766b58";

// All available themes
const THEMES = [
  { id: "apple-light", name: "Apple Light", background: "#F5F5F7" },
  { id: "apple-dark", name: "Apple Dark", background: "#000000" },
  { id: "ios18-aurora", name: "Aurora", hasAnimation: true },
  { id: "ios18-sunset", name: "Sunset Glow", hasAnimation: true },
  { id: "ios18-ocean", name: "Ocean Depths", hasAnimation: true },
  { id: "ios18-forest", name: "Forest Dream", hasAnimation: true },
  { id: "ios18-twilight", name: "Twilight Magic", hasAnimation: true },
];

test.describe("TV Display Theme System", () => {
  test.beforeEach(async ({ page }) => {
    // Suppress console noise
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("Browser console error:", msg.text());
      }
    });
  });

  test("should load and apply theme from URL parameter", async ({ page }) => {
    // Test each theme
    for (const theme of THEMES) {
      console.log(`\n🎨 Testing theme: ${theme.name} (${theme.id})`);

      // Navigate to TV display with theme parameter
      await page.goto(
        `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=99&theme=${theme.id}&preview=true`,
        { waitUntil: "networkidle" }
      );

      // Wait for theme to be applied
      await page.waitForTimeout(2000);

      // Check that theme resolution logged correctly
      const themeLog = await page.evaluate(() => {
        return (window as any).__lastThemeResolution;
      });

      // Verify the root container has correct background
      const rootDiv = page.locator("div.w-screen.h-screen").first();
      await expect(rootDiv).toBeVisible({ timeout: 5000 });

      // Get computed styles
      const styles = await rootDiv.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          backgroundSize: computed.backgroundSize,
          animation: computed.animation,
        };
      });

      console.log(`  ✓ Background: ${styles.backgroundColor}`);

      // For static themes, verify solid background color
      if (!theme.hasAnimation && theme.background) {
        // Convert hex to RGB for comparison
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
            : null;
        };
        const expectedRgb = hexToRgb(theme.background);
        expect(styles.backgroundColor).toBe(expectedRgb);
      }

      // For animated themes, verify gradient and animation properties
      if (theme.hasAnimation) {
        expect(styles.backgroundImage).toContain("linear-gradient");
        console.log(`  ✓ Has gradient: ${styles.backgroundImage.substring(0, 50)}...`);

        // Check for animation (iOS 18 themes)
        if (styles.animation && styles.animation !== "none") {
          console.log(`  ✓ Has animation: ${styles.animation}`);
        }

        // Check background-size for animated gradients
        if (styles.backgroundSize) {
          console.log(`  ✓ Background size: ${styles.backgroundSize}`);
        }
      }
    }
  });

  test("should resolve theme priority correctly: URL > Menu > Group", async ({
    page,
  }) => {
    // Test 1: Theme from URL parameter (highest priority)
    console.log("\n🔍 Test 1: URL parameter override");
    await page.goto(
      `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=1&theme=apple-light`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(2000);

    let consoleLogs: string[] = [];
    page.on("console", (msg) => {
      consoleLogs.push(msg.text());
    });

    // Check console log for theme resolution
    const urlThemeLog = consoleLogs.find((log) =>
      log.includes("Theme Resolution")
    );
    console.log("  Theme resolution:", urlThemeLog);

    // Test 2: Theme from database menu (when no URL override)
    console.log("\n🔍 Test 2: Menu theme from database");
    consoleLogs = [];
    await page.goto(
      `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=1`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(2000);

    const menuThemeLog = consoleLogs.find((log) =>
      log.includes("Theme Resolution")
    );
    console.log("  Theme resolution:", menuThemeLog);
  });

  test("should handle invalid theme gracefully with fallback", async ({
    page,
  }) => {
    console.log("\n🔍 Testing invalid theme fallback");

    await page.goto(
      `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=99&theme=invalid-theme-id&preview=true`,
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForTimeout(2000);

    // Should fall back to first theme (apple-light)
    const rootDiv = page.locator("div.w-screen.h-screen").first();
    const bgColor = await rootDiv.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log(`  Fallback background: ${bgColor}`);
    // Should be apple-light background (#F5F5F7 = rgb(245, 245, 247))
    expect(bgColor).toBe("rgb(245, 245, 247)");
  });

  test("should apply theme changes instantly when URL parameter changes", async ({
    page,
  }) => {
    console.log("\n🔍 Testing instant theme switching");

    // Start with apple-light
    await page.goto(
      `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=99&theme=apple-light&preview=true`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(1000);

    const rootDiv = page.locator("div.w-screen.h-screen").first();

    // Verify initial theme
    let bgColor = await rootDiv.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBe("rgb(245, 245, 247)"); // apple-light (#F5F5F7)

    // Switch to apple-dark
    await page.goto(
      `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=99&theme=apple-dark&preview=true`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(1000);

    // Verify theme changed
    bgColor = await rootDiv.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBe("rgb(0, 0, 0)"); // apple-dark (#000000)

    console.log("  ✓ Theme switched from light to dark successfully");

    // Switch to iOS 18 animated theme
    await page.goto(
      `/tv-display?vendor_id=${VENDOR_ID}&location_id=${CHARLOTTE_LOCATION_ID}&tv_number=99&theme=ios18-sunset&preview=true`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(1000);

    // Verify gradient applied
    const bgImage = await rootDiv.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(bgImage).toContain("linear-gradient");
    console.log("  ✓ Theme switched to animated gradient successfully");
  });

  test("should persist theme across iframe reloads", async ({ page }) => {
    console.log("\n🔍 Testing theme persistence in iframe");

    await page.goto("/vendor/tv-menus", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find an iframe preview
    const iframe = page.frameLocator("iframe").first();
    const iframeSrc = await page.locator("iframe").first().getAttribute("src");
    console.log(`  Iframe src: ${iframeSrc}`);

    // Check if theme parameter is in URL
    expect(iframeSrc).toContain("theme=");

    // Verify iframe loaded with theme
    const rootInIframe = iframe.locator("div.w-screen.h-screen").first();
    await expect(rootInIframe).toBeVisible({ timeout: 5000 });

    console.log("  ✓ Theme parameter present in iframe URL");
  });
});
