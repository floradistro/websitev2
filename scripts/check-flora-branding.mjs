#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🏢 Flora Distribution Branding Assets\n');

// Get Flora vendor info
const { data: vendor } = await supabase
  .from('vendors')
  .select('*')
  .eq('slug', 'flora-distro')
  .single();

if (!vendor) {
  console.error('❌ Flora Distro vendor not found');
  process.exit(1);
}

console.log('✅ Vendor: Flora Distribution');
console.log(`   ID: ${vendor.id}`);
console.log(`   Name: ${vendor.name}`);
console.log(`   Slug: ${vendor.slug}\n`);

console.log('📸 Current Branding Assets:');
console.log(`   Logo: ${vendor.logo_url || 'Not set'}`);
console.log(`   Primary Color: ${vendor.primary_color || 'Not set'}`);
console.log(`   Secondary Color: ${vendor.secondary_color || 'Not set'}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Alpine IQ Wallet Pass Setup Instructions:\n');
console.log('1. Log in to Alpine IQ dashboard:');
console.log('   https://lab.alpineiq.com\n');
console.log('2. Navigate to: Settings > Wallet Pass Settings\n');
console.log('3. Upload branding assets:');
console.log('   • Small Logo: 400x400px PNG/JPG');
console.log('   • Cover Photo: 1000x300px PNG/JPG');
console.log('   • (Max 2MB file size)\n');
console.log('4. Configure appearance:');
console.log('   • Brand name: Flora Distribution');
console.log('   • Colors: Match your brand');
console.log('   • Message/description\n');

if (vendor.logo_url) {
  console.log('✅ You can use your existing logo:');
  console.log(`   ${vendor.logo_url}\n`);
  console.log('   Download it and upload to Alpine IQ wallet pass settings.');
} else {
  console.log('⚠️  No logo found in WhaleTools.');
  console.log('   Upload your Flora Distribution logo to Alpine IQ.\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
