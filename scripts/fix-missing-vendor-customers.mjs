#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const BATCH_SIZE = 100;

console.log('🔧 Fixing Missing Vendor Customer Links\n');
console.log('📋 This script will:');
console.log('   1. Find customers with synthetic emails (@alpine.local, @phone.local)');
console.log('   2. Create vendor_customers records to link them to Flora Distro');
console.log('   3. Update loyalty points from Alpine IQ CSV\n');

// Read Alpine IQ CSV to get loyalty data
console.log('1️⃣ Reading Alpine IQ CSV...\n');
const csvContent = readFileSync('/Users/whale/Downloads/3999-244484-1761775748-rp.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} records in CSV\n`);

// Create a phone => loyalty points map
const phoneToLoyaltyMap = new Map();
for (const record of records) {
  const phone = record.mobile_phone?.trim().replace(/[^0-9]/g, '');
  const loyaltyPoints = parseFloat(record.loyalty_points || '0');
  const covaId = record.src_ids?.includes('cova:::')
    ? record.src_ids.split('|')[0].replace('cova:::', '').trim()
    : null;
  const totalSpent = parseFloat(record.total_spent_as_member || '0');
  const countOfSales = parseInt(record.count_of_sales || '0');

  if (phone) {
    phoneToLoyaltyMap.set(phone, {
      loyaltyPoints,
      covaId,
      totalSpent,
      countOfSales,
      firstName: record.first_name?.trim() || null,
      lastName: record.last_name?.trim() || null,
    });
  }
}

console.log(`📊 Built loyalty map for ${phoneToLoyaltyMap.size} phone numbers\n`);

// Find all customers with synthetic emails or phone-only
console.log('2️⃣ Finding customers with synthetic emails...\n');

const { data: syntheticCustomers, error: searchError } = await supabase
  .from('customers')
  .select('id, email, phone, first_name, last_name')
  .or('email.like.%@alpine.local,email.like.%@phone.local')
  .limit(10000);

if (searchError) {
  console.error('❌ Error:', searchError.message);
  process.exit(1);
}

console.log(`✅ Found ${syntheticCustomers.length} customers with synthetic emails\n`);

// Check which ones already have vendor_customers records
console.log('3️⃣ Checking for existing vendor_customers records...\n');

const customerIds = syntheticCustomers.map(c => c.id);
const linkedCustomerIds = new Set();

// Process in batches of 200 to avoid "Bad Request" errors
const CHECK_BATCH_SIZE = 200;
for (let i = 0; i < customerIds.length; i += CHECK_BATCH_SIZE) {
  const batchIds = customerIds.slice(i, i + CHECK_BATCH_SIZE);

  const { data: existingLinks, error: linkError } = await supabase
    .from('vendor_customers')
    .select('customer_id')
    .in('customer_id', batchIds)
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID);

  if (linkError) {
    console.error(`❌ Error checking batch ${i}-${i + CHECK_BATCH_SIZE}:`, linkError.message);
    continue; // Skip this batch but keep going
  }

  existingLinks.forEach(l => linkedCustomerIds.add(l.customer_id));
  console.log(`   Checked ${Math.min(i + CHECK_BATCH_SIZE, customerIds.length)}/${customerIds.length} customers...`);
}

const unlinkedCustomers = syntheticCustomers.filter(c => !linkedCustomerIds.has(c.id));

console.log(`\n   ✅ Already linked: ${linkedCustomerIds.size}`);
console.log(`   🔴 Need linking: ${unlinkedCustomers.length}\n`);

// Create vendor_customers records in batches
console.log('4️⃣ Creating vendor_customers records...\n');

let created = 0;
let errors = 0;
let batch = [];

for (const customer of unlinkedCustomers) {
  const phone = customer.phone?.replace(/[^0-9]/g, '');
  const loyaltyData = phone ? phoneToLoyaltyMap.get(phone) : null;

  // Calculate tier
  const points = loyaltyData?.loyaltyPoints || 0;
  let tier = 'bronze';
  if (points >= 10000) tier = 'platinum';
  else if (points >= 5000) tier = 'gold';
  else if (points >= 2500) tier = 'silver';

  batch.push({
    vendor_id: FLORA_DISTRO_VENDOR_ID,
    customer_id: customer.id,
    loyalty_points: Math.round(points),
    loyalty_tier: tier,
    total_orders: loyaltyData?.countOfSales || 0,
    total_spent: loyaltyData?.totalSpent || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Insert batch
  if (batch.length >= BATCH_SIZE) {
    const { error: insertError } = await supabase
      .from('vendor_customers')
      .insert(batch);

    if (insertError) {
      console.error(`   ❌ Batch error:`, insertError.message);
      errors += batch.length;
    } else {
      created += batch.length;
      console.log(`   ✅ Created ${created} vendor_customer records...`);
    }

    batch = [];
  }
}

// Insert remaining batch
if (batch.length > 0) {
  const { error: insertError } = await supabase
    .from('vendor_customers')
    .insert(batch);

  if (insertError) {
    console.error(`   ❌ Final batch error:`, insertError.message);
    errors += batch.length;
  } else {
    created += batch.length;
  }
}

console.log('\n🎉 Fix Complete!\n');
console.log('📊 Summary:');
console.log(`   Synthetic email customers found: ${syntheticCustomers.length}`);
console.log(`   Already had vendor links: ${linkedCustomerIds.size}`);
console.log(`   New vendor_customers created: ${created}`);
console.log(`   Errors: ${errors}`);

// Verify final count
const { count } = await supabase
  .from('vendor_customers')
  .select('*', { count: 'exact', head: true })
  .eq('vendor_id', FLORA_DISTRO_VENDOR_ID);

console.log(`\n✅ Total Flora Distro customers in database: ${count}\n`);

// Test search for Eva Magan - search customers table first, then check vendor link
console.log('🧪 Testing search for Eva Magan...\n');

// First find the customer
const { data: evaCustomer } = await supabase
  .from('customers')
  .select('id, first_name, last_name, phone, email')
  .ilike('phone', '%9198066511%')
  .limit(1);

if (evaCustomer && evaCustomer.length > 0) {
  console.log(`✅ Eva Magan found in customers table:`);
  console.log(`   ID: ${evaCustomer[0].id}`);
  console.log(`   Name: ${evaCustomer[0].first_name} ${evaCustomer[0].last_name}`);
  console.log(`   Phone: ${evaCustomer[0].phone}`);
  console.log(`   Email: ${evaCustomer[0].email}`);

  // Check if linked to vendor
  const { data: vendorLink } = await supabase
    .from('vendor_customers')
    .select('id, loyalty_points, loyalty_tier')
    .eq('customer_id', evaCustomer[0].id)
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .limit(1);

  if (vendorLink && vendorLink.length > 0) {
    console.log(`   ✅ Linked to Flora Distro`);
    console.log(`   Loyalty Points: ${vendorLink[0].loyalty_points}`);
    console.log(`   Tier: ${vendorLink[0].loyalty_tier}`);
  } else {
    console.log(`   ❌ NOT linked to Flora Distro vendor!`);
  }
} else {
  console.log('❌ Eva Magan not found in customers table at all!');
}

console.log('\n✨ Done!\n');
