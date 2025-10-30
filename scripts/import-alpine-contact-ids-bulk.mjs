#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const csvPath = process.argv[2] || '/Users/whale/Downloads/3999-244484-1761775748-rp.csv';

console.log('📥 Bulk Importing Alpine IQ Contact IDs\n');
console.log(`Reading: ${csvPath}\n`);

// Step 1: Load ALL customers into memory
console.log('1️⃣ Loading all customers into memory...');
const { data: allCustomers, error: customersError } = await supabase
  .from('customers')
  .select('id, email');

if (customersError) {
  console.error('❌ Error loading customers:', customersError);
  process.exit(1);
}

console.log(`✅ Loaded ${allCustomers.length} customers\n`);

// Create lookup maps
const customersByEmail = new Map();
const customersByCovaId = new Map();

for (const customer of allCustomers) {
  if (customer.email) {
    customersByEmail.set(customer.email.toLowerCase().trim(), customer.id);
  }
  customersByCovaId.set(customer.id, customer.id);
}

console.log(`   📧 ${customersByEmail.size} customers with emails`);
console.log(`   🆔 ${customersByCovaId.size} customers by ID\n`);

// Step 2: Read and parse CSV
console.log('2️⃣ Reading CSV...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} records in CSV\n`);

// Step 3: Match customers in memory
console.log('3️⃣ Matching customers...');
const mappings = [];
let matched = 0;
let skipped = 0;

for (const record of records) {
  const contactId = record.contact_id;
  const email = record.email?.toLowerCase().trim();
  const srcIds = record.src_ids;

  if (!contactId) {
    skipped++;
    continue;
  }

  let customerId = null;

  // Try to match by email first
  if (email && email.length > 0 && customersByEmail.has(email)) {
    customerId = customersByEmail.get(email);
  }

  // If not found by email, try by COVA ID
  if (!customerId && srcIds && srcIds.includes('cova:::')) {
    const covaId = srcIds.replace('cova:::', '');
    if (customersByCovaId.has(covaId)) {
      customerId = covaId;
    }
  }

  if (customerId) {
    mappings.push({
      vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
      customer_id: customerId,
      alpineiq_customer_id: contactId,
      last_synced_at: new Date().toISOString()
    });
    matched++;
  } else {
    skipped++;
  }

  if (matched % 1000 === 0) {
    console.log(`   📊 Matched ${matched} customers...`);
  }
}

console.log(`\n✅ Matched ${matched} customers`);
console.log(`   Skipped ${skipped} (no match found)\n`);

// Step 4: Bulk insert mappings
console.log('4️⃣ Saving mappings to database...');
console.log(`   Inserting ${mappings.length} mappings in batches of 1000...\n`);

let inserted = 0;
const batchSize = 1000;

for (let i = 0; i < mappings.length; i += batchSize) {
  const batch = mappings.slice(i, i + batchSize);

  const { error } = await supabase
    .from('alpineiq_customer_mapping')
    .upsert(batch, {
      onConflict: 'vendor_id,customer_id'
    });

  if (error) {
    console.error(`❌ Error inserting batch at index ${i}:`, error);
  } else {
    inserted += batch.length;
    console.log(`   💾 Saved ${inserted} / ${mappings.length} mappings...`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n✅ Bulk Import Complete!\n');
console.log(`   Total CSV Records: ${records.length}`);
console.log(`   Matched Customers: ${matched}`);
console.log(`   Inserted Mappings: ${inserted}`);
console.log(`   Skipped: ${skipped}`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
