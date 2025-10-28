import { test, expect } from '@playwright/test';

test.describe('Category Dropdown Visual Test', () => {
  test('verify category dropdown exists and works in POS', async ({ page }) => {
    console.log('🔐 Logging in to vendor portal...');

    // Go to login page
    await page.goto('/vendor/login');

    // Fill login form
    await page.fill('input[type="email"]', 'darioncdjr@gmail.com');
    await page.fill('input[type="password"]', 'Vendor123!');

    // Submit and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ timeout: 15000 }).catch(() => {
        console.log('⚠️ Navigation timeout, checking current URL...');
      })
    ]);

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Take screenshot after login
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });

    console.log('🚀 Navigating to POS register...');
    await page.goto('/pos/register');
    await page.waitForTimeout(2000);

    // Take screenshot of POS page
    await page.screenshot({ path: 'test-results/pos-page.png', fullPage: true });

    // Check if we're on the login page or the POS page
    const isLoginPage = await page.locator('text=Sign in to manage your store').count() > 0;

    if (isLoginPage) {
      console.log('❌ Still on login page - authentication failed');
      const bodyText = await page.locator('body').textContent();
      console.log('Page content preview:', bodyText?.substring(0, 500));
      return;
    }

    console.log('✅ Successfully loaded POS page');

    // Wait for products/content to load
    await page.waitForTimeout(3000);

    // Look for any select elements
    const selectElements = await page.locator('select').count();
    console.log(`Found ${selectElements} select element(s) on page`);

    if (selectElements === 0) {
      console.log('❌ No select elements found');

      // Check what's actually on the page
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log('Page headings:', headings);

      // Look for any text that might indicate what's showing
      const bodyText = await page.locator('body').textContent();
      console.log('Body contains "category":', bodyText?.toLowerCase().includes('category'));
      console.log('Body contains "search":', bodyText?.toLowerCase().includes('search'));
      console.log('Body contains "product":', bodyText?.toLowerCase().includes('product'));

      return;
    }

    // Found select element(s)
    const categorySelect = page.locator('select').first();

    // Take a focused screenshot
    await categorySelect.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/category-dropdown-focus.png' });

    // Get all options
    const options = await categorySelect.locator('option').allTextContents();
    console.log('✅ Category options:', options);

    // Check if it's visible and enabled
    const isVisible = await categorySelect.isVisible();
    const isEnabled = await categorySelect.isEnabled();
    console.log('Dropdown visible:', isVisible, '| enabled:', isEnabled);

    // Try to interact with it
    if (options.length > 1) {
      console.log(`🎯 Selecting option: ${options[1]}`);
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Take screenshot after selection
      await page.screenshot({ path: 'test-results/after-category-select.png' });

      const newValue = await categorySelect.inputValue();
      console.log('✅ New value:', newValue);
    }

    // Check CSS
    const bgColor = await categorySelect.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const cursor = await categorySelect.evaluate(el => window.getComputedStyle(el).cursor);

    console.log('CSS - Background:', bgColor, '| Cursor:', cursor);
  });
});
