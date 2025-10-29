#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🗄️  Running Alpine IQ loyalty migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20251029_alpine_iq_loyalty.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  try {
    // Execute the SQL via Supabase's RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, we'll execute each statement separately
      console.log('⚠️  exec_sql not available, running statements individually...\n');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (stmtError) {
          // Try using the REST API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql_query: statement })
          });

          if (!response.ok) {
            console.log(`⚠️  Statement might have already been executed or needs manual execution`);
          } else {
            console.log('✅ Executed successfully');
          }
        } else {
          console.log('✅ Executed successfully');
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    console.log('\n📊 Verifying customer_loyalty table schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('customer_loyalty')
      .select('*')
      .limit(0);

    if (!schemaError) {
      console.log('✅ customer_loyalty table is accessible');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Manual migration required. Run this SQL in Supabase SQL Editor:');
    console.log(sql);
  }
}

async function updateVendorConfig() {
  console.log('\n🔧 Updating Flora Distro vendor configuration...');

  const { data, error } = await supabase
    .from('vendors')
    .update({
      marketing_provider: 'alpineiq',
      marketing_config: {
        api_key: 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw',
        user_id: '3999'
      }
    })
    .eq('id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .select();

  if (error) {
    console.error('❌ Error updating vendor:', error.message);
    console.log('\n📝 Manual update required. Run this SQL in Supabase:');
    console.log(`
UPDATE vendors
SET
  marketing_provider = 'alpineiq',
  marketing_config = '{
    "api_key": "U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw",
    "user_id": "3999"
  }'::jsonb
WHERE id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
    `);
  } else {
    console.log('✅ Flora Distro vendor configured for Alpine IQ!');
    console.log('   Vendor:', data[0]?.vendor_name || data[0]?.store_name);
    console.log('   Provider:', data[0]?.marketing_provider);
  }
}

async function verifySetup() {
  console.log('\n🧪 Verifying setup...');

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id, vendor_name, store_name, marketing_provider, marketing_config')
    .eq('id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .single();

  if (error) {
    console.error('❌ Could not verify vendor:', error.message);
    return;
  }

  console.log('\n✅ Setup verified:');
  console.log('   Vendor:', vendor.vendor_name || vendor.store_name);
  console.log('   Provider:', vendor.marketing_provider);
  console.log('   User ID:', vendor.marketing_config?.user_id);
  console.log('\n🎉 Alpine IQ integration is ready!');
  console.log('\n📋 Next step: Test the loyalty sync:');
  console.log('   curl -X POST http://localhost:3000/api/vendor/marketing/alpineiq/sync-loyalty \\');
  console.log('     -H "x-vendor-id: cd2e1122-d511-4edb-be5d-98ef274b4baf"');
}

// Run all steps
async function main() {
  await runMigration();
  await updateVendorConfig();
  await verifySetup();
}

main().catch(console.error);
