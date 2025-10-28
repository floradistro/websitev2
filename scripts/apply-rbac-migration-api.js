const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

async function runMigration() {
  console.log('🚀 Applying RBAC migration via Supabase REST API...\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_rbac_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log('📝 Executing SQL via REST API...\n');

  try {
    // Use Supabase SQL endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const text = await response.text();

    if (!response.ok) {
      console.log('❌ API Response:', response.status, text);
      console.log('\n⚠️  REST API execution failed. Trying alternative method...\n');

      // Try sending each statement individually
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`Found ${statements.length} statements\n`);

      for (let i = 0; i < Math.min(5, statements.length); i++) {
        const stmt = statements[i];
        console.log(`[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);

        const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: stmt + ';'
          })
        });

        if (stmtResponse.ok) {
          console.log('  ✅ Success');
        } else {
          const errText = await stmtResponse.text();
          console.log('  ⚠️  Response:', stmtResponse.status, errText.substring(0, 100));
        }
      }

      console.log('\n💡 Migration may need to be run manually via Supabase Studio.');
      console.log('   URL: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql');
      console.log('\n📋 Copy the SQL from: supabase/migrations/20251027_rbac_system.sql\n');
    } else {
      console.log('✅ Migration executed successfully via REST API!');
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please run the migration manually via Supabase Studio SQL editor');
    console.log('   URL: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql\n');
  }
}

runMigration();
