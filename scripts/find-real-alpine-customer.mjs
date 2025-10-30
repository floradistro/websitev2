#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Finding customers with real Alpine IQ mappings\n');

// Get customers with Alpine IQ mappings (excluding test IDs)
const { data: mappings, error } = await supabase
  .from('alpineiq_customer_mapping')
  .select(`
    alpineiq_customer_id,
    customer_id,
    customers (
      email,
      first_name,
      last_name
    )
  `)
  .not('alpineiq_customer_id', 'like', 'test-%')
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

if (!mappings || mappings.length === 0) {
  console.log('⚠️  No customers found with Alpine IQ mappings');
  process.exit(0);
}

console.log(`✅ Found ${mappings.length} customers with Alpine IQ mappings\n`);

// Test wallet pass for each
for (const mapping of mappings) {
  const customer = mapping.customers;

  console.log(`\n📧 ${customer.email}`);
  console.log(`   Alpine IQ ID: ${mapping.alpineiq_customer_id}`);

  // Test wallet pass API
  try {
    const passUrl = `${ALPINE_BASE_URL}/api/v1.1/walletPass/${ALPINE_USER_ID}/${mapping.alpineiq_customer_id}`;
    const response = await fetch(passUrl, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
      }
    });

    const passData = await response.json();

    if (passData.apple || passData.google) {
      console.log('   ✅ WALLET PASS WORKING!');
      if (passData.apple) console.log(`      🍎 Apple: ${passData.apple.substring(0, 60)}...`);
      if (passData.google) console.log(`      🤖 Google: ${passData.google.substring(0, 60)}...`);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🎉 SUCCESS! Found a working customer!');
      console.log('\n📋 Use this customer to test wallet passes:');
      console.log(`   Email: ${customer.email}`);
      console.log(`   Customer ID: ${mapping.customer_id}`);
      console.log(`   Alpine IQ ID: ${mapping.alpineiq_customer_id}`);
      console.log('\n🧪 Test URL:');
      console.log(`   http://localhost:3000/api/customer/wallet-pass?customer_id=${mapping.customer_id}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      break;
    } else {
      console.log(`   ⚠️  No wallet pass: ${JSON.stringify(passData)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}
