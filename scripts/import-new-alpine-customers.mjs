#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BATCH_SIZE = 50;

console.log('🚀 Importing NEW Alpine IQ Customers (not in POS)\n');

// Read CSV
console.log('1️⃣ Reading CSV file...\n');
const csvContent = readFileSync('/Users/whale/Downloads/3999-244484-1761775748-rp.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} records in Alpine IQ CSV\n`);

console.log('2️⃣ Finding NEW customers (not in database)...\n');

let newCustomers = 0;
let skipped = 0;
let errors = 0;
let batch = [];

for (let i = 0; i < records.length; i++) {
  const record = records[i];

  // Extract data
  const email = record.email?.trim().toLowerCase() || null;
  const phone = record.mobile_phone?.trim() || null;
  const loyaltyPoints = parseFloat(record.loyalty_points || '0');
  const isLoyaltyMember = record.loyalty === 'true';
  const firstName = record.first_name?.trim() || null;
  const lastName = record.last_name?.trim() || null;

  // Skip if no identifier
  if (!email && !phone) {
    skipped++;
    continue;
  }

  // Check if customer already exists
  let query = supabase.from('customers').select('id');

  if (email) {
    query = query.eq('email', email);
  } else if (phone) {
    query = query.eq('phone', phone);
  }

  const { data: existing, error: searchError } = await query.limit(1);

  if (searchError) {
    console.error(`   ❌ Search error:`, searchError.message);
    errors++;
    continue;
  }

  // If customer exists, skip
  if (existing && existing.length > 0) {
    skipped++;
    continue;
  }

  // NEW CUSTOMER - add to batch
  // Map Alpine IQ tier based on points
  let tier = 'bronze';
  if (loyaltyPoints >= 10000) tier = 'platinum';
  else if (loyaltyPoints >= 5000) tier = 'gold';
  else if (loyaltyPoints >= 2500) tier = 'silver';

  // Generate synthetic email for phone-only customers
  let finalEmail = email;
  if (!email && phone) {
    finalEmail = `${phone.replace(/[^0-9]/g, '')}@alpine.local`;
  }

  batch.push({
    email: finalEmail,
    phone: phone || null,
    first_name: firstName,
    last_name: lastName,
    loyalty_points: Math.round(loyaltyPoints),
    loyalty_tier: tier,
    marketing_opt_in: true,
    is_active: true,
    is_verified: !!email, // Only verified if real email
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  newCustomers++;

  if (newCustomers % 10 === 0) {
    console.log(`   ✅ Found ${newCustomers} new customers...`);
  }

  // Insert batch
  if (batch.length >= BATCH_SIZE) {
    const { error: insertError } = await supabase
      .from('customers')
      .insert(batch);

    if (insertError) {
      console.error(`   ❌ Batch insert error:`, insertError.message);
      errors += batch.length;
    }

    batch = [];
  }

  // Progress
  if (i % 500 === 0 && i > 0) {
    console.log(`   📊 Progress: ${i}/${records.length} (${newCustomers} new, ${skipped} skipped)`);
  }
}

// Insert remaining batch
if (batch.length > 0) {
  const { error: insertError } = await supabase
    .from('customers')
    .insert(batch);

  if (insertError) {
    console.error(`   ❌ Final batch error:`, insertError.message);
    errors += batch.length;
  }
}

console.log('\n🎉 Import Complete!\n');
console.log('📊 Summary:');
console.log(`   Alpine IQ records: ${records.length}`);
console.log(`   New customers added: ${newCustomers}`);
console.log(`   Already existed (skipped): ${skipped}`);
console.log(`   Errors: ${errors}`);

// Verify total count
const { count } = await supabase
  .from('customers')
  .select('*', { count: 'exact', head: true });

console.log(`\n✅ Total customers in database: ${count}\n`);
