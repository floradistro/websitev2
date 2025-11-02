import { chromium } from 'playwright';

const TESTS = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);

  if (passed) {
    TESTS.passed.push(name);
  } else {
    TESTS.failed.push({ name, details });
  }
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
  TESTS.warnings.push(message);
}

async function getLocalStorage(page) {
  return await page.evaluate(() => {
    return {
      app_user: localStorage.getItem('app_user'),
      app_locations: localStorage.getItem('app_locations'),
      app_accessible_apps: localStorage.getItem('app_accessible_apps')
    };
  });
}

async function checkLocations(page, testName, expectedMin = 1) {
  const storage = await getLocalStorage(page);
  const locations = storage.app_locations ? JSON.parse(storage.app_locations) : [];
  const count = locations.length;

  logTest(
    testName,
    count >= expectedMin,
    `Expected ≥${expectedMin} locations, got ${count}`
  );

  return count;
}

async function waitAndLog(page, message, ms = 1000) {
  console.log(`⏳ ${message}`);
  await page.waitForTimeout(ms);
}

(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPREHENSIVE LOCATION PERSISTENCE TEST SUITE');
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);

    // Only log important messages during test
    if (text.includes('📍') || text.includes('❌') || text.includes('⚠️')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  try {
    // =============================================================================
    // TEST 1: Fresh Login
    // =============================================================================
    console.log('\n📋 TEST SUITE 1: Fresh Login Flow');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/apps', { timeout: 10000 });
    await waitAndLog(page, 'Login completed, checking storage...', 2000);

    await checkLocations(page, '1.1: Locations loaded after fresh login', 6);

    // =============================================================================
    // TEST 2: First Navigation to POS
    // =============================================================================
    console.log('\n📋 TEST SUITE 2: First Navigation to POS');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Navigated to POS, checking locations...', 2000);

    const count1 = await checkLocations(page, '2.1: Locations persist on first POS visit', 6);

    // Check if location selector is visible
    const hasLocationSelector = await page.locator('text=Select Location').count() > 0;
    logTest('2.2: Location selector is visible', hasLocationSelector);

    const hasNoLocationsMessage = await page.locator('text=No locations available').count() > 0;
    logTest('2.3: No "No locations" error message', !hasNoLocationsMessage);

    // =============================================================================
    // TEST 3: Select Location
    // =============================================================================
    console.log('\n📋 TEST SUITE 3: Location Selection');
    console.log('-'.repeat(80));

    if (count1 > 0) {
      const locationButtons = await page.locator('button:has-text("Charlotte Central")').count();
      if (locationButtons > 0) {
        await page.click('button:has-text("Charlotte Central")');
        await waitAndLog(page, 'Location selected, waiting for register selector...', 2000);

        const hasRegisterSelector = await page.locator('text=Select Register').count() > 0;
        logTest('3.1: Register selector appears after location selection', hasRegisterSelector);
      } else {
        logWarning('Charlotte Central location not found in selector');
      }
    }

    // =============================================================================
    // TEST 4: Navigation Back to Dashboard
    // =============================================================================
    console.log('\n📋 TEST SUITE 4: Navigation Back to Dashboard');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Returned to dashboard, checking locations...', 2000);

    await checkLocations(page, '4.1: Locations persist after returning to dashboard', 6);

    // =============================================================================
    // TEST 5: Second Navigation to POS (Critical Bug Test)
    // =============================================================================
    console.log('\n📋 TEST SUITE 5: Second Navigation to POS (THE BUG)');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Second POS navigation, checking for bug...', 3000);

    const count2 = await checkLocations(page, '5.1: Locations persist on second POS visit', 6);

    const hasNoLocations2 = await page.locator('text=No locations available').count() > 0;
    logTest('5.2: No "No locations" error on second visit', !hasNoLocations2);

    const hasLocationSelector2 = await page.locator('text=Select Location').count() > 0;
    logTest('5.3: Location selector visible on second visit', hasLocationSelector2);

    // =============================================================================
    // TEST 6: Multiple Rapid Navigations
    // =============================================================================
    console.log('\n📋 TEST SUITE 6: Rapid Navigation Stress Test');
    console.log('-'.repeat(80));

    for (let i = 1; i <= 5; i++) {
      await page.goto('http://localhost:3000/vendor/apps');
      await page.waitForLoadState('networkidle');
      await page.goto('http://localhost:3000/pos/register');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const count = await checkLocations(page, `6.${i}: Locations persist after rapid nav #${i}`, 6);

      if (count === 0) {
        logWarning(`Lost locations on rapid navigation iteration ${i}`);
        break;
      }
    }

    // =============================================================================
    // TEST 7: Browser Back/Forward
    // =============================================================================
    console.log('\n📋 TEST SUITE 7: Browser Back/Forward Navigation');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/vendor/apps');
    await page.waitForLoadState('networkidle');
    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Navigated to POS, testing back button...', 1000);

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Pressed back button...', 1000);
    await checkLocations(page, '7.1: Locations persist after back button', 6);

    await page.goForward();
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Pressed forward button...', 1000);
    await checkLocations(page, '7.2: Locations persist after forward button', 6);

    // =============================================================================
    // TEST 8: Page Refresh
    // =============================================================================
    console.log('\n📋 TEST SUITE 8: Page Refresh');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'At POS, refreshing page...', 1000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Page refreshed...', 2000);
    await checkLocations(page, '8.1: Locations persist after page refresh', 6);

    // =============================================================================
    // TEST 9: Direct URL Navigation
    // =============================================================================
    console.log('\n📋 TEST SUITE 9: Direct URL Navigation');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/pos/register');
    await page.waitForLoadState('networkidle');
    await waitAndLog(page, 'Direct navigation to POS...', 2000);
    await checkLocations(page, '9.1: Locations available via direct URL', 6);

    // =============================================================================
    // TEST 10: Check for Memory Leaks in Console
    // =============================================================================
    console.log('\n📋 TEST SUITE 10: Console Error Analysis');
    console.log('-'.repeat(80));

    const errorLogs = consoleLogs.filter(log => log.includes('[error]'));
    const warningLogs = consoleLogs.filter(log =>
      log.includes('[warning]') &&
      !log.includes('preloaded using link preload')
    );

    logTest('10.1: No critical console errors', errorLogs.length === 0,
      errorLogs.length > 0 ? `Found ${errorLogs.length} errors` : '');

    if (errorLogs.length > 0) {
      console.log('\n❌ Console Errors Found:');
      errorLogs.slice(0, 5).forEach(err => console.log(`   ${err}`));
    }

    // =============================================================================
    // TEST 11: localStorage Integrity
    // =============================================================================
    console.log('\n📋 TEST SUITE 11: LocalStorage Data Integrity');
    console.log('-'.repeat(80));

    const finalStorage = await getLocalStorage(page);

    try {
      const user = JSON.parse(finalStorage.app_user);
      logTest('11.1: User data is valid JSON', true);
      logTest('11.2: User has vendor_id', !!user.vendor_id);
      logTest('11.3: User has email', !!user.email);
      logTest('11.4: User has role', !!user.role);
    } catch (e) {
      logTest('11.1: User data is valid JSON', false, e.message);
    }

    try {
      const locations = JSON.parse(finalStorage.app_locations);
      logTest('11.5: Locations data is valid JSON', true);
      logTest('11.6: Locations is an array', Array.isArray(locations));
      logTest('11.7: All locations have id and name',
        locations.every(loc => loc.id && loc.name));
    } catch (e) {
      logTest('11.5: Locations data is valid JSON', false, e.message);
    }

    // =============================================================================
    // TEST 12: Context Provider Mounting
    // =============================================================================
    console.log('\n📋 TEST SUITE 12: React Context Checks');
    console.log('-'.repeat(80));

    const loadUserLogs = consoleLogs.filter(log => log.includes('✅ Loaded user from localStorage'));
    const loadLocationLogs = consoleLogs.filter(log => log.includes('📍 Loaded locations from localStorage'));

    logTest('12.1: User loaded from localStorage', loadUserLogs.length > 0,
      `Found ${loadUserLogs.length} load events`);
    logTest('12.2: Locations loaded from localStorage', loadLocationLogs.length > 0,
      `Found ${loadLocationLogs.length} load events`);

    // Check for duplicate provider warnings
    const duplicateProviderLogs = consoleLogs.filter(log =>
      log.toLowerCase().includes('provider') &&
      log.toLowerCase().includes('duplicate')
    );
    logTest('12.3: No duplicate provider warnings', duplicateProviderLogs.length === 0);

    // =============================================================================
    // Final Screenshot and Report
    // =============================================================================
    await page.screenshot({ path: 'test-final-state.png', fullPage: true });
    console.log('\n📸 Screenshot saved as test-final-state.png');

  } catch (error) {
    console.error('\n💥 CRITICAL TEST ERROR:', error.message);
    console.error(error.stack);
    TESTS.failed.push({ name: 'Test execution', details: error.message });
  }

  // =============================================================================
  // Print Final Report
  // =============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL TEST REPORT');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${TESTS.passed.length} tests`);
  console.log(`❌ Failed: ${TESTS.failed.length} tests`);
  console.log(`⚠️  Warnings: ${TESTS.warnings.length}`);

  if (TESTS.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    TESTS.failed.forEach(test => {
      console.log(`   - ${test.name}`);
      if (test.details) console.log(`     ${test.details}`);
    });
  }

  if (TESTS.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    TESTS.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  const passRate = (TESTS.passed.length / (TESTS.passed.length + TESTS.failed.length) * 100).toFixed(1);
  console.log(`\n📈 Pass Rate: ${passRate}%`);

  if (passRate === '100.0') {
    console.log('\n🎉 ALL TESTS PASSED! Location persistence is working perfectly!');
  } else if (passRate >= '80.0') {
    console.log('\n⚠️  MOSTLY WORKING - Some edge cases need attention');
  } else {
    console.log('\n❌ CRITICAL ISSUES - Location persistence is broken');
  }

  console.log('\n⏳ Browser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();

  // Exit with error code if tests failed
  process.exit(TESTS.failed.length > 0 ? 1 : 0);
})();
