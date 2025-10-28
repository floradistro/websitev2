import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const LOCATION_ID = 'de082d7f-492f-456e-ad54-c019cc32885a';

test.describe('TV Menu System', () => {

  test('vendor dashboard loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus`);

    // Should show digital signage header
    await expect(page.getByText('Digital Signage')).toBeVisible();

    // Should show stats cards
    await expect(page.getByText('Total Menus')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();

    // Should show create button
    await expect(page.getByText('Create Menu')).toBeVisible();

    console.log('✅ Vendor dashboard loaded successfully');
  });

  test('create menu page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/create`);

    // Should show form fields
    await expect(page.getByText('Create TV Menu')).toBeVisible();
    await expect(page.getByText('Menu Name')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Location')).toBeVisible();

    console.log('✅ Create menu page loaded successfully');
  });

  test('TV display page loads with valid params', async ({ page }) => {
    const url = `${BASE_URL}/tv-display?vendor_id=${VENDOR_ID}&location_id=${LOCATION_ID}&tv_number=1`;
    await page.goto(url);

    // Wait for loading to complete
    await page.waitForTimeout(3000);

    // Should not show loading spinner after 3 seconds
    const loadingSpinner = page.getByText('Loading display...');
    await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });

    // Should show either content or "No Content Configured"
    const hasNoContent = await page.getByText('No Content Configured').isVisible().catch(() => false);
    const hasConnected = await page.getByText('Connected').isVisible().catch(() => false);

    expect(hasNoContent || hasConnected).toBeTruthy();

    console.log('✅ TV display page loaded successfully');
  });

  test('TV display shows error with missing vendor_id', async ({ page }) => {
    await page.goto(`${BASE_URL}/tv-display?tv_number=1`);

    // Should show error
    await expect(page.getByText('Missing vendor_id')).toBeVisible({ timeout: 5000 });

    console.log('✅ TV display shows proper error for missing params');
  });

  test('TV display shows error with invalid tv_number', async ({ page }) => {
    await page.goto(`${BASE_URL}/tv-display?vendor_id=${VENDOR_ID}&tv_number=invalid`);

    // Should show error - wait for either error message to appear
    const displayError = page.getByText('Display Error');
    const invalidNumber = page.getByText(/Invalid tv_number/i);

    await Promise.race([
      displayError.waitFor({ timeout: 5000 }),
      invalidNumber.waitFor({ timeout: 5000 })
    ]);

    const errorVisible = await displayError.isVisible() || await invalidNumber.isVisible();
    expect(errorVisible).toBeTruthy();

    console.log('✅ TV display validates tv_number correctly');
  });
});

test.describe('TV Menu CRUD Operations', () => {

  test('can create a new menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/create`);

    // Fill out form
    await page.fill('input[type="text"]', 'Test Menu - Playwright');
    await page.fill('textarea', 'Created by automated test');

    // Submit form
    await page.click('button:has-text("Create Menu")');

    // Should redirect to dashboard
    await page.waitForURL(`${BASE_URL}/vendor/tv-menus`, { timeout: 10000 });

    // Should show new menu
    await expect(page.getByText('Test Menu - Playwright')).toBeVisible({ timeout: 5000 });

    console.log('✅ Menu created successfully');
  });
});

test.describe('Performance Tests', () => {

  test('vendor dashboard loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/vendor/tv-menus`);
    await page.waitForSelector('text=Digital Signage');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
    console.log(`✅ Dashboard loaded in ${loadTime}ms`);
  });

  test('TV display registers device quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/tv-display?vendor_id=${VENDOR_ID}&location_id=${LOCATION_ID}&tv_number=999`);

    // Wait for either connection status or no content message (both mean device registered)
    await Promise.race([
      page.waitForSelector('text=Connected', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('text=No Content Configured', { timeout: 5000 }).catch(() => null)
    ]);

    const loadTime = Date.now() - startTime;

    // Verify device registered by checking for either success state
    const hasConnected = await page.getByText('Connected').isVisible().catch(() => false);
    const hasNoContent = await page.getByText('No Content Configured').isVisible().catch(() => false);
    const hasDeviceId = await page.getByText(/Device ID:/).isVisible().catch(() => false);

    expect(hasConnected || hasNoContent || hasDeviceId).toBeTruthy();
    expect(loadTime).toBeLessThan(5000);
    console.log(`✅ Device registered in ${loadTime}ms`);
  });
});
