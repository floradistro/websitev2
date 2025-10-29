#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const BATCH_SIZE = 50;
const DELAY = 300; // ms between Alpine IQ calls

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function alpineRequest(endpoint, method = 'GET', body = null) {
  const url = `${ALPINE_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.errors?.[0]?.message || `API error: ${response.statusText}`);
  }

  return data.data;
}

async function importPOSCustomers(excelFilePath) {
  console.log('🚀 Importing POS Customers\n');

  // Read Excel file
  console.log(`1️⃣ Reading Excel file: ${excelFilePath}\n`);

  let workbook;
  try {
    workbook = XLSX.readFile(excelFilePath);
  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    console.log('\n💡 Usage: node import-pos-customers.mjs "/path/to/Customer Export.xlsx"');
    return;
  }

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✅ Found ${records.length} customers in Excel\n`);

  if (records.length === 0) {
    console.log('⚠️  Excel file is empty');
    return;
  }

  // Show sample of columns
  console.log('📋 Excel Columns detected:');
  Object.keys(records[0]).forEach(col => {
    console.log(`   - ${col}`);
  });
  console.log('');

  // Import customers
  console.log('2️⃣ Importing to database & enriching with Alpine IQ...\n');

  let imported = 0;
  let enriched = 0;
  let skipped = 0;
  let errors = 0;
  let batch = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Extract fields (try various column name formats)
    const email = (
      record.Email || record.email || record.EMAIL ||
      record['Email Address'] || record.emailAddress || ''
    ).toLowerCase().trim();

    const phone = (
      record.Phone || record.phone || record.PHONE ||
      record['Phone Number'] || record.phoneNumber ||
      record.Mobile || record.mobile || ''
    ).trim();

    const firstName = (
      record['First Name'] || record.firstName || record.FirstName ||
      record['Customer First Name'] || record.first_name || ''
    ).trim();

    const lastName = (
      record['Last Name'] || record.lastName || record.LastName ||
      record['Customer Last Name'] || record.last_name || ''
    ).trim();

    const dob = record.DOB || record.dob || record['Date of Birth'] || record.birthdate || null;

    // Skip if no contact info at all
    if (!email && !phone) {
      skipped++;
      continue;
    }

    // Generate email for phone-only customers
    let finalEmail = email;
    if (!email && phone) {
      // Create synthetic email from phone
      finalEmail = `${phone.replace(/[^0-9]/g, '')}@phone.local`;
    }

    // Check Alpine IQ for loyalty data
    let loyaltyData = null;
    if (email || phone) {
      try {
        const identifier = email || phone;
        loyaltyData = await alpineRequest(
          `/api/v2/loyalty/lookup/${identifier}`,
          'POST',
          {}
        );

        if (loyaltyData?.contact) {
          enriched++;
        }

        await sleep(DELAY);
      } catch (error) {
        // Customer not in Alpine IQ loyalty program yet
      }
    }

    // Map Alpine IQ tiers to our tier system
    const alpineTier = loyaltyData?.wallet?.tier || '';
    let dbTier = 'bronze';
    if (alpineTier.toLowerCase().includes('silver') || alpineTier.toLowerCase().includes('tier 2')) dbTier = 'silver';
    else if (alpineTier.toLowerCase().includes('gold') || alpineTier.toLowerCase().includes('tier 3')) dbTier = 'gold';
    else if (alpineTier.toLowerCase().includes('platinum') || alpineTier.toLowerCase().includes('tier 4')) dbTier = 'platinum';

    // Prepare customer data
    const customerData = {
      email: finalEmail,
      phone: phone || null,
      first_name: firstName || loyaltyData?.contact?.firstName || null,
      last_name: lastName || loyaltyData?.contact?.lastName || null,
      date_of_birth: dob || null,
      marketing_opt_in: true,
      loyalty_points: loyaltyData?.wallet?.points || 0,
      loyalty_tier: dbTier,
      is_active: true,
      is_verified: !!email, // Only verified if real email
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
      if (i % 100 === 0) {
        console.log(`   📊 Progress: ${i}/${records.length} (${imported} imported, ${enriched} enriched, ${skipped} skipped)`);
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
  console.log(`   Enriched with Alpine IQ: ${enriched}`);
  console.log(`   Skipped: ${skipped} (no email/phone)`);
  console.log(`   Errors: ${errors}`);

  // Verify
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total customers in database: ${count}\n`);
}

// Get Excel path from command line
const excelPath = process.argv[2];

if (!excelPath) {
  console.log('❌ Please provide an Excel file path\n');
  console.log('Usage:');
  console.log('   node import-pos-customers.mjs "/path/to/Customer Export.xlsx"');
  console.log('');
  console.log('Example:');
  console.log('   node import-pos-customers.mjs ~/Downloads/"Customer Export.xlsx"');
  process.exit(1);
}

importPOSCustomers(excelPath).catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
