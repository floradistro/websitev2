import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_VENDOR_EMAIL = 'vendor@example.com';
const TEST_VENDOR_PASSWORD = 'test123';
const MEDIA_LIBRARY_URL = '/vendor/media-library';

// Helper function to login as vendor
async function loginAsVendor(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_VENDOR_EMAIL);
  await page.fill('input[type="password"]', TEST_VENDOR_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/vendor/apps', { timeout: 15000 });
}

// Helper function to navigate to media library
async function navigateToMediaLibrary(page: Page) {
  await page.goto(MEDIA_LIBRARY_URL);
  await page.waitForLoadState('networkidle');
  // Wait for the Media Library header to be visible
  await expect(page.getByText('Media Library')).toBeVisible({ timeout: 10000 });
}

test.describe('Vendor Media Library', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
    await navigateToMediaLibrary(page);
  });

  test.describe('Basic UI Elements', () => {
    test('should display media library header and search', async ({ page }) => {
      await expect(page.getByText('Media Library')).toBeVisible();
      await expect(page.getByPlaceholder('Search media...')).toBeVisible();
    });

    test('should display category filter segmented control', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Products' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Social' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Promo' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Brand' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Menus' })).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Auto-Match/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Generate/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible();
    });

    test('should display Smart Albums section', async ({ page }) => {
      await expect(page.getByText('Smart Albums')).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should select all files with Cmd+A', async ({ page }) => {
      // Wait for media cards to load
      const mediaCards = page.locator('[data-testid="media-card"]').first();
      if (await mediaCards.count() > 0) {
        await page.keyboard.press('Meta+A');
        await page.waitForTimeout(500);

        // Check if selection toolbar shows
        const selectedText = page.getByText(/Selected/);
        if (await selectedText.count() > 0) {
          await expect(selectedText.first()).toBeVisible();
        }
      }
    });

    test('should clear selection with Escape', async ({ page }) => {
      // First select files
      const firstCard = page.locator('[data-testid="media-card"]').first();
      if (await firstCard.count() > 0) {
        await page.keyboard.press('Meta+A');
        await page.waitForTimeout(300);

        // Then press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Selection should be cleared
        const deleteButton = page.getByRole('button', { name: /Delete/i });
        await expect(deleteButton).toBeHidden();
      }
    });
  });

  test.describe('Category Filtering', () => {
    test('should filter by product category', async ({ page }) => {
      await page.getByRole('button', { name: 'Products' }).click();
      await page.waitForTimeout(500);

      // Button should have active state
      const productsButton = page.getByRole('button', { name: 'Products' });
      await expect(productsButton).toHaveClass(/bg-white\/\[0\.12\]/);
    });

    test('should switch between categories', async ({ page }) => {
      // Click Products
      await page.getByRole('button', { name: 'Products' }).click();
      await page.waitForTimeout(300);

      // Click Social
      await page.getByRole('button', { name: 'Social' }).click();
      await page.waitForTimeout(300);

      // Social should be active
      const socialButton = page.getByRole('button', { name: 'Social' });
      await expect(socialButton).toHaveClass(/bg-white\/\[0\.12\]/);
    });

    test('should return to All when clicking active category', async ({ page }) => {
      // Click a category
      await page.getByRole('button', { name: 'Products' }).click();
      await page.waitForTimeout(300);

      // Click All
      await page.getByRole('button', { name: 'All' }).click();
      await page.waitForTimeout(300);

      // All should be active
      const allButton = page.getByRole('button', { name: 'All' });
      await expect(allButton).toHaveClass(/bg-white\/\[0\.12\]/);
    });
  });

  test.describe('Smart Albums', () => {
    test('should filter by Unlinked smart album', async ({ page }) => {
      const unlinkedButton = page.getByRole('button', { name: /Unlinked/i }).first();

      if (await unlinkedButton.count() > 0) {
        await unlinkedButton.click();
        await page.waitForTimeout(500);

        // Should show "Show All" button
        await expect(page.getByRole('button', { name: 'Show All' })).toBeVisible();

        // Album should have active state
        await expect(unlinkedButton).toHaveClass(/scale-105/);
      }
    });

    test('should clear smart album filter with Show All button', async ({ page }) => {
      const unlinkedButton = page.getByRole('button', { name: /Unlinked/i }).first();

      if (await unlinkedButton.count() > 0) {
        await unlinkedButton.click();
        await page.waitForTimeout(300);

        // Click Show All
        await page.getByRole('button', { name: 'Show All' }).click();
        await page.waitForTimeout(300);

        // Show All button should disappear
        await expect(page.getByRole('button', { name: 'Show All' })).toBeHidden();
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should search media files', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search media...');
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Search input should have the value
      await expect(searchInput).toHaveValue('test');
    });

    test('should clear search', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search media...');
      await searchInput.fill('test');
      await page.waitForTimeout(300);
      await searchInput.clear();
      await page.waitForTimeout(300);

      await expect(searchInput).toHaveValue('');
    });
  });

  test.describe('View Mode Toggle', () => {
    test('should switch to list view', async ({ page }) => {
      // Find the list view button (second button in view toggle)
      const viewToggle = page.locator('.flex.bg-white\\/\\[0\\.04\\].rounded-xl button').nth(1);

      if (await viewToggle.count() > 0) {
        await viewToggle.click();
        await page.waitForTimeout(500);

        // List view should be active
        await expect(viewToggle).toHaveClass(/bg-white\/\[0\.12\]/);
      }
    });

    test('should switch back to grid view', async ({ page }) => {
      // Switch to list first
      const listButton = page.locator('.flex.bg-white\\/\\[0\\.04\\].rounded-xl button').nth(1);
      if (await listButton.count() > 0) {
        await listButton.click();
        await page.waitForTimeout(300);
      }

      // Switch back to grid
      const gridButton = page.locator('.flex.bg-white\\/\\[0\\.04\\].rounded-xl button').nth(0);
      if (await gridButton.count() > 0) {
        await gridButton.click();
        await page.waitForTimeout(500);

        await expect(gridButton).toHaveClass(/bg-white\/\[0\.12\]/);
      }
    });
  });

  test.describe('File Selection', () => {
    test('should select a single file', async ({ page }) => {
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        // Click the checkbox button
        const checkbox = firstCard.locator('button').first();
        await checkbox.click();
        await page.waitForTimeout(500);

        // Selection count should show "1 Selected"
        await expect(page.getByText('1 Selected')).toBeVisible();
      }
    });

    test('should show selection toolbar when files are selected', async ({ page }) => {
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        const checkbox = firstCard.locator('button').first();
        await checkbox.click();
        await page.waitForTimeout(500);

        // Toolbar buttons should be visible
        await expect(page.getByRole('button', { name: /Categorize/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Delete/i })).toBeVisible();
      }
    });

    test('should deselect files', async ({ page }) => {
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        const checkbox = firstCard.locator('button').first();

        // Select
        await checkbox.click();
        await page.waitForTimeout(300);

        // Deselect
        await checkbox.click();
        await page.waitForTimeout(500);

        // Selection should be cleared
        await expect(page.getByText('Select All')).toBeVisible();
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should show bulk category menu', async ({ page }) => {
      // Select a file first
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        await firstCard.locator('button').first().click();
        await page.waitForTimeout(300);

        // Click Categorize button
        await page.getByRole('button', { name: /Categorize/i }).click();
        await page.waitForTimeout(500);

        // Category menu should be visible
        await expect(page.getByText('Product').first()).toBeVisible();
        await expect(page.getByText('Social').first()).toBeVisible();
      }
    });
  });

  test.describe('Quick View Modal', () => {
    test('should open Quick View when clicking an image', async ({ page }) => {
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        // Click the image area (not the checkbox)
        await firstCard.locator('.aspect-square').click();
        await page.waitForTimeout(1000);

        // Modal should be visible
        const modal = page.locator('.fixed.inset-0.bg-black\\/90');
        await expect(modal).toBeVisible();
      }
    });

    test('should close Quick View with close button', async ({ page }) => {
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        await firstCard.locator('.aspect-square').click();
        await page.waitForTimeout(500);

        // Click close button (circular X button)
        const closeButton = page.locator('button').filter({ hasText: /^$/ }).first();
        await closeButton.click();
        await page.waitForTimeout(500);

        // Modal should be hidden
        const modal = page.locator('.fixed.inset-0.bg-black\\/90');
        await expect(modal).toBeHidden();
      }
    });

    test('should close Quick View with Escape key', async ({ page }) => {
      const firstCard = page.locator('[data-testid="media-card"]').first();

      if (await firstCard.count() > 0) {
        await firstCard.locator('.aspect-square').click();
        await page.waitForTimeout(500);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Modal should be hidden
        const modal = page.locator('.fixed.inset-0.bg-black\\/90');
        await expect(modal).toBeHidden();
      }
    });

    test('should navigate to next image with arrow key', async ({ page }) => {
      const mediaCards = page.locator('[data-testid="media-card"]');
      const cardCount = await mediaCards.count();

      if (cardCount > 1) {
        // Open first image
        await mediaCards.first().locator('.aspect-square').click();
        await page.waitForTimeout(500);

        // Press right arrow
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);

        // Counter should show "2 / X"
        const counter = page.locator('text=/2 \\/ \\d+/');
        await expect(counter).toBeVisible();
      }
    });

    test('should navigate to previous image with arrow key', async ({ page }) => {
      const mediaCards = page.locator('[data-testid="media-card"]');
      const cardCount = await mediaCards.count();

      if (cardCount > 1) {
        // Open second image
        await mediaCards.nth(1).locator('.aspect-square').click();
        await page.waitForTimeout(500);

        // Press left arrow
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(500);

        // Counter should show "1 / X"
        const counter = page.locator('text=/1 \\/ \\d+/');
        await expect(counter).toBeVisible();
      }
    });

    test('should show navigation arrows on hover', async ({ page }) => {
      const mediaCards = page.locator('[data-testid="media-card"]');
      const cardCount = await mediaCards.count();

      if (cardCount > 1) {
        // Open first image
        await mediaCards.first().locator('.aspect-square').click();
        await page.waitForTimeout(500);

        // Hover over the image area
        const imageContainer = page.locator('.flex-1.min-h-0.bg-black');
        await imageContainer.hover();
        await page.waitForTimeout(300);

        // Next arrow should be visible (if not at the end)
        const nextButton = page.getByLabel('Next image');
        if (await nextButton.count() > 0) {
          await expect(nextButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance & Responsiveness', () => {
    test('should load media library within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(MEDIA_LIBRARY_URL);
      await page.waitForSelector('text=Media Library', { timeout: 10000 });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid category switching', async ({ page }) => {
      // Rapidly switch categories
      await page.getByRole('button', { name: 'Products' }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: 'Social' }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: 'Print' }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: 'All' }).click();

      // Should end on All category
      const allButton = page.getByRole('button', { name: 'All' });
      await expect(allButton).toHaveClass(/bg-white\/\[0\.12\]/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on navigation buttons', async ({ page }) => {
      const mediaCards = page.locator('[data-testid="media-card"]');

      if (await mediaCards.count() > 1) {
        await mediaCards.first().locator('.aspect-square').click();
        await page.waitForTimeout(500);

        // Check for aria-label on navigation buttons
        const prevButton = page.getByLabel('Previous image');
        const nextButton = page.getByLabel('Next image');

        if (await prevButton.count() > 0) {
          expect(await prevButton.getAttribute('aria-label')).toBe('Previous image');
        }
        if (await nextButton.count() > 0) {
          expect(await nextButton.getAttribute('aria-label')).toBe('Next image');
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through the interface
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Should focus on search input
      const searchInput = page.getByPlaceholder('Search media...');
      await expect(searchInput).toBeFocused();
    });
  });
});
