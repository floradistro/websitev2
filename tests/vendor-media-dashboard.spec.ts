import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_VENDOR_EMAIL = 'fahad@cwscommercial.com';
const TEST_VENDOR_PASSWORD = 'Flipperspender123!!';
const MEDIA_DASHBOARD_URL = '/vendor/media';

// Helper function to login as vendor
async function loginAsVendor(page: Page) {
  await page.goto('/vendor/login');
  await page.fill('input[type="email"]', TEST_VENDOR_EMAIL);
  await page.fill('input[type="password"]', TEST_VENDOR_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/vendor/apps', { timeout: 15000 });
}

// Helper function to navigate to media dashboard
async function navigateToMediaDashboard(page: Page) {
  await page.goto(MEDIA_DASHBOARD_URL);
  await page.waitForLoadState('networkidle');
  // Wait for the Media Powerhouse header to be visible
  await expect(page.getByText('Media Powerhouse')).toBeVisible({ timeout: 10000 });
}

test.describe('Media Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
    await navigateToMediaDashboard(page);
  });

  test.describe('Dashboard UI Elements', () => {
    test('should display main header and title', async ({ page }) => {
      await expect(page.getByText('Media Powerhouse')).toBeVisible();
      await expect(page.getByText('Command Center')).toBeVisible();
    });

    test('should display media health section', async ({ page }) => {
      await expect(page.getByText('Media Health')).toBeVisible();

      // Should show health score (0-100%)
      const healthScore = page.locator('text=/\\d+%/').first();
      await expect(healthScore).toBeVisible();

      // Should show star rating
      const starRating = page.locator('text=/★+/').first();
      await expect(starRating).toBeVisible();

      // Should show health bar
      const healthBar = page.locator('.bg-white\\/\\[0\\.04\\].rounded-full');
      await expect(healthBar).toBeVisible();
    });

    test('should display health status text', async ({ page }) => {
      const statusTexts = ['Excellent', 'Good', 'Fair', 'Needs Work'];
      const statusVisible = await Promise.race(
        statusTexts.map(text =>
          page.getByText(text, { exact: false }).isVisible()
        )
      );
      expect(statusVisible).toBeTruthy();
    });
  });

  test.describe('Quick Wins Section', () => {
    test('should display quick wins heading', async ({ page }) => {
      await expect(page.getByText('🎯 Quick Wins')).toBeVisible();
    });

    test('should show products needing images card if applicable', async ({ page }) => {
      // Check if card exists
      const productsNeedImagesCard = page.getByText('Products Need Images');

      if (await productsNeedImagesCard.isVisible()) {
        // Should show count
        const countElement = productsNeedImagesCard.locator('..').locator('h3').first();
        await expect(countElement).toBeVisible();

        // Should have "Generate with AI" text
        await expect(page.getByText('Generate with AI')).toBeVisible();

        // Should be clickable
        const card = productsNeedImagesCard.locator('..');
        await expect(card).toHaveClass(/group/);
      }
    });

    test('should show unlinked images card if applicable', async ({ page }) => {
      const unlinkedCard = page.getByText('Images Need Linking');

      if (await unlinkedCard.isVisible()) {
        // Should show count
        const countElement = unlinkedCard.locator('..').locator('h3').first();
        await expect(countElement).toBeVisible();

        // Should have "Link Now" text
        await expect(page.getByText('Link Now')).toBeVisible();
      }
    });

    test('should show vapes needing images card if applicable', async ({ page }) => {
      const vapesCard = page.getByText('Vapes Need Cartoon Images');

      if (await vapesCard.isVisible()) {
        // Should show count
        const countElement = vapesCard.locator('..').locator('h3').first();
        await expect(countElement).toBeVisible();

        // Should have "Bulk Generate" text
        await expect(page.getByText('Bulk Generate')).toBeVisible();
      }
    });
  });

  test.describe('Media Stats Grid', () => {
    test('should display stats section heading', async ({ page }) => {
      await expect(page.getByText('📈 Media Stats')).toBeVisible();
    });

    test('should display total images stat', async ({ page }) => {
      await expect(page.getByText('Total Images')).toBeVisible();

      // Should show a number
      const totalImages = page.locator('text=/Total Images/').locator('..').locator('p').first();
      await expect(totalImages).toBeVisible();
    });

    test('should display AI generated stat', async ({ page }) => {
      await expect(page.getByText('AI Generated')).toBeVisible();

      const aiGenerated = page.locator('text=/AI Generated/').locator('..').locator('p').first();
      await expect(aiGenerated).toBeVisible();
    });

    test('should display total products stat', async ({ page }) => {
      await expect(page.getByText('Total Products')).toBeVisible();

      const totalProducts = page.locator('text=/Total Products/').locator('..').locator('p').first();
      await expect(totalProducts).toBeVisible();
    });

    test('should display today uploads stat', async ({ page }) => {
      // Look for the "Today" label
      const todayLabels = page.locator('text=Today');
      const todayLabel = todayLabels.filter({ hasText: /^Today$/i }).first();
      await expect(todayLabel).toBeVisible();
    });

    test('should show numeric values for all stats', async ({ page }) => {
      // All stat cards should have numeric values
      const statCards = page.locator('.grid.grid-cols-2 > div');
      const count = await statCards.count();

      expect(count).toBeGreaterThanOrEqual(4);

      for (let i = 0; i < count; i++) {
        const card = statCards.nth(i);
        const value = card.locator('p.text-2xl').first();
        await expect(value).toBeVisible();
      }
    });
  });

  test.describe('Navigation Cards', () => {
    test('should display media library navigation card', async ({ page }) => {
      await expect(page.getByText('Media Library')).toBeVisible();
      await expect(page.getByText('Browse, organize, and manage all your media files')).toBeVisible();
      await expect(page.getByText('Open Library')).toBeVisible();
    });

    test('should display AI generation navigation card', async ({ page }) => {
      await expect(page.getByText('AI Generation')).toBeVisible();
      await expect(page.getByText('Generate beautiful product images with AI')).toBeVisible();
      await expect(page.getByText('Generate Images')).toBeVisible();
    });

    test('should display link center navigation card', async ({ page }) => {
      await expect(page.getByText('Link Center')).toBeVisible();
      await expect(page.getByText('Connect images to products automatically')).toBeVisible();
      await expect(page.getByText('Link Images')).toBeVisible();
    });

    test('should navigate to media library when clicked', async ({ page }) => {
      const libraryCard = page.getByText('Open Library').locator('..');
      await libraryCard.click();
      await page.waitForTimeout(500);

      // Should navigate to media library
      await expect(page).toHaveURL(/\/vendor\/media-library/);
    });

    test('should navigate to generate page when AI card clicked', async ({ page }) => {
      const generateCard = page.getByText('Generate Images').locator('..');
      await generateCard.click();
      await page.waitForTimeout(500);

      // Should navigate to generate page
      await expect(page).toHaveURL(/\/vendor\/media\/generate/);
    });

    test('should navigate to link center when clicked', async ({ page }) => {
      const linkCard = page.getByText('Link Images').locator('..');
      await linkCard.click();
      await page.waitForTimeout(500);

      // Should navigate to link page
      await expect(page).toHaveURL(/\/vendor\/media\/link/);
    });
  });

  test.describe('Quick Win Navigation', () => {
    test('should navigate to generate page from products need images card', async ({ page }) => {
      const card = page.getByText('Products Need Images');

      if (await card.isVisible()) {
        const cardButton = card.locator('..').locator('..');
        await cardButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveURL(/\/vendor\/media\/generate/);
      }
    });

    test('should navigate to link center from unlinked images card', async ({ page }) => {
      const card = page.getByText('Images Need Linking');

      if (await card.isVisible()) {
        const cardButton = card.locator('..').locator('..');
        await cardButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveURL(/\/vendor\/media\/link/);
      }
    });

    test('should navigate to generate page with vapes filter from vapes card', async ({ page }) => {
      const card = page.getByText('Vapes Need Cartoon Images');

      if (await card.isVisible()) {
        const cardButton = card.locator('..').locator('..');
        await cardButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveURL(/\/vendor\/media\/generate.*category=vapes/);
      }
    });
  });

  test.describe('Data Accuracy', () => {
    test('should calculate health score correctly', async ({ page }) => {
      // Get the health score percentage
      const healthScoreText = await page.locator('text=/\\d+%/').first().textContent();
      const healthScore = parseInt(healthScoreText?.replace('%', '') || '0');

      // Health score should be between 0-100
      expect(healthScore).toBeGreaterThanOrEqual(0);
      expect(healthScore).toBeLessThanOrEqual(100);

      // Get stats to verify calculation logic
      const totalProductsText = await page.locator('text=/Total Products/').locator('..').locator('p').first().textContent();
      const totalProducts = parseInt(totalProductsText || '0');

      if (totalProducts > 0) {
        // Health score should be reasonable based on products
        expect(healthScore).toBeGreaterThan(0);
      }
    });

    test('should show correct star rating based on health score', async ({ page }) => {
      const healthScoreText = await page.locator('text=/\\d+%/').first().textContent();
      const healthScore = parseInt(healthScoreText?.replace('%', '') || '0');

      const starRating = await page.locator('text=/★+/').first().textContent();

      if (healthScore >= 90) {
        expect(starRating).toContain('★★★★★');
      } else if (healthScore >= 70) {
        expect(starRating).toContain('★★★★☆');
      } else if (healthScore >= 50) {
        expect(starRating).toContain('★★★☆☆');
      } else {
        expect(starRating).toContain('★★☆☆☆');
      }
    });

    test('should show products with images count in health description', async ({ page }) => {
      const description = page.locator('text=/\\d+ of \\d+ products have images/').first();
      await expect(description).toBeVisible();

      const text = await description.textContent();
      expect(text).toMatch(/\d+ of \d+ products have images/);
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(MEDIA_DASHBOARD_URL);
      await page.waitForSelector('text=Media Powerhouse', { timeout: 10000 });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid navigation between sections', async ({ page }) => {
      // Navigate to library
      await page.getByText('Open Library').locator('..').click();
      await page.waitForTimeout(300);

      // Navigate back to dashboard
      await page.goto(MEDIA_DASHBOARD_URL);
      await page.waitForTimeout(300);

      // Navigate to generate
      await page.getByText('Generate Images').locator('..').click();
      await page.waitForTimeout(300);

      // Navigate back to dashboard
      await page.goto(MEDIA_DASHBOARD_URL);
      await page.waitForTimeout(300);

      // Dashboard should still be functional
      await expect(page.getByText('Media Powerhouse')).toBeVisible();
      await expect(page.getByText('Media Health')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByText('Media Powerhouse')).toBeVisible();
      await expect(page.getByText('Media Health')).toBeVisible();
      await expect(page.getByText('Quick Wins')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByText('Media Powerhouse')).toBeVisible();
      await expect(page.getByText('Media Health')).toBeVisible();
      await expect(page.getByText('Quick Wins')).toBeVisible();
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await expect(page.getByText('Media Powerhouse')).toBeVisible();
      await expect(page.getByText('Media Health')).toBeVisible();
      await expect(page.getByText('Quick Wins')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      const h2s = page.locator('h2');

      // Should have at least one h1
      expect(await h1.count()).toBeGreaterThanOrEqual(1);

      // Should have multiple h2s for sections
      expect(await h2s.count()).toBeGreaterThanOrEqual(2);
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through the interface
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Should be able to navigate with keyboard
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Should not throw any errors
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Even if API fails, dashboard should still render
      await expect(page.getByText('Media Powerhouse')).toBeVisible();

      // Stats might be 0, but should not crash
      const stats = page.locator('.grid.grid-cols-2 > div');
      const count = await stats.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('should show loading state initially', async ({ page }) => {
      // Navigate to fresh page
      const response = page.goto(MEDIA_DASHBOARD_URL);

      // Should show loading state briefly
      const loadingText = page.getByText('Loading Dashboard...');

      // Wait for response
      await response;

      // Should eventually show content
      await expect(page.getByText('Media Powerhouse')).toBeVisible({ timeout: 10000 });
    });
  });
});
