import { test, expect } from '@playwright/test';

/**
 * Test for POS Location Navigation Bootloop Bug
 *
 * Issue: When navigating Dashboard -> POS -> Register -> Dashboard -> POS,
 * the app enters an infinite reload loop with "lost location" message.
 *
 * Root cause: Auto-reload logic triggers before context finishes loading,
 * creating infinite reload cycle.
 */

test.describe('POS Location Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/vendor/login');

    // Login with test credentials
    await page.fill('input[type="email"]', 'darioncdjr@gmail.com');
    await page.fill('input[type="password"]', 'Smallpenis123!!');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/vendor/apps', { timeout: 10000 });
    console.log('✅ Logged in successfully');
  });

  test('should not bootloop when navigating back to POS after selecting register', async ({ page }) => {
    let reloadCount = 0;

    // Track page reloads to detect bootloop
    page.on('load', () => {
      reloadCount++;
      console.log(`🔄 Page reload #${reloadCount}`);

      // If we reload more than 3 times, we're in a bootloop
      if (reloadCount > 3) {
        throw new Error(`BOOTLOOP DETECTED: Page reloaded ${reloadCount} times!`);
      }
    });

    // STEP 1: Go to POS from dashboard
    console.log('📍 Step 1: Navigate to POS');
    await page.goto('http://localhost:3000/pos/register');

    // Should show location selector
    await expect(page.getByText(/select location/i)).toBeVisible({ timeout: 5000 });
    console.log('✅ Location selector shown');

    // STEP 2: Select Elizabethton location
    console.log('📍 Step 2: Select Elizabethton');
    await page.click('text=/.*elizabethton.*/i');

    // Should show register selector
    await expect(page.getByText(/select register/i)).toBeVisible({ timeout: 5000 });
    console.log('✅ Register selector shown');

    // STEP 3: Select Terminal/Register One
    console.log('📍 Step 3: Select Terminal One');
    await page.click('text=/.*terminal.*one.*/i');

    // Should load POS interface
    await expect(page.locator('text=/.*cart.*/i')).toBeVisible({ timeout: 10000 });
    console.log('✅ POS interface loaded');

    // STEP 4: Go back to dashboard
    console.log('📍 Step 4: Navigate back to Dashboard');
    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    console.log('✅ Dashboard loaded');

    // STEP 5: Go to POS again - THIS IS WHERE THE BUG OCCURS
    console.log('📍 Step 5: Navigate back to POS (trigger point)');
    await page.goto('http://localhost:3000/pos/register');

    // Wait a bit to see if bootloop starts
    await page.waitForTimeout(2000);

    // Should NOT see "Reloading... (Context lost location data)"
    const bootloopMessage = page.getByText(/reloading.*context lost/i);
    await expect(bootloopMessage).not.toBeVisible();

    // Should either show:
    // - Location selector (if localStorage cleared)
    // - Register selector (if location remembered)
    // - POS interface (if both location and register remembered)
    const hasLocationSelector = await page.getByText(/select location/i).isVisible().catch(() => false);
    const hasRegisterSelector = await page.getByText(/select register/i).isVisible().catch(() => false);
    const hasPOSInterface = await page.locator('text=/.*cart.*/i').isVisible().catch(() => false);

    const isValidState = hasLocationSelector || hasRegisterSelector || hasPOSInterface;

    console.log('📊 Final state:', {
      hasLocationSelector,
      hasRegisterSelector,
      hasPOSInterface,
      reloadCount
    });

    expect(isValidState).toBe(true);
    expect(reloadCount).toBeLessThanOrEqual(2); // Initial load + at most 1 navigation reload

    console.log('✅ No bootloop detected - navigation works correctly!');
  });

  test('should handle "Change Location" button without bootloop', async ({ page }) => {
    let reloadCount = 0;

    page.on('load', () => {
      reloadCount++;
      console.log(`🔄 Page reload #${reloadCount}`);
      if (reloadCount > 3) {
        throw new Error(`BOOTLOOP DETECTED: Page reloaded ${reloadCount} times!`);
      }
    });

    // Navigate to POS
    await page.goto('http://localhost:3000/pos/register');

    // Select location
    await page.click('text=/.*elizabethton.*/i');
    await expect(page.getByText(/select register/i)).toBeVisible({ timeout: 5000 });

    // Click "Change Location" button
    console.log('📍 Clicking Change Location button');
    await page.click('button:has-text("Change Location")');

    // Wait a bit
    await page.waitForTimeout(2000);

    // Should show location selector again
    await expect(page.getByText(/select location/i)).toBeVisible({ timeout: 5000 });

    // Should not bootloop
    expect(reloadCount).toBeLessThanOrEqual(2);

    console.log('✅ Change Location works without bootloop!');
  });
});
