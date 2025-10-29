#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BATCH_SIZE = 50;

async function importFromCSV(csvFilePath) {
  console.log('🚀 Import Alpine IQ Customers from CSV\n');

  // Read CSV file
  console.log(`1️⃣ Reading CSV file: ${csvFilePath}\n`);

  let records;
  try {
    const csvContent = readFileSync(csvFilePath, 'utf-8');
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    console.error('❌ Error reading CSV:', error.message);
    console.log('\n💡 Usage: node import-alpineiq-csv.mjs /path/to/customers.csv');
    return;
  }

  console.log(`✅ Found ${records.length} records in CSV\n`);

  if (records.length === 0) {
    console.log('⚠️  CSV is empty');
    return;
  }

  // Show sample of columns
  console.log('📋 CSV Columns detected:');
  Object.keys(records[0]).forEach(col => {
    console.log(`   - ${col}`);
  });
  console.log('');

  // Map CSV columns to database fields
  console.log('2️⃣ Mapping and importing...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let batch = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Try to extract email/phone from various possible column names
    const email = record.email || record.Email || record.EMAIL ||
                  record['Email Address'] || record.emailAddress || null;

    const phone = record.phone || record.Phone || record.PHONE ||
                  record['Phone Number'] || record.phoneNumber || record.mobile || null;

    if (!email && !phone) {
      skipped++;
      continue;
    }

    // Extract other fields
    const firstName = record.firstName || record['First Name'] || record.first_name ||
                      record.FirstName || null;

    const lastName = record.lastName || record['Last Name'] || record.last_name ||
                     record.LastName || null;

    const dob = record.birthdate || record.dob || record.DOB || record['Date of Birth'] || null;

    const loyaltyPoints = parseInt(
      record.points || record.Points || record.loyaltyPoints ||
      record['Loyalty Points'] || '0'
    );

    const tier = record.tier || record.Tier || record.loyaltyTier || 'Member';

    const optIn = record.emailOptIn || record.optIn || record['Email Opt In'];
    const marketingOptIn = optIn === 'true' || optIn === '1' || optIn === 'yes' || optIn === true;

    // Prepare customer data
    const customerData = {
      email: email?.toLowerCase() || null,
      phone: phone || null,
      first_name: firstName || null,
      last_name: lastName || null,
      date_of_birth: dob || null,
      marketing_opt_in: marketingOptIn,
      loyalty_points: loyaltyPoints || 0,
      loyalty_tier: tier || 'Member',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    batch.push(customerData);

    // Insert batch
    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('customers')
        .upsert(batch, {
          onConflict: 'email',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`   ❌ Batch error:`, error.message);
        errors += batch.length;
      } else {
        imported += batch.length;
      }

      batch = [];

      // Progress
      if (i % 500 === 0) {
        console.log(`   📊 Progress: ${i}/${records.length} (${imported} imported, ${skipped} skipped, ${errors} errors)`);
      }
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    const { error } = await supabase
      .from('customers')
      .upsert(batch, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (error) {
      errors += batch.length;
    } else {
      imported += batch.length;
    }
  }

  console.log('\n🎉 Import Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total records: ${records.length}`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped} (no email/phone)`);
  console.log(`   Errors: ${errors}`);

  // Verify
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total customers in database: ${count}\n`);
}

// Get CSV path from command line
const csvPath = process.argv[2];

if (!csvPath) {
  console.log('❌ Please provide a CSV file path\n');
  console.log('Usage:');
  console.log('   node import-alpineiq-csv.mjs /path/to/customers.csv');
  console.log('');
  console.log('Example:');
  console.log('   node import-alpineiq-csv.mjs ~/Downloads/alpineiq-customers.csv');
  process.exit(1);
}

importFromCSV(csvPath).catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
