#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const csvPath = process.argv[2] || '/Users/whale/Downloads/3999-244484-1761775748-rp.csv';

console.log('📥 Importing Alpine IQ Contact IDs\n');
console.log(`Reading: ${csvPath}\n`);

// Read and parse CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`✅ Found ${records.length} records in CSV\n`);

let matched = 0;
let created = 0;
let errors = 0;
let skipped = 0;

// Process in batches
for (const record of records) {
  const contactId = record.contact_id;
  const email = record.email?.toLowerCase().trim();
  const srcIds = record.src_ids; // e.g., "cova:::uuid"

  if (!contactId) {
    skipped++;
    continue;
  }

  // Extract COVA ID from src_ids
  let covaId = null;
  if (srcIds && srcIds.includes('cova:::')) {
    covaId = srcIds.replace('cova:::', '');
  }

  try {
    let customer = null;

    // Try to find customer by email first
    if (email && email.length > 0) {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();

      if (data) {
        customer = data;
      }
    }

    // If not found by email, try by COVA ID
    if (!customer && covaId) {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('id', covaId) // Assuming customer.id is the COVA ID
        .single();

      if (data) {
        customer = data;
      }
    }

    if (customer) {
      // Save mapping
      const { error } = await supabase
        .from('alpineiq_customer_mapping')
        .upsert({
          vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
          customer_id: customer.id,
          alpineiq_customer_id: contactId,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'vendor_id,customer_id'
        });

      if (error) {
        console.error(`❌ Error saving mapping for ${email || covaId}: ${error.message}`);
        errors++;
      } else {
        matched++;
        created++;

        if (created % 100 === 0) {
          console.log(`   💾 Saved ${created} mappings...`);
        }
      }
    } else {
      skipped++;
    }

  } catch (err) {
    console.error(`❌ Error processing record: ${err.message}`);
    errors++;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n✅ Import Complete!\n');
console.log(`   Matched: ${matched}`);
console.log(`   Created: ${created}`);
console.log(`   Skipped: ${skipped}`);
console.log(`   Errors: ${errors}`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
