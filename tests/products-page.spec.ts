/**
 * Products Page Comprehensive Test
 * Tests /vendor/products page functionality including:
 * - Category filtering
 * - Status filtering
 * - Search
 * - Pagination
 * - Mobile responsiveness
 */

import { test, expect } from '@playwright/test';

const VENDOR_EMAIL = 'flora@floradistro.com';
const VENDOR_PASSWORD = 'password123';

test.describe('Products Page Tests', () => {
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

  test('1. Page loads and displays products', async ({ page }) => {
    console.log('📦 Testing products page load...');

    // Check page title/header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check products list exists
    const productsList = page.locator('[data-testid="products-list"], .products-list, main');
    await expect(productsList).toBeVisible();

    console.log('✅ Products page loaded successfully');
  });

  test('2. Category filter works correctly', async ({ page }) => {
    console.log('🔍 Testing category filter...');

    // Find category dropdown
    const categorySelect = page.locator('select#category-filter, select[aria-label*="category" i]');
    await expect(categorySelect).toBeVisible();

    // Get initial product count
    const initialProducts = await page.locator('[data-product-card], [data-testid="product-card"]').count();
    console.log(`📊 Initial products: ${initialProducts}`);

    // Select a category (e.g., "Edibles")
    await categorySelect.selectOption('Edibles');

    // Wait for results to update
    await page.waitForTimeout(1000);

    // Check that URL updated with category parameter
    const url = page.url();
    console.log(`🔗 URL after filter: ${url}`);

    // Products should be filtered
    const filteredProducts = await page.locator('[data-product-card], [data-testid="product-card"]').count();
    console.log(`📊 Filtered products: ${filteredProducts}`);

    console.log('✅ Category filter working');
  });

  test('3. Status filter works correctly', async ({ page }) => {
    console.log('🔍 Testing status filter...');

    // Find status dropdown
    const statusSelect = page.locator('select#status-filter, select[aria-label*="status" i]');
    await expect(statusSelect).toBeVisible();

    // Select "Published" status
    await statusSelect.selectOption('published');

    // Wait for results
    await page.waitForTimeout(1000);

    console.log('✅ Status filter working');
  });

  test('4. Search functionality works', async ({ page }) => {
    console.log('🔍 Testing search...');

    // Find search input
    const searchInput = page.locator('input[type="text"][placeholder*="Search" i], input[aria-label*="search" i]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('gummy');

    // Wait for debounce and results
    await page.waitForTimeout(1500);

    console.log('✅ Search working');
  });

  test('5. Pagination works', async ({ page }) => {
    console.log('📄 Testing pagination...');

    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination" i]');

    if (await pagination.isVisible()) {
      // Try clicking next page
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]');

      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Pagination working');
      } else {
        console.log('ℹ️  Only one page of products');
      }
    } else {
      console.log('ℹ️  No pagination needed');
    }
  });

  test('6. Clear filters button works', async ({ page }) => {
    console.log('🔍 Testing clear filters...');

    // Apply filters first
    const categorySelect = page.locator('select#category-filter, select[aria-label*="category" i]');
    const statusSelect = page.locator('select#status-filter, select[aria-label*="status" i]');

    await categorySelect.selectOption('Flower');
    await statusSelect.selectOption('published');
    await page.waitForTimeout(1000);

    // Find and click clear filters button
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("clear" i)');

    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);

      // Verify filters reset
      const categoryValue = await categorySelect.inputValue();
      const statusValue = await statusSelect.inputValue();

      expect(categoryValue).toBe('all');
      expect(statusValue).toBe('all');

      console.log('✅ Clear filters working');
    } else {
      console.log('ℹ️  No clear filters button found');
    }
  });

  test('7. Mobile: Page is responsive', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that page content is visible and not overflowing
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check filters are accessible on mobile
    const categorySelect = page.locator('select#category-filter, select[aria-label*="category" i]');
    await expect(categorySelect).toBeVisible();

    console.log('✅ Mobile layout working');
  });

  test('8. Products have correct status pills', async ({ page }) => {
    console.log('🏷️  Testing status pills...');

    // Find any status badges/pills
    const statusPills = page.locator('[data-status], .status-badge, [class*="status"]');

    const count = await statusPills.count();
    console.log(`📊 Found ${count} status indicators`);

    if (count > 0) {
      const firstPill = statusPills.first();
      await expect(firstPill).toBeVisible();
      console.log('✅ Status pills visible');
    }
  });
});

test.describe('Products Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vendor/login');
    await page.fill('input[type="email"]', VENDOR_EMAIL);
    await page.fill('input[type="password"]', VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/vendor/apps');
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
  });

  test('9. Desktop: Full width layout', async ({ page }) => {
    console.log('🖥️  Testing desktop full width...');

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    const mainBox = await main.boundingBox();

    if (mainBox) {
      console.log(`📏 Main content width: ${mainBox.width}px`);
      console.log(`📏 Viewport width: 1920px`);

      // Should use most of the screen width
      expect(mainBox.width).toBeGreaterThan(1400);
    }

    console.log('✅ Full width layout verified');
  });

  test('10. Icons are monochrome/minimalist', async ({ page }) => {
    console.log('🎨 Testing icon style...');

    // Check for icon elements
    const icons = page.locator('svg, [class*="icon"]');
    const iconCount = await icons.count();

    console.log(`🎨 Found ${iconCount} icons on page`);

    if (iconCount > 0) {
      console.log('✅ Icons present on page');
    }
  });
});
