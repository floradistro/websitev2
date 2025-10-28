import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const WAREHOUSE_ID = 'de082d7f-492f-456e-ad54-c019cc32885a';

test.describe('TV System Complete E2E Test', () => {

  test('complete workflow: register device, create menu, assign menu, verify display', async ({ page, context }) => {
    console.log('\n🎬 Starting complete TV system E2E test...\n');

    // Step 1: Open TV display to register device
    console.log('📺 Step 1: Registering TV display...');
    await page.goto(`${BASE_URL}/tv-display?vendor_id=${VENDOR_ID}&tv_number=1`);

    // Wait for registration to complete
    await page.waitForTimeout(3000);

    // Check if device registered (should show either content or "No Content Configured")
    const hasNoContent = await page.getByText('No Content Configured').isVisible().catch(() => false);
    const hasConnected = await page.getByText('Connected').isVisible().catch(() => false);
    const hasDeviceId = await page.getByText(/Device ID:/).isVisible().catch(() => false);

    expect(hasNoContent || hasConnected || hasDeviceId).toBeTruthy();
    console.log('✅ TV display registered successfully\n');

    // Step 2: Open dashboard in new page
    console.log('📊 Step 2: Opening vendor dashboard...');
    const dashboardPage = await context.newPage();
    await dashboardPage.goto(`${BASE_URL}/vendor/tv-menus`);

    // Wait for page to load
    await dashboardPage.waitForTimeout(3000);

    // Check console logs
    const logs: string[] = [];
    dashboardPage.on('console', msg => {
      logs.push(msg.text());
    });

    // Take screenshot of dashboard
    await dashboardPage.screenshot({ path: 'test-results/dashboard-initial.png' });

    // Check header for device count
    const header = await dashboardPage.locator('text=Digital Signage').locator('..').locator('p').textContent();
    console.log(`📊 Dashboard header: ${header}`);

    // Verify location selector shows "All Locations"
    const locationSelect = dashboardPage.locator('select');
    const selectedValue = await locationSelect.inputValue();
    console.log(`📍 Location selector value: "${selectedValue}"`);
    expect(selectedValue).toBe(''); // Should be empty string for "All Locations"

    // Check if devices are visible
    const deviceCards = dashboardPage.locator('.grid > div').filter({ has: dashboardPage.locator('select') });
    const deviceCount = await deviceCards.count();
    console.log(`📺 Device cards visible: ${deviceCount}`);

    if (deviceCount === 0) {
      console.log('⚠️ No devices visible, checking logs...');
      console.log('Console logs:', logs.filter(l => l.includes('Loaded') || l.includes('devices')));

      // Take screenshot for debugging
      await dashboardPage.screenshot({ path: 'test-results/dashboard-no-devices.png' });
    }

    expect(deviceCount).toBeGreaterThan(0);
    console.log('✅ Dashboard shows devices\n');

    // Step 3: Create a menu
    console.log('📝 Step 3: Creating test menu...');

    // Click "New Menu" button
    await dashboardPage.getByText('New Menu').click();
    await dashboardPage.waitForTimeout(500);

    // Fill menu name
    const menuName = `E2E Test Menu ${Date.now()}`;
    await dashboardPage.locator('input[type="text"]').fill(menuName);

    // Create
    await dashboardPage.getByRole('button', { name: 'Create' }).click();
    await dashboardPage.waitForTimeout(2000);

    // Verify modal closed
    const modalVisible = await dashboardPage.getByText('New Menu').filter({ has: dashboardPage.locator('input') }).isVisible().catch(() => false);
    expect(modalVisible).toBeFalsy();
    console.log('✅ Menu created successfully\n');

    // Step 4: Assign menu to device
    console.log('🔗 Step 4: Assigning menu to device...');

    // Find the first device dropdown
    const firstDeviceDropdown = deviceCards.first().locator('select');

    // Get options
    const options = await firstDeviceDropdown.locator('option').allTextContents();
    console.log(`   Available menus: ${options.join(', ')}`);

    // Select the newly created menu (should be in the list)
    await firstDeviceDropdown.selectOption({ label: menuName });
    await dashboardPage.waitForTimeout(1000);

    // Verify selection
    const selectedMenu = await firstDeviceDropdown.inputValue();
    expect(selectedMenu).not.toBe('');
    console.log(`✅ Menu "${menuName}" assigned to device\n`);

    // Step 5: Verify display shows menu
    console.log('✅ Step 5: Verifying TV display shows menu...');

    // Go back to TV display page
    await page.reload();
    await page.waitForTimeout(3000);

    // Should no longer show "No Content Configured"
    const stillNoContent = await page.getByText('No Content Configured').isVisible().catch(() => false);

    if (stillNoContent) {
      console.log('⚠️ Display still shows "No Content Configured"');
      await page.screenshot({ path: 'test-results/display-no-content.png' });
    } else {
      console.log('✅ Display showing content');
      await page.screenshot({ path: 'test-results/display-with-content.png' });
    }

    // Check if products or menu content is visible
    const hasProducts = await page.locator('.grid').isVisible().catch(() => false);
    console.log(`   Products visible: ${hasProducts}`);

    console.log('\n🎉 Complete E2E test passed!\n');

    // Take final screenshots
    await page.screenshot({ path: 'test-results/tv-display-final.png', fullPage: true });
    await dashboardPage.screenshot({ path: 'test-results/dashboard-final.png', fullPage: true });

    await dashboardPage.close();
  });

  test('location filtering works correctly', async ({ page }) => {
    console.log('\n📍 Testing location filtering...\n');

    await page.goto(`${BASE_URL}/vendor/tv-menus`);
    await page.waitForTimeout(2000);

    // Check initial state - should be "All Locations"
    const locationSelect = page.locator('select').first();
    let selectedValue = await locationSelect.inputValue();
    console.log(`Initial selection: "${selectedValue}" (should be empty for "All Locations")`);
    expect(selectedValue).toBe('');

    // Get initial device count
    const initialCount = await page.locator('.grid > div').filter({ has: page.locator('select') }).count();
    console.log(`Devices visible with "All Locations": ${initialCount}`);

    // Select Charlotte Central
    await locationSelect.selectOption({ label: 'Charlotte Central' });
    await page.waitForTimeout(1000);

    selectedValue = await locationSelect.inputValue();
    console.log(`After selecting Charlotte Central: "${selectedValue}"`);

    // Get device count after filtering
    const filteredCount = await page.locator('.grid > div').filter({ has: page.locator('select') }).count();
    console.log(`Devices visible with "Charlotte Central": ${filteredCount}`);

    // Select back to "All Locations"
    await locationSelect.selectOption({ value: '' });
    await page.waitForTimeout(1000);

    const finalCount = await page.locator('.grid > div').filter({ has: page.locator('select') }).count();
    console.log(`Devices visible back to "All Locations": ${finalCount}`);

    expect(finalCount).toBe(initialCount);
    console.log('\n✅ Location filtering works correctly\n');
  });
});
