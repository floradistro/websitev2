#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Setting up Wallet Test Customer\n');
console.log('This script will:');
console.log('1. Create a test customer');
console.log('2. Create a test order');
console.log('3. Sync to Alpine IQ');
console.log('4. Create Alpine IQ customer mapping');
console.log('5. Return the customer ID for wallet testing\n');

// STEP 1: Create test customer
console.log('1️⃣ Creating test customer...');
const testEmail = `wallet-test-${Date.now()}@test.com`;

const { data: customer, error: customerError } = await supabase
  .from('customers')
  .insert({
    email: testEmail,
    first_name: 'Wallet',
    last_name: 'Tester',
    phone: '+15555551234',
    loyalty_points: 0,
    loyalty_tier: 'bronze'
  })
  .select()
  .single();

if (customerError) {
  console.error('❌ Failed to create customer:', customerError);
  process.exit(1);
}

console.log(`✅ Customer created: ${customer.email}`);
console.log(`   Customer ID: ${customer.id}`);

// STEP 2: Get a test product
console.log('\n2️⃣ Finding test product...');
const { data: product } = await supabase
  .from('products')
  .select('*')
  .limit(1)
  .single();

if (!product) {
  console.error('❌ No products found');
  process.exit(1);
}

console.log(`✅ Product: ${product.name}`);

// STEP 3: Create test order
console.log('\n3️⃣ Creating test order...');
const orderNumber = `TEST-WALLET-${Date.now()}`;

const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_id: customer.id,
    order_number: orderNumber,
    status: 'completed',
    total_amount: 50.00,
    currency: 'USD',
    payment_method: 'cash',
    payment_method_title: 'Cash',
    order_date: new Date().toISOString(),
    customer_note: 'TEST ORDER - Wallet Pass Test'
  })
  .select()
  .single();

if (orderError) {
  console.error('❌ Failed to create order:', orderError);
  process.exit(1);
}

console.log(`✅ Order created: ${order.order_number}`);

// STEP 4: Create order item
console.log('\n4️⃣ Creating order item...');
await supabase.from('order_items').insert({
  order_id: order.id,
  product_id: product.id,
  product_name: product.name,
  quantity: 1,
  quantity_grams: 3.5,
  quantity_display: '1/8 oz',
  unit_price: 50.00,
  line_total: 50.00,
  tier_name: 'Recreational'
});

console.log('✅ Order item created');

// STEP 5: Sync to Alpine IQ
console.log('\n5️⃣ Syncing to Alpine IQ...');

const transactionDate = new Date(order.order_date)
  .toISOString()
  .replace('T', ' ')
  .split('.')[0] + ' +0000';

const alpinePayload = {
  member: {
    email: customer.email,
    mobilePhone: customer.phone,
    firstName: customer.first_name,
    lastName: customer.last_name,
  },
  visit: {
    pos_id: order.id,
    pos_user: customer.email,
    pos_type: 'online',
    transaction_date: transactionDate,
    location: 'Test Store',
    budtenderName: 'Test Employee',
    budtenderID: 'TEST001',
    visit_details_attributes: [{
      sku: product.sku || 'TEST-SKU',
      size: '1/8 oz',
      category: product.category || 'FLOWER',
      brand: product.brand || 'Test Brand',
      name: product.name,
      price: 50.00,
      discount: 0,
      quantity: 1,
      species: product.cannabis_type || 'hybrid',
      customAttributes: []
    }],
    transaction_total: 50.00,
    send_notification: false
  }
};

try {
  const response = await fetch(`${ALPINE_BASE_URL}/api/v1.1/createUpdateSale/${ALPINE_USER_ID}`, {
    method: 'POST',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(alpinePayload)
  });

  const data = await response.json();
  console.log('   Alpine IQ Response:', JSON.stringify(data, null, 2));

  if (!response.ok || !data.success) {
    console.error('⚠️  Alpine IQ sync failed');
    console.log('   Response:', data);
  } else {
    console.log('✅ Order synced to Alpine IQ');

    // Alpine IQ returns contactID in different places depending on the response
    let alpineiqCustomerId = null;

    // Try different response structures
    if (data.data && data.data.contactID) {
      alpineiqCustomerId = data.data.contactID;
    } else if (data.contactID) {
      alpineiqCustomerId = data.contactID;
    } else if (data.data && data.data.sales && data.data.sales[0]) {
      // Sometimes it's in the sales array
      console.log('   Checking sales data for contact ID...');
    }

    if (alpineiqCustomerId) {
      // STEP 6: Save mapping
      console.log('\n6️⃣ Saving Alpine IQ customer mapping...');
      await supabase.from('alpineiq_customer_mapping').insert({
        vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
        customer_id: customer.id,
        alpineiq_customer_id: alpineiqCustomerId,
        last_synced_at: new Date().toISOString()
      });

      console.log(`✅ Mapping saved - Alpine IQ ID: ${alpineiqCustomerId}`);
    } else {
      console.log('⚠️  Could not extract Alpine IQ customer ID from response');
      console.log('   Creating a test mapping with placeholder ID...');

      // Create a test mapping with a generated ID for testing purposes
      const testAlpineId = `test-${customer.id.substring(0, 8)}`;
      await supabase.from('alpineiq_customer_mapping').insert({
        vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
        customer_id: customer.id,
        alpineiq_customer_id: testAlpineId,
        last_synced_at: new Date().toISOString()
      });

      console.log(`✅ Test mapping created - Alpine IQ ID: ${testAlpineId}`);
      console.log('   Note: This is a test ID. In production, this would come from Alpine IQ.');
    }
  }
} catch (error) {
  console.error('⚠️  Alpine IQ sync error:', error.message);
  console.log('   Continuing anyway...');
}

// STEP 7: Display test information
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n✅ TEST CUSTOMER READY FOR WALLET TESTING!');
console.log('\n📋 Test Customer Details:');
console.log(`   Email: ${customer.email}`);
console.log(`   Customer ID: ${customer.id}`);
console.log(`   Order: ${order.order_number}`);
console.log(`   Total: $${order.total_amount}`);

console.log('\n🧪 How to Test:');
console.log('   1. Log in to the storefront as this customer');
console.log(`      Email: ${customer.email}`);
console.log('      (You may need to set a password in Supabase Auth first)');
console.log('   ');
console.log('   2. Visit: http://localhost:3000/storefront/loyalty');
console.log('   ');
console.log('   3. Click "Get Wallet Pass"');
console.log('   ');
console.log('   4. You should see Apple Wallet and Google Wallet buttons');
console.log('   ');
console.log('   5. Click either button to get the wallet pass download link');

console.log('\n💡 Alternative Testing:');
console.log('   Test the API directly:');
console.log(`   curl "http://localhost:3000/api/customer/wallet-pass?customer_id=${customer.id}"`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
