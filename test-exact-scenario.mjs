import { chromium } from 'playwright';

(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 EXACT SCENARIO TEST: Login → Select Location → Select Register → End Session → Dashboard → POS');
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📍') || text.includes('✅') || text.includes('❌') || text.includes('⚠️')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  try {
    // STEP 1: Login
    console.log('\n1️⃣  Login');
    console.log('-'.repeat(40));
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    // Check if already logged in
    if (page.url().includes('/vendor/apps')) {
      console.log('✅ Already logged in');
    } else {
      await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      try {
        await page.waitForURL('**/vendor/apps', { timeout: 10000 });
        console.log('✅ Login successful');
      } catch (e) {
        console.log('⚠️  Already at dashboard');
      }
    }
    await page.waitForTimeout(2000);

    // STEP 2: Navigate to POS
    console.log('\n2️⃣  Navigate to POS');
    console.log('-'.repeat(40));
    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const storage1 = await page.evaluate(() => localStorage.getItem('app_locations'));
    const locations1 = storage1 ? JSON.parse(storage1).length : 0;
    console.log(`📍 Locations in localStorage: ${locations1}`);

    // STEP 3: Select Location
    console.log('\n3️⃣  Select Location');
    console.log('-'.repeat(40));
    const locationButton = await page.locator('button:has-text("Charlotte Central")').first();
    const hasLocationSelector = await locationButton.count() > 0;

    if (hasLocationSelector) {
      console.log('✅ Location selector visible');
      await locationButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Charlotte Central selected');

      // Check if location was persisted
      const savedLocation = await page.evaluate(() => localStorage.getItem('pos_selected_location'));
      console.log(`💾 Saved location in localStorage: ${savedLocation ? 'YES' : 'NO'}`);
    } else {
      console.log('⚠️  No location selector - might be auto-selected');
    }

    // STEP 4: Select Register
    console.log('\n4️⃣  Select Register');
    console.log('-'.repeat(40));
    const registerButton = await page.locator('button').filter({ hasText: /^Register \d+/ }).first();
    const hasRegisterSelector = await registerButton.count() > 0;

    if (hasRegisterSelector) {
      console.log('✅ Register selector visible');
      await registerButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Register selected, POS loaded');
    } else {
      console.log('❌ No register selector found');
    }

    // STEP 5: End Session
    console.log('\n5️⃣  End Session');
    console.log('-'.repeat(40));

    // Look for close/end session button in the dropdown or header
    const endSessionBtn = await page.locator('button, a').filter({ hasText: /End Session|Close.*Session|Close Register/i }).first();
    const hasEndButton = await endSessionBtn.count() > 0;

    if (hasEndButton) {
      await endSessionBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked end session button');

      // Handle confirmation modal if it appears
      const confirmBtn = await page.locator('button').filter({ hasText: /^Confirm|^Yes|^End/ }).first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Confirmed session end');
      }
    } else {
      console.log('⚠️  End session button not found - checking for logout/close options');
    }

    // Check storage after ending session
    const storage2 = await page.evaluate(() => ({
      locations: localStorage.getItem('app_locations'),
      selectedLocation: localStorage.getItem('pos_selected_location')
    }));
    const locations2 = storage2.locations ? JSON.parse(storage2.locations).length : 0;
    console.log(`📍 Locations after ending session: ${locations2}`);
    console.log(`💾 Selected location still saved: ${storage2.selectedLocation ? 'YES' : 'NO'}`);

    // STEP 6: Click Breadcrumb to Dashboard
    console.log('\n6️⃣  Click Breadcrumb to Dashboard');
    console.log('-'.repeat(40));

    const dashboardLink = await page.locator('a[href="/vendor/apps"], a:has-text("Dashboard")').first();
    const hasDashboardLink = await dashboardLink.count() > 0;

    if (hasDashboardLink) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to dashboard via breadcrumb');
    } else {
      console.log('⚠️  Breadcrumb not found - using direct navigation');
      await page.goto('http://localhost:3000/vendor/apps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    const storage3 = await page.evaluate(() => ({
      locations: localStorage.getItem('app_locations'),
      selectedLocation: localStorage.getItem('pos_selected_location')
    }));
    const locations3 = storage3.locations ? JSON.parse(storage3.locations).length : 0;
    console.log(`📍 Locations on dashboard: ${locations3}`);
    console.log(`💾 Selected location persisted: ${storage3.selectedLocation ? 'YES' : 'NO'}`);

    // STEP 7: Click POS App Again (CRITICAL TEST)
    console.log('\n7️⃣  Click POS App Again (CRITICAL TEST)');
    console.log('-'.repeat(40));

    const posAppLink = await page.locator('a[href="/pos/register"], a:has-text("POS")').first();
    const hasPosLink = await posAppLink.count() > 0;

    if (hasPosLink) {
      await posAppLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✅ Clicked POS app');
    } else {
      console.log('⚠️  POS link not found - using direct navigation');
      await page.goto('http://localhost:3000/pos/register');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    // FINAL CHECKS
    const storage4 = await page.evaluate(() => ({
      locations: localStorage.getItem('app_locations'),
      selectedLocation: localStorage.getItem('pos_selected_location')
    }));
    const locations4 = storage4.locations ? JSON.parse(storage4.locations).length : 0;
    const selectedLoc4 = storage4.selectedLocation ? JSON.parse(storage4.selectedLocation) : null;

    console.log(`📍 Locations in localStorage: ${locations4}`);
    console.log(`💾 Selected location: ${selectedLoc4 ? selectedLoc4.name : 'NONE'}`);

    // Check what's rendered on page
    const noLocationsMsg = await page.locator('text=No locations available').count();
    const hasLocationSelector2 = await page.locator('text=Select Location').count();
    const hasRegisterSelector2 = await page.locator('text=Select Register').count();

    // Take screenshot
    await page.screenshot({ path: 'test-exact-scenario-result.png', fullPage: true });

    // VERDICT
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL VERDICT');
    console.log('='.repeat(80));

    const testPassed = locations4 >= 6 && noLocationsMsg === 0 && (hasRegisterSelector2 > 0 || hasLocationSelector2 > 0);

    if (testPassed) {
      console.log('✅ SUCCESS: Location persistence works perfectly!');
      console.log(`   - Locations available: ${locations4}`);
      console.log(`   - Selected location persisted: ${selectedLoc4 ? 'YES' : 'NO'}`);
      console.log(`   - No "No locations" error: ${noLocationsMsg === 0 ? 'YES' : 'NO'}`);
      console.log(`   - Correct screen shown: ${hasRegisterSelector2 > 0 ? 'Register Selector' : 'Location Selector'}`);
    } else {
      console.log('❌ FAILURE: Location persistence broken!');
      console.log(`   - Locations available: ${locations4} (expected ≥6)`);
      console.log(`   - Selected location persisted: ${selectedLoc4 ? 'YES' : 'NO'}`);
      console.log(`   - "No locations" error shown: ${noLocationsMsg > 0 ? 'YES' : 'NO'}`);
      console.log(`   - Location selector visible: ${hasLocationSelector2 > 0 ? 'YES' : 'NO'}`);
      console.log(`   - Register selector visible: ${hasRegisterSelector2 > 0 ? 'YES' : 'NO'}`);
    }

    console.log('\n📸 Screenshot saved as test-exact-scenario-result.png');
    console.log('\n⏳ Browser will stay open for 60 seconds for inspection...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n💥 TEST ERROR:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
