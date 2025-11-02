#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLocations() {
  console.log('🔍 Checking vendor locations...\n');

  // Get vendor by email
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('email', 'floradistro@gmail.com')
    .single();

  if (vendorError) {
    console.error('❌ Error fetching vendor:', vendorError);
    return;
  }

  console.log('✅ Vendor found:');
  console.log('   ID:', vendor.id);
  console.log('   Name:', vendor.store_name);
  console.log('   Email:', vendor.email);
  console.log('');

  // Get locations for this vendor
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', vendor.id);

  if (locationsError) {
    console.error('❌ Error fetching locations:', locationsError);
    return;
  }

  console.log(`📍 Found ${locations?.length || 0} locations:\n`);

  if (locations && locations.length > 0) {
    locations.forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name}`);
      console.log(`   ID: ${loc.id}`);
      console.log(`   Address: ${loc.address || 'N/A'}`);
      console.log(`   Active: ${loc.is_active}`);
      console.log(`   POS Enabled: ${loc.pos_enabled}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No locations found for this vendor!');
    console.log('   This is why you\'re seeing "NO LOCATIONS AVAILABLE"');
    console.log('');
    console.log('💡 You need to create at least one location for this vendor.');
  }

  // Check users table too
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'floradistro@gmail.com')
    .single();

  if (!userError && user) {
    console.log('👤 User record:');
    console.log('   Role:', user.role);
    console.log('   Vendor ID:', user.vendor_id);
    console.log('');
  }
}

checkLocations();
