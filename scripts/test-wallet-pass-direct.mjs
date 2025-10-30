#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Wallet Pass Generation (Direct)\n');

// STEP 1: Get a test customer
console.log('1️⃣ Finding test customer...');
const { data: customer, error: customerError } = await supabase
  .from('customers')
  .select('id, email, phone, first_name, last_name, loyalty_points, loyalty_tier')
  .not('email', 'like', '%@phone.local')
  .not('email', 'like', '%@alpine.local')
  .not('email', 'like', '%@pos.local')
  .limit(1)
  .single();

if (customerError || !customer) {
  console.error('❌ No suitable customer found');
  process.exit(1);
}

console.log(`✅ Customer: ${customer.email} (${customer.first_name} ${customer.last_name})`);
console.log(`   Loyalty Points: ${customer.loyalty_points || 0}`);
console.log(`   Loyalty Tier: ${customer.loyalty_tier || 'N/A'}`);

// STEP 2: Check if customer has Alpine IQ mapping
console.log('\n2️⃣ Checking Alpine IQ mapping...');
const { data: mapping } = await supabase
  .from('alpineiq_customer_mapping')
  .select('alpineiq_customer_id')
  .eq('customer_id', customer.id)
  .single();

let alpineiqCustomerId;

if (!mapping) {
  console.log('⚠️  Customer not mapped to Alpine IQ yet. Signing up...');

  // Sign up customer for loyalty
  const signupPayload = {
    uid: ALPINE_USER_ID,
    email: customer.email,
    mobilePhone: customer.phone || '',
    firstName: customer.first_name || '',
    lastName: customer.last_name || '',
    loyalty: true
  };

  const signupResponse = await fetch(`${ALPINE_BASE_URL}/api/v2/loyalty`, {
    method: 'POST',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signupPayload)
  });

  const signupData = await signupResponse.json();

  if (!signupResponse.ok || !signupData.contactID) {
    console.error('❌ Failed to sign up customer:', signupData);
    process.exit(1);
  }

  alpineiqCustomerId = signupData.contactID;
  console.log(`✅ Customer signed up! Alpine IQ ID: ${alpineiqCustomerId}`);

  // Save mapping
  await supabase.from('alpineiq_customer_mapping').insert({
    vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
    customer_id: customer.id,
    alpineiq_customer_id: alpineiqCustomerId,
    last_synced_at: new Date().toISOString()
  });

  console.log('✅ Mapping saved to database');
} else {
  alpineiqCustomerId = mapping.alpineiq_customer_id;
  console.log(`✅ Customer already mapped. Alpine IQ ID: ${alpineiqCustomerId}`);
}

// STEP 3: Get wallet pass links from Alpine IQ
console.log('\n3️⃣ Getting wallet pass download links...');

const walletResponse = await fetch(
  `${ALPINE_BASE_URL}/api/v1.1/walletPass/${ALPINE_USER_ID}/${alpineiqCustomerId}`,
  {
    method: 'GET',
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
    },
  }
);

if (!walletResponse.ok) {
  console.error(`❌ Wallet pass API failed: ${walletResponse.status} ${walletResponse.statusText}`);
  process.exit(1);
}

const walletData = await walletResponse.json();

console.log('✅ Wallet pass links retrieved!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📱 Digital Loyalty Card');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n👤 Customer Information:');
console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
console.log(`   Email: ${customer.email}`);
console.log(`   Loyalty Points: ${customer.loyalty_points || 0}`);
console.log(`   Loyalty Tier: ${customer.loyalty_tier || 'Bronze'}`);

console.log('\n🔗 Wallet Pass Download Links:');

if (walletData.apple || walletData.applePass) {
  const appleLink = walletData.apple || walletData.applePass;
  console.log(`\n🍎 Apple Wallet (iOS):`);
  console.log(`   ${appleLink}`);
  console.log(`   → Open this link on an iPhone to add to Apple Wallet`);
} else {
  console.log('\n⚠️  No Apple Wallet link available');
}

if (walletData.google || walletData.googlePass) {
  const googleLink = walletData.google || walletData.googlePass;
  console.log(`\n🤖 Google Wallet (Android):`);
  console.log(`   ${googleLink}`);
  console.log(`   → Open this link on an Android device to add to Google Wallet`);
} else {
  console.log('\n⚠️  No Google Wallet link available');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n✅ Wallet pass generation successful!');
console.log('\n💡 How to use:');
console.log('   1. Copy the wallet pass link for your device');
console.log('   2. Open the link on your iPhone (Apple) or Android (Google) device');
console.log('   3. Tap "Add to Wallet" when prompted');
console.log('   4. Your loyalty card will appear in your device\'s wallet app');
console.log('   5. Show the card at checkout to earn and redeem points');
console.log('\n🎉 The customer can now access their loyalty card anytime from their phone!');
