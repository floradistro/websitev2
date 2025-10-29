#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFloraCustomers() {
  console.log('🔍 Checking Flora Distro customers...\n');

  const vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

  // Count Flora Distro customers
  const { count: totalCount, error: totalError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);

  if (totalError) {
    console.log(`❌ Error: ${totalError.message}`);
    console.log('   Code:', totalError.code);
    console.log('   Details:', totalError.details);
    console.log('   Hint:', totalError.hint);
    return;
  }

  console.log(`📊 Flora Distro customers: ${totalCount}`);

  // Count with email
  const { count: emailCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .not('email', 'is', null);

  console.log(`📧 With email: ${emailCount}`);

  // Count with phone
  const { count: phoneCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .not('phone', 'is', null);

  console.log(`📱 With phone: ${phoneCount}`);

  // Get sample
  const { data: samples, error: sampleError } = await supabase
    .from('customers')
    .select('id, email, phone, first_name, last_name')
    .eq('vendor_id', vendorId)
    .not('email', 'is', null)
    .limit(5);

  if (sampleError) {
    console.log(`\n❌ Error getting samples: ${sampleError.message}`);
    return;
  }

  if (samples && samples.length > 0) {
    console.log('\n📋 Sample customers with email:');
    samples.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.email}`);
      console.log(`      Name: ${c.first_name || ''} ${c.last_name || ''}`);
      console.log(`      Phone: ${c.phone || 'N/A'}`);
    });
  } else {
    console.log('\n⚠️  No Flora Distro customers with email addresses');
  }

  // Check all customers without vendor filter
  console.log('\n📊 All customers breakdown by vendor:');
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('vendor_id');

  if (allCustomers) {
    const vendorCounts = {};
    allCustomers.forEach(c => {
      vendorCounts[c.vendor_id] = (vendorCounts[c.vendor_id] || 0) + 1;
    });

    Object.entries(vendorCounts).forEach(([vid, count]) => {
      console.log(`   ${vid}: ${count} customers`);
    });
  }
}

checkFloraCustomers().catch(console.error);
