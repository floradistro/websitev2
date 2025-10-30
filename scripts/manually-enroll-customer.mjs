#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customerEmail = process.argv[2] || 'fahad@cwscommercial.com';

console.log('🚀 Manually Enrolling Customer in Alpine IQ\n');
console.log(`Customer Email: ${customerEmail}\n`);

// STEP 1: Get customer
console.log('1️⃣ Getting customer data...');
const { data: customer, error: customerError } = await supabase
  .from('customers')
  .select('*')
  .eq('email', customerEmail)
  .single();

if (customerError || !customer) {
  console.error('❌ Customer not found');
  process.exit(1);
}

console.log(`✅ Customer found: ${customer.email}`);
console.log(`   ID: ${customer.id}`);
console.log(`   Name: ${customer.first_name || 'N/A'} ${customer.last_name || 'N/A'}`);
console.log(`   Phone: ${customer.phone || 'N/A'}`);

// STEP 2: Get an order for this customer
console.log('\n2️⃣ Finding customer order...');
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', customer.id)
  .order('order_date', { ascending: false })
  .limit(1)
  .single();

if (!order) {
  console.log('⚠️  No orders found, will create enrollment without order');
}

// STEP 3: Get a product for the order
console.log('\n3️⃣ Getting product...');
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

// STEP 4: Create a sale in Alpine IQ with proper customer data
console.log('\n4️⃣ Creating sale in Alpine IQ to enroll customer...');

const transactionDate = new Date()
  .toISOString()
  .replace('T', ' ')
  .split('.')[0] + ' +0000';

// Ensure we have valid customer data
const firstName = customer.first_name || 'Customer';
const lastName = customer.last_name || 'User';
const phone = customer.phone || '+15555551234';

const alpinePayload = {
  member: {
    email: customer.email,
    mobilePhone: phone,
    firstName: firstName,
    lastName: lastName,
  },
  visit: {
    pos_id: order ? order.id : `ENROLL-${Date.now()}`,
    pos_user: customer.email,
    pos_type: 'online',
    transaction_date: transactionDate,
    location: 'Flora Distribution',
    budtenderName: 'System',
    budtenderID: 'SYS001',
    visit_details_attributes: [{
      sku: product.sku || 'ENROLL-001',
      size: '1/8 oz',
      category: product.category || 'FLOWER',
      brand: product.brand || 'Flora',
      name: product.name,
      price: 1.00, // Nominal price for enrollment
      discount: 0,
      quantity: 1,
      species: product.cannabis_type || 'hybrid',
      customAttributes: []
    }],
    transaction_total: 1.00,
    send_notification: false
  }
};

console.log('   Payload:', JSON.stringify(alpinePayload, null, 2));

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
  console.log('\n   Alpine IQ Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log('\n✅ Customer enrolled in Alpine IQ!');

    // Extract contact ID
    let contactId = null;

    if (data.data && data.data.contactID) {
      contactId = data.data.contactID;
    } else if (data.contactID) {
      contactId = data.contactID;
    } else if (data.data && data.data.contact_id) {
      contactId = data.data.contact_id;
    }

    if (contactId) {
      console.log(`   Contact ID: ${contactId}`);

      // STEP 5: Save mapping
      console.log('\n5️⃣ Saving Alpine IQ mapping...');
      await supabase.from('alpineiq_customer_mapping').upsert({
        vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
        customer_id: customer.id,
        alpineiq_customer_id: contactId.toString(),
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id'
      });

      console.log('✅ Mapping saved!');

      // STEP 6: Test wallet pass
      console.log('\n6️⃣ Testing wallet pass...');
      const passUrl = `${ALPINE_BASE_URL}/api/v1.1/walletPass/${ALPINE_USER_ID}/${contactId}`;
      const passResponse = await fetch(passUrl, {
        headers: {
          'X-APIKEY': ALPINE_API_KEY,
        }
      });

      const passData = await passResponse.json();

      if (passData.apple || passData.google) {
        console.log('✅ Wallet pass links generated!');
        if (passData.apple) {
          console.log(`   🍎 Apple Wallet: ${passData.apple}`);
        }
        if (passData.google) {
          console.log(`   🤖 Google Wallet: ${passData.google}`);
        }
      } else {
        console.log('⚠️  Wallet pass response:', JSON.stringify(passData, null, 2));
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🎉 SUCCESS! Customer is enrolled and can get wallet pass');
      console.log('\n🧪 Test the wallet pass:');
      console.log('   1. Go to: http://localhost:3000/storefront/loyalty?vendor=flora-distro');
      console.log(`   2. Log in as: ${customer.email}`);
      console.log('   3. Click "Get Wallet Pass"');
      console.log('   4. You should see Apple and Google Wallet buttons!');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } else {
      console.log('⚠️  No contact ID in response');
      console.log('   Response structure:', Object.keys(data));
    }

  } else {
    console.log('\n❌ Alpine IQ enrollment failed');
    console.log('   Status:', response.status);
    console.log('   Response:', data);
  }

} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
