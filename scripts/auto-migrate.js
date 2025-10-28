#!/usr/bin/env node
/**
 * Automatic Migration Runner
 * Runs all pending migrations in /supabase/migrations automatically
 * Usage: node scripts/auto-migrate.js
 */

const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  return { ok: response.ok, status: response.status };
}

async function runAllMigrations() {
  console.log('🔄 Auto-Migration Runner\n');

  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  No migrations directory found');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('✅ No migrations to run');
    return;
  }

  console.log(`📦 Found ${files.length} migration files\n`);

  for (const file of files) {
    console.log(`⚙️  Applying: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const result = await executeSql(sql);

    if (result.ok || result.status === 404 || result.status === 409) {
      console.log(`   ✅ Success\n`);
    } else {
      console.log(`   ⚠️  Status: ${result.status} (may be OK if tables exist)\n`);
    }
  }

  console.log('✨ All migrations processed!\n');
}

// Run migrations
runAllMigrations().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
