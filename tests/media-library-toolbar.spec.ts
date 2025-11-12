import { test, expect } from '@playwright/test';

test.describe('Media Library Toolbar', () => {
  test('should display the new comprehensive toolbar', async ({ page }) => {
    // Navigate to media library
    await page.goto('http://localhost:3000/vendor/media-library');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'media-library-toolbar.png', fullPage: true });

    // Check if toolbar exists
    const toolbar = page.locator('div.flex-shrink-0.h-14');
    await expect(toolbar).toBeVisible();

    // Check for view mode buttons
    const splitViewButton = page.getByTitle('Split View');
    await expect(splitViewButton).toBeVisible();

    const gridViewButton = page.getByTitle('Grid View');
    await expect(gridViewButton).toBeVisible();

    const listViewButton = page.getByTitle('List View');
    await expect(listViewButton).toBeVisible();

    // Check for search input
    const searchInput = page.getByPlaceholder('Search products & media...');
    await expect(searchInput).toBeVisible();

    // Check for category buttons
    await expect(page.getByRole('button', { name: 'All Media' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Marketing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menus' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Brand' })).toBeVisible();

    // Check for item count
    const itemCount = page.locator('text=/\\d+ items/');
    await expect(itemCount).toBeVisible();

    console.log('✅ All toolbar elements are visible!');
  });
});
