import { test, expect } from '@playwright/test';

test.describe('Vendor Dashboard Debug', () => {
  test('check vendor dashboard crash', async ({ page }) => {
    // Navigate to vendor dashboard
    await page.goto('http://localhost:3000/vendor/dashboard');

    // Wait a bit to see if it crashes
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/vendor-dashboard-state.png', fullPage: true });

    // Check what's on the page
    const content = await page.content();
    console.log('Page URL:', page.url());
    console.log('Page title:', await page.title());

    // Check for error messages
    const errors = await page.locator('[class*="error"]').count();
    console.log('Error elements found:', errors);

    // Check for loading states
    const loading = await page.locator('[class*="loading"], [class*="skeleton"]').count();
    console.log('Loading elements found:', loading);

    // Check if redirected
    console.log('Final URL:', page.url());

    // Look for specific text that should be on dashboard
    const hasStoreName = await page.getByText(/dashboard|vendor|portal/i).count();
    console.log('Dashboard-related text found:', hasStoreName);

    // Check console errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleMessages.length > 0) {
      console.log('Console errors:', consoleMessages);
    }
  });

  test('check vendor login redirect', async ({ page }) => {
    // Navigate to vendor dashboard without auth
    await page.goto('http://localhost:3000/vendor/dashboard');

    await page.waitForTimeout(2000);

    console.log('After navigation URL:', page.url());

    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log('✅ Correctly redirected to login page');
    } else if (page.url().includes('/vendor/dashboard')) {
      console.log('⚠️ Still on dashboard - checking for content');
      await page.screenshot({ path: 'test-results/dashboard-no-redirect.png', fullPage: true });
    }
  });
});
