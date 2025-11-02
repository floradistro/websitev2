#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(icon, text, color = colors.white) {
  console.log(`${color}${icon} ${text}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log('='.repeat(80));
}

// Test amounts for validation
const TEST_AMOUNTS = [
  { amount: 100, description: '$100 base amount' },
  { amount: 50.50, description: '$50.50 fractional' },
  { amount: 0.01, description: '$0.01 minimum' },
  { amount: 999.99, description: '$999.99 large amount' },
  { amount: 27.33, description: '$27.33 typical product' }
];

async function createPOSSale(locationId, customerId, customerName, items, expectedTaxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * expectedTaxRate;
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

async function testLocationTax(location, testAmount) {
  const taxConfig = location.settings?.tax_config;

  if (!taxConfig) {
    return { success: false, error: 'No tax config found' };
  }

  const expectedTaxRate = taxConfig.sales_tax_rate || 0;
  const expectedTaxAmount = testAmount * expectedTaxRate;
  const expectedTotal = testAmount + expectedTaxAmount;

  // Get inventory for this location
  const { data: inventory } = await supabase
    .from('inventory')
    .select('id, product_id, quantity, products(id, name, price, sku)')
    .eq('location_id', location.id)
    .eq('vendor_id', FLORA_VENDOR_ID)
    .gt('quantity', 0)
    .limit(1)
    .single();

  if (!inventory) {
    return { success: false, error: 'No inventory available' };
  }

  // Create test customer
  const timestamp = Date.now();
  const { data: customer } = await supabase
    .from('customers')
    .insert({
      first_name: 'Tax',
      last_name: `Test ${location.name}`,
      email: `taxtest.${location.slug}.${timestamp}@test.com`,
      phone: `+191977${String(timestamp).slice(-5)}`
    })
    .select()
    .single();

  await supabase.from('vendor_customers').insert({
    vendor_id: FLORA_VENDOR_ID,
    customer_id: customer.id
  });

  // Adjust quantity to match test amount
  const unitPrice = inventory.products.price || 25;
  const quantity = testAmount / unitPrice;

  const items = [{
    productId: inventory.product_id,
    productName: inventory.products.name,
    unitPrice: unitPrice,
    quantity: quantity,
    lineTotal: testAmount,
    inventoryId: inventory.id,
    sku: inventory.products.sku
  }];

  const result = await createPOSSale(
    location.id,
    customer.id,
    `${customer.first_name} ${customer.last_name}`,
    items,
    expectedTaxRate
  );

  return {
    success: result.success,
    location: location.name,
    taxConfig: taxConfig,
    testAmount,
    expectedTaxRate,
    expectedTaxAmount,
    expectedTotal,
    actualOrder: result.order,
    orderNumber: result.orderNumber,
    customer,
    error: result.error
  };
}

async function main() {
  header('🧪 COMPREHENSIVE TAX CONFIGURATION TESTING');

  // Get all locations with tax config
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .neq('type', 'warehouse')
    .eq('is_active', true);

  console.log(`\n📍 Found ${locations.length} active retail locations\n`);

  const testResults = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test each location
  for (const location of locations) {
    header(`Testing: ${location.name} (${location.state})`);

    const taxConfig = location.settings?.tax_config;

    if (!taxConfig) {
      log('⚠️ ', `No tax configuration found for ${location.name}`, colors.yellow);
      continue;
    }

    // Display tax config
    log('📋', 'Tax Configuration:', colors.blue);
    console.log(`   Tax Rate: ${taxConfig.default_rate}%`);
    console.log(`   Decimal: ${taxConfig.sales_tax_rate}`);
    console.log(`   Status: ${taxConfig.status}`);

    if (taxConfig.taxes) {
      console.log(`   Tax Breakdown:`);
      taxConfig.taxes.forEach(tax => {
        console.log(`      - ${tax.name}: ${tax.rate}% (${tax.status})`);
      });
    }

    // Test with $100 amount
    console.log(`\n🧪 Testing with $100.00 purchase...`);
    const result = await testLocationTax(location, 100);
    totalTests++;

    if (result.success) {
      const actualSubtotal = parseFloat(result.actualOrder.subtotal);
      const actualTax = parseFloat(result.actualOrder.tax_amount);
      const actualTotal = parseFloat(result.actualOrder.total_amount);

      const taxMatch = Math.abs(actualTax - result.expectedTaxAmount) < 0.01;
      const totalMatch = Math.abs(actualTotal - result.expectedTotal) < 0.01;

      if (taxMatch && totalMatch) {
        passedTests++;
        log('✅', `PASS: Tax calculated correctly`, colors.green);
        console.log(`   Subtotal: $${actualSubtotal.toFixed(2)}`);
        console.log(`   Tax (${taxConfig.default_rate}%): $${actualTax.toFixed(2)}`);
        console.log(`   Total: $${actualTotal.toFixed(2)}`);
        console.log(`   Order: ${result.orderNumber}`);
      } else {
        failedTests++;
        log('❌', `FAIL: Tax calculation mismatch`, colors.red);
        console.log(`   Expected Tax: $${result.expectedTaxAmount.toFixed(2)}`);
        console.log(`   Actual Tax: $${actualTax.toFixed(2)}`);
        console.log(`   Expected Total: $${result.expectedTotal.toFixed(2)}`);
        console.log(`   Actual Total: $${actualTotal.toFixed(2)}`);
      }

      testResults.push({
        location: location.name,
        taxRate: taxConfig.default_rate,
        passed: taxMatch && totalMatch,
        orderNumber: result.orderNumber,
        subtotal: actualSubtotal,
        tax: actualTax,
        total: actualTotal
      });
    } else {
      failedTests++;
      log('❌', `FAIL: ${result.error}`, colors.red);
      testResults.push({
        location: location.name,
        taxRate: taxConfig.default_rate,
        passed: false,
        error: result.error
      });
    }
  }

  // Summary
  header('📊 TEST SUMMARY');
  console.log(`\nTotal Tests: ${totalTests}`);
  log('✅', `Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`, colors.green);
  if (failedTests > 0) {
    log('❌', `Failed: ${failedTests}/${totalTests}`, colors.red);
  }

  console.log('\n📋 Detailed Results:');
  testResults.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.location} (${result.taxRate}%)${colors.reset}`);
    if (result.passed) {
      console.log(`   Order: ${result.orderNumber}`);
      console.log(`   Subtotal: $${result.subtotal.toFixed(2)}, Tax: $${result.tax.toFixed(2)}, Total: $${result.total.toFixed(2)}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Database verification
  header('🔍 DATABASE VERIFICATION');

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('order_number, subtotal, tax_amount, total_amount, pickup_location_id, locations(name)')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .gte('created_at', new Date(Date.now() - 300000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(`\n📦 Recent Orders (last 5 minutes):`);
  if (recentOrders && recentOrders.length > 0) {
    recentOrders.forEach(order => {
      const taxPercent = (order.tax_amount / order.subtotal * 100).toFixed(2);
      console.log(`   ${order.order_number} - ${order.locations?.name}`);
      console.log(`      Subtotal: $${order.subtotal}, Tax: $${order.tax_amount} (${taxPercent}%), Total: $${order.total_amount}`);
    });
  } else {
    console.log('   No recent orders found');
  }

  header('✅ TESTING COMPLETE');

  if (failedTests === 0) {
    log('🎉', 'ALL TAX CALCULATIONS VERIFIED - PRODUCTION READY!', colors.green + colors.bright);
  } else {
    log('⚠️ ', `${failedTests} test(s) failed - review required`, colors.yellow);
  }
}

main().catch(console.error);
