#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const CHARLOTTE_LOCATION_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

async function createPOSSale(locationId, customerId, customerName, items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * 0.08;
  const total = subtotal + taxAmount;

  const response = await fetch('http://localhost:3000/api/pos/sales/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locationId,
      vendorId: FLORA_VENDOR_ID,
      userId: null,
      sessionId: null,
      customerId,
      customerName,
      items,
      subtotal,
      taxAmount,
      total,
      paymentMethod: 'cash',
      cashTendered: Math.ceil(total),
      changeGiven: Math.ceil(total) - total
    })
  });

  return await response.json();
}

async function testRaceCondition() {
  console.log('\n='.repeat(80));
  console.log('🔬 DETAILED RACE CONDITION TEST');
  console.log('='.repeat(80));

  // Find a product with sufficient inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      quantity,
      products (id, name, price, sku)
    `)
    .eq('vendor_id', FLORA_VENDOR_ID)
    .eq('location_id', CHARLOTTE_LOCATION_ID)
    .gt('quantity', 10)
    .limit(1)
    .single();

  if (!inventory) {
    console.error('❌ No suitable product found for testing');
    process.exit(1);
  }

  console.log(`\n📦 Test Product: ${inventory.products.name}`);
  console.log(`   Initial Quantity: ${inventory.quantity}`);
  console.log(`   Inventory ID: ${inventory.id}\n`);

  // Create 5 test customers
  const customers = [];
  for (let i = 0; i < 5; i++) {
    const timestamp = Date.now() + i;
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        first_name: `RaceTest${i}`,
        last_name: 'Customer',
        email: `racetest${i}.${timestamp}@test.com`,
        phone: `+191966${i}${String(timestamp).slice(-4)}`
      })
      .select()
      .single();

    await supabase.from('vendor_customers').insert({
      vendor_id: FLORA_VENDOR_ID,
      customer_id: customer.id
    });

    customers.push(customer);
  }

  console.log(`✅ Created ${customers.length} test customers\n`);

  // Record starting quantity
  const startQuantity = inventory.quantity;

  console.log('🚀 Launching 5 CONCURRENT sales to same product...\n');

  const startTime = Date.now();

  // Launch 5 simultaneous sales
  const salesPromises = customers.map((customer, i) =>
    createPOSSale(
      CHARLOTTE_LOCATION_ID,
      customer.id,
      `${customer.first_name} ${customer.last_name}`,
      [{
        productId: inventory.product_id,
        productName: inventory.products.name,
        unitPrice: inventory.products.price || 25,
        quantity: 1,
        lineTotal: inventory.products.price || 25,
        inventoryId: inventory.id,
        sku: inventory.products.sku
      }]
    ).then(result => ({
      customerIndex: i,
      result,
      timestamp: Date.now() - startTime
    }))
  );

  const salesResults = await Promise.all(salesPromises);

  console.log('⏱️  All sales completed\n');

  // Analyze results
  const successfulSales = salesResults.filter(s => s.result.success);
  const failedSales = salesResults.filter(s => !s.result.success);

  console.log('📊 RESULTS:');
  console.log(`   Successful: ${successfulSales.length}/5`);
  console.log(`   Failed: ${failedSales.length}/5\n`);

  salesResults.forEach(({ customerIndex, result, timestamp }) => {
    const status = result.success ? '✅' : '❌';
    const orderNum = result.orderNumber || 'N/A';
    console.log(`   ${status} Customer ${customerIndex}: ${orderNum} (${timestamp}ms)`);
  });

  // Check final inventory
  const { data: finalInv } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('id', inventory.id)
    .single();

  console.log(`\n📊 INVENTORY CHECK:`);
  console.log(`   Starting Quantity: ${startQuantity}`);
  console.log(`   Expected After (${startQuantity} - ${successfulSales.length}): ${startQuantity - successfulSales.length}`);
  console.log(`   Actual Quantity: ${finalInv.quantity}`);

  const discrepancy = (startQuantity - successfulSales.length) - finalInv.quantity;

  if (discrepancy !== 0) {
    console.log(`\n❌ RACE CONDITION DETECTED!`);
    console.log(`   Discrepancy: ${Math.abs(discrepancy)} units`);
    console.log(`   Lost Inventory: ${discrepancy > 0 ? 'YES' : 'NO'}`);
    console.log(`   Extra Deductions: ${discrepancy < 0 ? Math.abs(discrepancy) : 0}`);
  } else {
    console.log(`\n✅ NO RACE CONDITION - Inventory is correct!`);
  }

  // Check for duplicate order numbers (another race condition indicator)
  const orderNumbers = successfulSales.map(s => s.result.orderNumber);
  const uniqueOrderNumbers = new Set(orderNumbers);

  if (orderNumbers.length !== uniqueOrderNumbers.size) {
    console.log(`\n⚠️  DUPLICATE ORDER NUMBERS DETECTED!`);
    console.log(`   Total: ${orderNumbers.length}, Unique: ${uniqueOrderNumbers.size}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

testRaceCondition().catch(console.error);
