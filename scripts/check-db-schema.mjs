#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Try to list tables by attempting to query known tables
  const tables = ['customers', 'vendors', 'customer_loyalty', 'orders'];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check vendor
  console.log('\n🏪 Checking Flora Distro vendor...');
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, store_name, marketing_provider')
    .eq('id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .single();

  if (vendorError) {
    console.log(`❌ Error: ${vendorError.message}`);
  } else if (vendor) {
    console.log(`✅ Found vendor: ${vendor.store_name}`);
    console.log(`   Marketing provider: ${vendor.marketing_provider || 'none'}`);
  }
}

checkSchema().catch(console.error);
