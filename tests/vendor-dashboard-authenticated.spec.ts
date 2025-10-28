import { test, expect } from '@playwright/test';

test.describe('Vendor Dashboard - Authenticated', () => {
  test('login with real credentials and test dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('domcontentloaded');

    // Use the test credentials shown on the page
    const email = 'fahad@cwscommercial.com';
    const password = 'Flipperspender123!!';

    console.log('Attempting login with test credentials...');

    // Fill in login form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('After login, URL:', page.url());

    if (page.url().includes('/vendor/dashboard')) {
      console.log('✅ Successfully logged in and on dashboard');

      // Take screenshot
      await page.screenshot({ path: 'test-results/dashboard-authenticated.png', fullPage: true });

      // Wait to see if page stays stable
      console.log('Waiting 3 seconds to check stability...');
      await page.waitForTimeout(3000);

      console.log('After 3s, URL:', page.url());
      console.log('Still on dashboard:', page.url().includes('/vendor/dashboard'));

      // Check for dashboard content
      const hasHeader = await page.getByText(/dashboard/i).count() > 0;
      const hasContent = await page.locator('.minimal-glass, [class*="stat"]').count() > 0;

      console.log('Has dashboard header:', hasHeader);
      console.log('Has dashboard content:', hasContent);

      // Look for specific elements we know should be there
      const statCards = await page.locator('[class*="minimal-glass"]').count();
      console.log('Found stat cards/containers:', statCards);

      if (statCards === 0) {
        console.log('⚠️  No stat cards found - page might have crashed');
        const bodyText = await page.textContent('body');
        console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
      }

      // Take final screenshot
      await page.screenshot({ path: 'test-results/dashboard-final-state.png', fullPage: true });

    } else if (page.url().includes('/vendor/login')) {
      console.log('❌ Still on login page - credentials may be incorrect');

      // Check for error messages
      const errorText = await page.locator('[class*="error"], [class*="alert"]').count();
      console.log('Error messages found:', errorText);

      await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
    } else {
      console.log('❌ Redirected to unexpected page:', page.url());
      await page.screenshot({ path: 'test-results/unexpected-redirect.png', fullPage: true });
    }
  });
});
