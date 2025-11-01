#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

console.log('🧪 Testing phone search logic...\n');

// Simulate the API query
const limit = 50000;
let query = supabase
  .from('vendor_customers')
  .select(`
    id,
    vendor_customer_number,
    loyalty_points,
    loyalty_tier,
    total_orders,
    total_spent,
    last_purchase_date,
    customer_id,
    customers (
      id,
      first_name,
      last_name,
      email,
      phone,
      display_name
    )
  `)
  .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
  .order('loyalty_points', { ascending: false })
  .limit(limit);

const { data, error } = await query;

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`✅ Fetched ${data.length} customer records\n`);

// Transform data like the API does
let customers = (data || [])
  .filter((vc) => vc.customers)
  .map((vc) => ({
    id: vc.customers.id,
    first_name: vc.customers.first_name || '',
    last_name: vc.customers.last_name || '',
    email: vc.customers.email,
    phone: vc.customers.phone,
    display_name: vc.customers.display_name,
    loyalty_points: vc.loyalty_points || 0,
    loyalty_tier: vc.loyalty_tier || 'bronze',
    vendor_customer_number: vc.vendor_customer_number,
  }));

console.log(`✅ Transformed to ${customers.length} customers\n`);

// Test search for "9198066511"
const search = '9198066511';
const searchLower = search.toLowerCase().trim();

const evaBeforeFilter = customers.find(c =>
  c.first_name?.toLowerCase() === 'eva' && c.last_name?.toLowerCase() === 'magan'
);

console.log('🔍 Eva Magan BEFORE search filter:');
if (evaBeforeFilter) {
  console.log(`   ✅ FOUND - Phone: "${evaBeforeFilter.phone}"`);
  console.log(`   Loyalty Points: ${evaBeforeFilter.loyalty_points}`);
} else {
  console.log(`   ❌ NOT FOUND in fetched ${customers.length} customers`);
}

// Apply search filter (same logic as API)
const filteredCustomers = customers.filter((customer) => {
  const firstName = (customer.first_name || '').toLowerCase();
  const lastName = (customer.last_name || '').toLowerCase();
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = (customer.display_name || '').toLowerCase();
  const email = (customer.email || '').toLowerCase();
  const phone = (customer.phone || '').replace(/\D/g, '');
  const searchPhone = searchLower.replace(/\D/g, '');
  const customerNumber = (customer.vendor_customer_number || '').toLowerCase();

  return (
    firstName.includes(searchLower) ||
    lastName.includes(searchLower) ||
    fullName.includes(searchLower) ||
    displayName.includes(searchLower) ||
    email.includes(searchLower) ||
    (searchPhone && phone.includes(searchPhone)) ||
    customerNumber.includes(searchLower)
  );
});

console.log(`\n🔍 After applying search filter for "${search}":`);
console.log(`   Matched ${filteredCustomers.length} customers\n`);

const evaAfterFilter = filteredCustomers.find(c =>
  c.first_name?.toLowerCase() === 'eva' && c.last_name?.toLowerCase() === 'magan'
);

if (evaAfterFilter) {
  console.log('✅ Eva Magan FOUND after filter:');
  console.log(`   Name: ${evaAfterFilter.first_name} ${evaAfterFilter.last_name}`);
  console.log(`   Phone: "${evaAfterFilter.phone}"`);
  console.log(`   Phone (stripped): "${(evaAfterFilter.phone || '').replace(/\D/g, '')}"`);
  console.log(`   Search query (stripped): "${searchLower.replace(/\D/g, '')}"`);
  console.log(`   Loyalty Points: ${evaAfterFilter.loyalty_points}`);
} else {
  console.log('❌ Eva Magan NOT FOUND after filter');

  if (evaBeforeFilter) {
    console.log('\n🔍 Debugging why Eva was filtered out:');
    const phone = (evaBeforeFilter.phone || '').replace(/\D/g, '');
    const searchPhone = searchLower.replace(/\D/g, '');
    console.log(`   Eva's phone (stripped): "${phone}"`);
    console.log(`   Search phone (stripped): "${searchPhone}"`);
    console.log(`   Match: ${phone.includes(searchPhone)}`);
  }
}

console.log('\n✨ Done!\n');
