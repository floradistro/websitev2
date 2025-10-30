#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customerEmail = process.argv[2] || 'fahad@cwscommercial.com';

console.log('🔍 Looking up customer loyalty in Alpine IQ\n');
console.log(`Email: ${customerEmail}\n`);

// Get customer from our DB
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('email', customerEmail)
  .single();

if (!customer) {
  console.error('❌ Customer not found in database');
  process.exit(1);
}

console.log('✅ Customer found in database');
console.log(`   ID: ${customer.id}`);
console.log(`   Email: ${customer.email}\n`);

// Use loyalty lookup endpoint - email goes in URL path
console.log('🔎 Searching Alpine IQ loyalty...');
try {
  const response = await fetch(`${ALPINE_BASE_URL}/api/v2/loyalty/lookup/${encodeURIComponent(customer.email)}`, {
    method: 'POST',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });

  console.log(`   Status: ${response.status} ${response.statusText}`);

  const responseText = await response.text();
  console.log('   Raw response:', responseText.substring(0, 500));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    console.log('   ⚠️  Response is not JSON');
    throw new Error(`Invalid response from Alpine IQ: ${responseText.substring(0, 100)}`);
  }

  console.log('   Response:', JSON.stringify(data, null, 2));

  if (data.success && data.contact) {
    const contactId = data.contact.id || data.contact.universalID;
    console.log('\n✅ Customer found in Alpine IQ!');
    console.log(`   Contact ID: ${contactId}`);
    console.log(`   Name: ${data.contact.firstName || ''} ${data.contact.lastName || ''}`);
    console.log(`   Email: ${data.contact.email}`);
    console.log(`   Phone: ${data.contact.phone || 'N/A'}`);
    console.log(`   Points: ${data.wallet?.points || 0}`);
    console.log(`   Tier: ${data.wallet?.tier || 'Member'}`);

    // Save mapping
    console.log('\n💾 Saving mapping...');
    await supabase.from('alpineiq_customer_mapping').upsert({
      vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
      customer_id: customer.id,
      alpineiq_customer_id: contactId.toString(),
      last_synced_at: new Date().toISOString()
    }, {
      onConflict: 'customer_id'
    });

    console.log('✅ Mapping saved!');

    // Test wallet pass
    console.log('\n🎫 Testing wallet pass...');
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

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🎉 SUCCESS! Customer wallet pass is ready!');
      console.log('\n🧪 Test the wallet pass:');
      console.log('   1. Go to: http://localhost:3000/storefront/loyalty?vendor=flora-distro');
      console.log(`   2. Log in as: ${customer.email}`);
      console.log('   3. Click "Get Wallet Pass"');
      console.log('   4. You should see Apple and Google Wallet buttons!');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } else {
      console.log('⚠️  Wallet pass response:', JSON.stringify(passData, null, 2));
    }

  } else {
    console.log('\n❌ Customer not found in Alpine IQ');
    console.log('   The customer may need to be enrolled first');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
}
