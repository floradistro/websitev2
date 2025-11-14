import { test, expect } from "@playwright/test";

test.describe("Apple Wallet Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/vendor/login");
    await page.fill('#email', "darioncdjr@gmail.com");
    await page.fill('#password', "Smallpenis123!!");

    // Click submit and wait for the navigation (window.location.href redirect)
    await page.click('button[type="submit"]');

    // Wait for the redirect to complete
    await page.waitForURL("**/vendor/dashboard", { timeout: 30000 });
    await page.waitForLoadState("networkidle");
  });

  test("should display Apple Wallet tab on loyalty page", async ({ page }) => {
    // Navigate to loyalty page
    await page.goto("http://localhost:3000/vendor/loyalty");
    await page.waitForLoadState("networkidle");

    // Check if Apple Wallet tab exists
    const walletTab = page.locator('text="Apple Wallet"');
    await expect(walletTab).toBeVisible();

    // Click the tab
    await walletTab.click();
    await page.waitForTimeout(500);

    // Verify tab content is visible
    const tabContent = page.locator('text="QR Code Testing"');
    await expect(tabContent).toBeVisible();
  });

  test("should load customers and display QR code", async ({ page }) => {
    await page.goto("http://localhost:3000/vendor/loyalty");
    await page.waitForLoadState("networkidle");

    // Click Apple Wallet tab
    await page.click('text="Apple Wallet"');
    await page.waitForTimeout(1000);

    // Wait for customers to load
    const customerSelect = page.locator('select').first();
    await expect(customerSelect).toBeVisible();

    // Check if customers are loaded
    const optionCount = await customerSelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(1); // Should have "Select customer" + actual customers

    // Select first customer
    await customerSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Verify QR code appears
    const qrCode = page.locator("svg").filter({ hasText: /^$/ }).first(); // QR code SVG
    await expect(qrCode).toBeVisible();

    // Verify pass preview appears
    const passPreview = page.locator('text="LOYALTY CARD"');
    await expect(passPreview).toBeVisible();
  });

  test("should search and filter customers", async ({ page }) => {
    await page.goto("http://localhost:3000/vendor/loyalty");
    await page.waitForLoadState("networkidle");

    // Click Apple Wallet tab
    await page.click('text="Apple Wallet"');
    await page.waitForTimeout(1000);

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("test");
    await page.waitForTimeout(500);

    // Verify customer dropdown updates
    const customerSelect = page.locator('select').first();
    const optionCount = await customerSelect.locator("option").count();
    console.log(`Filtered customers: ${optionCount - 1}`); // Minus "Select customer" option
  });

  test("should generate valid wallet pass URL", async ({ page }) => {
    await page.goto("http://localhost:3000/vendor/loyalty");
    await page.waitForLoadState("networkidle");

    // Click Apple Wallet tab
    await page.click('text="Apple Wallet"');
    await page.waitForTimeout(1000);

    // Select first customer
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Get the selected customer ID from the dropdown
    const selectedValue = await customerSelect.inputValue();
    console.log("Selected customer ID:", selectedValue);

    // Verify QR code contains correct URL structure
    // We can't directly read QR code, but we can check if the QR code SVG exists
    const qrCodeSvg = page.locator('svg[width="200"][height="200"]');
    await expect(qrCodeSvg).toBeVisible();

    // Test the actual API endpoint
    const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf"; // Flora Distro
    const apiUrl = `http://localhost:3000/api/customer/wallet-pass?customer_id=${selectedValue}&vendor_id=${vendorId}`;

    console.log("Testing API endpoint:", apiUrl);

    // Make direct API request
    const response = await page.request.get(apiUrl);
    console.log("API Response status:", response.status());
    console.log("API Response headers:", response.headers());

    if (response.status() !== 200) {
      const body = await response.text();
      console.log("Error response body:", body);

      // If there's an error, let's see what it is
      try {
        const jsonBody = JSON.parse(body);
        console.log("Error details:", jsonBody);
      } catch (e) {
        console.log("Could not parse error as JSON");
      }
    }

    // Check response
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/vnd.apple.pkpass");
  });

  test("should display pass preview with customer data", async ({ page }) => {
    await page.goto("http://localhost:3000/vendor/loyalty");
    await page.waitForLoadState("networkidle");

    // Click Apple Wallet tab
    await page.click('text="Apple Wallet"');
    await page.waitForTimeout(1000);

    // Select first customer
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Get customer name from the dropdown
    const selectedOption = await customerSelect.locator('option:checked').textContent();
    console.log("Selected customer:", selectedOption);

    // Verify pass preview shows customer tier
    const tierElement = page.locator('text=/Bronze|Silver|Gold|Platinum/');
    await expect(tierElement).toBeVisible();

    // Verify pass preview shows points (if available)
    const pointsElement = page.locator('text="Points"').first();
    await expect(pointsElement).toBeVisible();
  });

  test("should have working download button", async ({ page }) => {
    await page.goto("http://localhost:3000/vendor/loyalty");
    await page.waitForLoadState("networkidle");

    // Click Apple Wallet tab
    await page.click('text="Apple Wallet"');
    await page.waitForTimeout(1000);

    // Select first customer
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Find download button
    const downloadButton = page.locator('button:has-text("Generate Pass")');
    await expect(downloadButton).toBeVisible();

    // Click download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      downloadButton.click(),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toContain(".pkpass");
    console.log("Downloaded file:", download.suggestedFilename());
  });
});
