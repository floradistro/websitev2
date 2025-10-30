#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('📱 Wallet Pass QR Code Generator\n');

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

// Get Alpine IQ mapping
const { data: mapping } = await supabase
  .from('alpineiq_customer_mapping')
  .select('alpineiq_customer_id')
  .eq('customer_id', customer.id)
  .single();

if (!mapping) {
  console.error('❌ No Alpine IQ mapping found');
  process.exit(1);
}

// Generate wallet pass URL
const alpineUserId = '3999';
const walletUrl = `https://lab.alpineiq.com/wallet/${alpineUserId}/${mapping.alpineiq_customer_id}`;

// Generate QR code URL
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(walletUrl)}`;

console.log('✅ Customer: ' + customer.email);
console.log('✅ Alpine IQ Contact ID: ' + mapping.alpineiq_customer_id + '\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📱 WALLET PASS URL:');
console.log(walletUrl);
console.log('\n🔲 QR CODE (scan with your phone):');
console.log(qrCodeUrl);
console.log('\n💡 INSTRUCTIONS:');
console.log('1. Open this QR code URL in your browser (desktop)');
console.log('2. Scan the QR code with your phone camera');
console.log('3. On iPhone: Tap "Add to Apple Wallet" button');
console.log('4. On Android: Tap "Add to Google Wallet" button');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
