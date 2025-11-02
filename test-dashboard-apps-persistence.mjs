import { chromium } from 'playwright';

(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 DASHBOARD APPS PERSISTENCE TEST');
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

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ============================================================================
    // TEST 1: Fresh Login
    // ============================================================================
    console.log('\n📋 TEST 1: Fresh Login - Apps Should Load');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    // Check if already logged in
    if (page.url().includes('/vendor/apps')) {
      console.log('⚠️  Already logged in, logging out first...');
      await page.goto('http://localhost:3000/vendor/apps');
      await page.waitForTimeout(1000);
      // Try to find logout button
      const logoutBtn = await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.goto('http://localhost:3000/vendor/login');
      await page.waitForLoadState('networkidle');
    }

    await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/vendor/apps', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if apps are visible
    const appsAfterLogin = await page.locator('a[href*="/pos"], a[href*="/vendor"]').count();
    console.log(`📱 Apps visible after login: ${appsAfterLogin}`);

    const noAppsMsg1 = await page.locator('text=No apps available').count();

    if (appsAfterLogin >= 3 && noAppsMsg1 === 0) {
      console.log('✅ TEST 1 PASSED: Apps loaded after login');
      testsPassed++;
    } else {
      console.log(`❌ TEST 1 FAILED: Expected ≥3 apps, got ${appsAfterLogin}. No apps message: ${noAppsMsg1 > 0 ? 'YES' : 'NO'}`);
      testsFailed++;
    }

    // ============================================================================
    // TEST 2: Navigate to Products → Back to Dashboard
    // ============================================================================
    console.log('\n📋 TEST 2: Products → Dashboard Navigation');
    console.log('-'.repeat(80));

    const productsLink = await page.locator('a[href="/vendor/products"]').first();
    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log('📦 Navigated to Products page');

      // Go back to dashboard
      await page.goto('http://localhost:3000/vendor/apps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const appsAfterProducts = await page.locator('a[href*="/pos"], a[href*="/vendor"]').count();
      const noAppsMsg2 = await page.locator('text=No apps available').count();

      console.log(`📱 Apps visible after returning: ${appsAfterProducts}`);

      if (appsAfterProducts >= 3 && noAppsMsg2 === 0) {
        console.log('✅ TEST 2 PASSED: Apps persisted after Products navigation');
        testsPassed++;
      } else {
        console.log(`❌ TEST 2 FAILED: Expected ≥3 apps, got ${appsAfterProducts}. No apps message: ${noAppsMsg2 > 0 ? 'YES' : 'NO'}`);
        testsFailed++;
      }
    } else {
      console.log('⚠️  TEST 2 SKIPPED: Products link not found');
    }

    // ============================================================================
    // TEST 3: Navigate to POS → Back to Dashboard
    // ============================================================================
    console.log('\n📋 TEST 3: POS → Dashboard Navigation');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const posLink = await page.locator('a[href="/pos/register"]').first();
    if (await posLink.count() > 0) {
      await posLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('💳 Navigated to POS page');

      // Go back to dashboard using browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const appsAfterPOS = await page.locator('a[href*="/pos"], a[href*="/vendor"]').count();
      const noAppsMsg3 = await page.locator('text=No apps available').count();

      console.log(`📱 Apps visible after browser back: ${appsAfterPOS}`);

      if (appsAfterPOS >= 3 && noAppsMsg3 === 0) {
        console.log('✅ TEST 3 PASSED: Apps persisted after POS navigation (browser back)');
        testsPassed++;
      } else {
        console.log(`❌ TEST 3 FAILED: Expected ≥3 apps, got ${appsAfterPOS}. No apps message: ${noAppsMsg3 > 0 ? 'YES' : 'NO'}`);
        testsFailed++;
      }
    } else {
      console.log('⚠️  TEST 3 SKIPPED: POS link not found');
    }

    // ============================================================================
    // TEST 4: Rapid Navigation (5 iterations)
    // ============================================================================
    console.log('\n📋 TEST 4: Rapid Navigation Stress Test (5 iterations)');
    console.log('-'.repeat(80));

    let rapidTestPassed = true;

    for (let i = 1; i <= 5; i++) {
      console.log(`\n🔄 Iteration ${i}/5`);

      // Go to Products
      await page.goto('http://localhost:3000/vendor/products');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Back to Dashboard
      await page.goto('http://localhost:3000/vendor/apps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const appsInIteration = await page.locator('a[href*="/pos"], a[href*="/vendor"]').count();
      const noAppsMsgInIteration = await page.locator('text=No apps available').count();

      console.log(`   📱 Apps visible: ${appsInIteration}`);

      if (appsInIteration < 3 || noAppsMsgInIteration > 0) {
        console.log(`   ❌ Failed on iteration ${i}`);
        rapidTestPassed = false;
        break;
      } else {
        console.log(`   ✅ Iteration ${i} passed`);
      }
    }

    if (rapidTestPassed) {
      console.log('✅ TEST 4 PASSED: Apps persisted through rapid navigation');
      testsPassed++;
    } else {
      console.log('❌ TEST 4 FAILED: Apps lost during rapid navigation');
      testsFailed++;
    }

    // ============================================================================
    // TEST 5: Page Refresh
    // ============================================================================
    console.log('\n📋 TEST 5: Page Refresh');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const appsAfterRefresh = await page.locator('a[href*="/pos"], a[href*="/vendor"]').count();
    const noAppsMsg5 = await page.locator('text=No apps available').count();

    console.log(`📱 Apps visible after refresh: ${appsAfterRefresh}`);

    if (appsAfterRefresh >= 3 && noAppsMsg5 === 0) {
      console.log('✅ TEST 5 PASSED: Apps persisted after page refresh');
      testsPassed++;
    } else {
      console.log(`❌ TEST 5 FAILED: Expected ≥3 apps, got ${appsAfterRefresh}. No apps message: ${noAppsMsg5 > 0 ? 'YES' : 'NO'}`);
      testsFailed++;
    }

    // ============================================================================
    // TEST 6: localStorage Integrity Check
    // ============================================================================
    console.log('\n📋 TEST 6: localStorage Integrity Check');
    console.log('-'.repeat(80));

    const storageCheck = await page.evaluate(() => ({
      hasUser: !!localStorage.getItem('app_user'),
      hasApps: !!localStorage.getItem('app_accessible_apps'),
      hasLocations: !!localStorage.getItem('app_locations'),
      appsCount: localStorage.getItem('app_accessible_apps') ? JSON.parse(localStorage.getItem('app_accessible_apps')).length : 0,
      userRole: localStorage.getItem('app_user') ? JSON.parse(localStorage.getItem('app_user')).role : null,
    }));

    console.log('💾 localStorage contents:');
    console.log(`   - Has user data: ${storageCheck.hasUser ? 'YES' : 'NO'}`);
    console.log(`   - Has apps data: ${storageCheck.hasApps ? 'YES' : 'NO'}`);
    console.log(`   - Has locations: ${storageCheck.hasLocations ? 'YES' : 'NO'}`);
    console.log(`   - User role: ${storageCheck.userRole}`);
    console.log(`   - Apps count: ${storageCheck.appsCount}`);

    const isAdmin = storageCheck.userRole === 'vendor_owner' || storageCheck.userRole === 'vendor_manager';
    const expectedApps = isAdmin ? 0 : 3; // Admins have empty array (access to all), others have default 3 apps

    if (storageCheck.hasUser && storageCheck.hasApps &&
        (storageCheck.appsCount >= expectedApps || isAdmin)) {
      console.log('✅ TEST 6 PASSED: localStorage integrity maintained');
      testsPassed++;
    } else {
      console.log('❌ TEST 6 FAILED: localStorage integrity compromised');
      testsFailed++;
    }

    // ============================================================================
    // TEST 7: Direct URL Navigation
    // ============================================================================
    console.log('\n📋 TEST 7: Direct URL Navigation to Dashboard');
    console.log('-'.repeat(80));

    // Navigate away
    await page.goto('http://localhost:3000/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Direct URL navigation back to dashboard
    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const appsAfterDirectNav = await page.locator('a[href*="/pos"], a[href*="/vendor"]').count();
    const noAppsMsg7 = await page.locator('text=No apps available').count();

    console.log(`📱 Apps visible after direct navigation: ${appsAfterDirectNav}`);

    if (appsAfterDirectNav >= 3 && noAppsMsg7 === 0) {
      console.log('✅ TEST 7 PASSED: Apps persisted with direct URL navigation');
      testsPassed++;
    } else {
      console.log(`❌ TEST 7 FAILED: Expected ≥3 apps, got ${appsAfterDirectNav}. No apps message: ${noAppsMsg7 > 0 ? 'YES' : 'NO'}`);
      testsFailed++;
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-dashboard-apps-result.png', fullPage: true });

    // ============================================================================
    // FINAL RESULTS
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(80));

    const totalTests = testsPassed + testsFailed;
    const passRate = ((testsPassed / totalTests) * 100).toFixed(1);

    console.log(`\n✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`❌ Tests Failed: ${testsFailed}/${totalTests}`);
    console.log(`📈 Pass Rate: ${passRate}%`);

    if (testsFailed === 0) {
      console.log('\n🎉 SUCCESS: All dashboard apps persistence tests passed!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED: Dashboard apps persistence needs attention');
    }

    console.log('\n📸 Screenshot saved as test-dashboard-apps-result.png');
    console.log('\n⏳ Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n💥 TEST ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-dashboard-apps-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
