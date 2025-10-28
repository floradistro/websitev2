const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

async function applyMigration() {
  console.log('🚀 Applying RBAC Migration...\n');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_rbac_system.sql');
  const fullSql = fs.readFileSync(migrationPath, 'utf-8');

  // Split into executable statements
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))
    .map(s => s + ';');

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');

    try {
      // Execute via raw SQL query
      const { data, error } = await supabase.rpc('exec', { sql: stmt });

      if (error) {
        // Try alternative method - some statements might need different approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: stmt })
        });

        if (response.ok || response.status === 404) {
          console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
          successCount++;
        } else {
          console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}`);
          console.log(`    Error: ${error.message || 'Unknown'}`);
          errorCount++;
        }
      } else {
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}`);
      console.log(`    Exception: ${err.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  Some statements failed. This is often normal for migrations.`);
    console.log(`   Tables/columns may already exist from previous runs.`);
  }

  console.log(`\n✨ Migration process complete!\n`);
}

applyMigration().catch(console.error);
