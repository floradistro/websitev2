import { test, expect } from '@playwright/test';

/**
 * Test to reproduce the intermittent RLS error on cash sales
 *
 * This test will spam 15 rapid cash sales to try to trigger the bug.
 * Watch server logs for:
 * - 🔐 Service key available: NO
 * - 🔑 Using service key: false
 * - ❌ Order creation failed: code 42501
 */

test.describe('POS Cash Sale RLS Error Spam Test', () => {
  test('spam 15 cash sales to trigger RLS error', async ({ page }) => {
    console.log('🎯 Starting RLS error reproduction test...');

    // Login
    await page.goto('http://localhost:3000/vendor/login');
    await page.fill('input[type="email"]', 'darioncdjr@gmail.com');
    await page.fill('input[type="password"]', 'Smallpenis123!!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/apps', { timeout: 10000 });
    console.log('✅ Logged in');

    // Go to POS
    await page.goto('http://localhost:3000/pos/register');
    await page.waitForTimeout(1000);

    // Select Elizabethton location
    const elizabethtonButton = page.locator('button:has-text("Elizabethton")').first();
    await elizabethtonButton.click();
    console.log('✅ Selected Elizabethton');

    await page.waitForTimeout(1000);

    // Select Main Register
    const registerButton = page.locator('button', { hasText: /main.*register/i }).first();
    await registerButton.click();
    console.log('✅ Selected Main Register');

    // Wait for POS to load
    await page.waitForTimeout(2000);

    // Find a product to add to cart
    const productCards = page.locator('[class*="product-card"], [data-testid*="product"], button:has-text("Add to Cart")').first();

    // Track successes and failures
    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // SPAM 15 CASH SALES
    for (let i = 1; i <= 15; i++) {
      console.log(`\n💰 Sale #${i}/15...`);

      try {
        // Add product to cart (click first available product)
        const firstProduct = page.locator('div[class*="cursor-pointer"]').first();
        await firstProduct.click();
        await page.waitForTimeout(300);

        // Click checkout/pay button
        const checkoutButton = page.getByRole('button', { name: /checkout|pay/i });
        await checkoutButton.click();
        await page.waitForTimeout(300);

        // Select CASH payment
        const cashButton = page.getByRole('button', { name: /cash/i });
        await cashButton.click();
        await page.waitForTimeout(200);

        // Enter cash amount (try to find cash input or just click complete)
        const cashInput = page.locator('input[type="number"]').first();
        const isInputVisible = await cashInput.isVisible().catch(() => false);

        if (isInputVisible) {
          await cashInput.fill('20');
          await page.waitForTimeout(200);
        }

        // Click Complete Sale button
        const completeButton = page.getByRole('button', { name: /complete|finish|confirm/i });
        await completeButton.click();

        // Wait for sale to process
        await page.waitForTimeout(800);

        // Check if error appeared
        const errorVisible = await page.locator('text=/error|failed/i').isVisible({ timeout: 1000 }).catch(() => false);

        if (errorVisible) {
          failureCount++;
          console.log(`❌ Sale #${i} FAILED - RLS error likely triggered!`);

          const errorText = await page.locator('text=/error|failed/i').first().textContent();
          errors.push({
            saleNumber: i,
            errorText
          });
        } else {
          successCount++;
          console.log(`✅ Sale #${i} succeeded`);
        }

        // Wait a bit before next sale
        await page.waitForTimeout(500);

      } catch (error) {
        failureCount++;
        console.error(`❌ Sale #${i} threw exception:`, error);
        errors.push({
          saleNumber: i,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Report results
    console.log('\n' + '='.repeat(60));
    console.log('📊 SPAM TEST RESULTS:');
    console.log('='.repeat(60));
    console.log(`✅ Successful sales: ${successCount}/15`);
    console.log(`❌ Failed sales: ${failureCount}/15`);
    console.log(`📉 Failure rate: ${((failureCount / 15) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      console.log('\n🔍 ERRORS CAPTURED:');
      errors.forEach(e => {
        console.log(`  Sale #${e.saleNumber}:`, e.errorText || e.error);
      });
    }

    console.log('\n💡 Check server logs for:');
    console.log('  - 🔐 Service key available: NO');
    console.log('  - 🔑 Using service key: false');
    console.log('  - ❌ Order creation failed: code 42501');
    console.log('='.repeat(60));

    // The test itself doesn't need to fail - we just want to see the logs
    // But we can warn if we got failures
    if (failureCount > 0) {
      console.log(`\n⚠️  Got ${failureCount} failures - CHECK SERVER LOGS for RLS diagnostics!`);
    }
  });

  test('slower spam test - 10 sales with 2s delay', async ({ page }) => {
    console.log('🎯 Starting SLOWER RLS spam test (to rule out race conditions)...');

    // Login
    await page.goto('http://localhost:3000/vendor/login');
    await page.fill('input[type="email"]', 'darioncdjr@gmail.com');
    await page.fill('input[type="password"]', 'Smallpenis123!!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/apps', { timeout: 10000 });

    // Go to POS
    await page.goto('http://localhost:3000/pos/register');
    await page.waitForTimeout(1000);

    // Select Elizabethton
    await page.locator('button:has-text("Elizabethton")').first().click();
    await page.waitForTimeout(1000);

    // Select Main Register
    await page.locator('button', { hasText: /main.*register/i }).first().click();
    await page.waitForTimeout(2000);

    let successCount = 0;
    let failureCount = 0;

    // 10 sales with 2 second delay between each
    for (let i = 1; i <= 10; i++) {
      console.log(`\n💰 Slow Sale #${i}/10...`);

      try {
        await page.locator('div[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: /checkout|pay/i }).click();
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: /cash/i }).click();
        await page.waitForTimeout(300);

        const cashInput = page.locator('input[type="number"]').first();
        if (await cashInput.isVisible().catch(() => false)) {
          await cashInput.fill('20');
        }
        await page.waitForTimeout(300);

        await page.getByRole('button', { name: /complete|finish|confirm/i }).click();
        await page.waitForTimeout(1000);

        const errorVisible = await page.locator('text=/error|failed/i').isVisible({ timeout: 1000 }).catch(() => false);

        if (errorVisible) {
          failureCount++;
          console.log(`❌ Slow Sale #${i} FAILED`);
        } else {
          successCount++;
          console.log(`✅ Slow Sale #${i} succeeded`);
        }

        // 2 second delay before next sale
        await page.waitForTimeout(2000);

      } catch (error) {
        failureCount++;
        console.error(`❌ Slow Sale #${i} exception:`, error);
      }
    }

    console.log('\n📊 SLOW SPAM RESULTS:');
    console.log(`✅ Successful: ${successCount}/10`);
    console.log(`❌ Failed: ${failureCount}/10`);
  });
});
