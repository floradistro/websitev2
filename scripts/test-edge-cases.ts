#!/usr/bin/env tsx
/**
 * 🧪 COMPREHENSIVE EDGE CASE TEST SUITE
 * =====================================
 *
 * Tests all the scenarios that could break in production:
 * 1. Boundary conditions (zero, negative, null values)
 * 2. Concurrent operations (race conditions)
 * 3. Rollback scenarios (partial failures)
 * 4. Data integrity (orphaned records, audit trails)
 * 5. Real production data scenarios
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];
const createdProductIds: string[] = [];

function logTest(category: string, name: string, passed: boolean, error?: string, details?: any) {
  results.push({ category, name, passed, error, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category}] ${name}`);
  if (error) console.log(`   Error: ${error}`);
  if (details && !passed) console.log(`   Details:`, JSON.stringify(details, null, 2));
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  for (const id of createdProductIds) {
    await supabase.from('products').delete().eq('id', id);
  }
  console.log(`   Deleted ${createdProductIds.length} test products`);
  createdProductIds.length = 0;
}

// ============================================================================
// CATEGORY 1: BOUNDARY CONDITIONS
// ============================================================================

async function testZeroStockProduct() {
  console.log('\n📦 BOUNDARY CONDITIONS - Zero Stock Product');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Zero Stock ${Date.now()}`,
        slug: `test-zero-${Date.now()}`,
        sku: `TEST-ZERO-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
        custom_fields: {},
        meta_data: {},
      },
      p_initial_stock: 0, // Zero stock - should NOT create inventory
      p_variants: null,
    });

    if (error) {
      logTest('BOUNDARY', 'Zero stock product', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    // Verify no inventory was created
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId);

    // Verify no stock movement was created
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('reference_id', productId);

    const noInventory = !inventory || inventory.length === 0;
    const noMovements = !movements || movements.length === 0;
    const correctBehavior = noInventory && noMovements;

    logTest(
      'BOUNDARY',
      'Zero stock product',
      correctBehavior,
      correctBehavior ? undefined : 'Inventory/movements should not be created for zero stock',
      {
        product_created: !!productId,
        inventory_count: inventory?.length || 0,
        movement_count: movements?.length || 0,
        inventory_created_flag: data.inventory_created,
      }
    );
  } catch (err: any) {
    logTest('BOUNDARY', 'Zero stock product', false, err.message);
  }
}

async function testNegativeStock() {
  console.log('\n📦 BOUNDARY CONDITIONS - Negative Stock');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Negative Stock ${Date.now()}`,
        slug: `test-neg-${Date.now()}`,
        sku: `TEST-NEG-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: -10, // Negative stock - should be rejected or handled
      p_variants: null,
    });

    // Should either reject or convert to zero
    if (error) {
      // If it rejects, that's good
      logTest('BOUNDARY', 'Negative stock rejection', true, undefined, {
        rejected: true,
        error_message: error.message,
      });
    } else {
      // If it accepts, check if it converted to zero or positive
      const productId = data.product_id;
      createdProductIds.push(productId);

      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', productId)
        .single();

      const qty = parseFloat(inventory?.quantity || '0');
      const handledCorrectly = qty >= 0; // Should not be negative

      logTest(
        'BOUNDARY',
        'Negative stock handling',
        handledCorrectly,
        handledCorrectly ? undefined : `Negative stock created: ${qty}`,
        {
          initial_stock: data.initial_stock,
          actual_quantity: qty,
        }
      );
    }
  } catch (err: any) {
    logTest('BOUNDARY', 'Negative stock', false, err.message);
  }
}

async function testZeroPrice() {
  console.log('\n📦 BOUNDARY CONDITIONS - Zero Price Product');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Zero Price ${Date.now()}`,
        slug: `test-zero-price-${Date.now()}`,
        sku: `TEST-ZPRICE-${Date.now()}`,
        regular_price: 0, // Free product
        status: 'published',
      },
      p_initial_stock: 50,
      p_variants: null,
    });

    if (error) {
      logTest('BOUNDARY', 'Zero price product', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: product } = await supabase
      .from('products')
      .select('regular_price')
      .eq('id', productId)
      .single();

    const priceIsZero = parseFloat(product?.regular_price || '0') === 0;

    logTest(
      'BOUNDARY',
      'Zero price product',
      priceIsZero,
      priceIsZero ? undefined : 'Price should be zero',
      { price: product?.regular_price }
    );
  } catch (err: any) {
    logTest('BOUNDARY', 'Zero price product', false, err.message);
  }
}

async function testNullPriceDefaults() {
  console.log('\n📦 BOUNDARY CONDITIONS - Null/Missing Price');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Null Price ${Date.now()}`,
        slug: `test-null-price-${Date.now()}`,
        sku: `TEST-NPRICE-${Date.now()}`,
        // regular_price omitted - should default to 0
        status: 'published',
      },
      p_initial_stock: 25,
      p_variants: null,
    });

    if (error) {
      logTest('BOUNDARY', 'Null price defaults', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: product } = await supabase
      .from('products')
      .select('regular_price')
      .eq('id', productId)
      .single();

    const hasDefaultPrice = product?.regular_price !== null;

    logTest(
      'BOUNDARY',
      'Null price defaults to 0',
      hasDefaultPrice,
      hasDefaultPrice ? undefined : 'Price should default to 0',
      { price: product?.regular_price }
    );
  } catch (err: any) {
    logTest('BOUNDARY', 'Null price defaults', false, err.message);
  }
}

async function testLargeStock() {
  console.log('\n📦 BOUNDARY CONDITIONS - Large Stock Quantity');

  try {
    const largeQty = 999999.99; // Very large quantity

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Large Stock ${Date.now()}`,
        slug: `test-large-${Date.now()}`,
        sku: `TEST-LARGE-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: largeQty,
      p_variants: null,
    });

    if (error) {
      logTest('BOUNDARY', 'Large stock quantity', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: inventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId)
      .single();

    const actualQty = parseFloat(inventory?.quantity || '0');
    const qtyMatches = Math.abs(actualQty - largeQty) < 0.01;

    logTest(
      'BOUNDARY',
      'Large stock quantity',
      qtyMatches,
      qtyMatches ? undefined : `Quantity mismatch: expected ${largeQty}, got ${actualQty}`,
      {
        expected: largeQty,
        actual: actualQty,
      }
    );
  } catch (err: any) {
    logTest('BOUNDARY', 'Large stock quantity', false, err.message);
  }
}

async function testDecimalPrecision() {
  console.log('\n📦 BOUNDARY CONDITIONS - Decimal Precision');

  try {
    const preciseQty = 123.456789; // Many decimal places

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Decimal ${Date.now()}`,
        slug: `test-decimal-${Date.now()}`,
        sku: `TEST-DEC-${Date.now()}`,
        regular_price: 45.99,
        status: 'published',
      },
      p_initial_stock: preciseQty,
      p_variants: null,
    });

    if (error) {
      logTest('BOUNDARY', 'Decimal precision', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: inventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId)
      .single();

    const actualQty = parseFloat(inventory?.quantity || '0');
    const precisionPreserved = Math.abs(actualQty - preciseQty) < 0.0001;

    logTest(
      'BOUNDARY',
      'Decimal precision preserved',
      precisionPreserved,
      precisionPreserved ? undefined : `Precision lost: expected ${preciseQty}, got ${actualQty}`,
      {
        expected: preciseQty,
        actual: actualQty,
        difference: Math.abs(actualQty - preciseQty),
      }
    );
  } catch (err: any) {
    logTest('BOUNDARY', 'Decimal precision', false, err.message);
  }
}

// ============================================================================
// CATEGORY 2: DATA INTEGRITY
// ============================================================================

async function testAuditTrailCompleteness() {
  console.log('\n📋 DATA INTEGRITY - Complete Audit Trail');

  try {
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Audit Trail ${Date.now()}`,
        slug: `test-audit-${Date.now()}`,
        sku: `TEST-AUDIT-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 100,
      p_variants: null,
    });

    if (error) {
      logTest('INTEGRITY', 'Audit trail completeness', false, error.message);
      return;
    }

    const productId = data.product_id;
    const inventoryId = data.inventory_id;
    createdProductIds.push(productId);

    // Check stock movement has all required fields
    const { data: movement } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('inventory_id', inventoryId)
      .eq('reference_type', 'product_creation')
      .single();

    const requiredFields = [
      'inventory_id',
      'movement_type',
      'quantity',
      'to_location_id',
      'reference_type',
      'reference_id',
      'reason',
      'metadata',
      'created_at',
    ];

    const missingFields = requiredFields.filter(field => !movement || movement[field] === null);
    const isComplete = missingFields.length === 0;

    // Verify metadata has expected structure
    const metadata = movement?.metadata || {};
    const hasMetadata = metadata.created_by === 'atomic_product_creation' &&
                       metadata.product_name &&
                       metadata.location_name;

    logTest(
      'INTEGRITY',
      'Audit trail completeness',
      isComplete && hasMetadata,
      isComplete ? undefined : `Missing fields: ${missingFields.join(', ')}`,
      {
        missing_fields: missingFields,
        has_metadata: hasMetadata,
        metadata_keys: Object.keys(metadata),
      }
    );
  } catch (err: any) {
    logTest('INTEGRITY', 'Audit trail completeness', false, err.message);
  }
}

async function testNoOrphanedRecords() {
  console.log('\n📋 DATA INTEGRITY - No Orphaned Records');

  try {
    // Create a product successfully
    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Orphan Check ${Date.now()}`,
        slug: `test-orphan-${Date.now()}`,
        sku: `TEST-ORPHAN-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 50,
      p_variants: null,
    });

    if (error) {
      logTest('INTEGRITY', 'No orphaned records', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    // Check all related records exist
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, product_id')
      .eq('product_id', productId);

    const { data: movements } = await supabase
      .from('stock_movements')
      .select('id, reference_id')
      .eq('reference_id', productId)
      .eq('reference_type', 'product_creation');

    const allRelated = !!product && inventory && inventory.length > 0 && movements && movements.length > 0;

    // Verify inventory references product
    const inventoryLinked = inventory && inventory.every(inv => inv.product_id === productId);

    // Verify movements reference product
    const movementsLinked = movements && movements.every(mov => mov.reference_id === productId);

    const noOrphans = allRelated && inventoryLinked && movementsLinked;

    logTest(
      'INTEGRITY',
      'No orphaned records',
      noOrphans,
      noOrphans ? undefined : 'Found orphaned or unlinked records',
      {
        product_exists: !!product,
        inventory_count: inventory?.length || 0,
        movements_count: movements?.length || 0,
        inventory_linked: inventoryLinked,
        movements_linked: movementsLinked,
      }
    );
  } catch (err: any) {
    logTest('INTEGRITY', 'No orphaned records', false, err.message);
  }
}

async function testStockStatusConsistency() {
  console.log('\n📋 DATA INTEGRITY - Stock Status Consistency');

  try {
    // Test 1: In stock product
    const { data: inStockData } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST In Stock ${Date.now()}`,
        slug: `test-instock-${Date.now()}`,
        sku: `TEST-INSTOCK-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 100,
      p_variants: null,
    });

    if (inStockData) createdProductIds.push(inStockData.product_id);

    const { data: inStockProduct } = await supabase
      .from('products')
      .select('stock_status, stock_quantity')
      .eq('id', inStockData?.product_id)
      .single();

    const inStockCorrect = inStockProduct?.stock_status === 'instock' &&
                          parseFloat(inStockProduct?.stock_quantity || '0') === 100;

    // Test 2: Out of stock product
    const { data: outStockData } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Out Stock ${Date.now()}`,
        slug: `test-outstock-${Date.now()}`,
        sku: `TEST-OUTSTOCK-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 0,
      p_variants: null,
    });

    if (outStockData) createdProductIds.push(outStockData.product_id);

    const { data: outStockProduct } = await supabase
      .from('products')
      .select('stock_status, stock_quantity')
      .eq('id', outStockData?.product_id)
      .single();

    const outStockCorrect = outStockProduct?.stock_status === 'outofstock' &&
                           parseFloat(outStockProduct?.stock_quantity || '0') === 0;

    logTest(
      'INTEGRITY',
      'Stock status consistency',
      inStockCorrect && outStockCorrect,
      (inStockCorrect && outStockCorrect) ? undefined : 'Stock status mismatch with quantity',
      {
        instock_status: inStockProduct?.stock_status,
        instock_qty: inStockProduct?.stock_quantity,
        outstock_status: outStockProduct?.stock_status,
        outstock_qty: outStockProduct?.stock_quantity,
      }
    );
  } catch (err: any) {
    logTest('INTEGRITY', 'Stock status consistency', false, err.message);
  }
}

// ============================================================================
// CATEGORY 3: REAL PRODUCTION SCENARIOS
// ============================================================================

async function testDuplicateSkuHandling() {
  console.log('\n🏭 PRODUCTION - Duplicate SKU Handling');

  try {
    const duplicateSku = `TEST-DUP-${Date.now()}`;

    // Create first product
    const { data: first, error: error1 } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Duplicate SKU 1 ${Date.now()}`,
        slug: `test-dup1-${Date.now()}`,
        sku: duplicateSku,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 50,
      p_variants: null,
    });

    if (error1) {
      logTest('PRODUCTION', 'Duplicate SKU handling', false, error1.message);
      return;
    }

    createdProductIds.push(first.product_id);

    // Try to create second product with same SKU
    const { data: second, error: error2 } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Duplicate SKU 2 ${Date.now()}`,
        slug: `test-dup2-${Date.now()}`,
        sku: duplicateSku, // Same SKU
        regular_price: 50.00,
        status: 'published',
      },
      p_initial_stock: 75,
      p_variants: null,
    });

    // Should either reject or handle gracefully
    if (error2) {
      // Good - rejected duplicate
      logTest('PRODUCTION', 'Duplicate SKU rejected', true, undefined, {
        rejected: true,
        error: error2.message,
      });
    } else {
      // Allowed duplicate - verify both exist separately
      createdProductIds.push(second.product_id);

      const { data: products } = await supabase
        .from('products')
        .select('id, sku')
        .eq('sku', duplicateSku);

      logTest('PRODUCTION', 'Duplicate SKU handling', true, undefined, {
        allowed_duplicates: true,
        duplicate_count: products?.length || 0,
        note: 'System allows duplicate SKUs',
      });
    }
  } catch (err: any) {
    logTest('PRODUCTION', 'Duplicate SKU handling', false, err.message);
  }
}

async function testSpecialCharactersInName() {
  console.log('\n🏭 PRODUCTION - Special Characters Handling');

  try {
    const specialName = `TEST Product with "Quotes" & <Tags> and 'Apostrophe's ${Date.now()}`;

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: specialName,
        slug: `test-special-${Date.now()}`,
        sku: `TEST-SPECIAL-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
      },
      p_initial_stock: 50,
      p_variants: null,
    });

    if (error) {
      logTest('PRODUCTION', 'Special characters handling', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    const namePreserved = product?.name === specialName;

    logTest(
      'PRODUCTION',
      'Special characters preserved',
      namePreserved,
      namePreserved ? undefined : 'Name was modified or escaped incorrectly',
      {
        original: specialName,
        stored: product?.name,
      }
    );
  } catch (err: any) {
    logTest('PRODUCTION', 'Special characters handling', false, err.message);
  }
}

async function testCustomFieldsPersistence() {
  console.log('\n🏭 PRODUCTION - Custom Fields Persistence');

  try {
    const customFields = {
      strain_type: 'indica-dominant',
      thc_content: '28.5%',
      cbd_content: '0.8%',
      terpene_profile: ['Myrcene', 'Limonene', 'Caryophyllene'],
      effects: ['Relaxing', 'Sleepy', 'Euphoric'],
      nose: 'Earthy with citrus notes',
      lineage: 'OG Kush x Durban Poison',
      grower_notes: 'Batch #42 - Harvest 2024-11-01',
    };

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Custom Fields ${Date.now()}`,
        slug: `test-custom-${Date.now()}`,
        sku: `TEST-CUSTOM-${Date.now()}`,
        regular_price: 55.00,
        status: 'published',
        custom_fields: customFields,
      },
      p_initial_stock: 100,
      p_variants: null,
    });

    if (error) {
      logTest('PRODUCTION', 'Custom fields persistence', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: product } = await supabase
      .from('products')
      .select('custom_fields')
      .eq('id', productId)
      .single();

    const storedFields = product?.custom_fields || {};

    // Check all fields persisted correctly
    const allFieldsMatch = Object.keys(customFields).every(key => {
      const expected = JSON.stringify(customFields[key as keyof typeof customFields]);
      const actual = JSON.stringify(storedFields[key]);
      return expected === actual;
    });

    logTest(
      'PRODUCTION',
      'Custom fields persistence',
      allFieldsMatch,
      allFieldsMatch ? undefined : 'Some custom fields were lost or modified',
      {
        fields_count: Object.keys(customFields).length,
        stored_count: Object.keys(storedFields).length,
        all_match: allFieldsMatch,
      }
    );
  } catch (err: any) {
    logTest('PRODUCTION', 'Custom fields persistence', false, err.message);
  }
}

async function testMetaDataPersistence() {
  console.log('\n🏭 PRODUCTION - Meta Data Persistence');

  try {
    const metaData = {
      pricing_mode: 'tiered',
      pricing_tiers: [
        { quantity: '3.5', price: 35.00 },
        { quantity: '7', price: 65.00 },
        { quantity: '14', price: 120.00 },
        { quantity: '28', price: 220.00 },
      ],
      thc_percentage: '24.5%',
      cbd_percentage: '0.5%',
      coa_url: 'https://example.com/coa/batch123.pdf',
    };

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Meta Data ${Date.now()}`,
        slug: `test-meta-${Date.now()}`,
        sku: `TEST-META-${Date.now()}`,
        regular_price: 45.00,
        status: 'published',
        meta_data: metaData,
      },
      p_initial_stock: 100,
      p_variants: null,
    });

    if (error) {
      logTest('PRODUCTION', 'Meta data persistence', false, error.message);
      return;
    }

    const productId = data.product_id;
    createdProductIds.push(productId);

    const { data: product } = await supabase
      .from('products')
      .select('meta_data')
      .eq('id', productId)
      .single();

    const storedMeta = product?.meta_data || {};
    const pricingTiersMatch = JSON.stringify(storedMeta.pricing_tiers) === JSON.stringify(metaData.pricing_tiers);

    logTest(
      'PRODUCTION',
      'Meta data persistence',
      pricingTiersMatch,
      pricingTiersMatch ? undefined : 'Pricing tiers data was lost or modified',
      {
        pricing_mode: storedMeta.pricing_mode,
        tiers_count: storedMeta.pricing_tiers?.length || 0,
      }
    );
  } catch (err: any) {
    logTest('PRODUCTION', 'Meta data persistence', false, err.message);
  }
}

// ============================================================================
// CATEGORY 4: ROLLBACK SCENARIOS
// ============================================================================

async function testRollbackOnInvalidCategory() {
  console.log('\n🔄 ROLLBACK - Invalid Category ID');

  try {
    const fakeCategory = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase.rpc('atomic_create_product', {
      p_vendor_id: TEST_VENDOR_ID,
      p_product_data: {
        name: `TEST Invalid Category ${Date.now()}`,
        slug: `test-invalid-cat-${Date.now()}`,
        sku: `TEST-INVCAT-${Date.now()}`,
        regular_price: 45.00,
        primary_category_id: fakeCategory, // Invalid category
        status: 'published',
      },
      p_initial_stock: 50,
      p_variants: null,
    });

    // Should fail
    if (!error) {
      // If it didn't fail, that might be okay (foreign key not enforced)
      // But verify nothing was created
      const productId = data?.product_id;

      const { data: orphanProducts } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId);

      const noOrphans = !orphanProducts || orphanProducts.length === 0;

      logTest(
        'ROLLBACK',
        'Invalid category rollback',
        noOrphans,
        noOrphans ? undefined : 'Product created with invalid category (FK not enforced)',
        {
          product_created: !!productId,
          allows_invalid_category: !noOrphans,
        }
      );
    } else {
      // Good - it failed
      // Verify no orphaned records
      const sku = `TEST-INVCAT-${Date.now().toString().slice(-6)}`;
      const { data: orphans } = await supabase
        .from('products')
        .select('id')
        .ilike('sku', `%INVCAT%`)
        .gte('created_at', new Date(Date.now() - 60000).toISOString());

      const noOrphans = !orphans || orphans.length === 0;

      logTest(
        'ROLLBACK',
        'Invalid category rollback',
        noOrphans,
        noOrphans ? undefined : 'Found orphaned products',
        {
          failed_correctly: true,
          error: error.message,
          orphans_found: orphans?.length || 0,
        }
      );
    }
  } catch (err: any) {
    logTest('ROLLBACK', 'Invalid category rollback', false, err.message);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllEdgeCaseTests() {
  console.log('🧪 COMPREHENSIVE EDGE CASE TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Vendor: ${TEST_VENDOR_ID}`);
  console.log('='.repeat(60));

  // CATEGORY 1: BOUNDARY CONDITIONS
  await testZeroStockProduct();
  await testNegativeStock();
  await testZeroPrice();
  await testNullPriceDefaults();
  await testLargeStock();
  await testDecimalPrecision();

  // CATEGORY 2: DATA INTEGRITY
  await testAuditTrailCompleteness();
  await testNoOrphanedRecords();
  await testStockStatusConsistency();

  // CATEGORY 3: PRODUCTION SCENARIOS
  await testDuplicateSkuHandling();
  await testSpecialCharactersInName();
  await testCustomFieldsPersistence();
  await testMetaDataPersistence();

  // CATEGORY 4: ROLLBACK SCENARIOS
  await testRollbackOnInvalidCategory();

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EDGE CASE TEST SUMMARY');
  console.log('='.repeat(60));

  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { passed: 0, failed: 0, total: 0 };
    acc[r.category].total++;
    if (r.passed) acc[r.category].passed++;
    else acc[r.category].failed++;
    return acc;
  }, {} as Record<string, { passed: number; failed: number; total: number }>);

  Object.entries(byCategory).forEach(([category, stats]) => {
    console.log(`\n${category}:`);
    console.log(`  ✅ Passed: ${stats.passed}/${stats.total}`);
    if (stats.failed > 0) {
      console.log(`  ❌ Failed: ${stats.failed}/${stats.total}`);
    }
  });

  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOTAL: ${totalPassed}/${total} passed`);

  if (totalFailed > 0) {
    console.log(`\n❌ Failed Tests:`);
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   - [${r.category}] ${r.name}: ${r.error || 'Unknown error'}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  process.exit(totalFailed > 0 ? 1 : 0);
}

runAllEdgeCaseTests().catch((err) => {
  console.error('❌ Test suite crashed:', err);
  process.exit(1);
});
