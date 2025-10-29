#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Alpine IQ Order Sync\n');

// STEP 1: Get a test customer with real email (for Alpine IQ)
console.log('1️⃣ Finding test customer...');
const { data: customers, error: customerError } = await supabase
  .from('customers')
  .select('id, email, phone, first_name, last_name')
  .not('email', 'like', '%@phone.local')
  .not('email', 'like', '%@alpine.local')
  .not('email', 'like', '%@pos.local')
  .limit(5);

if (customerError || !customers || customers.length === 0) {
  console.error('❌ No suitable test customers found');
  process.exit(1);
}

const customer = customers[0];
console.log(`✅ Using customer: ${customer.email} (${customer.first_name} ${customer.last_name})`);

// STEP 2: Get a test product (any product, we'll skip stock check for test)
console.log('\n2️⃣ Finding test product...');
const { data: products, error: productError } = await supabase
  .from('products')
  .select('id, name, sku, category, brand, price, stock_quantity')
  .limit(1)
  .single();

if (productError || !products) {
  console.error('❌ No products found in database');
  console.error('Error:', productError);
  process.exit(1);
}

console.log(`✅ Using product: ${products.name} (SKU: ${products.sku})`);

// STEP 3: Create test order via API
console.log('\n3️⃣ Creating test order...');

const orderPayload = {
  customer_id: customer.id,
  line_items: [
    {
      product_id: products.id,
      name: products.name,
      quantity: 1,
      quantity_grams: 3.5, // 1/8oz
      quantity_display: '1/8 oz',
      price: parseFloat(products.price) || 35.00,
      image: null,
      tierName: 'Recreational',
      orderType: 'delivery'
    }
  ],
  billing_address: {
    street: '123 Test St',
    city: 'Seattle',
    state: 'WA',
    zip: '98101'
  },
  shipping_address: {
    street: '123 Test St',
    city: 'Seattle',
    state: 'WA',
    zip: '98101'
  },
  payment_method: 'cash',
  payment_method_title: 'Cash',
  customer_note: 'TEST ORDER - Alpine IQ Sync Test',
  order_type: 'delivery'
};

try {
  const response = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload)
  });

  const data = await response.json();

  if (!data.success) {
    console.error('❌ Order creation failed:', data.error);
    process.exit(1);
  }

  console.log(`✅ Order created: ${data.order.number}`);
  console.log(`   Order ID: ${data.order.id}`);
  console.log(`   Total: $${data.order.total}`);
  console.log(`   Items: ${data.order.line_items.length}`);

  // STEP 4: Wait a moment for background sync to complete
  console.log('\n4️⃣ Waiting for Alpine IQ sync (3 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n✅ Test complete!');
  console.log('\n📋 Check server logs for Alpine IQ sync confirmation:');
  console.log('   Look for: "✅ Order [order-number] synced to Alpine IQ"');
  console.log('   Or: "⚠️ Alpine IQ sync failed (order still created)"');
  console.log('\n⏰ Note: Order will appear in Alpine IQ dashboard in 24 hours');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
