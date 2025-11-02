import { chromium } from 'playwright';

(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 SPECIFIC TEST: End Session → Dashboard → POS');
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📍') || text.includes('❌') || text.includes('⚠️') || text.includes('🔐')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  try {
    // Step 1: Login
    console.log('\n1️⃣  STEP 1: Login');
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/apps', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully');

    // Step 2: Navigate to POS
    console.log('\n2️⃣  STEP 2: Navigate to POS');
    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const storage1 = await page.evaluate(() => localStorage.getItem('app_locations'));
    const locations1 = storage1 ? JSON.parse(storage1).length : 0;
    console.log(`📍 Locations available: ${locations1}`);

    // Step 3: Select location
    console.log('\n3️⃣  STEP 3: Select location');
    const locationButton = await page.locator('button:has-text("Charlotte Central")').first();
    if (await locationButton.count() > 0) {
      await locationButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Location selected');
    }

    // Step 4: Select register and start session
    console.log('\n4️⃣  STEP 4: Select register and start session');
    const registerButton = await page.locator('button:has-text("Register")').first();
    if (await registerButton.count() > 0) {
      await registerButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Register selected, session started');
    }

    // Step 5: End session
    console.log('\n5️⃣  STEP 5: End session');
    const endSessionButton = await page.locator('button:has-text("End Session")').first();
    if (await endSessionButton.count() > 0) {
      await endSessionButton.click();
      await page.waitForTimeout(1000);

      // Confirm the modal if it appears
      const confirmButton = await page.locator('button:has-text("Confirm")').first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Session ended');
      }
    } else {
      console.log('⚠️  No "End Session" button found - trying close button...');

      const closeButton = await page.locator('button:has-text("Close Register")').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Register closed');
      }
    }

    // Check storage after ending session
    const storage2 = await page.evaluate(() => localStorage.getItem('app_locations'));
    const locations2 = storage2 ? JSON.parse(storage2).length : 0;
    console.log(`📍 Locations after ending session: ${locations2}`);

    // Step 6: Navigate to dashboard
    console.log('\n6️⃣  STEP 6: Navigate to Dashboard');
    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const storage3 = await page.evaluate(() => localStorage.getItem('app_locations'));
    const locations3 = storage3 ? JSON.parse(storage3).length : 0;
    console.log(`📍 Locations on dashboard: ${locations3}`);

    // Step 7: Navigate back to POS (THE CRITICAL TEST)
    console.log('\n7️⃣  STEP 7: Navigate back to POS (CRITICAL TEST)');
    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const storage4 = await page.evaluate(() => localStorage.getItem('app_locations'));
    const locations4 = storage4 ? JSON.parse(storage4).length : 0;
    console.log(`📍 Locations after returning to POS: ${locations4}`);

    // Check for "No locations available" message
    const noLocationsMessage = await page.locator('text=No locations available').count();
    const hasLocationSelector = await page.locator('text=Select Location').count();

    // Take screenshot
    await page.screenshot({ path: 'test-session-end-scenario.png', fullPage: true });

    // Final verdict
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(80));

    if (locations4 >= 6 && noLocationsMessage === 0 && hasLocationSelector > 0) {
      console.log('✅ SUCCESS: Locations persist correctly after ending session');
      console.log(`   - Locations available: ${locations4}`);
      console.log(`   - Location selector visible: Yes`);
      console.log(`   - No error messages: Yes`);
    } else {
      console.log('❌ FAILURE: Location persistence issue detected');
      console.log(`   - Locations available: ${locations4} (expected ≥6)`);
      console.log(`   - "No locations" error shown: ${noLocationsMessage > 0 ? 'YES' : 'NO'}`);
      console.log(`   - Location selector visible: ${hasLocationSelector > 0 ? 'YES' : 'NO'}`);
    }

    console.log('\n📸 Screenshot saved as test-session-end-scenario.png');
    console.log('\n⏳ Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n💥 TEST ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
