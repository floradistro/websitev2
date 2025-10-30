#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customerEmail = process.argv[2] || 'fahad@cwscommercial.com';

console.log('🧪 Creating Test Wallet Mapping\n');
console.log(`This creates a test Alpine IQ mapping to verify wallet pass flow\n`);

// Get customer
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('email', customerEmail)
  .single();

if (!customer) {
  console.error('❌ Customer not found');
  process.exit(1);
}

console.log('✅ Customer found:', customer.email);
console.log(`   ID: ${customer.id}\n`);

// Generate a unique test contact ID
const testContactId = `test-wallet-${customer.id.substring(0, 8)}`;
console.log(`📋 Using test contact ID: ${testContactId}\n`);

// Save mapping - first delete any existing one
console.log('💾 Creating Alpine IQ mapping...');
await supabase.from('alpineiq_customer_mapping')
  .delete()
  .eq('customer_id', customer.id);

const { error } = await supabase.from('alpineiq_customer_mapping').insert({
  vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
  customer_id: customer.id,
  alpineiq_customer_id: testContactId,
  last_synced_at: new Date().toISOString()
});

if (error) {
  console.error('❌ Error creating mapping:', error);
  process.exit(1);
}

console.log('✅ Mapping created!\n');

// Now test the wallet pass API
console.log('🧪 Testing wallet pass API...\n');

try {
  const response = await fetch(`http://localhost:3000/api/customer/wallet-pass?customer_id=${customer.id}`);
  const data = await response.json();

  if (data.success) {
    console.log('✅ SUCCESS! Wallet pass API working!\n');
    console.log('🎫 Wallet Pass Links:');

    if (data.walletPass.apple) {
      console.log(`   🍎 Apple: ${data.walletPass.apple}`);
    }

    if (data.walletPass.google) {
      console.log(`   🤖 Google: ${data.walletPass.google}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 WALLET PASS INTEGRATION WORKING!');
    console.log('\n📱 Next Steps:');
    console.log('   1. Visit: http://localhost:3000/storefront/loyalty?vendor=flora-distro');
    console.log(`   2. Log in as: ${customer.email}`);
    console.log('   3. Click "Get Wallet Pass"');
    console.log('   4. You should now see Apple & Google Wallet buttons!');
    console.log('\n⚠️  Note: This uses a test Alpine IQ contact ID.');
    console.log('   In production, contact IDs come from real orders synced to Alpine IQ.');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } else {
    console.log('❌ Wallet pass API returned error:');
    console.log(`   ${data.error}\n`);

    if (data.needsEnrollment) {
      console.log('   Note: Customer still shows as needing enrollment');
      console.log('   This might be a caching issue or the mapping needs time to propagate\n');
    }
  }
} catch (error) {
  console.error('❌ Error testing wallet pass:', error.message);
}
