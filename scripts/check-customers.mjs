#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCustomers() {
  console.log('🔍 Checking customer data for Flora Distro...\n');

  // Count total customers
  const { count: totalCount, error: totalError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf');

  if (totalError) {
    console.error('❌ Error counting customers:', totalError.message);
    return;
  }

  console.log(`📊 Total customers: ${totalCount}`);

  // Count customers with email
  const { count: emailCount, error: emailError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .not('email', 'is', null);

  if (!emailError) {
    console.log(`📧 Customers with email: ${emailCount}`);
  }

  // Count customers with phone
  const { count: phoneCount, error: phoneError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .not('phone', 'is', null);

  if (!phoneError) {
    console.log(`📱 Customers with phone: ${phoneCount}`);
  }

  // Get sample customers
  const { data: sampleCustomers, error: sampleError } = await supabase
    .from('customers')
    .select('id, email, phone, first_name, last_name')
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .limit(5);

  if (sampleError) {
    console.error('\n❌ Error getting sample customers:', sampleError.message);
  } else if (sampleCustomers && sampleCustomers.length > 0) {
    console.log('\n📋 Sample customers:');
    sampleCustomers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.first_name || ''} ${c.last_name || ''}`);
      console.log(`      Email: ${c.email || 'N/A'}`);
      console.log(`      Phone: ${c.phone || 'N/A'}`);
    });
  } else {
    console.log('\n⚠️  No customers found in database');
    console.log('\n💡 To use Alpine IQ loyalty sync, you need to:');
    console.log('   1. Import customer data from your POS system');
    console.log('   2. Or manually create customers in the platform');
    console.log('   3. Then run the loyalty sync to enrich them with Alpine IQ data');
  }
}

checkCustomers().catch(console.error);
