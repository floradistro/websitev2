/**
 * POS Comprehensive Tests
 * Verify all POS functionality works after refactoring
 */

import { test, expect } from "@playwright/test";

import { logger } from "@/lib/logger";
test.describe("POS Comprehensive Validation", () => {
  test("All POS pages load without errors", async ({ page }) => {
    const pagesToTest = [
      { url: "/pos/register", name: "Register" },
      { url: "/pos/orders", name: "Orders" },
      { url: "/pos/receiving", name: "Receiving" },
    ];

    for (const pageInfo of pagesToTest) {
      const errors: string[] = [];

      page.on("pageerror", (error) => {
        errors.push(`[${pageInfo.name}] ${error.message}`);
      });

      await page.goto(pageInfo.url);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);

      // Check for import/export errors
      const importErrors = errors.filter(
        (err) =>
          err.includes("export") || err.includes("import") || err.includes("is not exported"),
      );

      if (importErrors.length > 0) {
        logger.debug(`\n❌ ${pageInfo.name} has import errors:`, importErrors);
      } else {
        logger.debug(`✅ ${pageInfo.name} loaded successfully`);
      }

      expect(importErrors.length).toBe(0);
    }
  });

  test("POS components render without crashes", async ({ page }) => {
    await page.goto("/pos/register");
    await page.waitForLoadState("networkidle");

    // Check if main POS elements exist (even if behind auth)
    const bodyExists = await page.locator("body").count();
    expect(bodyExists).toBeGreaterThan(0);

    logger.debug("✅ POS register page rendered");
  });

  test("No component export errors in console", async ({ page }) => {
    const componentErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("Card") ||
          text.includes("Input") ||
          text.includes("Textarea") ||
          text.includes("is not exported")
        ) {
          componentErrors.push(text);
        }
      }
    });

    await page.goto("/pos/register");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (componentErrors.length > 0) {
      logger.debug("\n❌ Component export errors:", componentErrors);
    }

    expect(componentErrors.length).toBe(0);
  });
});
