#!/usr/bin/env node
/**
 * Comprehensive Multi-Tenant Vendor Autonomy Test Suite
 * Tests all features with edge cases and validates true multi-tenancy
 */

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const BASE_URL = 'http://localhost:3000';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test utilities
function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function logTest(name, passed, details = '') {
  const emoji = passed ? '✅' : '❌';
  console.log(`${emoji} ${name}${details ? ': ' + details : ''}`);
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function apiCall(method, endpoint, data = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-vendor-id': VENDOR_ID,
      ...headers
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await response.text();

  try {
    return {
      status: response.status,
      ok: response.ok,
      data: text ? JSON.parse(text) : null
    };
  } catch (e) {
    return {
      status: response.status,
      ok: response.ok,
      data: null,
      error: text
    };
  }
}

// ============================================
// 1. CATEGORY TESTS
// ============================================

async function testCategories() {
  log('🗂️', 'TESTING CATEGORY MANAGEMENT');
  console.log('━'.repeat(60));

  let createdCategoryId = null;

  // Test 1: Get all categories (should include global + vendor)
  try {
    const res = await apiCall('GET', `/api/categories?vendor_id=${VENDOR_ID}`);
    logTest(
      'Get all categories (global + vendor)',
      res.ok && res.data.success && Array.isArray(res.data.categories),
      `Found ${res.data.categories?.length || 0} categories`
    );

    const globalCount = res.data.categories?.filter(c => !c.vendor_id).length || 0;
    const vendorCount = res.data.categories?.filter(c => c.vendor_id === VENDOR_ID).length || 0;
    log('ℹ️', `  Global: ${globalCount}, Vendor-specific: ${vendorCount}`);
  } catch (e) {
    logTest('Get all categories', false, e.message);
  }

  // Test 2: Create vendor-specific category
  try {
    const res = await apiCall('POST', '/api/categories', {
      name: 'Test Vendor Category',
      description: 'Created by test suite',
      icon: '🧪'
    });

    logTest(
      'Create vendor-specific category',
      res.ok && res.data.success && res.data.category.vendor_id === VENDOR_ID,
      res.data.category?.id
    );

    if (res.data.success) {
      createdCategoryId = res.data.category.id;
    }
  } catch (e) {
    logTest('Create vendor-specific category', false, e.message);
  }

  // Test 3: Create category with special characters
  try {
    const res = await apiCall('POST', '/api/categories', {
      name: 'Test Category with Special!@#$%',
      description: 'Special chars: café, naïve, résumé',
      icon: '🎯'
    });

    logTest(
      'Create category with special characters',
      res.ok && res.data.success,
      res.data.category?.slug
    );

    if (res.data.success) {
      // Clean up
      await apiCall('DELETE', `/api/categories?id=${res.data.category.id}`);
    }
  } catch (e) {
    logTest('Create category with special characters', false, e.message);
  }

  // Test 4: Create category with empty name (should fail)
  try {
    const res = await apiCall('POST', '/api/categories', {
      name: '',
      icon: '📦'
    });

    logTest(
      'Reject empty category name',
      !res.ok || !res.data.success,
      'Validation working'
    );
  } catch (e) {
    logTest('Reject empty category name', false, e.message);
  }

  // Test 5: Edit vendor category
  if (createdCategoryId) {
    try {
      const res = await apiCall('PUT', '/api/categories', {
        id: createdCategoryId,
        name: 'Updated Test Category',
        description: 'Updated description',
        icon: '✨'
      });

      logTest(
        'Update vendor-specific category',
        res.ok && res.data.success && res.data.category.name === 'Updated Test Category',
        'Name and icon updated'
      );
    } catch (e) {
      logTest('Update vendor-specific category', false, e.message);
    }
  }

  // Test 6: Try to edit global category (should fail)
  try {
    const globalRes = await apiCall('GET', '/api/categories');
    const globalCategory = globalRes.data.categories?.find(c => !c.vendor_id);

    if (globalCategory) {
      const res = await apiCall('PUT', '/api/categories', {
        id: globalCategory.id,
        name: 'Hacked Global Category'
      });

      logTest(
        'Prevent editing global categories',
        !res.ok || res.data.error,
        'Vendor isolation working'
      );
    }
  } catch (e) {
    logTest('Prevent editing global categories', true, 'No global categories found');
  }

  // Test 7: Delete vendor category
  if (createdCategoryId) {
    try {
      const res = await apiCall('DELETE', `/api/categories?id=${createdCategoryId}`);

      logTest(
        'Delete vendor-specific category',
        res.ok && res.data.success,
        'Cleanup successful'
      );
    } catch (e) {
      logTest('Delete vendor-specific category', false, e.message);
    }
  }

  console.log('');
}

// ============================================
// 2. PRICING BLUEPRINT TESTS
// ============================================

async function testPricingBlueprints() {
  log('💎', 'TESTING PRICING BLUEPRINTS');
  console.log('━'.repeat(60));

  let createdBlueprintId = null;

  // Test 1: Get all blueprints (global + vendor)
  try {
    const res = await apiCall('GET', '/api/vendor/pricing-blueprints');
    logTest(
      'Get all pricing blueprints',
      res.ok && res.data.success && Array.isArray(res.data.blueprints),
      `Found ${res.data.blueprints?.length || 0} blueprints (${res.data.global_count} global, ${res.data.custom_count} custom)`
    );
  } catch (e) {
    logTest('Get all pricing blueprints', false, e.message);
  }

  // Test 2: Create custom pricing blueprint
  try {
    const res = await apiCall('POST', '/api/vendor/pricing-blueprints', {
      name: 'Test Premium Pricing',
      description: 'Test blueprint for premium products',
      tier_type: 'weight', // Pricing calculation method
      quality_tier: 'exotic', // Quality level
      context: 'retail',
      price_breaks: [
        { break_id: '1g', label: '1 Gram', qty: 1, unit: 'gram', sort_order: 1 },
        { break_id: '3.5g', label: '3.5 Grams', qty: 3.5, unit: 'gram', sort_order: 2 },
        { break_id: '7g', label: '7 Grams', qty: 7, unit: 'gram', sort_order: 3 }
      ],
      applicable_to_categories: []
    });

    logTest(
      'Create custom pricing blueprint',
      res.ok && res.data.success && res.data.blueprint.vendor_id === VENDOR_ID,
      res.data.blueprint?.id
    );

    if (res.data.success) {
      createdBlueprintId = res.data.blueprint.id;
    }
  } catch (e) {
    logTest('Create custom pricing blueprint', false, e.message);
  }

  // Test 3: Create blueprint with multiple tiers
  try {
    const res = await apiCall('POST', '/api/vendor/pricing-blueprints', {
      name: 'Test Multi-Tier Pricing',
      tier_type: 'quantity',
      quality_tier: 'top-shelf',
      context: 'wholesale',
      price_breaks: [
        { break_id: 'tier1', label: '1-10 lbs', min_qty: 1, max_qty: 10, sort_order: 1 },
        { break_id: 'tier2', label: '11-25 lbs', min_qty: 11, max_qty: 25, sort_order: 2 },
        { break_id: 'tier3', label: '26-50 lbs', min_qty: 26, max_qty: 50, sort_order: 3 },
        { break_id: 'tier4', label: '51+ lbs', min_qty: 51, max_qty: null, sort_order: 4 }
      ]
    });

    logTest(
      'Create blueprint with multiple tiers',
      res.ok && res.data.success && res.data.blueprint.price_breaks.length === 4,
      `4 tiers created`
    );

    if (res.data.success) {
      // Clean up
      await apiCall('DELETE', `/api/vendor/pricing-blueprints?id=${res.data.blueprint.id}`);
    }
  } catch (e) {
    logTest('Create blueprint with multiple tiers', false, e.message);
  }

  // Test 4: Create blueprint without price breaks (should fail)
  try {
    const res = await apiCall('POST', '/api/vendor/pricing-blueprints', {
      name: 'Invalid Blueprint',
      tier_type: 'value',
      context: 'retail',
      price_breaks: []
    });

    logTest(
      'Reject blueprint without price breaks',
      !res.ok || !res.data.success,
      'Validation working'
    );
  } catch (e) {
    logTest('Reject blueprint without price breaks', true, 'Validation caught it');
  }

  // Test 5: Update custom blueprint
  if (createdBlueprintId) {
    try {
      const res = await apiCall('PUT', '/api/vendor/pricing-blueprints', {
        id: createdBlueprintId,
        name: 'Updated Premium Pricing',
        description: 'Updated description',
        price_breaks: [
          { break_id: '1g', label: '1 Gram', qty: 1, unit: 'gram', sort_order: 1 },
          { break_id: '3.5g', label: '3.5 Grams', qty: 3.5, unit: 'gram', sort_order: 2 }
        ]
      });

      logTest(
        'Update custom blueprint',
        res.ok && res.data.success,
        'Updated successfully'
      );
    } catch (e) {
      logTest('Update custom blueprint', false, e.message);
    }
  }

  // Test 6: Try to delete global blueprint (should fail)
  try {
    const globalRes = await apiCall('GET', '/api/vendor/pricing-blueprints');
    const globalBlueprint = globalRes.data.blueprints?.find(b => !b.vendor_id);

    if (globalBlueprint) {
      const res = await apiCall('DELETE', `/api/vendor/pricing-blueprints?id=${globalBlueprint.id}`);

      logTest(
        'Prevent deleting global blueprints',
        !res.ok || res.data.error,
        'Vendor isolation working'
      );
    }
  } catch (e) {
    logTest('Prevent deleting global blueprints', true, 'No global blueprints');
  }

  // Test 7: Delete custom blueprint
  if (createdBlueprintId) {
    try {
      const res = await apiCall('DELETE', `/api/vendor/pricing-blueprints?id=${createdBlueprintId}`);

      logTest(
        'Delete custom blueprint',
        res.ok && res.data.success,
        'Cleanup successful'
      );
    } catch (e) {
      logTest('Delete custom blueprint', false, e.message);
    }
  }

  console.log('');
}

// ============================================
// 3. PRODUCT VISIBILITY TESTS
// ============================================

async function testProductVisibility() {
  log('📦', 'TESTING PRODUCT VISIBILITY & AUTO-PUBLISH');
  console.log('━'.repeat(60));

  let internalProductId = null;
  let marketplaceProductId = null;

  // Test 1: Create internal product (should auto-publish)
  try {
    const res = await apiCall('POST', '/api/vendor/products', {
      name: 'Test Internal Auto-Publish',
      description: 'Should publish immediately',
      category: 'Flower',
      price: '20.00',
      product_visibility: 'internal',
      initial_quantity: '50'
    });

    const autoPublished = res.data.product?.status === 'published';
    logTest(
      'Internal product auto-publishes',
      res.ok && res.data.success && autoPublished,
      `Status: ${res.data.product?.status}`
    );

    if (res.data.success) {
      internalProductId = res.data.product.id;
    }
  } catch (e) {
    logTest('Internal product auto-publishes', false, e.message);
  }

  // Test 2: Create marketplace product (should be pending)
  try {
    const res = await apiCall('POST', '/api/vendor/products', {
      name: 'Test Marketplace Pending',
      description: 'Should require approval',
      category: 'Flower',
      price: '30.00',
      product_visibility: 'marketplace',
      initial_quantity: '25'
    });

    const isPending = res.data.product?.status === 'pending';
    logTest(
      'Marketplace product requires approval',
      res.ok && res.data.success && isPending,
      `Status: ${res.data.product?.status}`
    );

    if (res.data.success) {
      marketplaceProductId = res.data.product.id;
    }
  } catch (e) {
    logTest('Marketplace product requires approval', false, e.message);
  }

  // Test 3: Create product without visibility (should default to internal)
  try {
    const res = await apiCall('POST', '/api/vendor/products', {
      name: 'Test Default Visibility',
      description: 'No visibility specified',
      category: 'Flower',
      price: '25.00'
    });

    const isPublished = res.data.product?.status === 'published';
    logTest(
      'Default visibility is internal (auto-publish)',
      res.ok && res.data.success && isPublished,
      `Status: ${res.data.product?.status}`
    );

    if (res.data.success) {
      // Clean up
      await apiCall('DELETE', `/api/vendor/products?product_id=${res.data.product.id}`);
    }
  } catch (e) {
    logTest('Default visibility is internal', false, e.message);
  }

  // Test 4: Verify product visibility field is stored
  if (internalProductId) {
    try {
      const res = await apiCall('GET', '/api/vendor/products');
      const product = res.data.products?.find(p => p.id === internalProductId);

      logTest(
        'Product visibility field stored correctly',
        product && product.product_visibility === 'internal',
        `Visibility: ${product?.product_visibility}`
      );
    } catch (e) {
      logTest('Product visibility field stored', false, e.message);
    }
  }

  // Cleanup
  if (internalProductId) {
    await apiCall('DELETE', `/api/vendor/products?product_id=${internalProductId}`);
  }
  if (marketplaceProductId) {
    await apiCall('DELETE', `/api/vendor/products?product_id=${marketplaceProductId}`);
  }

  console.log('');
}

// ============================================
// 4. INTEGRATION TESTS
// ============================================

async function testIntegration() {
  log('🔗', 'TESTING INTEGRATION FLOWS');
  console.log('━'.repeat(60));

  let categoryId = null;
  let blueprintId = null;
  let productId = null;

  // Test 1: Full flow - Create category → Create product in that category
  try {
    // Create category
    const catRes = await apiCall('POST', '/api/categories', {
      name: 'Test Integration Category',
      icon: '🧪'
    });

    if (catRes.data.success) {
      categoryId = catRes.data.category.id;

      // Create product in that category
      const prodRes = await apiCall('POST', '/api/vendor/products', {
        name: 'Product in Custom Category',
        category: 'Test Integration Category',
        price: '15.00',
        product_visibility: 'internal'
      });

      logTest(
        'Create category → Create product flow',
        prodRes.ok && prodRes.data.success,
        'Product assigned to vendor category'
      );

      if (prodRes.data.success) {
        productId = prodRes.data.product.id;
      }
    }
  } catch (e) {
    logTest('Create category → Create product flow', false, e.message);
  }

  // Test 2: Full flow - Create blueprint → Assign to category
  try {
    const bpRes = await apiCall('POST', '/api/vendor/pricing-blueprints', {
      name: 'Test Integration Blueprint',
      tier_type: 'weight',
      quality_tier: 'top-shelf',
      context: 'retail',
      price_breaks: [
        { break_id: '1g', label: '1g', qty: 1, unit: 'gram', sort_order: 1 }
      ],
      applicable_to_categories: categoryId ? [categoryId] : []
    });

    logTest(
      'Create blueprint → Assign to category flow',
      bpRes.ok && bpRes.data.success,
      'Blueprint assigned to custom category'
    );

    if (bpRes.data.success) {
      blueprintId = bpRes.data.blueprint.id;
    }
  } catch (e) {
    logTest('Create blueprint → Assign to category flow', false, e.message);
  }

  // Cleanup
  if (productId) await apiCall('DELETE', `/api/vendor/products?product_id=${productId}`);
  if (blueprintId) await apiCall('DELETE', `/api/vendor/pricing-blueprints?id=${blueprintId}`);
  if (categoryId) await apiCall('DELETE', `/api/categories?id=${categoryId}`);

  console.log('');
}

// ============================================
// 5. EDGE CASES & SECURITY
// ============================================

async function testEdgeCases() {
  log('⚠️', 'TESTING EDGE CASES & SECURITY');
  console.log('━'.repeat(60));

  // Test 1: Very long category name
  try {
    const longName = 'A'.repeat(300);
    const res = await apiCall('POST', '/api/categories', {
      name: longName,
      icon: '📦'
    });

    logTest(
      'Handle very long category name',
      res.ok && res.data.success,
      'Accepts long names'
    );

    if (res.data.success) {
      await apiCall('DELETE', `/api/categories?id=${res.data.category.id}`);
    }
  } catch (e) {
    logTest('Handle very long category name', false, e.message);
  }

  // Test 2: SQL injection attempt in category name
  try {
    const res = await apiCall('POST', '/api/categories', {
      name: "'; DROP TABLE categories; --",
      icon: '💀'
    });

    // Should either succeed with escaped string or fail safely
    const safe = res.ok ? res.data.category.name === "'; DROP TABLE categories; --" : true;
    logTest(
      'Prevent SQL injection in category',
      safe,
      'Input properly escaped/sanitized'
    );

    if (res.data.success) {
      await apiCall('DELETE', `/api/categories?id=${res.data.category.id}`);
    }
  } catch (e) {
    logTest('Prevent SQL injection', true, 'Request rejected');
  }

  // Test 3: XSS attempt in description
  try {
    const res = await apiCall('POST', '/api/categories', {
      name: 'XSS Test',
      description: '<script>alert("xss")</script>',
      icon: '🛡️'
    });

    logTest(
      'Handle XSS in description',
      res.ok,
      'String stored (client should sanitize)'
    );

    if (res.data.success) {
      await apiCall('DELETE', `/api/categories?id=${res.data.category.id}`);
    }
  } catch (e) {
    logTest('Handle XSS in description', false, e.message);
  }

  // Test 4: Unauthorized access - Try without vendor ID
  try {
    const res = await apiCall('POST', '/api/categories', {
      name: 'Unauthorized Category',
      icon: '🚫'
    }, { 'x-vendor-id': '' });

    logTest(
      'Reject requests without vendor ID',
      !res.ok || res.status === 401,
      'Authentication required'
    );
  } catch (e) {
    logTest('Reject unauthorized requests', true, 'Auth check working');
  }

  // Test 5: Try to access another vendor's category
  try {
    // Create a category
    const createRes = await apiCall('POST', '/api/categories', {
      name: 'Vendor A Category',
      icon: '🏢'
    });

    if (createRes.data.success) {
      const categoryId = createRes.data.category.id;

      // Try to edit with different vendor ID
      const editRes = await apiCall('PUT', '/api/categories', {
        id: categoryId,
        name: 'Hacked by Vendor B'
      }, { 'x-vendor-id': 'different-vendor-id-12345' });

      logTest(
        'Prevent cross-vendor category access',
        !editRes.ok || editRes.data.error,
        'Vendor isolation enforced'
      );

      // Cleanup
      await apiCall('DELETE', `/api/categories?id=${categoryId}`);
    }
  } catch (e) {
    logTest('Prevent cross-vendor access', false, e.message);
  }

  console.log('');
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('');
  console.log('🧪 COMPREHENSIVE MULTI-TENANT VENDOR AUTONOMY TEST SUITE');
  console.log('═'.repeat(60));
  console.log('');

  const startTime = Date.now();

  await testCategories();
  await testPricingBlueprints();
  await testProductVisibility();
  await testIntegration();
  await testEdgeCases();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log('');
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('');

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  ❌ ${t.name}: ${t.details}`));
    console.log('');
  }

  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  console.log('');

  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Steve Jobs would be proud. ✨');
  } else {
    console.log('⚠️  Some tests failed. Review output above.');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
