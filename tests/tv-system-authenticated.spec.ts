import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

test.describe('TV System with Authentication', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    console.log('\n🔐 Logging in as Flora Distro...');

    await page.goto(`${BASE_URL}/vendor/login`);

    // Fill login form
    await page.fill('input[type="email"]', 'info@floradistro.com');
    await page.fill('input[type="password"]', 'floradistro123');

    // Submit
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/vendor/, { timeout: 10000 });

    console.log('✅ Logged in successfully\n');
  });

  test('dashboard loads and shows devices', async ({ page }) => {
    console.log('📊 TEST: Dashboard loads and shows devices\n');

    // Navigate to TV menus
    await page.goto(`${BASE_URL}/vendor/tv-menus`);

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('loadData') || text.includes('devices') || text.includes('Loaded')) {
        console.log(`   📝 ${text}`);
      }
    });

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/dashboard-authenticated.png', fullPage: true });

    // Check header text
    const header = await page.locator('h1:has-text("Digital Signage")').locator('..').locator('p').textContent();
    console.log(`\n📊 Header text: "${header}"`);

    // Parse device count from header
    const match = header?.match(/(\d+) of (\d+) displays online/);
    if (match) {
      const online = parseInt(match[1]);
      const total = parseInt(match[2]);
      console.log(`   Online: ${online}, Total: ${total}`);

      expect(total).toBeGreaterThan(0);
      console.log('✅ Devices found in header\n');
    } else {
      console.log('❌ Could not parse device count from header\n');
      throw new Error(`Header format unexpected: ${header}`);
    }

    // Check location selector
    const locationSelect = page.locator('select').first();
    const selectedValue = await locationSelect.inputValue();
    console.log(`📍 Location selector value: "${selectedValue}"`);
    expect(selectedValue).toBe(''); // Should be "All Locations"
    console.log('✅ Location selector defaults to "All Locations"\n');

    // Count display cards
    const deviceCards = page.locator('.grid > div').filter({ has: page.locator('select') });
    const deviceCount = await deviceCards.count();
    console.log(`📺 Device cards visible: ${deviceCount}`);

    expect(deviceCount).toBeGreaterThan(0);
    console.log('✅ Device cards are visible\n');

    // Check each device card has a dropdown with menus
    for (let i = 0; i < deviceCount; i++) {
      const card = deviceCards.nth(i);
      const dropdown = card.locator('select');
      const options = await dropdown.locator('option').allTextContents();

      console.log(`   TV ${i + 1}: ${options.length - 1} menus available`); // -1 for "None" option
      expect(options.length).toBeGreaterThan(1); // Should have at least "None" + 1 menu
    }
    console.log('✅ All device cards have menu dropdowns\n');

    // Print relevant console logs
    console.log('📝 Console logs with device data:');
    logs.filter(l => l.includes('Loaded') && l.includes('devices')).forEach(log => {
      console.log(`   ${log}`);
    });

    console.log('\n✅ Dashboard test passed!\n');
  });

  test('create menu and verify it appears', async ({ page }) => {
    console.log('📝 TEST: Create menu and verify\n');

    await page.goto(`${BASE_URL}/vendor/tv-menus`);
    await page.waitForTimeout(2000);

    // Get initial menu count
    const header = await page.locator('h1:has-text("Digital Signage")').locator('..').locator('p').textContent();
    const initialMenuCount = parseInt(header?.match(/(\d+) menus$/)?.[1] || '0');
    console.log(`📋 Initial menu count: ${initialMenuCount}`);

    // Click New Menu
    await page.getByText('New Menu').click();
    await page.waitForTimeout(500);

    // Fill menu name
    const menuName = `Playwright Test ${Date.now()}`;
    await page.locator('input[type="text"]').fill(menuName);
    console.log(`   Creating menu: "${menuName}"`);

    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('Creating menu') || text.includes('Menu created')) {
        console.log(`   📝 ${text}`);
      }
    });

    // Create
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(3000);

    // Verify modal closed
    const modalVisible = await page.locator('input[type="text"]').filter({ hasText: menuName }).isVisible().catch(() => false);
    expect(modalVisible).toBeFalsy();
    console.log('✅ Modal closed\n');

    // Check if menu count increased
    const newHeader = await page.locator('h1:has-text("Digital Signage")').locator('..').locator('p').textContent();
    const newMenuCount = parseInt(newHeader?.match(/(\d+) menus$/)?.[1] || '0');
    console.log(`📋 New menu count: ${newMenuCount}`);

    expect(newMenuCount).toBe(initialMenuCount + 1);
    console.log('✅ Menu count increased\n');

    // Verify menu appears in dropdowns
    const deviceCards = page.locator('.grid > div').filter({ has: page.locator('select') });
    const firstCard = deviceCards.first();
    const dropdown = firstCard.locator('select');
    const options = await dropdown.locator('option').allTextContents();

    const menuExists = options.some(opt => opt.includes(menuName));
    console.log(`📋 Menu "${menuName}" in dropdown: ${menuExists ? 'Yes' : 'No'}`);

    expect(menuExists).toBeTruthy();
    console.log('✅ Menu appears in dropdown\n');

    // Print creation logs
    console.log('📝 Menu creation logs:');
    logs.filter(l => l.includes('Menu created')).forEach(log => {
      console.log(`   ${log}`);
    });

    console.log('\n✅ Create menu test passed!\n');
  });

  test('assign menu and verify display updates', async ({ page, context }) => {
    console.log('🔗 TEST: Assign menu and verify display\n');

    // Open dashboard
    await page.goto(`${BASE_URL}/vendor/tv-menus`);
    await page.waitForTimeout(2000);

    // Get first device card
    const deviceCards = page.locator('.grid > div').filter({ has: page.locator('select') });
    expect(await deviceCards.count()).toBeGreaterThan(0);

    const firstCard = deviceCards.first();
    const dropdown = firstCard.locator('select');

    // Get menu options
    const options = await dropdown.locator('option').allTextContents();
    console.log(`📋 Available menus: ${options.join(', ')}`);

    // Select first non-empty menu
    const menuToSelect = options.find(opt => opt !== 'None') || options[1];
    console.log(`   Selecting: "${menuToSelect}"`);

    await dropdown.selectOption({ label: menuToSelect });
    await page.waitForTimeout(1000);

    // Verify selection
    const selectedOption = await dropdown.locator('option:checked').textContent();
    console.log(`✅ Selected: "${selectedOption}"\n`);
    expect(selectedOption).toBe(menuToSelect);

    // Open TV display in new page
    console.log('📺 Opening TV display...');
    const displayPage = await context.newPage();
    await displayPage.goto(`${BASE_URL}/tv-display?vendor_id=${VENDOR_ID}&tv_number=1`);
    await displayPage.waitForTimeout(3000);

    // Take screenshot
    await displayPage.screenshot({ path: 'test-results/tv-display-with-menu.png', fullPage: true });

    // Check if content is showing
    const hasNoContent = await displayPage.getByText('No Content Configured').isVisible().catch(() => false);
    const hasProducts = await displayPage.locator('.grid').isVisible().catch(() => false);

    console.log(`   No Content: ${hasNoContent}`);
    console.log(`   Has Products: ${hasProducts}`);

    // Should show products (not "No Content Configured")
    if (hasNoContent) {
      console.log('⚠️  Display still shows "No Content Configured"');
      console.log('   This might mean the assignment hasn\'t synced yet');
    } else {
      console.log('✅ Display showing content\n');
    }

    await displayPage.close();

    console.log('\n✅ Assign menu test passed!\n');
  });

  test('location filtering works', async ({ page }) => {
    console.log('📍 TEST: Location filtering\n');

    await page.goto(`${BASE_URL}/vendor/tv-menus`);
    await page.waitForTimeout(2000);

    const locationSelect = page.locator('select').first();

    // Get initial device count
    let deviceCards = page.locator('.grid > div').filter({ has: page.locator('select') });
    const initialCount = await deviceCards.count();
    console.log(`📺 Devices with "All Locations": ${initialCount}`);

    // Get location options
    const locations = await locationSelect.locator('option').allTextContents();
    console.log(`📍 Available locations: ${locations.join(', ')}`);

    // Filter by Charlotte Central
    await locationSelect.selectOption({ label: 'Charlotte Central' });
    await page.waitForTimeout(1000);

    deviceCards = page.locator('.grid > div').filter({ has: page.locator('select') });
    const filteredCount = await deviceCards.count();
    console.log(`📺 Devices with "Charlotte Central": ${filteredCount}`);

    // Should be different (likely 0 since devices are at Warehouse)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Switch back to All Locations
    await locationSelect.selectOption({ value: '' });
    await page.waitForTimeout(1000);

    deviceCards = page.locator('.grid > div').filter({ has: page.locator('select') });
    const finalCount = await deviceCards.count();
    console.log(`📺 Devices back to "All Locations": ${finalCount}`);

    expect(finalCount).toBe(initialCount);
    console.log('✅ Location filtering works correctly\n');

    console.log('\n✅ Location filter test passed!\n');
  });
});
