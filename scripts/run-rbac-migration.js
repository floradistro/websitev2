const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

async function runMigration() {
  console.log('🚀 Starting RBAC migration...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_rbac_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log('📊 Executing SQL statements...\n');

  try {
    // Execute the entire SQL as a single query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sql
    });

    if (error) {
      console.log('⚠️  RPC method not available, trying alternative approach...\n');

      // Alternative: Split and execute individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      console.log(`Found ${statements.length} statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length > 50) {
          console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 50)}...`);
        } else {
          console.log(`[${i + 1}/${statements.length}] ${stmt}`);
        }
      }

      console.log('\n⚠️  Unable to execute via API. Please run the migration manually:');
      console.log('\n1. Go to https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql');
      console.log('2. Copy the contents of: supabase/migrations/20251027_rbac_system.sql');
      console.log('3. Paste and run in the SQL editor\n');
    } else {
      console.log('✅ Migration executed successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Please run the migration manually via Supabase Studio SQL editor');
    console.log('   URL: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql\n');
  }
}

runMigration();
