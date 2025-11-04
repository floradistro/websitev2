import { test, expect } from '@playwright/test';

test.describe('Field Visibility Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Go to vendor login page
    await page.goto('http://localhost:3000/vendor/login');

    // Fill in login form (use id selectors from the page)
    await page.fill('#email', 'fahad@cwscommercial.com');
    await page.fill('#password', 'Flipperspender12!!');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait a bit and check if there's an error message
    await page.waitForTimeout(2000);

    const errorElement = await page.locator('.text-red-500').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      throw new Error(`Login failed: ${errorText}`);
    }

    // Wait for redirect to dashboard (apps or products page)
    await page.waitForURL(/\/vendor\/(apps|products)/, { timeout: 15000 });

    // Navigate to products page if we landed on apps page
    const url = page.url();
    if (url.includes('/vendor/apps')) {
      await page.goto('http://localhost:3000/vendor/products');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should toggle field visibility and verify on storefront', async ({ page, context }) => {
    // Click the CATEGORIES tab button
    await page.getByRole('button', { name: /Categories/i }).click();

    // Wait for categories panel to load
    await page.waitForTimeout(2000);

    // Click on "FIELDS (12)" button for Beverages category to expand the fields
    await page.getByText(/FIELDS \(\d+\)/i).first().click();

    // Wait for fields to expand and render
    await page.waitForTimeout(2000);

    // Screenshot to debug
    await page.screenshot({ path: 'test-results/fields-expanded.png', fullPage: true });

    // Look for eye/eyeoff buttons specifically with title containing field name and "storefront"
    // Example title: "dosage: Visible on storefront" or "flavor: Hidden on storefront"
    const firstToggleButton = page.locator('button[title*=": "][title*=" on storefront"]').first();

    // Check initial state - should be visible
    await expect(firstToggleButton).toBeVisible();

    // Get the field name and current state from the button's title attribute
    const fieldTitle = await firstToggleButton.getAttribute('title');
    console.log('Toggle button title:', fieldTitle);

    // Extract field name and current state from title (format: "fieldname: Visible/Hidden on storefront")
    const fieldName = fieldTitle?.split(':')[0].trim().toLowerCase() || 'field';
    const isCurrentlyVisible = fieldTitle?.includes('Visible on storefront');

    console.log(`Field "${fieldName}" is currently ${isCurrentlyVisible ? 'VISIBLE' : 'HIDDEN'}`);

    // If field is already visible, click to HIDE it. If hidden, click to SHOW it.
    // We want to test HIDING a field
    if (!isCurrentlyVisible) {
      console.log('Field is already hidden, clicking to show it first...');
      await firstToggleButton.click();
      await page.waitForSelector('text=Field Visibility Updated', { timeout: 5000 });
      await page.waitForTimeout(1000);
    }

    // Now click to hide the field
    console.log(`Clicking to HIDE "${fieldName}"...`);
    await firstToggleButton.click();

    // Wait for the API call to complete
    await page.waitForResponse(response =>
      response.url().includes('/api/categories') &&
      response.request().method() === 'PUT'
    );

    // Wait for success notification
    await page.waitForSelector('text=Field Visibility Updated', { timeout: 5000 });

    // Open storefront in new tab
    const storefrontPage = await context.newPage();
    await storefrontPage.goto('http://localhost:3001/shop');

    // Wait for initial load
    await storefrontPage.waitForTimeout(1000);

    // Force reload to ensure we get fresh data (not cached)
    await storefrontPage.reload();
    await storefrontPage.waitForTimeout(2000);

    // Check that the field is NOT visible on product cards (search for the field name)
    const hiddenFields = storefrontPage.locator(`text=/${fieldName}/i`);
    const hiddenCount = await hiddenFields.count();
    console.log(`Found ${hiddenCount} instances of "${fieldName}" on storefront (should be 0)`);
    expect(hiddenCount).toBe(0);

    // Go back to vendor dashboard
    await page.bringToFront();

    // Click the toggle again to show the field
    await firstToggleButton.click();

    // Wait for the API call
    await page.waitForResponse(response =>
      response.url().includes('/api/categories') &&
      response.request().method() === 'PUT'
    );

    // Wait for success notification
    await page.waitForSelector('text=Field Visibility Updated', { timeout: 5000 });

    // Refresh storefront
    await storefrontPage.reload();
    await storefrontPage.waitForTimeout(2000);

    // Check that field IS NOW visible on product cards
    const visibleFields = storefrontPage.locator(`text=/${fieldName}/i`).first();
    await expect(visibleFields).toBeVisible({ timeout: 5000 });
    console.log(`Field "${fieldName}" is now visible on storefront`);

    // Cleanup
    await storefrontPage.close();
  });

  test('should show correct icon state (Eye vs EyeOff)', async ({ page }) => {
    // Go to Categories tab
    await page.click('text=CATEGORIES');

    // Wait for categories to load
    await page.waitForSelector('text=BEVERAGES', { timeout: 10000 });

    // Click on Fields section for Beverages category
    await page.click('text=FIELDS (12)');

    // Wait for fields to be visible
    await page.waitForSelector('text=FLAVOR', { timeout: 5000 });

    // Find the toggle button for flavor field
    const flavorToggle = page.locator('button[title*="flavor"]').first();

    // Get the SVG icon inside the button
    const icon = flavorToggle.locator('svg').first();

    // Check if it's an Eye or EyeOff icon by checking the class
    const iconClass = await icon.getAttribute('class');
    const initialState = iconClass?.includes('lucide-eye');

    // Click the toggle
    await flavorToggle.click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Check that the icon changed
    const newIconClass = await icon.getAttribute('class');
    const newState = newIconClass?.includes('lucide-eye');

    // State should have flipped
    expect(newState).not.toBe(initialState);
  });

  test('should handle multiple field toggles', async ({ page }) => {
    // Go to Categories tab
    await page.click('text=CATEGORIES');

    // Wait for categories to load
    await page.waitForSelector('text=BEVERAGES', { timeout: 10000 });

    // Click on Fields section
    await page.click('text=FIELDS (12)');

    // Wait for fields
    await page.waitForSelector('text=DOSAGE', { timeout: 5000 });

    // Toggle multiple fields
    const dosageToggle = page.locator('button[title*="dosage"]').first();
    const flavorToggle = page.locator('button[title*="flavor"]').first();

    // Hide both fields
    await dosageToggle.click();
    await page.waitForSelector('text=Field Visibility Updated', { timeout: 5000 });

    await flavorToggle.click();
    await page.waitForSelector('text=Field Visibility Updated', { timeout: 5000 });

    // Both should now be hidden (EyeOff icons)
    // We can verify by checking if multiple notifications appeared
    const notifications = page.locator('text=Field Visibility Updated');
    expect(await notifications.count()).toBeGreaterThanOrEqual(2);
  });
});
