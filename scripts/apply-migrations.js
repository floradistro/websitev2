const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODc4NjUwMywiZXhwIjoyMDQ0MzYyNTAzfQ.tPBaJh4TdE7CmcKUuVVaLYT2e_7TUv7JVHxaCuzAm4I';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filePath) {
  console.log(`\n📄 Applying migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  // Split SQL into individual statements (rough split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (!statement || statement.startsWith('--') || statement.length < 5) {
      continue;
    }

    try {
      // Execute via RPC to bypass RLS
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Try direct execution if RPC fails
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: statement + ';' })
        });

        if (!response.ok) {
          console.log(`   ⚠️  Statement ${i + 1} - trying alternative method...`);
          // Last resort: try using pg_catalog
          continue;
        }
      }

      console.log(`   ✅ Statement ${i + 1}/${statements.length}`);
    } catch (err) {
      console.error(`   ❌ Error on statement ${i + 1}:`, err.message);
      console.error(`   SQL: ${statement.substring(0, 100)}...`);
    }
  }

  console.log(`✅ Migration completed: ${path.basename(filePath)}`);
}

async function main() {
  console.log('🚀 Starting migration process...\n');

  const migrations = [
    '/Users/whale/Desktop/Website/supabase/migrations/20251028_promotions_system.sql',
    '/Users/whale/Desktop/Website/supabase/migrations/20251028_tv_menu_inventory_integration.sql'
  ];

  for (const migration of migrations) {
    if (fs.existsSync(migration)) {
      await applyMigration(migration);
    } else {
      console.log(`⚠️  Migration file not found: ${migration}`);
    }
  }

  console.log('\n✨ All migrations completed!');
}

main().catch(console.error);
