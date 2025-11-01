#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

console.log('🔍 Checking Eva Magan vendor linkage...\n');

const customerId = '677d1bef-e400-4a8b-85c0-edecaaa5abb0';

// Check vendor_customers
const { data: vendorLink, error } = await supabase
  .from('vendor_customers')
  .select('*')
  .eq('customer_id', customerId)
  .eq('vendor_id', FLORA_DISTRO_VENDOR_ID);

if (error) {
  console.error('Error:', error);
} else if (vendorLink && vendorLink.length > 0) {
  console.log('✅ Eva Magan IS linked to Flora Distro:');
  console.log(JSON.stringify(vendorLink[0], null, 2));
} else {
  console.log('❌ Eva Magan is NOT linked to Flora Distro!');
  console.log('\n🔧 Creating vendor_customers record...\n');

  // Create the link
  const { data: newLink, error: insertError } = await supabase
    .from('vendor_customers')
    .insert({
      vendor_id: FLORA_DISTRO_VENDOR_ID,
      customer_id: customerId,
      loyalty_points: 90, // From Alpine IQ
      loyalty_tier: 'bronze',
      total_orders: 0,
      total_spent: 4342.19, // From Alpine IQ
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (insertError) {
    console.error('❌ Error creating link:', insertError);
  } else {
    console.log('✅ Successfully created vendor_customers record:');
    console.log(JSON.stringify(newLink[0], null, 2));
  }
}

console.log('\n✨ Done!\n');
