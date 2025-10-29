#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Alpine IQ Direct Sync\n');

// STEP 1: Get a test customer with real email
console.log('1️⃣ Finding test customer...');
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .not('email', 'like', '%@phone.local')
  .not('email', 'like', '%@alpine.local')
  .not('email', 'like', '%@pos.local')
  .limit(1)
  .single();

if (!customer) {
  console.error('❌ No suitable customer found');
  process.exit(1);
}

console.log(`✅ Customer: ${customer.email} (${customer.first_name} ${customer.last_name})`);

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

// STEP 3: Create mock order directly in database (bypassing API stock checks)
console.log('\n3️⃣ Creating test order in database...');
const orderNumber = `TEST-${Date.now()}`;

const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_id: customer.id,
    order_number: orderNumber,
    status: 'completed',
    total_amount: 42.00,
    currency: 'USD',
    payment_method: 'cash',
    payment_method_title: 'Cash',
    order_date: new Date().toISOString(),
    customer_note: 'TEST ORDER - Alpine IQ Sync Test'
  })
  .select()
  .single();

if (orderError) {
  console.error('❌ Failed to create order:', orderError);
  process.exit(1);
}

console.log(`✅ Order created: ${order.order_number} (ID: ${order.id})`);

// STEP 4: Create order item
console.log('\n4️⃣ Creating order item...');
const { error: itemError } = await supabase
  .from('order_items')
  .insert({
    order_id: order.id,
    product_id: product.id,
    product_name: product.name,
    quantity: 1,
    quantity_grams: 3.5,
    quantity_display: '1/8 oz',
    unit_price: 42.00,
    line_total: 42.00,
    tier_name: 'Recreational'
  });

if (itemError) {
  console.error('❌ Failed to create order item:', itemError);
}

console.log('✅ Order item created');

// STEP 5: Sync to Alpine IQ
console.log('\n5️⃣ Syncing to Alpine IQ...');

// Format transaction date
const transactionDate = new Date(order.order_date)
  .toISOString()
  .replace('T', ' ')
  .split('.')[0] + ' +0000';

const alpinePayload = {
  member: {
    email: customer.email,
    mobilePhone: customer.phone || undefined,
    firstName: customer.first_name || undefined,
    lastName: customer.last_name || undefined,
  },
  visit: {
    pos_id: order.id,
    pos_user: customer.email,
    pos_type: 'online',
    transaction_date: transactionDate,
    location: 'Test Store',
    budtenderName: 'Test Employee',
    budtenderID: 'TEST001',
    visit_details_attributes: [
      {
        sku: product.sku || 'TEST-SKU',
        size: '1/8 oz',
        category: product.category || 'FLOWER',
        brand: product.brand || 'Test Brand',
        name: product.name,
        price: 42.00,
        discount: 0,
        quantity: 1,
        species: product.cannabis_type || 'hybrid',
        customAttributes: product.thc_percentage ? [{
          key: 'THC',
          value: `${product.thc_percentage}%`
        }] : []
      }
    ],
    transaction_total: 42.00,
    send_notification: false
  }
};

console.log('\nPayload:', JSON.stringify(alpinePayload, null, 2));

try {
  const response = await fetch(`${ALPINE_BASE_URL}/api/v1.1/createUpdateSale/${ALPINE_USER_ID}`, {
    method: 'POST',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(alpinePayload)
  });

  console.log(`\n📡 Alpine IQ Response: ${response.status} ${response.statusText}`);

  const text = await response.text();
  if (text) {
    try {
      const data = JSON.parse(text);
      console.log('\nResponse:', JSON.stringify(data, null, 2));

      if (data.success || response.ok) {
        console.log('\n✅ SUCCESS! Order synced to Alpine IQ');
        console.log(`   Customer: ${customer.email}`);
        console.log(`   Order: ${order.order_number}`);
        console.log(`   Total: $42.00`);
        console.log('\n⏰ This transaction will appear in Alpine IQ dashboard in 24 hours');
      } else {
        console.log('\n⚠️ Alpine IQ returned an error');
      }
    } catch {
      console.log('\nResponse (text):', text.substring(0, 500));
    }
  }

} catch (error) {
  console.error('\n❌ Sync failed:', error.message);
}
