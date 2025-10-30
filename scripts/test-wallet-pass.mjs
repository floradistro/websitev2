#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Wallet Pass for fahad@cwscommercial.com\n');

// Get customer
const { data: customer } = await supabase
  .from('customers')
  .select('id, email, first_name, last_name')
  .eq('email', 'fahad@cwscommercial.com')
  .single();

if (!customer) {
  console.error('❌ Customer not found');
  process.exit(1);
}

console.log('✅ Customer found:');
console.log(`   Email: ${customer.email}`);
console.log(`   ID: ${customer.id}\n`);

// Get Alpine IQ mapping
const { data: mapping } = await supabase
  .from('alpineiq_customer_mapping')
  .select('alpineiq_customer_id')
  .eq('customer_id', customer.id)
  .single();

if (!mapping) {
  console.error('❌ No Alpine IQ mapping found');
  console.log('   Customer needs to make a purchase first to enroll in loyalty program');
  process.exit(1);
}

console.log('✅ Alpine IQ mapping found:');
console.log(`   Contact ID: ${mapping.alpineiq_customer_id}\n`);

// Generate web wallet URL
const alpineUserId = '3999';
const webWalletUrl = `https://lab.alpineiq.com/wallet/${alpineUserId}/${mapping.alpineiq_customer_id}`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🎉 Wallet Pass Ready!\n');
console.log('📱 Web Wallet URL (works on any device):');
console.log(`   ${webWalletUrl}\n`);
console.log('🍎 Open this URL on iPhone to add to Apple Wallet');
console.log('🤖 Open this URL on Android to add to Google Wallet\n');
console.log('🧪 Test via API:');
console.log(`   http://localhost:3000/api/customer/wallet-pass?customer_id=${customer.id}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
