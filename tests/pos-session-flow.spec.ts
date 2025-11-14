import { test, expect, Page } from "@playwright/test";

/**
 * POS Session Flow E2E Test
 * 
 * Tests the complete Steve Jobs-level elegant session management:
 * 1. Login as vendor
 * 2. Navigate to POS
 * 3. Select location
 * 4. Select register
 * 5. Start new session (with opening cash drawer)
 * 6. Verify session indicator in breadcrumb
 * 7. Navigate to Orders page (session persists)
 * 8. Navigate to Receiving page (session persists)
 * 9. Navigate back to Register (session persists)
 * 10. End session elegantly
 * 11. Verify redirected to register selector
 */

const VENDOR_EMAIL = "darioncdjr@gmail.com";
const VENDOR_PASSWORD = "Smallpenis123!!";

test.describe("POS Session Flow", () => {
  test.setTimeout(120000); // 2 minutes for full flow

  test("should complete full session lifecycle with navigation", async ({ page }) => {
    // Step 1: Login
    await test.step("Login as vendor", async () => {
      await page.goto("http://localhost:3000/vendor/login");
      await page.fill('input[type="email"]', VENDOR_EMAIL);
      await page.fill('input[type="password"]', VENDOR_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL("**/vendor/dashboard", { timeout: 10000 });
      await expect(page).toHaveURL(/\/vendor\/dashboard/);
    });

    // Step 2: Navigate to POS
    await test.step("Navigate to POS", async () => {
      // Click POS icon in sidebar or navigate directly
      await page.goto("http://localhost:3000/vendor/pos/register");
      await page.waitForLoadState("networkidle");
    });

    // Step 3: Select location (if prompted)
    await test.step("Select location", async () => {
      // Check if location selector is visible
      const locationSelector = page.locator('text="Select Location"');
      const isVisible = await locationSelector.isVisible().catch(() => false);

      if (isVisible) {
        // Click first available location
        await page.locator('button:has-text("Select Location")').first().click();
        await page.waitForLoadState("networkidle");
      }
    });

    // Step 4: Select register
    let sessionNumber: string = "";
    await test.step("Select register and start session", async () => {
      // Wait for register selector
      await expect(page.locator('text="Select Register"')).toBeVisible({ timeout: 10000 });
      
      // Click first available register
      const registerCards = page.locator('button:has-text("Register")');
      await registerCards.first().click();

      // Opening cash drawer modal should appear
      await expect(page.locator('text="Opening Cash Count"')).toBeVisible({ timeout: 5000 });

      // Enter opening cash amount
      await page.fill('input[type="number"]', '100');
      
      // Submit
      await page.click('button:has-text("Start Session")');

      // Wait for session to start (breadcrumb should show session info)
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000); // Allow session to initialize
    });

    // Step 5: Verify session indicator in breadcrumb
    await test.step("Verify session indicator", async () => {
      // Check for session indicator with green dot
      const sessionIndicator = page.locator('[class*="bg-green-400"][class*="rounded-full"]');
      await expect(sessionIndicator).toBeVisible({ timeout: 10000 });

      // Check for session number
      const sessionInfo = page.locator('text=/SESSION-\\d+/');
      await expect(sessionInfo).toBeVisible();
      
      // Store session number for later verification
      sessionNumber = await sessionInfo.textContent() || "";
      console.log(`✅ Session started: ${sessionNumber}`);

      // Check for End Session button
      await expect(page.locator('button:has-text("End Session")')).toBeVisible();

      // Verify session stats are visible (sales, time, register name)
      await expect(page.locator('text=/\\$\\d+\\.\\d{2}/')).toBeVisible(); // Sales amount
    });

    // Step 6: Navigate to Orders page
    await test.step("Navigate to Orders page", async () => {
      await page.goto("http://localhost:3000/vendor/pos/orders");
      await page.waitForLoadState("networkidle");

      // Verify session persists
      await expect(page.locator('button:has-text("End Session")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text="${sessionNumber}"`)).toBeVisible();

      console.log("✅ Session persisted on Orders page");
    });

    // Step 7: Navigate to Receiving page
    await test.step("Navigate to Receiving page", async () => {
      await page.goto("http://localhost:3000/vendor/pos/receiving");
      await page.waitForLoadState("networkidle");

      // Verify session persists
      await expect(page.locator('button:has-text("End Session")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text="${sessionNumber}"`)).toBeVisible();

      console.log("✅ Session persisted on Receiving page");
    });

    // Step 8: Navigate back to Register
    await test.step("Navigate back to Register", async () => {
      await page.goto("http://localhost:3000/vendor/pos/register");
      await page.waitForLoadState("networkidle");

      // Verify session persists
      await expect(page.locator('button:has-text("End Session")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text="${sessionNumber}"`)).toBeVisible();

      console.log("✅ Session persisted back on Register page");
    });

    // Step 9: End session elegantly
    await test.step("End session", async () => {
      // Click End Session button
      await page.click('button:has-text("End Session")');

      // Confirmation dialog should appear
      await expect(page.locator('text="Are you sure you want to end session"')).toBeVisible({ timeout: 3000 });

      // Confirm
      await page.click('button:has-text("End Session")');

      // Wait for session to end
      await page.waitForTimeout(2000);
      await page.waitForLoadState("networkidle");
    });

    // Step 10: Verify redirected to register selector
    await test.step("Verify session ended", async () => {
      // Should be back at register selector
      await expect(page.locator('text="Select Register"')).toBeVisible({ timeout: 10000 });

      // Session indicator should be gone
      const sessionIndicator = page.locator('button:has-text("End Session")');
      await expect(sessionIndicator).not.toBeVisible();

      console.log("✅ Session ended successfully - back at register selector");
    });
  });

  test("should handle existing session join flow", async ({ page }) => {
    // Step 1: Login
    await test.step("Login as vendor", async () => {
      await page.goto("http://localhost:3000/vendor/login");
      await page.fill('input[type="email"]', VENDOR_EMAIL);
      await page.fill('input[type="password"]', VENDOR_PASSWORD);
      await page.click('button[type="submit"]');
      
      await page.waitForURL("**/vendor/dashboard", { timeout: 10000 });
    });

    // Step 2: Start first session
    let sessionNumber = "";
    await test.step("Start initial session", async () => {
      await page.goto("http://localhost:3000/vendor/pos/register");
      await page.waitForLoadState("networkidle");

      // Select location if needed
      const locationSelector = page.locator('text="Select Location"');
      if (await locationSelector.isVisible().catch(() => false)) {
        await page.locator('button:has-text("Select Location")').first().click();
      }

      // Select register
      await page.locator('button:has-text("Register")').first().click();

      // Enter opening cash
      await page.fill('input[type="number"]', '100');
      await page.click('button:has-text("Start Session")');

      await page.waitForTimeout(2000);

      // Get session number
      const sessionInfo = page.locator('text=/SESSION-\\d+/');
      sessionNumber = await sessionInfo.textContent() || "";
    });

    // Step 3: Simulate another user accessing same register
    await test.step("Simulate second user accessing register", async () => {
      // Clear session from localStorage to simulate new user
      await page.evaluate(() => {
        localStorage.removeItem("pos_active_session");
      });

      // Refresh page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should show existing session modal
      await expect(page.locator('text="Session Active"')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text="${sessionNumber}"`)).toBeVisible();

      // Should show options to Join or End & Start New
      await expect(page.locator('button:has-text("Join Session")')).toBeVisible();
      await expect(page.locator('button:has-text("End & Start New")')).toBeVisible();

      console.log("✅ Existing session modal shown correctly");
    });

    // Step 4: Join existing session
    await test.step("Join existing session", async () => {
      await page.click('button:has-text("Join Session")');

      await page.waitForTimeout(1000);

      // Should be back in POS with same session
      await expect(page.locator(`text="${sessionNumber}"`)).toBeVisible({ timeout: 5000 });

      console.log("✅ Successfully joined existing session");
    });

    // Cleanup: End session
    await test.step("Cleanup - end session", async () => {
      await page.click('button:has-text("End Session")');
      await page.click('button:has-text("End Session")'); // Confirm
      await page.waitForTimeout(1000);
    });
  });

  test("should show session info across all POS pages", async ({ page }) => {
    // Login and start session
    await test.step("Setup - login and start session", async () => {
      await page.goto("http://localhost:3000/vendor/login");
      await page.fill('input[type="email"]', VENDOR_EMAIL);
      await page.fill('input[type="password"]', VENDOR_PASSWORD);
      await page.click('button[type="submit"]');
      
      await page.waitForURL("**/vendor/dashboard");

      await page.goto("http://localhost:3000/vendor/pos/register");
      await page.waitForLoadState("networkidle");

      // Select location if needed
      const locationSelector = page.locator('text="Select Location"');
      if (await locationSelector.isVisible().catch(() => false)) {
        await page.locator('button:has-text("Select Location")').first().click();
      }

      // Select register and start session
      await page.locator('button:has-text("Register")').first().click();
      await page.fill('input[type="number"]', '100');
      await page.click('button:has-text("Start Session")');
      await page.waitForTimeout(2000);
    });

    // Verify breadcrumb on Register page
    await test.step("Verify breadcrumb on Register page", async () => {
      await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text="POS"')).toBeVisible();
      await expect(page.locator('text="Register"')).toBeVisible();
      await expect(page.locator('button:has-text("End Session")')).toBeVisible();
    });

    // Verify breadcrumb on Orders page
    await test.step("Verify breadcrumb on Orders page", async () => {
      await page.goto("http://localhost:3000/vendor/pos/orders");
      await page.waitForLoadState("networkidle");

      await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text="POS"')).toBeVisible();
      await expect(page.locator('text="Orders"')).toBeVisible();
      await expect(page.locator('button:has-text("End Session")')).toBeVisible();
    });

    // Verify breadcrumb on Receiving page
    await test.step("Verify breadcrumb on Receiving page", async () => {
      await page.goto("http://localhost:3000/vendor/pos/receiving");
      await page.waitForLoadState("networkidle");

      await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text="POS"')).toBeVisible();
      await expect(page.locator('text="Receiving"')).toBeVisible();
      await expect(page.locator('button:has-text("End Session")')).toBeVisible();
    });

    // Cleanup
    await test.step("Cleanup - end session", async () => {
      await page.click('button:has-text("End Session")');
      await page.click('button:has-text("End Session")'); // Confirm
      await page.waitForTimeout(1000);
    });
  });
});
