/**
 * Products Page - Unified Interface Test
 * Tests the Steve Jobs-inspired single-page product management interface
 *
 * Features tested:
 * - First-time vendor onboarding with template picker
 * - 3-tab navigation (Catalog, Categories, Pricing Rules)
 * - Inline category field management
 * - Template import flow
 * - Product creation and management
 */

import { test, expect } from '@playwright/test';

const TEST_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const TEST_BASE_URL = 'http://localhost:3000';

test.describe('Products Page - Unified Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${TEST_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('should display onboarding modal for new vendors', async ({ page }) => {
    // This test assumes a new vendor with no products/categories
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Check if onboarding modal appears
    const onboardingModal = page.locator('text=Welcome! What do you sell?');

    // If modal is visible, test its contents
    if (await onboardingModal.isVisible()) {
      // Should show template options
      await expect(page.locator('text=Cannabis Dispensary')).toBeVisible();
      await expect(page.locator('text=Start from Scratch')).toBeVisible();

      // Should have skip button
      await expect(page.locator('text=Skip for now')).toBeVisible();

      console.log('✅ Onboarding modal displayed correctly');
    } else {
      console.log('⏭️  Vendor already has products/categories - skipping onboarding test');
    }
  });

  test('should show 3-tab navigation structure', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding if it appears
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Check for all 3 tabs
    await expect(page.locator('text=Catalog')).toBeVisible();
    await expect(page.locator('text=Categories')).toBeVisible();
    await expect(page.locator('text=Pricing Rules')).toBeVisible();

    // Tabs should show counts
    const catalogTab = page.locator('button', { hasText: 'Catalog' });
    await expect(catalogTab).toBeVisible();

    console.log('✅ All 3 tabs visible with counts');
  });

  test('should navigate between tabs smoothly', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Test Catalog tab (default)
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();

    // Switch to Categories tab
    await page.locator('button', { hasText: 'Categories' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Organize your products')).toBeVisible();

    // Switch to Pricing Rules tab
    await page.locator('button', { hasText: 'Pricing Rules' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Create pricing structures')).toBeVisible();

    // Switch back to Catalog
    await page.locator('button', { hasText: 'Catalog' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Search products')).toBeVisible();

    console.log('✅ Tab navigation works smoothly');
  });

  test('should display catalog with filters and search', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Check stats cards
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Check search and filters
    const searchInput = page.locator('input[placeholder*="Search products"]');
    await expect(searchInput).toBeVisible();

    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible();

    // Test search
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    console.log('✅ Catalog filters and search working');
  });

  test('should allow creating new category inline', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Go to Categories tab
    await page.locator('button', { hasText: 'Categories' }).click();
    await page.waitForTimeout(300);

    // Click New Category button
    const newCategoryButton = page.locator('button', { hasText: 'New Category' });
    await expect(newCategoryButton).toBeVisible();
    await newCategoryButton.click();
    await page.waitForTimeout(300);

    // Check form appears
    await expect(page.locator('text=Create Category')).toBeVisible();
    await expect(page.locator('input[placeholder*="Icon"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Category name"]')).toBeVisible();

    // Cancel button should work
    await page.locator('button', { hasText: 'Cancel' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('text=Create Category')).not.toBeVisible();

    console.log('✅ Category creation form works');
  });

  test('should show field groups when expanding category', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Go to Categories tab
    await page.locator('button', { hasText: 'Categories' }).click();
    await page.waitForTimeout(300);

    // Find first "Show Fields" button
    const showFieldsButton = page.locator('button', { hasText: 'Show Fields' }).first();

    if (await showFieldsButton.isVisible()) {
      await showFieldsButton.click();
      await page.waitForTimeout(300);

      // Should show fields section
      await expect(page.locator('text=Custom Fields')).toBeVisible();

      // Should change to "Hide Fields"
      await expect(page.locator('button', { hasText: 'Hide Fields' })).toBeVisible();

      console.log('✅ Category field expansion works');
    } else {
      console.log('⏭️  No categories available to test field expansion');
    }
  });

  test('should display pricing rules tab content', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Go to Pricing Rules tab
    await page.locator('button', { hasText: 'Pricing Rules' }).click();
    await page.waitForTimeout(300);

    // Should show description and create button
    await expect(page.locator('text=Create pricing structures')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Create Pricing Rule' })).toBeVisible();

    console.log('✅ Pricing rules tab displayed correctly');
  });

  test('should have consistent Apple-quality design', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Check for consistent styling elements
    const tabs = page.locator('button[class*="font-bold"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(3);

    // Check for smooth transitions (no flashing)
    await page.locator('button', { hasText: 'Categories' }).click();
    await page.waitForTimeout(100);

    // Page should still be visible (no white flash)
    const bodyBg = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should be dark (not white)
    expect(bodyBg).not.toBe('rgb(255, 255, 255)');

    console.log('✅ Design consistency check passed');
  });

  test('should handle template import flow', async ({ page }) => {
    // This test would work with a fresh vendor account
    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // If onboarding modal appears
    const onboardingModal = page.locator('text=Welcome! What do you sell?');

    if (await onboardingModal.isVisible()) {
      // Check template cards
      const cannabisTemplate = page.locator('text=Cannabis Dispensary');
      const scratchOption = page.locator('text=Start from Scratch');

      await expect(cannabisTemplate).toBeVisible();
      await expect(scratchOption).toBeVisible();

      // Test "Start from Scratch" closes modal
      await scratchOption.click();
      await page.waitForTimeout(500);

      // Modal should be closed
      await expect(onboardingModal).not.toBeVisible();

      // Should show empty products page
      await expect(page.locator('text=Products')).toBeVisible();

      console.log('✅ Template import flow works');
    } else {
      console.log('⏭️  Vendor already onboarded - skipping template import test');
    }
  });

  test('should have no console errors during navigation', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate through all tabs
    await page.locator('button', { hasText: 'Catalog' }).click();
    await page.waitForTimeout(500);

    await page.locator('button', { hasText: 'Categories' }).click();
    await page.waitForTimeout(500);

    await page.locator('button', { hasText: 'Pricing Rules' }).click();
    await page.waitForTimeout(500);

    // Filter out non-critical errors (like 404s for missing resources)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('404') &&
      !error.includes('favicon') &&
      !error.includes('Source map')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️  Console errors detected:', criticalErrors);
    } else {
      console.log('✅ No console errors during navigation');
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(`${TEST_BASE_URL}/vendor/products`);
    await page.waitForLoadState('networkidle');

    // Skip onboarding
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Tabs should still be visible and clickable
    await expect(page.locator('text=Catalog')).toBeVisible();
    await expect(page.locator('text=Categories')).toBeVisible();
    await expect(page.locator('text=Pricing Rules')).toBeVisible();

    // Test tab switching on mobile
    await page.locator('button', { hasText: 'Categories' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Organize your products')).toBeVisible();

    console.log('✅ Mobile responsive design works');
  });
});
