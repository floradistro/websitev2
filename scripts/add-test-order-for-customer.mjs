#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customerEmail = process.argv[2] || 'fahad@cwscommercial.com';

console.log('🧪 Creating Test Order for Customer\n');
console.log(`Customer Email: ${customerEmail}\n`);

// STEP 1: Find customer
console.log('1️⃣ Finding customer...');
const { data: customer, error: customerError } = await supabase
  .from('customers')
  .select('*')
  .eq('email', customerEmail)
  .single();

if (customerError || !customer) {
  console.error('❌ Customer not found:', customerEmail);
  console.log('\n💡 Creating new customer...');

  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      email: customerEmail,
      first_name: 'Fahad',
      last_name: 'Test',
      phone: '+15555551234',
      loyalty_points: 0,
      loyalty_tier: 'bronze'
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create customer:', createError);
    process.exit(1);
  }

  console.log(`✅ Customer created: ${newCustomer.email}`);
  customer = newCustomer;
} else {
  console.log(`✅ Customer found: ${customer.email}`);
  console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
  console.log(`   Customer ID: ${customer.id}`);
}

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

// STEP 3: Create test order via API (this will trigger the Alpine IQ sync automatically)
console.log('\n3️⃣ Creating test order via API...');

const orderPayload = {
  customer_id: customer.id,
  line_items: [
    {
      product_id: product.id,
      name: product.name,
      quantity: 1,
      quantity_grams: 3.5,
      quantity_display: '1/8 oz',
      price: 50.00,
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
  customer_note: 'TEST ORDER - Wallet Pass Demo',
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

    // Fallback: Create order directly in database
    console.log('\n⚠️  Falling back to direct database insert...');

    const orderNumber = `TEST-${Date.now()}`;
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
        customer_note: 'TEST ORDER - Wallet Pass Demo'
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Database insert failed:', orderError);
      process.exit(1);
    }

    // Create order item
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

    console.log(`✅ Order created in database: ${order.order_number}`);

    // Manually sync to Alpine IQ
    console.log('\n4️⃣ Syncing to Alpine IQ...');

    const transactionDate = new Date(order.order_date)
      .toISOString()
      .replace('T', ' ')
      .split('.')[0] + ' +0000';

    const alpinePayload = {
      member: {
        email: customer.email,
        mobilePhone: customer.phone || '+15555551234',
        firstName: customer.first_name || 'Customer',
        lastName: customer.last_name || 'Test',
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

    const alpineResponse = await fetch(`${ALPINE_BASE_URL}/api/v1.1/createUpdateSale/${ALPINE_USER_ID}`, {
      method: 'POST',
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alpinePayload)
    });

    const alpineData = await alpineResponse.json();

    if (alpineResponse.ok && alpineData.success) {
      console.log('✅ Order synced to Alpine IQ');

      // Try to extract and save Alpine IQ customer ID
      if (alpineData.data && alpineData.data.contactID) {
        const alpineiqCustomerId = alpineData.data.contactID;

        await supabase.from('alpineiq_customer_mapping').upsert({
          vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
          customer_id: customer.id,
          alpineiq_customer_id: alpineiqCustomerId,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'customer_id'
        });

        console.log(`✅ Alpine IQ mapping saved - ID: ${alpineiqCustomerId}`);
      } else {
        console.log('⚠️  No contact ID in response, will use existing mapping if available');
      }
    } else {
      console.log('⚠️  Alpine IQ sync response:', alpineData);
    }

  } else {
    console.log(`✅ Order created successfully: ${data.order.number}`);
    console.log(`   Order ID: ${data.order.id}`);
    console.log(`   Total: $${data.order.total}`);
    console.log('\n✅ Alpine IQ sync triggered automatically');
  }

  // Wait a moment for background sync to complete
  console.log('\n⏳ Waiting for Alpine IQ sync to complete (3 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 3000));

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

// STEP 4: Test wallet pass API
console.log('\n5️⃣ Testing wallet pass API...');

try {
  const walletResponse = await fetch(
    `http://localhost:3000/api/customer/wallet-pass?customer_id=${customer.id}`
  );

  const walletData = await walletResponse.json();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ WALLET PASS TEST COMPLETE!');
  console.log('\n📋 Customer Details:');
  console.log(`   Email: ${customer.email}`);
  console.log(`   Customer ID: ${customer.id}`);
  console.log(`   Name: ${customer.first_name} ${customer.last_name}`);

  if (walletData.success) {
    console.log('\n🎉 Wallet Pass Available!');
    console.log('\n🔗 Wallet Pass Links:');

    if (walletData.walletPass.apple) {
      console.log(`\n🍎 Apple Wallet:`);
      console.log(`   ${walletData.walletPass.apple}`);
    }

    if (walletData.walletPass.google) {
      console.log(`\n🤖 Google Wallet:`);
      console.log(`   ${walletData.walletPass.google}`);
    }

    console.log('\n✅ Customer can now add their loyalty card to their phone!');
  } else {
    console.log('\n⚠️  Wallet Pass Status:');
    console.log(`   ${walletData.error}`);

    if (walletData.needsEnrollment) {
      console.log('\n💡 Note: Customer needs a real Alpine IQ contact ID.');
      console.log('   In production, this happens automatically when they make a purchase.');
    }
  }

  console.log('\n🧪 Test the customer page:');
  console.log(`   1. Go to: http://localhost:3000/storefront/loyalty?vendor=flora-distro`);
  console.log(`   2. Log in as: ${customer.email}`);
  console.log(`   3. Click "Get Wallet Pass"`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (error) {
  console.error('❌ Wallet pass test failed:', error.message);
}
