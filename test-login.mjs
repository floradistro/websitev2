import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER ${msg.type()}] ${text}`);
  });

  // Navigate to login page
  console.log('\n🔹 STEP 1: Navigating to login page...');
  await page.goto('http://localhost:3000/vendor/login');
  await page.waitForLoadState('networkidle');

  // Fill in login form
  console.log('🔹 STEP 2: Filling in login form...');
  await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
  await page.fill('input[type="password"]', 'password123');

  // Click login button
  console.log('🔹 STEP 3: Clicking login button...');
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  console.log('🔹 STEP 4: Waiting for login response...');
  await page.waitForURL('**/vendor/apps', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Check localStorage after login
  console.log('\n💾 STEP 5: Checking localStorage after login...');
  let localStorage = await page.evaluate(() => {
    return {
      app_user: localStorage.getItem('app_user'),
      app_locations: localStorage.getItem('app_locations'),
      app_accessible_apps: localStorage.getItem('app_accessible_apps')
    };
  });
  console.log('app_locations after login:', localStorage.app_locations ? JSON.parse(localStorage.app_locations).length + ' locations' : 'NULL');

  // Navigate to POS register
  console.log('\n🔹 STEP 6: Navigating to POS register (first time)...');
  await page.goto('http://localhost:3000/pos/register');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check localStorage in POS
  console.log('\n💾 STEP 7: Checking localStorage in POS (first visit)...');
  localStorage = await page.evaluate(() => {
    return {
      app_user: localStorage.getItem('app_user'),
      app_locations: localStorage.getItem('app_locations'),
      app_accessible_apps: localStorage.getItem('app_accessible_apps')
    };
  });
  console.log('app_locations in POS (first visit):', localStorage.app_locations ? JSON.parse(localStorage.app_locations).length + ' locations' : 'NULL');

  // Try to select a location if the selector appears
  console.log('\n🔹 STEP 7b: Checking if location selector is visible...');
  const locationButtons = await page.locator('button:has-text("Charlotte Central")').count();
  if (locationButtons > 0) {
    console.log('✅ Found location selector - clicking Charlotte Central...');
    await page.click('button:has-text("Charlotte Central")');
    await page.waitForTimeout(2000);
  } else {
    console.log('ℹ️  No location selector (auto-selected or already selected)');
  }

  // Try to select a register if the selector appears
  console.log('\n🔹 STEP 7c: Checking if register selector is visible...');
  const registerButtons = await page.locator('button:has-text("Register")').count();
  if (registerButtons > 0) {
    console.log('✅ Found register selector - clicking first register...');
    await page.locator('button:has-text("Register")').first().click();
    await page.waitForTimeout(3000);
  } else {
    console.log('ℹ️  No register selector visible');
  }

  // Navigate back to dashboard
  console.log('\n🔹 STEP 8: Navigating back to dashboard...');
  await page.goto('http://localhost:3000/vendor/apps');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check localStorage in dashboard
  console.log('\n💾 STEP 9: Checking localStorage in dashboard...');
  localStorage = await page.evaluate(() => {
    return {
      app_user: localStorage.getItem('app_user'),
      app_locations: localStorage.getItem('app_locations'),
      app_accessible_apps: localStorage.getItem('app_accessible_apps')
    };
  });
  console.log('app_locations in dashboard:', localStorage.app_locations ? JSON.parse(localStorage.app_locations).length + ' locations' : 'NULL');

  // Navigate to POS register again
  console.log('\n🔹 STEP 10: Navigating to POS register (second time - THE BUG)...');
  await page.goto('http://localhost:3000/pos/register');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check localStorage in POS again
  console.log('\n💾 STEP 11: Checking localStorage in POS (second visit)...');
  localStorage = await page.evaluate(() => {
    return {
      app_user: localStorage.getItem('app_user'),
      app_locations: localStorage.getItem('app_locations'),
      app_accessible_apps: localStorage.getItem('app_accessible_apps')
    };
  });
  console.log('app_locations in POS (second visit):', localStorage.app_locations ? JSON.parse(localStorage.app_locations).length + ' locations' : 'NULL');

  // Check what's actually rendered on the page
  console.log('\n🔍 STEP 12: Checking what is actually rendered on page...');
  const pageText = await page.textContent('body');

  if (pageText.includes('No locations available') || pageText.includes('NO LOCATIONS AVAILABLE')) {
    console.log('❌ BUG CONFIRMED: Page shows "No locations available"');
  } else if (pageText.includes('Select Location')) {
    console.log('✅ Page shows location selector (locations exist)');
  } else if (pageText.includes('Select Register')) {
    console.log('✅ Page shows register selector (location already selected)');
  } else {
    console.log('❓ Unknown state - page text:', pageText.substring(0, 200));
  }

  // Take screenshot
  await page.screenshot({ path: 'pos-no-locations-bug.png', fullPage: true });
  console.log('\n📸 Screenshot saved as pos-no-locations-bug.png');

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TEST SUMMARY - Reproducing "No Locations Found" Bug');
  console.log('='.repeat(80));
  console.log('Navigation path: Login → Dashboard → POS → Dashboard → POS');
  console.log('Expected: Locations should persist across navigation');
  console.log('Actual: Check the screenshot and console logs above');
  console.log('='.repeat(80));

  // Keep browser open for inspection
  console.log('\n✅ Test complete. Browser will stay open for 60 seconds...');
  await page.waitForTimeout(60000);

  await browser.close();
})();
