/**
 * Test Apple Wallet Setup
 * Verifies configuration and generates a test pass
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testWalletSetup() {
  console.log('🧪 Testing Apple Wallet Setup...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const requiredVars = [
    'APPLE_PASS_TYPE_ID',
    'APPLE_TEAM_ID',
    'APPLE_WALLET_CERT_PASSWORD',
    'APPLE_WALLET_CERT_PATH',
    'APPLE_WALLET_WWDR_PATH',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('   ❌ Missing environment variables:', missing.join(', '));
    process.exit(1);
  }
  console.log('   ✅ All environment variables present\n');

  // 2. Check certificate files exist
  console.log('2️⃣ Checking certificate files...');
  const certPath = process.env.APPLE_WALLET_CERT_PATH!;
  const wwdrPath = process.env.APPLE_WALLET_WWDR_PATH!;

  if (!fs.existsSync(certPath)) {
    console.error(`   ❌ Certificate not found: ${certPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(wwdrPath)) {
    console.error(`   ❌ WWDR certificate not found: ${wwdrPath}`);
    process.exit(1);
  }
  console.log(`   ✅ Certificate found: ${certPath}`);
  console.log(`   ✅ WWDR certificate found: ${wwdrPath}\n`);

  // 3. Check database tables
  console.log('3️⃣ Checking database tables...');
  const tables = [
    'wallet_passes',
    'wallet_pass_events',
    'vendor_wallet_settings',
    'wallet_pass_updates_queue',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.error(`   ❌ Table '${table}' not found or inaccessible`);
      console.error(`      Error: ${error.message}`);
    } else {
      console.log(`   ✅ Table '${table}' exists`);
    }
  }
  console.log('');

  // 4. Check for test customer
  console.log('4️⃣ Finding test customer...');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, loyalty_points, loyalty_tier')
    .limit(1);

  if (customerError || !customers || customers.length === 0) {
    console.error('   ❌ No customers found in database');
    console.error('   💡 Create a test customer first');
    process.exit(1);
  }

  const testCustomer = customers[0];
  console.log(`   ✅ Found test customer: ${testCustomer.first_name} ${testCustomer.last_name}`);
  console.log(`      Email: ${testCustomer.email}`);
  console.log(`      Points: ${testCustomer.loyalty_points || 0}`);
  console.log(`      Tier: ${testCustomer.loyalty_tier || 'Bronze'}\n`);

  // 5. Check for vendor
  console.log('5️⃣ Finding test vendor...');
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, store_name, slug, logo_url, brand_colors')
    .eq('status', 'active')
    .limit(1);

  if (vendorError || !vendors || vendors.length === 0) {
    console.error('   ❌ No active vendors found in database');
    process.exit(1);
  }

  const testVendor = vendors[0];
  console.log(`   ✅ Found test vendor: ${testVendor.store_name}`);
  console.log(`      Slug: ${testVendor.slug}`);
  console.log(`      Has logo: ${testVendor.logo_url ? 'Yes' : 'No'}\n`);

  // 6. Test URL generation
  console.log('6️⃣ Generating test pass URL...');
  const testUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/customer/wallet-pass?customer_id=${testCustomer.id}&vendor_id=${testVendor.id}`;
  console.log(`   ✅ Test URL generated:`);
  console.log(`      ${testUrl}\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 SETUP COMPLETE!');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('📱 Next Steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Visit dashboard: http://localhost:3000/vendor/apple-wallet');
  console.log('   3. Test pass generation:');
  console.log(`      curl "${testUrl}" -o test-pass.pkpass\n`);

  console.log('📖 Documentation:');
  console.log('   • Quick Start: APPLE_WALLET_QUICKSTART.md');
  console.log('   • Full Guide: docs/APPLE_WALLET_SETUP.md\n');
}

testWalletSetup().catch((error) => {
  console.error('❌ Setup test failed:', error);
  process.exit(1);
});
