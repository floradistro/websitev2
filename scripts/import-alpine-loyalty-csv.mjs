#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BATCH_SIZE = 50;

console.log('🚀 Importing Alpine IQ Loyalty Points from CSV\n');

// Read CSV
console.log('1️⃣ Reading CSV file...\n');
const csvContent = readFileSync('/Users/whale/Downloads/3999-244484-1761775748-rp.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} records in CSV\n`);

// Show sample
console.log('📋 Sample records:');
console.log(records.slice(0, 3).map(r => ({
  email: r.email,
  phone: r.mobile_phone,
  points: r.loyalty_points,
  loyalty: r.loyalty
})));
console.log('');

console.log('2️⃣ Matching and updating customers...\n');

let matched = 0;
let notMatched = 0;
let updated = 0;
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
    notMatched++;
    continue;
  }

  // Map Alpine IQ tier based on points
  let tier = 'bronze';
  if (loyaltyPoints >= 10000) tier = 'platinum';
  else if (loyaltyPoints >= 5000) tier = 'gold';
  else if (loyaltyPoints >= 2500) tier = 'silver';

  // Find matching customer in database
  let query = supabase.from('customers').select('id, email, phone');

  if (email) {
    query = query.eq('email', email);
  } else if (phone) {
    query = query.eq('phone', phone);
  }

  const { data: customers, error: searchError } = await query.limit(1);

  if (searchError) {
    console.error(`   ❌ Search error:`, searchError.message);
    errors++;
    continue;
  }

  if (customers && customers.length > 0) {
    // Match found - update loyalty points
    const customer = customers[0];

    batch.push({
      id: customer.id,
      loyalty_points: Math.round(loyaltyPoints),
      loyalty_tier: tier,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    });

    matched++;

    if (matched % 10 === 0) {
      console.log(`   ✅ Matched ${matched} customers...`);
    }
  } else {
    notMatched++;
  }

  // Update batch
  if (batch.length >= BATCH_SIZE) {
    const { error: updateError } = await supabase
      .from('customers')
      .upsert(batch, { onConflict: 'id' });

    if (updateError) {
      console.error(`   ❌ Batch update error:`, updateError.message);
      errors += batch.length;
    } else {
      updated += batch.length;
    }

    batch = [];
  }

  // Progress
  if (i % 500 === 0 && i > 0) {
    console.log(`   📊 Progress: ${i}/${records.length} (${matched} matched, ${notMatched} not matched)`);
  }
}

// Update remaining batch
if (batch.length > 0) {
  const { error: updateError } = await supabase
    .from('customers')
    .upsert(batch, { onConflict: 'id' });

  if (updateError) {
    console.error(`   ❌ Final batch error:`, updateError.message);
    errors += batch.length;
  } else {
    updated += batch.length;
  }
}

console.log('\n🎉 Import Complete!\n');
console.log('📊 Summary:');
console.log(`   CSV records: ${records.length}`);
console.log(`   Matched customers: ${matched}`);
console.log(`   Not matched: ${notMatched}`);
console.log(`   Updated: ${updated}`);
console.log(`   Errors: ${errors}`);

// Verify
const { data: stats } = await supabase
  .from('customers')
  .select('loyalty_points')
  .gt('loyalty_points', 0);

console.log(`\n✅ Total customers with loyalty points: ${stats?.length || 0}\n`);

// Show top customers
const { data: topCustomers } = await supabase
  .from('customers')
  .select('email, first_name, last_name, loyalty_points, loyalty_tier')
  .order('loyalty_points', { ascending: false })
  .limit(10);

console.log('🏆 Top 10 loyalty customers:');
console.table(topCustomers);
