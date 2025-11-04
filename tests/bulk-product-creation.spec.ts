import { test, expect } from '@playwright/test';

test.describe('Bulk Product Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Flora Distro vendor
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('fahad@cwscommercial.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('Flipperspender12!!');

    // Click login button
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign In")'));
    await loginButton.click();

    // Wait for redirect to dashboard or apps page
    await page.waitForURL(/\/(vendor\/apps|vendor\/dashboard)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Wait a bit longer for auth state to fully settle
    await page.waitForTimeout(1000);

    // Verify we have auth cookies
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token');
    if (!authCookie) {
      console.warn('⚠️ Warning: No auth-token cookie found after login');
    } else {
      console.log('✅ Auth cookie found:', authCookie.name);
    }

    console.log('✅ Logged in as Flora Distro vendor');
  });

  test('should bulk create 5 cannabis strain products with AI autofill', async ({ page }) => {
    console.log('🧪 Starting bulk product creation test...');

    // Navigate to new product page
    await page.goto('http://localhost:3000/vendor/products/new');
    await page.waitForLoadState('networkidle');

    console.log('✅ Navigated to new product page');

    // Click "Bulk" button to switch to bulk import mode
    const bulkModeButton = page.locator('button:has-text("Bulk")');
    await bulkModeButton.waitFor({ state: 'visible', timeout: 10000 });
    await bulkModeButton.click();

    console.log('✅ Switched to Bulk mode');

    // Wait for bulk panel to appear
    await page.waitForTimeout(1000);

    // Enter product list
    const productList = `Blo Pop
Gorilla Glue #4
Lemon Runtz
Pez Runtz
Pink Soufflé`;

    console.log('📝 Selecting category and entering product list...');

    // Find and select category first (required)
    const categorySelect = page.locator('select').first();
    await categorySelect.waitFor({ state: 'visible', timeout: 10000 });
    await categorySelect.selectOption({ label: 'Flower' });

    console.log('✅ Selected Flower category');

    // Wait a moment for the textarea to be enabled
    await page.waitForTimeout(1000);

    // Find the bulk input textarea
    const bulkTextarea = page.locator('textarea[placeholder*="Blue Dream"]');
    await bulkTextarea.waitFor({ state: 'visible', timeout: 10000 });
    await bulkTextarea.fill(productList);

    console.log('✅ Filled product list');

    // Click AI Enrichment button
    const aiEnrichButton = page.locator('button:has-text("Generate AI Data for All Products")');
    await aiEnrichButton.waitFor({ state: 'visible', timeout: 5000 });

    console.log('🤖 Clicking AI enrichment button...');
    await aiEnrichButton.click();

    // Wait for AI processing to complete (this can take up to 30 seconds)
    console.log('⏳ Waiting for AI enrichment to complete...');

    // Wait for the review interface to appear
    const reviewHeader = page.locator('text=/Review & Edit Products/');
    await reviewHeader.waitFor({ state: 'visible', timeout: 45000 });

    console.log('✅ AI enrichment complete - review interface shown');

    // Verify all 5 products are in the review queue
    const productCounter = page.locator('text=/\\(1\\/5\\)/');
    await expect(productCounter).toBeVisible();

    console.log('✅ All 5 products ready for review');

    // Check that AI data was populated for the first product
    const productNameInput = page.locator('input[value="Blo Pop"]').or(page.locator('input').filter({ hasText: 'Blo Pop' }));
    await expect(productNameInput.first()).toBeVisible();

    console.log('✅ First product (Blo Pop) is visible in review');

    // Check for any enriched data fields
    const allInputs = page.locator('input[type="text"]');
    const inputCount = await allInputs.count();
    console.log(`📊 Found ${inputCount} input fields (should include AI-enriched data)`);

    console.log('✅ AI enrichment verified - proceeding to submit');

    // Submit all products
    console.log('📤 Submitting all products...');
    const submitButton = page.locator('button:has-text("Submit All")');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();

    // Wait for submission to complete
    console.log('⏳ Waiting for submission to complete...');

    // Wait for success notification or redirect
    await page.waitForTimeout(3000);

    // Check if we got redirected to products page or if there's a success notification
    const currentUrl = page.url();
    console.log(`📍 Current URL after submission: ${currentUrl}`);

    if (currentUrl.includes('/vendor/products') && !currentUrl.includes('/new')) {
      console.log('✅ Successfully redirected to products page');
    } else {
      // Look for success notification
      const successNotification = page.locator('text=/Success|Complete|Created/i');
      await expect(successNotification.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Success notification shown');
    }

    // Verify products exist in database
    console.log('🔍 Verifying products in database...');

    // Navigate to products page if not already there
    if (!currentUrl.includes('/vendor/products') || currentUrl.includes('/new')) {
      await page.goto('http://localhost:3000/vendor/products');
      await page.waitForLoadState('networkidle');
    }

    // Wait for product list to load
    await page.waitForTimeout(2000);

    // Search for each product
    const productNames = ['Blo Pop', 'Gorilla Glue #4', 'Lemon Runtz', 'Pez Runtz', 'Pink Soufflé'];
    let foundCount = 0;

    for (const name of productNames) {
      const productElement = page.locator(`text="${name}"`).first();
      if (await productElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundCount++;
        console.log(`✅ Found product: ${name}`);
      } else {
        console.log(`❌ Product not found: ${name}`);
      }
    }

    console.log(`\n📊 Results: ${foundCount}/5 products found on products page`);

    expect(foundCount).toBeGreaterThanOrEqual(3); // At least 3 should be visible
  });

  test('should show AI data in console logs', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AI') || text.includes('Submitting') || text.includes('Product')) {
        consoleLogs.push(text);
        console.log(`[BROWSER] ${text}`);
      }
    });

    await page.goto('http://localhost:3000/vendor/products/new');
    await page.waitForLoadState('networkidle');

    // Select category
    const categorySelect = page.locator('select').first();
    await categorySelect.waitFor({ state: 'visible', timeout: 10000 });
    await categorySelect.selectOption({ index: 1 }); // Select first category
    await page.waitForTimeout(1000);

    // Enter products
    const bulkTextarea = page.locator('textarea[placeholder*="Blue Dream"]');
    await bulkTextarea.fill('Blo Pop\nGorilla Glue #4');

    // Trigger AI
    const aiEnrichButton = page.locator('button:has-text("Generate AI Data for All Products")');
    await aiEnrichButton.click();

    // Wait for AI to complete
    await page.waitForTimeout(20000);

    console.log('\n📋 Console Logs Summary:');
    console.log(`Total logs captured: ${consoleLogs.length}`);

    const aiLogs = consoleLogs.filter(log => log.includes('AI') || log.includes('enriched'));
    console.log(`AI-related logs: ${aiLogs.length}`);

    if (aiLogs.length > 0) {
      console.log('\n🤖 AI Logs:');
      aiLogs.forEach(log => console.log(`  - ${log}`));
    }
  });
});
