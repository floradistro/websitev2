import { test, expect } from '@playwright/test';

test.describe('Vendor Auth Flow', () => {
  test('login and check dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    console.log('On login page');
    await page.screenshot({ path: 'test-results/vendor-login-page.png', fullPage: true });

    // Check if there's a login form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    const hasEmail = await emailInput.count() > 0;
    const hasPassword = await passwordInput.count() > 0;

    console.log('Has email input:', hasEmail);
    console.log('Has password input:', hasPassword);

    if (hasEmail && hasPassword) {
      // Try to login with test credentials
      await emailInput.fill('vendor@test.com');
      await passwordInput.fill('test123');

      // Find and click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")').first();
      await loginButton.click();

      // Wait for navigation
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');

      console.log('After login URL:', page.url());
      await page.screenshot({ path: 'test-results/vendor-after-login.png', fullPage: true });

      // Check if on dashboard
      if (page.url().includes('/vendor/dashboard')) {
        console.log('✅ Successfully on dashboard');

        // Wait a bit to see if it stays
        await page.waitForTimeout(2000);

        console.log('Still on dashboard after 2s:', page.url());

        // Check for dashboard content
        const content = await page.content();
        const hasContent = content.length > 1000;
        console.log('Page has content:', hasContent, 'Length:', content.length);

        // Look for common dashboard elements
        const statCards = await page.locator('[class*="StatCard"], [class*="stat"], .minimal-glass').count();
        console.log('Stat cards found:', statCards);

        await page.screenshot({ path: 'test-results/vendor-dashboard-final.png', fullPage: true });
      } else {
        console.log('❌ Not on dashboard, at:', page.url());
      }
    } else {
      console.log('❌ Login form not found');
    }
  });

  test('check dashboard with stored auth', async ({ page, context }) => {
    // Try to set auth manually
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
      }
    ]);

    await page.goto('http://localhost:3000/vendor/dashboard');
    await page.waitForTimeout(3000);

    console.log('URL with auth:', page.url());

    const content = await page.textContent('body');
    console.log('First 500 chars:', content?.substring(0, 500));

    await page.screenshot({ path: 'test-results/vendor-with-auth.png', fullPage: true });
  });
});
