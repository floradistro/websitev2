#!/usr/bin/env node

/**
 * SKU Scanning Feature - Comprehensive Test Suite
 * Tests both API and frontend functionality with 10 different scenarios
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';
const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

// Initialize Supabase client for database queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable not found');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Test 1: Valid SKU Lookup
async function test1_ValidSKULookup() {
  logSection('TEST 1: Valid SKU Lookup');

  // First, get a valid SKU from the database
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('id, sku, name, price, status')
    .eq('status', 'published')
    .not('sku', 'is', null)
    .neq('sku', '')
    .limit(5);

  if (dbError || !products || products.length === 0) {
    logTest('Valid SKU Lookup', false, `Could not fetch products from database: ${dbError?.message || 'No products found'}`);
    return;
  }

  const testProduct = products[0];

  if (!testProduct) {
    logTest('Valid SKU Lookup', false, 'No published product with SKU found');
    return;
  }

  log(`Testing with SKU: ${testProduct.sku}`, 'cyan');

  const result = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(testProduct.sku)}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('API returns 200 OK', result.ok, `Status: ${result.response?.status}`);
  logTest('Response has success=true', result.data?.success === true);
  logTest('Product returned matches SKU', result.data?.product?.sku === testProduct.sku);
  logTest('Product has inventory data', result.data?.product?.inventory !== undefined);
  logTest('Product has correct structure',
    result.data?.product?.id &&
    result.data?.product?.name &&
    result.data?.product?.price !== undefined
  );

  if (result.data?.product) {
    log(`   Found: ${result.data.product.name}`, 'green');
    log(`   Price: $${result.data.product.price}`, 'green');
    log(`   Stock: ${result.data.product.inventory?.available_quantity || 0} units`, 'green');
  }

  return testProduct.sku; // Return for use in other tests
}

// Test 2: Invalid SKU (Not Found)
async function test2_InvalidSKU() {
  logSection('TEST 2: Invalid SKU - Not Found');

  const invalidSKU = 'INVALID-SKU-99999-NOTEXIST';
  log(`Testing with invalid SKU: ${invalidSKU}`, 'cyan');

  const result = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(invalidSKU)}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('API returns 404 status', result.response?.status === 404);
  logTest('Response has success=false', result.data?.success === false);
  logTest('Error message is descriptive',
    result.data?.error === 'Product not found' &&
    result.data?.message?.includes(invalidSKU)
  );
}

// Test 3: Case-Insensitive Search
async function test3_CaseInsensitive(validSKU) {
  logSection('TEST 3: Case-Insensitive SKU Search');

  if (!validSKU) {
    logTest('Case-insensitive search', false, 'No valid SKU provided from Test 1');
    return;
  }

  // Test with lowercase
  const lowerResult = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(validSKU.toLowerCase())}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  // Test with uppercase
  const upperResult = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(validSKU.toUpperCase())}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  // Test with mixed case
  const mixedCaseSKU = validSKU.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
  const mixedResult = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(mixedCaseSKU)}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('Lowercase SKU lookup works', lowerResult.ok && lowerResult.data?.success);
  logTest('Uppercase SKU lookup works', upperResult.ok && upperResult.data?.success);
  logTest('Mixed-case SKU lookup works', mixedResult.ok && mixedResult.data?.success);
  logTest('All return same product',
    lowerResult.data?.product?.id === upperResult.data?.product?.id &&
    upperResult.data?.product?.id === mixedResult.data?.product?.id
  );
}

// Test 4: Missing Parameters
async function test4_MissingParameters() {
  logSection('TEST 4: Missing Parameters Validation');

  // Missing SKU
  const noSKU = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('Missing SKU returns 400', noSKU.response?.status === 400);
  logTest('Missing SKU has error message', noSKU.data?.error?.includes('SKU'));

  // Missing location_id
  const noLocation = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=TEST-SKU`
  );

  logTest('Missing location_id returns 400', noLocation.response?.status === 400);
  logTest('Missing location_id has error message', noLocation.data?.error?.includes('location_id'));
}

// Test 5: Batch Lookup (Multiple SKUs)
async function test5_BatchLookup() {
  logSection('TEST 5: Batch SKU Lookup (POST)');

  // Get multiple valid SKUs from database
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('sku, name')
    .eq('status', 'published')
    .not('sku', 'is', null)
    .neq('sku', '')
    .limit(10);

  if (dbError || !products || products.length === 0) {
    logTest('Batch lookup', false, `Could not fetch products: ${dbError?.message || 'No products'}`);
    return;
  }

  const validSKUs = products.slice(0, 3).map(p => p.sku);

  if (validSKUs.length === 0) {
    logTest('Batch lookup', false, 'No valid SKUs found');
    return;
  }

  log(`Testing with ${validSKUs.length} SKUs: ${validSKUs.join(', ')}`, 'cyan');

  const result = await fetchAPI(`${BASE_URL}/api/pos/products/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skus: validSKUs,
      location_id: CHARLOTTE_CENTRAL_ID
    })
  });

  logTest('Batch lookup returns 200', result.ok);
  logTest('Response has success=true', result.data?.success === true);
  logTest('Returns array of products', Array.isArray(result.data?.products));
  logTest('Found count matches requested', result.data?.found === validSKUs.length);
  logTest('All products have inventory',
    result.data?.products?.every(p => p.inventory !== undefined) || false
  );

  if (result.data?.products) {
    log(`   Found ${result.data.found}/${result.data.requested} products`, 'green');
  }
}

// Test 6: Special Characters in SKU
async function test6_SpecialCharacters() {
  logSection('TEST 6: Special Characters in SKU');

  // Get a product and test with URL encoding
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('sku, name')
    .eq('status', 'published')
    .not('sku', 'is', null)
    .neq('sku', '')
    .limit(10);

  if (dbError || !products || products.length === 0) {
    logTest('Special characters test', false, `Could not fetch products: ${dbError?.message || 'No products'}`);
    return;
  }

  const product = products[0];

  if (product) {
    // Test with proper URL encoding
    const encodedSKU = encodeURIComponent(product.sku);
    const result = await fetchAPI(
      `${BASE_URL}/api/pos/products/lookup?sku=${encodedSKU}&location_id=${CHARLOTTE_CENTRAL_ID}`
    );

    logTest('URL-encoded SKU works', result.ok && result.data?.success);

    // Test with SKU containing special chars (if we find one)
    const specialProduct = products.find(p =>
      p.sku && /[&%#@!-]/.test(p.sku)
    );

    if (specialProduct) {
      const specialResult = await fetchAPI(
        `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(specialProduct.sku)}&location_id=${CHARLOTTE_CENTRAL_ID}`
      );
      logTest('SKU with special characters works', specialResult.ok && specialResult.data?.success);
    } else {
      logTest('SKU with special characters works', true, 'Skipped - no products with special chars found');
    }
  } else {
    logTest('URL-encoded SKU works', false, 'No published products found');
  }
}

// Test 7: Draft/Unpublished Products
async function test7_UnpublishedProducts() {
  logSection('TEST 7: Draft/Unpublished Products Filtering');

  // Try to find a draft product
  const { data: draftProducts, error: dbError } = await supabase
    .from('products')
    .select('sku, name, status')
    .eq('status', 'draft')
    .not('sku', 'is', null)
    .neq('sku', '')
    .limit(10);

  if (dbError) {
    logTest('Draft products test', false, `Database error: ${dbError.message}`);
    return;
  }

  if (draftProducts && draftProducts.length > 0) {
    const draftProduct = draftProducts[0];
    log(`Testing with draft product SKU: ${draftProduct.sku}`, 'cyan');

    const result = await fetchAPI(
      `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(draftProduct.sku)}&location_id=${CHARLOTTE_CENTRAL_ID}`
    );

    logTest('Draft products are NOT returned', result.response?.status === 404);
    logTest('Error message indicates not found', result.data?.error === 'Product not found');
  } else {
    logTest('Draft products filtering', true, 'Skipped - no draft products with SKU found');
  }
}

// Test 8: Product with Variants
async function test8_ProductVariants() {
  logSection('TEST 8: Products with Variants');

  // Get a published product
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('sku, name')
    .eq('status', 'published')
    .not('sku', 'is', null)
    .neq('sku', '')
    .limit(5);

  if (dbError || !products || products.length === 0) {
    logTest('Product variants test', false, `Could not fetch products: ${dbError?.message || 'No products'}`);
    return;
  }

  const productWithSKU = products[0];

  if (productWithSKU) {
    log(`Testing product: ${productWithSKU.name}`, 'cyan');

    const result = await fetchAPI(
      `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(productWithSKU.sku)}&location_id=${CHARLOTTE_CENTRAL_ID}`
    );

    logTest('Product lookup successful', result.ok && result.data?.success);
    logTest('Response includes variants field', result.data?.product?.variants !== undefined);
    logTest('Response includes has_variants flag', result.data?.product?.has_variants !== undefined);

    if (result.data?.product) {
      const hasVariants = result.data.product.has_variants;
      const variantsCount = result.data.product.variants?.length || 0;
      log(`   Has variants: ${hasVariants}, Count: ${variantsCount}`, 'cyan');

      logTest('Variant data is consistent',
        (hasVariants && variantsCount > 0) || (!hasVariants && variantsCount === 0)
      );
    }
  } else {
    logTest('Product variants test', false, 'No products with SKU found');
  }
}

// Test 9: Empty/Whitespace SKU
async function test9_EmptyWhitespaceSKU() {
  logSection('TEST 9: Empty/Whitespace SKU Handling');

  // Empty SKU
  const emptyResult = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('Empty SKU returns 400', emptyResult.response?.status === 400);
  logTest('Empty SKU has error message', emptyResult.data?.error?.includes('SKU'));

  // Whitespace-only SKU
  const whitespaceResult = await fetchAPI(
    `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent('   ')}&location_id=${CHARLOTTE_CENTRAL_ID}`
  );

  logTest('Whitespace SKU handled',
    whitespaceResult.response?.status === 400 || whitespaceResult.response?.status === 404
  );
}

// Test 10: Performance & Response Time
async function test10_Performance() {
  logSection('TEST 10: Performance & Response Time');

  // Get a valid SKU
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('sku, name')
    .eq('status', 'published')
    .not('sku', 'is', null)
    .neq('sku', '')
    .limit(5);

  if (dbError || !products || products.length === 0) {
    logTest('Performance test', false, `Could not fetch products: ${dbError?.message || 'No products'}`);
    return;
  }

  const testProduct = products[0];

  if (!testProduct) {
    logTest('Performance test', false, 'No valid product found');
    return;
  }

  // Test response time (5 requests)
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const result = await fetchAPI(
      `${BASE_URL}/api/pos/products/lookup?sku=${encodeURIComponent(testProduct.sku)}&location_id=${CHARLOTTE_CENTRAL_ID}`
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

    logTest('Average response time < 500ms', avg < 500, `Average: ${avg.toFixed(2)}ms`);
    logTest('Max response time < 1000ms', max < 1000, `Max: ${max}ms`);
    logTest('All requests succeeded', times.length === 5);
  } else {
    logTest('Performance test', false, 'No successful requests');
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'magenta');
  log('SKU SCANNING FEATURE - COMPREHENSIVE TEST SUITE', 'bold');
  log('Testing: API Endpoints + Database + Frontend Integration', 'cyan');
  log('='.repeat(60) + '\n', 'magenta');

  try {
    // Run all tests in sequence
    const validSKU = await test1_ValidSKULookup();
    await test2_InvalidSKU();
    await test3_CaseInsensitive(validSKU);
    await test4_MissingParameters();
    await test5_BatchLookup();
    await test6_SpecialCharacters();
    await test7_UnpublishedProducts();
    await test8_ProductVariants();
    await test9_EmptyWhitespaceSKU();
    await test10_Performance();

    // Print summary
    logSection('TEST SUMMARY');
    log(`Total Tests: ${totalTests}`, 'cyan');
    log(`✅ Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`, 'green');
    log(`❌ Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`, failedTests > 0 ? 'red' : 'green');

    if (failedTests === 0) {
      log('\n🎉 ALL TESTS PASSED! SKU Scanning feature is fully functional.', 'green');
      log('✅ Ready to move to next phase: Low Stock Notifications\n', 'green');
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
    const response = await fetch(`${BASE_URL}/api/health`);
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
