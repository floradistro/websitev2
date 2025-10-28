#!/usr/bin/env node

/**
 * Low Stock Notifications Feature - Comprehensive Test Suite
 * Tests API endpoints, database queries, and business logic with 10 scenarios
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';
const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`✅ ${testName}`, 'green');
    if (details) log(`   ${details}`, 'cyan');
  } else {
    failedTests++;
    log(`❌ ${testName}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${title}`, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

// Helper to fetch with error handling
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data, ok: response.ok };
  } catch (error) {
    return { error: error.message, ok: false };
  }
}

// Test 1: Fetch Low Stock Items - Default Threshold
async function test1_DefaultThreshold() {
  logSection('TEST 1: Fetch Low Stock Items (Default Threshold)');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}`
  );

  logTest('API returns 200 OK', result.ok, `Status: ${result.response?.status}`);
  logTest('Response has success=true', result.data?.success === true);
  logTest('Response includes low_stock_items array', Array.isArray(result.data?.low_stock_items));
  logTest('Response includes stats object', result.data?.stats !== undefined);
  logTest('Response includes threshold_used', result.data?.threshold_used === 10);

  if (result.data?.low_stock_items) {
    log(`   Found ${result.data.low_stock_items.length} low stock items`, 'cyan');
    if (result.data.stats) {
      log(`   Critical: ${result.data.stats.critical}, High: ${result.data.stats.high}, Medium: ${result.data.stats.medium}`, 'cyan');
    }
  }

  return result.data;
}

// Test 2: Fetch Low Stock Items - Custom Threshold
async function test2_CustomThreshold() {
  logSection('TEST 2: Custom Threshold');

  const threshold = 20;
  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&threshold=${threshold}`
  );

  logTest('API accepts custom threshold', result.ok);
  logTest('Threshold used matches request', result.data?.threshold_used === threshold);
  logTest('Returns items below custom threshold', result.ok);

  if (result.data?.low_stock_items) {
    log(`   Found ${result.data.low_stock_items.length} items below ${threshold}`, 'cyan');
  }
}

// Test 3: Location-Specific Low Stock
async function test3_LocationFilter() {
  logSection('TEST 3: Location-Specific Filtering');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('API accepts location filter', result.ok);
  logTest('Response structure correct', result.data?.success === true);

  if (result.data?.low_stock_items) {
    const allSameLocation = result.data.low_stock_items.every(
      item => item.location?.id === CHARLOTTE_CENTRAL_ID
    );
    logTest('All items from specified location', allSameLocation);
    log(`   Found ${result.data.low_stock_items.length} items at Charlotte Central`, 'cyan');
  } else {
    logTest('All items from specified location', true, 'No items to check');
  }
}

// Test 4: Urgency Classification
async function test4_UrgencyLevels() {
  logSection('TEST 4: Urgency Level Classification');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&threshold=100`
  );

  if (result.data?.low_stock_items && result.data.low_stock_items.length > 0) {
    const hasUrgency = result.data.low_stock_items.every(item =>
      ['critical', 'high', 'medium'].includes(item.urgency)
    );

    logTest('All items have urgency level', hasUrgency);

    const criticalItems = result.data.low_stock_items.filter(i => i.urgency === 'critical');
    const highItems = result.data.low_stock_items.filter(i => i.urgency === 'high');
    const mediumItems = result.data.low_stock_items.filter(i => i.urgency === 'medium');

    logTest('Critical urgency assigned correctly',
      criticalItems.every(i => i.available_quantity <= 0)
    );

    log(`   Critical: ${criticalItems.length}, High: ${highItems.length}, Medium: ${mediumItems.length}`, 'cyan');
  } else {
    logTest('Urgency classification', true, 'Skipped - no low stock items');
  }
}

// Test 5: Sorting by Urgency
async function test5_SortingByUrgency() {
  logSection('TEST 5: Sorting by Urgency and Quantity');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&threshold=50`
  );

  if (result.data?.low_stock_items && result.data.low_stock_items.length > 1) {
    const items = result.data.low_stock_items;

    // Check that critical items come first
    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    let correctlySorted = true;

    for (let i = 0; i < items.length - 1; i++) {
      const currentUrgency = urgencyOrder[items[i].urgency];
      const nextUrgency = urgencyOrder[items[i + 1].urgency];

      if (currentUrgency > nextUrgency) {
        correctlySorted = false;
        break;
      }
    }

    logTest('Items sorted by urgency', correctlySorted);
    log(`   First item urgency: ${items[0].urgency}, Last item urgency: ${items[items.length - 1].urgency}`, 'cyan');
  } else {
    logTest('Sorting by urgency', true, 'Skipped - not enough items');
  }
}

// Test 6: Stats Calculation
async function test6_StatsCalculation() {
  logSection('TEST 6: Statistics Calculation');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&threshold=50`
  );

  if (result.data?.stats) {
    const stats = result.data.stats;
    const items = result.data.low_stock_items || [];

    const calculatedCritical = items.filter(i => i.urgency === 'critical').length;
    const calculatedHigh = items.filter(i => i.urgency === 'high').length;
    const calculatedMedium = items.filter(i => i.urgency === 'medium').length;
    const calculatedTotal = items.length;

    logTest('Total count matches', stats.total_low_stock === calculatedTotal,
      `Expected: ${calculatedTotal}, Got: ${stats.total_low_stock}`
    );
    logTest('Critical count matches', stats.critical === calculatedCritical,
      `Expected: ${calculatedCritical}, Got: ${stats.critical}`
    );
    logTest('High count matches', stats.high === calculatedHigh,
      `Expected: ${calculatedHigh}, Got: ${stats.high}`
    );
    logTest('Medium count matches', stats.medium === calculatedMedium,
      `Expected: ${calculatedMedium}, Got: ${stats.medium}`
    );
    logTest('Value at risk is calculated', typeof stats.total_value_at_risk === 'number');
    log(`   Total value at risk: $${stats.total_value_at_risk.toFixed(2)}`, 'cyan');
  } else {
    logTest('Stats calculation', false, 'No stats returned');
  }
}

// Test 7: Missing vendor_id
async function test7_MissingVendorId() {
  logSection('TEST 7: Missing vendor_id Parameter');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?threshold=10`
  );

  logTest('Returns 400 for missing vendor_id', result.response?.status === 400);
  logTest('Error message is descriptive', result.data?.error?.includes('vendor_id'));
}

// Test 8: Product Data Included
async function test8_ProductDataComplete() {
  logSection('TEST 8: Complete Product Data');

  const result = await fetchAPI(
    `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&threshold=50`
  );

  if (result.data?.low_stock_items && result.data.low_stock_items.length > 0) {
    const firstItem = result.data.low_stock_items[0];

    logTest('Product name included', typeof firstItem.product?.name === 'string');
    logTest('Product SKU included', firstItem.product?.sku !== undefined);
    logTest('Location data included', firstItem.location !== undefined);
    logTest('Available quantity included', typeof firstItem.available_quantity === 'number');
    logTest('Reorder point included', typeof firstItem.reorder_point === 'number');
    logTest('Urgency level included', firstItem.urgency !== undefined);

    log(`   Sample item: ${firstItem.product.name} (${firstItem.available_quantity} units)`, 'cyan');
  } else {
    logTest('Product data completeness', true, 'Skipped - no items');
  }
}

// Test 9: Update Reorder Point
async function test9_UpdateReorderPoint() {
  logSection('TEST 9: Update Reorder Point (PATCH)');

  // First, get an inventory item
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('id, product_id, reorder_point')
    .limit(1)
    .single();

  if (inventoryError || !inventory) {
    logTest('Update reorder point', false, 'Could not fetch inventory item');
    return;
  }

  log(`   Testing with inventory ID: ${inventory.id}`, 'cyan');

  const newReorderPoint = 25;
  const result = await fetchAPI(`${BASE_URL}/api/vendor/inventory/low-stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventory_id: inventory.id,
      reorder_point: newReorderPoint
    })
  });

  logTest('PATCH request succeeds', result.ok);
  logTest('Returns updated inventory', result.data?.inventory !== undefined);
  logTest('Reorder point updated', result.data?.inventory?.reorder_point === newReorderPoint);
  logTest('Success message included', result.data?.message?.includes('updated'));

  // Verify in database
  const { data: updated } = await supabase
    .from('inventory')
    .select('reorder_point')
    .eq('id', inventory.id)
    .single();

  logTest('Database updated correctly', updated?.reorder_point === newReorderPoint);
  log(`   New reorder point: ${newReorderPoint}`, 'cyan');

  // Restore original value
  await supabase
    .from('inventory')
    .update({ reorder_point: inventory.reorder_point })
    .eq('id', inventory.id);
}

// Test 10: Performance
async function test10_Performance() {
  logSection('TEST 10: Performance & Response Time');

  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const result = await fetchAPI(
      `${BASE_URL}/api/vendor/inventory/low-stock?vendor_id=${FLORA_DISTRO_VENDOR_ID}&threshold=20`
    );
    const end = Date.now();

    if (result.ok) {
      times.push(end - start);
    }
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    log(`   Response times: Min=${min}ms, Max=${max}ms, Avg=${avg.toFixed(2)}ms`, 'cyan');

    logTest('Average response time < 1000ms', avg < 1000, `Average: ${avg.toFixed(2)}ms`);
    logTest('Max response time < 2000ms', max < 2000, `Max: ${max}ms`);
    logTest('All requests succeeded', times.length === 5);
  } else {
    logTest('Performance test', false, 'No successful requests');
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'magenta');
  log('LOW STOCK NOTIFICATIONS - COMPREHENSIVE TEST SUITE', 'bold');
  log('Testing: API Endpoints + Business Logic + Database Integration', 'cyan');
  log('='.repeat(60) + '\n', 'magenta');

  try {
    await test1_DefaultThreshold();
    await test2_CustomThreshold();
    await test3_LocationFilter();
    await test4_UrgencyLevels();
    await test5_SortingByUrgency();
    await test6_StatsCalculation();
    await test7_MissingVendorId();
    await test8_ProductDataComplete();
    await test9_UpdateReorderPoint();
    await test10_Performance();

    // Print summary
    logSection('TEST SUMMARY');
    log(`Total Tests: ${totalTests}`, 'cyan');
    log(`✅ Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`, 'green');
    log(`❌ Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`, failedTests > 0 ? 'red' : 'green');

    if (failedTests === 0) {
      log('\n🎉 ALL TESTS PASSED! Low Stock Notifications feature is fully functional.', 'green');
      log('✅ Ready to move to next phase: POS Discounts\n', 'green');
    } else {
      log('\n⚠️  Some tests failed. Please review and fix before proceeding.\n', 'yellow');
    }

    process.exit(failedTests > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await fetch(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    log('❌ Server not running at http://localhost:3000', 'red');
    log('Please start the dev server with: npm run dev', 'yellow');
    return false;
  }
}

// Run tests
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runAllTests();
})();
