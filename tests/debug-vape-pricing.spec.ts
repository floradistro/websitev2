import { test, expect } from '@playwright/test';

test('Debug VAPE pricing on TV display', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/vendor/**');

  // Go to TV display
  await page.goto('http://localhost:3000/tv-display');
  await page.waitForTimeout(2000);

  // Check if VAPE section exists
  const vapeSection = page.locator('text=VAPE').first();
  await expect(vapeSection).toBeVisible();

  // Check for VAPE products
  const vapeProducts = page.locator('text=Girl Scout Cookie, text=Orange Candy Crush').first();
  await expect(vapeProducts.first()).toBeVisible();

  // Look for any price on VAPE side
  const vapePrices = page.locator('[data-testid="product-price"]').filter({ hasText: '$' });
  const priceCount = await vapePrices.count();

  console.log(`Found ${priceCount} prices on VAPE side`);

  // Take screenshot for debugging
  await page.screenshot({ path: 'vape-pricing-debug.png', fullPage: true });

  // Check console for errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('pricing')) {
      console.log('Console:', msg.text());
    }
  });

  // Log network requests to pricing API
  page.on('response', async response => {
    if (response.url().includes('category-pricing-tiers')) {
      console.log('Pricing API response:', await response.json());
    }
  });
});
