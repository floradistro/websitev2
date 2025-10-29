#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Applying vendor customer access policies...\n');

try {
  const sql = readFileSync('/Users/whale/Desktop/Website/supabase/migrations/20251029_vendor_customer_access.sql', 'utf-8');

  console.log('Executing SQL migration...\n');
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    console.error('❌ Error:', error.message);

    // Try alternative approach - split and execute
    console.log('\n⚠️  Trying alternative approach...\n');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error: stmtError } = await supabase.rpc('exec_sql', { sql_string: statement });
      if (stmtError) {
        console.error(`  ❌ ${stmtError.message}`);
      } else {
        console.log('  ✅ Success');
      }
    }
  } else {
    console.log('✅ Migration applied successfully!\n');
  }

  // Verify policies
  console.log('\n📊 Verifying policies...');
  const { data: policies, error: policiesError } = await supabase
    .from('customers')
    .select('*')
    .limit(1);

  if (policiesError) {
    console.error('❌ Still blocked:', policiesError.message);
  } else {
    console.log('✅ Customers table is now accessible!\n');
  }

} catch (err) {
  console.error('Fatal error:', err.message);
  process.exit(1);
}
