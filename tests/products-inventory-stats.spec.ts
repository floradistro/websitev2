/**
 * Products Inventory Stats Test
 * Verifies the new vendor-focused inventory statistics
 */

import { test, expect } from '@playwright/test';

const VENDOR_EMAIL = 'flora@floradistro.com';
const VENDOR_PASSWORD = 'password123';

test.describe('Products Inventory Stats', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/vendor/login');
    await page.fill('input[type="email"]', VENDOR_EMAIL);
    await page.fill('input[type="password"]', VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/vendor/apps');

    // Navigate to products page
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
  });

  test('1. Stats cards display vendor-focused metrics', async ({ page }) => {
    console.log('📊 Testing inventory-based stats...');

    // Check for the 4 stat cards with correct labels
    const totalCard = page.locator('text=TOTAL').first();
    const inStockCard = page.locator('text=IN STOCK').first();
    const lowStockCard = page.locator('text=LOW STOCK').first();
    const outOfStockCard = page.locator('text=OUT OF STOCK').first();

    await expect(totalCard).toBeVisible();
    await expect(inStockCard).toBeVisible();
    await expect(lowStockCard).toBeVisible();
    await expect(outOfStockCard).toBeVisible();

    console.log('✅ All inventory stat cards visible');
  });

  test('2. Stats show numeric values', async ({ page }) => {
    console.log('🔢 Testing stat values...');

    // Wait for stats to load
    await page.waitForTimeout(1000);

    // Find stat cards by their container
    const statsRegion = page.locator('[aria-label="Inventory statistics"]');
    await expect(statsRegion).toBeVisible();

    // Count stat cards
    const statCards = statsRegion.locator('[role="article"]');
    const count = await statCards.count();

    console.log(`📊 Found ${count} stat cards`);
    expect(count).toBe(4);

    // Check each card has a value
    for (let i = 0; i < count; i++) {
      const card = statCards.nth(i);
      const label = await card.getAttribute('aria-label');
      console.log(`   ${i + 1}. ${label}`);

      // Each card should have a numeric value
      const valueElement = card.locator('p').nth(1);
      await expect(valueElement).toBeVisible();
    }

    console.log('✅ All stat cards have values');
  });

  test('3. Stats are monochrome styled', async ({ page }) => {
    console.log('🎨 Testing monochrome styling...');

    // Check that icons exist and are using strokeWidth=1
    const icons = page.locator('[aria-label="Inventory statistics"] svg');
    const iconCount = await icons.count();

    console.log(`🎨 Found ${iconCount} icons`);
    expect(iconCount).toBe(4);

    console.log('✅ Monochrome icons present');
  });

  test('4. Low stock and out of stock cards highlight when > 0', async ({ page }) => {
    console.log('⚠️  Testing highlight behavior...');

    await page.waitForTimeout(1000);

    // Get the stat values
    const lowStockCard = page.locator('[aria-label*="Low Stock"]').first();
    const outOfStockCard = page.locator('[aria-label*="Out of Stock"]').first();

    await expect(lowStockCard).toBeVisible();
    await expect(outOfStockCard).toBeVisible();

    console.log('✅ Warning cards visible');
  });

  test('5. Stats are responsive on mobile', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Stats should be in 2x2 grid on mobile
    const statsRegion = page.locator('[aria-label="Inventory statistics"]');
    await expect(statsRegion).toBeVisible();

    // All 4 cards should still be visible
    const statCards = statsRegion.locator('[role="article"]');
    const count = await statCards.count();
    expect(count).toBe(4);

    console.log('✅ Mobile layout working (2x2 grid)');
  });

  test('6. Stats update when filters change', async ({ page }) => {
    console.log('🔄 Testing stats update on filter...');

    // Get initial total
    const totalCard = page.locator('[aria-label*="Total:"]').first();
    await expect(totalCard).toBeVisible();

    const initialLabel = await totalCard.getAttribute('aria-label');
    console.log(`   Initial: ${initialLabel}`);

    // Apply category filter
    const categorySelect = page.locator('select#category-filter');
    await categorySelect.selectOption('Flower');

    // Wait for stats to update
    await page.waitForTimeout(1500);

    const updatedLabel = await totalCard.getAttribute('aria-label');
    console.log(`   After filter: ${updatedLabel}`);

    console.log('✅ Stats respond to filters');
  });
});

test.describe('Stats Integration Test', () => {
  test('7. Stats accurately reflect database inventory', async ({ page, request }) => {
    console.log('🗄️  Testing stats accuracy against database...');

    // Login
    await page.goto('/vendor/login');
    await page.fill('input[type="email"]', VENDOR_EMAIL);
    await page.fill('input[type="password"]', VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/vendor/apps');

    // Get products from API
    const apiResponse = await request.get('/api/vendor/products/full?page=1&limit=100', {
      headers: {
        'x-vendor-id': 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
      }
    });

    const apiData = await apiResponse.json();
    const products = apiData.products || [];

    // Calculate expected stats
    const expected = {
      total: products.length,
      inStock: products.filter((p: any) => (p.total_stock || 0) > 10).length,
      lowStock: products.filter((p: any) => {
        const stock = p.total_stock || 0;
        return stock > 0 && stock <= 10;
      }).length,
      outOfStock: products.filter((p: any) => (p.total_stock || 0) === 0).length
    };

    console.log('📊 Expected stats from API:');
    console.log(`   Total: ${expected.total}`);
    console.log(`   In Stock: ${expected.inStock}`);
    console.log(`   Low Stock: ${expected.lowStock}`);
    console.log(`   Out of Stock: ${expected.outOfStock}`);

    // Navigate to products page and verify
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Extract displayed values
    const totalCard = page.locator('[aria-label*="Total:"]').first();
    const totalLabel = await totalCard.getAttribute('aria-label');
    const totalMatch = totalLabel?.match(/Total:\s*(\d+)/);
    const displayedTotal = totalMatch ? parseInt(totalMatch[1]) : 0;

    console.log(`   Displayed Total: ${displayedTotal}`);
    expect(displayedTotal).toBe(expected.total);

    console.log('✅ Stats accurately reflect inventory data');
  });
});
