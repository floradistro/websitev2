import { chromium } from 'playwright';

async function testLocationAccess() {
  console.log('🎭 Starting Playwright test for location access control...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to ALL console messages from the page
  page.on('console', msg => {
    const text = msg.text();
    console.log(`📋 Console: ${text}`);
  });

  try {
    // Go to login page
    console.log('🔐 Going to login page...');
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    // Fill in login form
    console.log('📝 Filling in login credentials...');
    await page.fill('input[name="email"]', 'charlottecental@floradistro.com');
    await page.fill('input[name="password"]', 'Nations123!');

    // Click login button
    console.log('🔑 Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/vendor/**', { timeout: 10000 });
    console.log('✅ Login successful!\n');

    // Navigate to TV menus page
    console.log('📺 Navigating to TV Menus page...');
    await page.goto('http://localhost:3000/vendor/tv-menus');
    await page.waitForLoadState('networkidle');

    // Wait for permissions to load
    console.log('⏳ Waiting for permissions to load...');
    await page.waitForTimeout(3000);

    // Check if location dropdown exists
    const locationDropdown = await page.locator('select').filter({ hasText: 'All Locations' }).first();
    const dropdownExists = await locationDropdown.count() > 0;

    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    console.log(`Location Dropdown Visible: ${dropdownExists ? '❌ YES (SHOULD BE HIDDEN)' : '✅ NO (CORRECT)'}`);

    // Get all select elements to see what's on the page
    const allSelects = await page.locator('select').all();
    console.log(`\nTotal <select> elements found: ${allSelects.length}`);

    for (let i = 0; i < allSelects.length; i++) {
      const options = await allSelects[i].locator('option').allTextContents();
      console.log(`  Select ${i + 1}: ${options.join(', ')}`);
    }

    // Check URL
    const url = page.url();
    console.log(`\nCurrent URL: ${url}`);

    // Take screenshot
    await page.screenshot({ path: '/Users/whale/Desktop/Website/tv-menus-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to: tv-menus-test.png');

    // Wait a bit so we can see the result
    console.log('\n⏳ Waiting 5 seconds before closing...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete!');
  }
}

testLocationAccess();
