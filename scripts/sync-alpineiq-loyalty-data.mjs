#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

console.log('🔄 Syncing Alpine IQ Loyalty Data\n');
console.log('📋 This script will:');
console.log('   1. Read Alpine IQ CSV for loyalty data');
console.log('   2. Find matching customers by phone');
console.log('   3. Update loyalty points, tier, total_spent, and total_orders\n');

// Read Alpine IQ CSV
console.log('1️⃣ Reading Alpine IQ CSV...\n');
const csvContent = readFileSync('/Users/whale/Downloads/3999-244484-1761775748-rp.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} records in CSV\n`);

// Create phone => loyalty data map
const phoneToLoyaltyMap = new Map();
for (const record of records) {
  const phone = record.mobile_phone?.trim();
  if (!phone) continue;

  // Normalize phone (remove all non-digits)
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  if (!normalizedPhone) continue;

  const loyaltyPoints = parseFloat(record.loyalty_points || '0');
  const totalSpent = parseFloat(record.total_spent_as_member || '0');
  const countOfSales = parseInt(record.count_of_sales || '0');

  phoneToLoyaltyMap.set(normalizedPhone, {
    loyaltyPoints,
    totalSpent,
    countOfSales,
  });
}

console.log(`📊 Built loyalty map for ${phoneToLoyaltyMap.size} phone numbers\n`);

// Get ALL customers for Flora Distro
console.log('2️⃣ Fetching all Flora Distro customers...\n');

let allVendorCustomers = [];
let offset = 0;
const CHUNK_SIZE = 1000;

while (true) {
  const { data: chunk, error } = await supabase
    .from('vendor_customers')
    .select(`
      id,
      customer_id,
      loyalty_points,
      loyalty_tier,
      customers (
        phone
      )
    `)
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .range(offset, offset + CHUNK_SIZE - 1);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!chunk || chunk.length === 0) break;

  allVendorCustomers.push(...chunk);
  console.log(`   Fetched ${allVendorCustomers.length} customers...`);

  if (chunk.length < CHUNK_SIZE) break;
  offset += CHUNK_SIZE;
}

console.log(`\n✅ Fetched ${allVendorCustomers.length} total customers\n`);

// Match customers and prepare updates
console.log('3️⃣ Matching customers with Alpine IQ data...\n');

const updates = [];
let matched = 0;
let noMatch = 0;

for (const vc of allVendorCustomers) {
  if (!vc.customers?.phone) {
    noMatch++;
    continue;
  }

  const normalizedPhone = vc.customers.phone.replace(/[^0-9]/g, '');
  const alpineData = phoneToLoyaltyMap.get(normalizedPhone);

  if (!alpineData) {
    noMatch++;
    continue;
  }

  // Calculate tier based on points
  const points = alpineData.loyaltyPoints;
  let tier = 'bronze';
  if (points >= 10000) tier = 'platinum';
  else if (points >= 5000) tier = 'gold';
  else if (points >= 2500) tier = 'silver';

  // Only update if there's a change
  const currentPoints = vc.loyalty_points || 0;
  const currentTier = vc.loyalty_tier || 'bronze';

  if (currentPoints !== Math.round(points) || currentTier !== tier) {
    updates.push({
      id: vc.id,
      loyalty_points: Math.round(points),
      loyalty_tier: tier,
      total_spent: alpineData.totalSpent,
      total_orders: alpineData.countOfSales,
    });
    matched++;
  } else {
    matched++; // Already correct
  }
}

console.log(`   ✅ Matched: ${matched}`);
console.log(`   ⚠️  No Alpine IQ data: ${noMatch}`);
console.log(`   🔄 Need updates: ${updates.length}\n`);

// Apply updates in batches
if (updates.length > 0) {
  console.log('4️⃣ Applying updates...\n');

  let updated = 0;
  let errors = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from('vendor_customers')
      .update({
        loyalty_points: update.loyalty_points,
        loyalty_tier: update.loyalty_tier,
        total_spent: update.total_spent,
        total_orders: update.total_orders,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id);

    if (error) {
      console.error(`   ❌ Error updating ${update.id}:`, error.message);
      errors++;
    } else {
      updated++;
      if (updated % 100 === 0) {
        console.log(`   ✅ Updated ${updated}/${updates.length}...`);
      }
    }
  }

  console.log(`\n✅ Updates complete! Updated: ${updated}, Errors: ${errors}\n`);
} else {
  console.log('4️⃣ No updates needed - all data already synced!\n');
}

// Verify Eva Magan's data
console.log('5️⃣ Verifying Eva Magan...\n');

const { data: evaCustomer } = await supabase
  .from('customers')
  .select('id')
  .ilike('phone', '%9198066511%')
  .limit(1);

if (evaCustomer && evaCustomer.length > 0) {
  const { data: evaVendor } = await supabase
    .from('vendor_customers')
    .select('loyalty_points, loyalty_tier, total_spent, total_orders')
    .eq('customer_id', evaCustomer[0].id)
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .limit(1);

  if (evaVendor && evaVendor.length > 0) {
    console.log('✅ Eva Magan data:');
    console.log(`   Loyalty Points: ${evaVendor[0].loyalty_points}`);
    console.log(`   Tier: ${evaVendor[0].loyalty_tier}`);
    console.log(`   Total Spent: $${evaVendor[0].total_spent || 0}`);
    console.log(`   Total Orders: ${evaVendor[0].total_orders || 0}`);
  }
}

console.log('\n✨ Done!\n');
