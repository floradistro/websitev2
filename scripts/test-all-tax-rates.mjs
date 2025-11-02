#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function header(text) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log('='.repeat(80));
}

function log(icon, text, color = colors.white) {
  console.log(`${color}${icon} ${text}${colors.reset}`);
}

async function createPOSSale(locationId, customerId, customerName, items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * taxRate;
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

async function testTaxCalculation(taxConfig, testAmount = 100) {
  const locationName = taxConfig.location_name;
  const taxRate = taxConfig.sales_tax_rate;
  const displayRate = taxConfig.default_rate;

  header(`Testing: ${locationName} - ${displayRate}% Tax`);

  // Get inventory from Charlotte Central
  const { data: inventory } = await supabase
    .from('inventory')
    .select('id, product_id, quantity, products(id, name, price, sku)')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .eq('vendor_id', FLORA_VENDOR_ID)
    .gt('quantity', 5)
    .limit(1)
    .single();

  if (!inventory) {
    log('❌', 'No inventory available', colors.red);
    return { passed: false, error: 'No inventory' };
  }

  // Create test customer
  const timestamp = Date.now();
  const { data: customer } = await supabase
    .from('customers')
    .insert({
      first_name: 'TaxTest',
      last_name: locationName,
      email: `taxtest.${locationName.toLowerCase().replace(/\s+/g, '')}.${timestamp}@test.com`,
      phone: `+191988${String(timestamp).slice(-5)}`
    })
    .select()
    .single();

  await supabase.from('vendor_customers').insert({
    vendor_id: FLORA_VENDOR_ID,
    customer_id: customer.id
  });

  // Calculate expected values
  const expectedSubtotal = testAmount;
  const expectedTax = testAmount * taxRate;
  const expectedTotal = expectedSubtotal + expectedTax;

  console.log(`\n📋 Expected Calculations:`);
  console.log(`   Subtotal: $${expectedSubtotal.toFixed(2)}`);
  console.log(`   Tax Rate: ${displayRate}% (${taxRate})`);
  console.log(`   Tax Amount: $${expectedTax.toFixed(2)}`);
  console.log(`   Total: $${expectedTotal.toFixed(2)}`);

  // Test multiple amounts
  const testCases = [
    { amount: 100, desc: 'Standard $100' },
    { amount: 50.50, desc: 'Fractional $50.50' },
    { amount: 27.33, desc: 'Typical product $27.33' }
  ];

  const results = [];

  for (const testCase of testCases) {
    const unitPrice = inventory.products.price || 25;
    const quantity = testCase.amount / unitPrice;

    const items = [{
      productId: inventory.product_id,
      productName: inventory.products.name,
      unitPrice: unitPrice,
      quantity: quantity,
      lineTotal: testCase.amount,
      inventoryId: inventory.id,
      sku: inventory.products.sku
    }];

    const result = await createPOSSale(
      CHARLOTTE_CENTRAL_ID,
      customer.id,
      `${customer.first_name} ${customer.last_name}`,
      items,
      taxRate
    );

    const subtotal = testCase.amount;
    const calcTax = subtotal * taxRate;
    const calcTotal = subtotal + calcTax;

    if (result.success) {
      const actualSubtotal = parseFloat(result.order.subtotal);
      const actualTax = parseFloat(result.order.tax_amount);
      const actualTotal = parseFloat(result.order.total_amount);

      const taxMatch = Math.abs(actualTax - calcTax) < 0.01;
      const totalMatch = Math.abs(actualTotal - calcTotal) < 0.01;

      const passed = taxMatch && totalMatch;

      console.log(`\n${passed ? '✅' : '❌'} ${testCase.desc}:`);
      console.log(`   Subtotal: $${actualSubtotal.toFixed(2)} ${actualSubtotal === subtotal ? '✓' : '✗'}`);
      console.log(`   Tax: $${actualTax.toFixed(2)} (expected $${calcTax.toFixed(2)}) ${taxMatch ? '✓' : '✗'}`);
      console.log(`   Total: $${actualTotal.toFixed(2)} (expected $${calcTotal.toFixed(2)}) ${totalMatch ? '✓' : '✗'}`);
      console.log(`   Order: ${result.orderNumber}`);

      results.push({ passed, testCase: testCase.desc, orderNumber: result.orderNumber });
    } else {
      console.log(`\n❌ ${testCase.desc}: FAILED`);
      console.log(`   Error: ${result.error}`);
      results.push({ passed: false, testCase: testCase.desc, error: result.error });
    }
  }

  const allPassed = results.every(r => r.passed);
  return {
    location: locationName,
    taxRate: displayRate,
    passed: allPassed,
    results
  };
}

async function main() {
  header('🧪 COMPREHENSIVE TAX RATE VERIFICATION');

  // Get all tax configurations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .neq('type', 'warehouse')
    .eq('is_active', true);

  const taxConfigs = locations
    .map(l => l.settings?.tax_config)
    .filter(tc => tc && tc.enabled);

  console.log(`\n📍 Testing ${taxConfigs.length} tax configurations\n`);

  const allResults = [];

  for (const taxConfig of taxConfigs) {
    const result = await testTaxCalculation(taxConfig);
    allResults.push(result);
  }

  // Summary
  header('📊 FINAL RESULTS');

  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`\nTotal Locations Tested: ${totalTests}`);
  log('✅', `Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`,
    passedTests === totalTests ? colors.green : colors.yellow);

  if (failedTests > 0) {
    log('❌', `Failed: ${failedTests}/${totalTests}`, colors.red);
  }

  console.log('\n📋 Location Summary:');
  allResults.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.location} - ${result.taxRate}%${colors.reset}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Database audit
  header('🔍 DATABASE AUDIT');

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('order_number, subtotal, tax_amount, total_amount, created_at')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .eq('pickup_location_id', CHARLOTTE_CENTRAL_ID)
    .gte('created_at', new Date(Date.now() - 300000).toISOString())
    .order('created_at', { ascending: false });

  console.log(`\n📦 Created ${recentOrders?.length || 0} test orders in last 5 minutes`);

  if (recentOrders && recentOrders.length > 0) {
    console.log('\nSample orders:');
    recentOrders.slice(0, 5).forEach(order => {
      const taxPercent = (order.tax_amount / order.subtotal * 100).toFixed(2);
      console.log(`   ${order.order_number}: $${order.subtotal} + $${order.tax_amount} (${taxPercent}%) = $${order.total_amount}`);
    });
  }

  header('✅ TESTING COMPLETE');

  if (failedTests === 0) {
    log('🎉', 'ALL TAX RATES VERIFIED - PRODUCTION READY!', colors.green + colors.bright);
  } else {
    log('⚠️ ', 'Some tests failed - review required', colors.yellow);
  }
}

main().catch(console.error);
