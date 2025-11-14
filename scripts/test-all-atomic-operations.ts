#!/usr/bin/env tsx
/**
 * 🧪 COMPREHENSIVE ATOMIC OPERATIONS TEST SUITE
 * ==============================================
 *
 * Tests all deployed RPC functions and atomic operations:
 * 1. atomic_create_product - Product creation with inventory/variants
 * 2. atomic_inventory_transfer - Inventory transfers with locking
 * 3. get_or_create_session - POS session management
 * 4. increment_inventory - Restore inventory (void/refund)
 * 5. decrement_inventory - Deduct inventory (sales)
 * 6. update_session_on_void - Session updates on void
 * 7. update_session_for_refund - Session updates on refund
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test vendor ID (YOLO Cultivation)
const TEST_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) console.log(`   Error: ${error}`);
  if (details) console.log(`   Details:`, details);
}

async function cleanup(productIds: string[]) {
  console.log('\n🧹 Cleaning up test data...');
  for (const id of productIds) {
    // Delete product (cascades to inventory, stock movements, variants)
    await supabase.from('products').delete().eq('id', id);
  }
  console.log(`   Deleted ${productIds.length} test products`);
}

async function testAtomicCreateProductSimple() {
  console.log('\n📦 TEST 1: Atomic Product Creation - Simple Product');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Simple Product ${Date.now()}`,
        slug: `test-simple-${Date.now()}`,
        description: 'Test product for atomic creation',
        sku: `TEST-SIMPLE-${Date.now()}`,
        regular_price: 45.00,
        product_type: 'simple',
        status: 'published',
        custom_fields: {
          strain_type: 'sativa',
          thc_content: '22%',
        },
        meta_data: {},
      },
      p_initial_stock: 100,
      p_variants: null,
    });

    if (error) {
      logTest('Simple product creation', false, error.message);
      return null;
    }

    // Verify all components created
    const productId = data.product_id;
    const inventoryId = data.inventory_id;
    const locationId = data.location_id;

    // Check product exists
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    // Check inventory exists
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', inventoryId)
      .single();

    // Check stock movement exists
    const { data: stockMovements } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('inventory_id', inventoryId)
      .eq('reference_type', 'product_creation');

    const allCreated = product && inventory && stockMovements && stockMovements.length > 0;
    const stockCorrect = parseFloat(inventory?.quantity || '0') === 100;

    logTest(
      'Simple product creation',
      allCreated && stockCorrect,
      !allCreated ? 'Missing components' : !stockCorrect ? `Stock incorrect: ${inventory?.quantity}` : undefined,
      {
        product_id: productId,
        inventory_id: inventoryId,
        location: data.location_name,
        stock: inventory?.quantity,
        stock_movement_count: stockMovements?.length || 0,
      }
    );

    return productId;
  } catch (err: any) {
    logTest('Simple product creation', false, err.message);
    return null;
  }
}

async function testAtomicCreateProductVariable() {
  console.log('\n📦 TEST 2: Atomic Product Creation - Variable Product with Variants');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Variable Product ${Date.now()}`,
        slug: `test-variable-${Date.now()}`,
        sku: `TEST-VAR-${Date.now()}`,
        product_type: 'variable',
        status: 'published',
        custom_fields: {},
        meta_data: {},
      },
      p_initial_stock: 0, // Variable products use variant stock
      p_variants: [
        {
          name: '3.5g',
          sku: `TEST-VAR-3.5-${Date.now()}`,
          regular_price: 35.00,
          stock_quantity: 50,
          attributes: { weight: '3.5g' },
        },
        {
          name: '7g',
          sku: `TEST-VAR-7-${Date.now()}`,
          regular_price: 65.00,
          stock_quantity: 30,
          attributes: { weight: '7g' },
        },
      ],
    });

    if (error) {
      logTest('Variable product creation', false, error.message);
      return null;
    }

    const productId = data.product_id;
    const variantIds = data.variant_ids || [];
    const variantsCreated = data.variants_created;

    // Verify variants exist
    const { data: variants } = await supabase
      .from('product_variations')
      .select('*')
      .eq('parent_product_id', productId);

    const correctVariantCount = variants?.length === 2 && variantsCreated === 2;

    logTest(
      'Variable product creation',
      correctVariantCount,
      correctVariantCount ? undefined : 'Variant count mismatch',
      {
        product_id: productId,
        variants_created: variantsCreated,
        variant_ids: variantIds,
        variant_names: variants?.map(v => v.name) || [],
      }
    );

    return productId;
  } catch (err: any) {
    logTest('Variable product creation', false, err.message);
    return null;
  }
}

async function testAtomicCreateProductNoLocation() {
  console.log('\n📦 TEST 3: Atomic Product Creation - Fail Fast (No Primary Location)');

  try {
    // Use a fake vendor ID that has no locations
    const fakeVendorId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: fakeVendorId,
      p_product_data: {
        name: `TEST Should Fail ${Date.now()}`,
        slug: `test-fail-${Date.now()}`,
        sku: `TEST-FAIL-${Date.now()}`,
        regular_price: 45.00,
        product_type: 'simple',
        status: 'published',
      },
      p_initial_stock: 100,
      p_variants: null,
    });

    // Should fail with "No primary location found"
    const failedCorrectly = error && error.message.includes('No primary location found');

    // Verify no product was created
    const { data: orphanProducts } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', fakeVendorId);

    const noOrphans = !orphanProducts || orphanProducts.length === 0;

    logTest(
      'Fail fast validation (no location)',
      failedCorrectly && noOrphans,
      failedCorrectly ? undefined : 'Should have failed with location error',
      {
        error_message: error?.message,
        orphan_products_created: orphanProducts?.length || 0,
      }
    );

    return null;
  } catch (err: any) {
    logTest('Fail fast validation (no location)', false, err.message);
    return null;
  }
}

async function testAtomicCreateProductNoVariants() {
  console.log('\n📦 TEST 4: Atomic Product Creation - Variable Product Validation (No Variants)');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Variable No Variants ${Date.now()}`,
        slug: `test-var-none-${Date.now()}`,
        sku: `TEST-VAR-NONE-${Date.now()}`,
        product_type: 'variable',
        status: 'published',
      },
      p_initial_stock: 0,
      p_variants: null, // ❌ Variable product requires variants
    });

    // Should fail with "Variable products require at least one variant"
    const failedCorrectly = error && error.message.includes('require at least one variant');

    logTest(
      'Variable product validation (no variants)',
      failedCorrectly,
      failedCorrectly ? undefined : 'Should have failed with variant requirement',
      {
        error_message: error?.message,
      }
    );

    return null;
  } catch (err: any) {
    logTest('Variable product validation (no variants)', false, err.message);
    return null;
  }
}

async function testInventoryOperations() {
  console.log('\n📊 TEST 5: Inventory Increment/Decrement Operations');

  try {
    // Get an existing product with inventory
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('id, quantity, product_id')
      .eq('vendor_id', TEST_VENDOR_ID)
      .limit(1)
      .single();

    if (!existingInventory) {
      logTest('Inventory operations', false, 'No existing inventory found for testing');
      return;
    }

    const inventoryId = existingInventory.id;
    const initialQty = parseFloat(existingInventory.quantity);

    // Test decrement (simulate sale)
    const { data: decrementData, error: decrementError } = await supabase.rpc('decrement_inventory', {
      p_inventory_id: inventoryId,
      p_quantity: 5,
      p_reference_type: 'test_sale',
      p_reference_id: 'TEST-SALE-001',
      p_reason: 'Test decrement operation',
    });

    // Test increment (simulate void/refund)
    const { data: incrementData, error: incrementError } = await supabase.rpc('increment_inventory', {
      p_inventory_id: inventoryId,
      p_quantity: 5,
      p_reference_type: 'test_void',
      p_reference_id: 'TEST-VOID-001',
      p_reason: 'Test increment operation',
    });

    // Verify final quantity matches initial
    const { data: finalInventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', inventoryId)
      .single();

    const finalQty = parseFloat(finalInventory?.quantity || '0');
    const quantityRestored = Math.abs(finalQty - initialQty) < 0.01; // Account for floating point

    logTest(
      'Inventory increment/decrement',
      !decrementError && !incrementError && quantityRestored,
      decrementError?.message || incrementError?.message,
      {
        inventory_id: inventoryId,
        initial_qty: initialQty,
        final_qty: finalQty,
        decrement_success: !decrementError,
        increment_success: !incrementError,
      }
    );
  } catch (err: any) {
    logTest('Inventory increment/decrement', false, err.message);
  }
}

async function testSessionOperations() {
  console.log('\n💰 TEST 6: POS Session Operations');

  try {
    // Get a primary location
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('vendor_id', TEST_VENDOR_ID)
      .eq('is_primary', true)
      .limit(1)
      .single();

    if (!location) {
      logTest('Session operations', false, 'No primary location found');
      return;
    }

    // Test get_or_create_session
    const testUserId = TEST_VENDOR_ID; // Use vendor ID as user ID for testing
    const { data: sessionData, error: sessionError } = await supabase.rpc('get_or_create_session', {
      p_location_id: location.id,
      p_user_id: testUserId,
    });

    if (sessionError || !sessionData) {
      logTest('Session operations', false, sessionError?.message || 'No session returned');
      return;
    }

    const sessionId = sessionData.session_id;

    // Test update_session_on_void
    const { error: voidError } = await supabase.rpc('update_session_on_void', {
      p_session_id: sessionId,
      p_amount_to_subtract: 25.50,
    });

    // Test update_session_for_refund
    const { error: refundError } = await supabase.rpc('update_session_for_refund', {
      p_session_id: sessionId,
      p_refund_amount: 15.25,
    });

    logTest(
      'Session operations',
      !sessionError && !voidError && !refundError,
      sessionError?.message || voidError?.message || refundError?.message,
      {
        session_id: sessionId,
        session_created: sessionData.was_created,
        void_update: !voidError,
        refund_update: !refundError,
      }
    );
  } catch (err: any) {
    logTest('Session operations', false, err.message);
  }
}

async function testInventoryTransfer() {
  console.log('\n🚚 TEST 7: Atomic Inventory Transfer');

  try {
    // Get two locations for transfer test
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('vendor_id', TEST_VENDOR_ID)
      .eq('is_active', true)
      .limit(2);

    if (!locations || locations.length < 2) {
      logTest('Inventory transfer', false, 'Need at least 2 locations for transfer test (skipped)');
      return;
    }

    // Get inventory at first location
    const { data: sourceInventory } = await supabase
      .from('inventory')
      .select('id, product_id, quantity')
      .eq('location_id', locations[0].id)
      .eq('vendor_id', TEST_VENDOR_ID)
      .gte('quantity', 10) // Need at least 10g to transfer
      .limit(1)
      .single();

    if (!sourceInventory) {
      logTest('Inventory transfer', false, 'No inventory with sufficient stock (skipped)');
      return;
    }

    const { data: transferData, error: transferError } = await supabase.rpc('atomic_inventory_transfer', {
      p_product_id: sourceInventory.product_id,
      p_from_location_id: locations[0].id,
      p_to_location_id: locations[1].id,
      p_quantity: 5,
      p_vendor_id: TEST_VENDOR_ID,
      p_reason: 'Test transfer operation',
    });

    logTest(
      'Atomic inventory transfer',
      !transferError && transferData?.success === true,
      transferError?.message,
      {
        from_location: locations[0].name,
        to_location: locations[1].name,
        product_id: sourceInventory.product_id,
        transfer_qty: 5,
        success: transferData?.success,
      }
    );
  } catch (err: any) {
    logTest('Atomic inventory transfer', false, err.message);
  }
}

async function verifyAllFunctionsExist() {
  console.log('\n🔍 TEST 8: Verify All RPC Functions Deployed');

  const requiredFunctions = [
    'atomic_create_product',
    'atomic_inventory_transfer',
    'get_or_create_session',
    'increment_inventory',
    'decrement_inventory',
    'update_session_on_void',
    'update_session_for_refund',
  ];

  try {
    const { data: functions, error } = await supabase.rpc('pg_catalog.pg_proc') as any;

    // Alternative: Try to call each function with invalid params to verify existence
    const existenceChecks = await Promise.all(
      requiredFunctions.map(async (funcName) => {
        const { error } = await supabase.rpc(funcName as any, {} as any);
        // If function exists, we'll get a parameter error, not "function not found"
        const exists = !error || !error.message.includes('Could not find');
        return { name: funcName, exists };
      })
    );

    const allExist = existenceChecks.every(check => check.exists);
    const missingFunctions = existenceChecks.filter(check => !check.exists).map(c => c.name);

    logTest(
      'All RPC functions deployed',
      allExist,
      allExist ? undefined : `Missing: ${missingFunctions.join(', ')}`,
      {
        total_required: requiredFunctions.length,
        total_found: existenceChecks.filter(c => c.exists).length,
        functions: existenceChecks,
      }
    );
  } catch (err: any) {
    logTest('All RPC functions deployed', false, err.message);
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE ATOMIC OPERATIONS TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Vendor: ${TEST_VENDOR_ID}`);
  console.log('='.repeat(60));

  const createdProductIds: string[] = [];

  // TEST 1: Simple product creation
  const simpleProductId = await testAtomicCreateProductSimple();
  if (simpleProductId) createdProductIds.push(simpleProductId);

  // TEST 2: Variable product creation
  const variableProductId = await testAtomicCreateProductVariable();
  if (variableProductId) createdProductIds.push(variableProductId);

  // TEST 3: Fail fast - no location
  await testAtomicCreateProductNoLocation();

  // TEST 4: Fail fast - variable without variants
  await testAtomicCreateProductNoVariants();

  // TEST 5: Inventory operations
  await testInventoryOperations();

  // TEST 6: Session operations
  await testSessionOperations();

  // TEST 7: Inventory transfer
  await testInventoryTransfer();

  // TEST 8: Verify all functions exist
  await verifyAllFunctionsExist();

  // Cleanup
  if (createdProductIds.length > 0) {
    await cleanup(createdProductIds);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((err) => {
  console.error('❌ Test suite crashed:', err);
  process.exit(1);
});
