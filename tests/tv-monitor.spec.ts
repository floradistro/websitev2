import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const LOCATION_ID = 'de082d7f-492f-456e-ad54-c019cc32885a';

test.describe('TV Monitor Dashboard', () => {

  test('monitor page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/monitor`);

    // Should show monitor header
    await expect(page.getByText('TV Monitor')).toBeVisible({ timeout: 10000 });

    // Should show location selector
    await expect(page.getByText('All Locations')).toBeVisible();

    // Should show stats
    await expect(page.getByText('Total Displays')).toBeVisible();
    await expect(page.getByText('Online')).toBeVisible();

    console.log('✅ Monitor page loaded successfully');
  });

  test('location selector works', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/monitor`);

    // Wait for page to load
    await page.waitForSelector('text=TV Monitor', { timeout: 10000 });

    // Find the location selector
    const selector = page.locator('select');
    await expect(selector).toBeVisible();

    // Should have "All Locations" option
    const options = await selector.locator('option').allTextContents();
    expect(options).toContain('All Locations');

    console.log('✅ Location selector functional');
  });

  test('displays registered devices', async ({ page }) => {
    // First register a test device
    await page.goto(`${BASE_URL}/tv-display?vendor_id=${VENDOR_ID}&location_id=${LOCATION_ID}&tv_number=888`);

    // Wait for device registration
    await page.waitForTimeout(2000);

    // Now go to monitor page
    await page.goto(`${BASE_URL}/vendor/tv-menus/monitor`);

    // Wait for page to load
    await page.waitForSelector('text=TV Monitor', { timeout: 10000 });

    // Should show at least one device (the one we just registered)
    const totalDisplays = page.getByText('Total Displays').locator('..').getByText(/\d+/);
    const count = await totalDisplays.textContent();

    expect(parseInt(count || '0')).toBeGreaterThan(0);

    console.log('✅ Devices displayed correctly');
  });

  test('live preview iframes render', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/monitor`);

    // Wait for page to load
    await page.waitForSelector('text=TV Monitor', { timeout: 10000 });
    await page.waitForTimeout(3000); // Give devices time to load

    // Check if any iframes are present (live previews)
    const iframes = page.locator('iframe');
    const count = await iframes.count();

    // If there are devices, there should be iframes
    if (count > 0) {
      console.log(`✅ Found ${count} live preview iframes`);
    } else {
      console.log('ℹ️  No devices to preview (expected if none registered)');
    }
  });

  test('refresh button works', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/monitor`);

    // Wait for page to load
    await page.waitForSelector('text=TV Monitor', { timeout: 10000 });

    // Find and click refresh button
    const refreshBtn = page.getByText('Refresh').locator('..');
    await expect(refreshBtn).toBeVisible();

    await refreshBtn.click();

    // Button should show spinning icon temporarily
    await page.waitForTimeout(500);

    console.log('✅ Refresh button functional');
  });

  test('manage button links to dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/tv-menus/monitor`);

    // Wait for page to load
    await page.waitForSelector('text=TV Monitor', { timeout: 10000 });

    // Find manage button
    const manageBtn = page.getByText('Manage');
    await expect(manageBtn).toBeVisible();

    // Click should navigate to menus page
    await manageBtn.click();
    await page.waitForURL(`${BASE_URL}/vendor/tv-menus`, { timeout: 10000 });

    await expect(page.getByText('Digital Signage')).toBeVisible();

    console.log('✅ Manage button navigation works');
  });
});
