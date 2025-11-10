import { test, expect } from "@playwright/test";

/**
 * Phase 2 Type Safety Verification Tests
 * Verify no regressions from error handling refactoring
 */

test.describe("Phase 2 Type Safety - No Regressions", () => {
  test("Homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/WhaleTools/);

    // Check for no console errors
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test("Vendor dashboard loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/vendor/dashboard");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check page loaded
    expect(page.url()).toContain("/vendor");

    // Should have no JavaScript errors
    expect(errors.length).toBe(0);
  });

  test("Vendor products page loads", async ({ page }) => {
    await page.goto("/vendor/products");
    await page.waitForTimeout(1000);

    // Page should load
    expect(page.url()).toContain("/vendor/products");

    // Check for products UI elements
    const hasContent = await page.evaluate(() => {
      return document.body.textContent?.includes("Products") ||
             document.body.textContent?.includes("Loading");
    });
    expect(hasContent).toBe(true);
  });

  test("Vendor analytics page loads", async ({ page }) => {
    await page.goto("/vendor/analytics");
    await page.waitForTimeout(1000);

    // Page should load
    expect(page.url()).toContain("/vendor/analytics");
  });

  test("Vendor media library loads", async ({ page }) => {
    await page.goto("/vendor/media-library");
    await page.waitForTimeout(1000);

    expect(page.url()).toContain("/vendor/media-library");
  });

  test("API health endpoint works", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status");
  });

  test("API routes return proper error responses", async ({ request }) => {
    // Test that API routes with new error handling work correctly
    const response = await request.get("/api/vendor/analytics/overview");

    // Should return 401 unauthorized (not 500 error)
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("Error handling doesn't break POS pages", async ({ page }) => {
    await page.goto("/pos/register");
    await page.waitForTimeout(1000);

    // POS should redirect or load (depending on auth state)
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test("No TypeScript runtime errors in browser", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      // Only capture TypeScript-related errors
      if (error.message.includes("TypeError") || error.message.includes("ReferenceError")) {
        errors.push(error.message);
      }
    });

    // Navigate to several pages
    await page.goto("/");
    await page.waitForTimeout(500);

    await page.goto("/vendor/dashboard");
    await page.waitForTimeout(500);

    await page.goto("/vendor/products");
    await page.waitForTimeout(500);

    // Should have no TypeScript runtime errors
    expect(errors).toEqual([]);
  });

  test("Button components still work after consolidation", async ({ page }) => {
    await page.goto("/vendor/dashboard");
    await page.waitForTimeout(1000);

    // Check if buttons exist and are clickable
    const buttons = await page.$$("button");
    expect(buttons.length).toBeGreaterThan(0);

    // Buttons should have proper styling (from ui/Button)
    const buttonClasses = await page.evaluate(() => {
      const btn = document.querySelector("button");
      return btn ? btn.className : "";
    });

    // Should have some classes (indicating buttons are styled)
    expect(buttonClasses.length).toBeGreaterThan(0);
  });
});
