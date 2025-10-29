#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 BULK Alpine IQ Import (FAST)\n');

// STEP 1: Load ALL existing customers into memory
console.log('1️⃣ Loading existing customers into memory...');
let allExisting = [];
let page = 0;
const pageSize = 1000;
let hasMore = true;

while (hasMore) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, email, phone')
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    allExisting = allExisting.concat(data);
    console.log(`   Loaded ${allExisting.length} customers...`);
    page++;
    if (data.length < pageSize) hasMore = false;
  } else {
    hasMore = false;
  }
}

console.log(`✅ Loaded ${allExisting.length} existing customers\n`);

// Create lookup maps
const emailMap = new Map();
const phoneMap = new Map();

allExisting.forEach(c => {
  if (c.email) emailMap.set(c.email.toLowerCase(), c);
  if (c.phone) phoneMap.set(c.phone, c);
});

// STEP 2: Parse Alpine CSV
console.log('2️⃣ Parsing Alpine IQ CSV...');
const csvContent = readFileSync('/Users/whale/Downloads/3999-244484-1761775748-rp.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} Alpine IQ records\n`);

// STEP 3: Match and categorize
console.log('3️⃣ Matching customers...');
const toUpdate = [];
const toInsert = [];
let skipped = 0;

for (const record of records) {
  const email = record.email?.trim().toLowerCase() || null;
  const phone = record.mobile_phone?.trim() || null;
  const loyaltyPoints = parseFloat(record.loyalty_points || '0');
  const firstName = record.first_name?.trim() || null;
  const lastName = record.last_name?.trim() || null;

  // Skip if no identifier
  if (!email && !phone) {
    skipped++;
    continue;
  }

  // Map tier
  let tier = 'bronze';
  if (loyaltyPoints >= 10000) tier = 'platinum';
  else if (loyaltyPoints >= 5000) tier = 'gold';
  else if (loyaltyPoints >= 2500) tier = 'silver';

  // Check if exists
  let existing = null;
  if (email) existing = emailMap.get(email);
  if (!existing && phone) existing = phoneMap.get(phone);

  if (existing) {
    // UPDATE existing customer
    toUpdate.push({
      id: existing.id,
      loyalty_points: Math.round(loyaltyPoints),
      loyalty_tier: tier,
    });
  } else {
    // INSERT new customer
    let finalEmail = email;
    if (!email && phone) {
      finalEmail = `${phone.replace(/[^0-9]/g, '')}@alpine.local`;
    }

    toInsert.push({
      email: finalEmail,
      phone: phone || null,
      first_name: firstName,
      last_name: lastName,
      loyalty_points: Math.round(loyaltyPoints),
      loyalty_tier: tier,
      marketing_opt_in: true,
      is_active: true,
      is_verified: !!email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

console.log(`✅ Matched: ${toUpdate.length} to update, ${toInsert.length} to insert, ${skipped} skipped\n`);

// STEP 4: Bulk update existing customers
console.log('4️⃣ Bulk updating existing customers...');
const BATCH_SIZE = 500;

for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
  const batch = toUpdate.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('customers')
    .upsert(batch, { onConflict: 'id' });

  if (error) {
    console.error(`   ❌ Batch ${i}-${i + batch.length} error:`, error.message);
  } else {
    console.log(`   ✅ Updated ${i + batch.length}/${toUpdate.length}`);
  }
}

console.log(`✅ Updated ${toUpdate.length} customers\n`);

// STEP 5: Bulk insert new customers
console.log('5️⃣ Bulk inserting new customers...');

for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
  const batch = toInsert.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('customers')
    .insert(batch);

  if (error) {
    console.error(`   ❌ Batch ${i}-${i + batch.length} error:`, error.message);
  } else {
    console.log(`   ✅ Inserted ${i + batch.length}/${toInsert.length}`);
  }
}

console.log(`✅ Inserted ${toInsert.length} new customers\n`);

// STEP 6: Verify
console.log('6️⃣ Verifying...');
const { count } = await supabase
  .from('customers')
  .select('*', { count: 'exact', head: true });

const { data: withPoints } = await supabase
  .from('customers')
  .select('loyalty_points')
  .gt('loyalty_points', 0);

console.log('\n🎉 Import Complete!\n');
console.log('📊 Final Stats:');
console.log(`   Total customers: ${count}`);
console.log(`   With loyalty points: ${withPoints?.length || 0}`);
console.log(`   Updated: ${toUpdate.length}`);
console.log(`   Inserted: ${toInsert.length}`);
console.log(`   Skipped: ${skipped}\n`);
