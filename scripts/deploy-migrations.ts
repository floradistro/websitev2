/**
 * Deploy SQL migrations via Supabase service role
 * Workaround for CLI prepared statement limitations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployMigration(filename: string) {
  console.log(`\n📦 Deploying: ${filename}`);

  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', filename),
    'utf-8'
  );

  try {
    // Execute SQL via Supabase edge function proxy
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // If RPC doesn't exist, try direct execution via postgREST
      console.log('⚠️  exec_sql RPC not found, trying alternative method...');

      // Split SQL into individual statements and execute sequentially
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const stmt of statements) {
        if (stmt) {
          const { error } = await (supabase as any).rpc('exec', { sql: stmt });
          if (error) {
            throw new Error(`Statement failed: ${stmt.substring(0, 100)}...\nError: ${error.message}`);
          }
        }
      }
    }

    console.log(`✅ ${filename} deployed successfully`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to deploy ${filename}:`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Deploying P0 Critical Migrations\n');
  console.log('━'.repeat(60));

  const migrations = [
    '20251113080001_atomic_inventory_transfer.sql',
    '20251113080002_atomic_session_management.sql',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await deployMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`\n📊 Deployment Summary:`);
  console.log(`   ✅ Success: ${successCount}/${migrations.length}`);
  console.log(`   ❌ Failed:  ${failCount}/${migrations.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please deploy manually via Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new');
    process.exit(1);
  }

  console.log('\n✨ All migrations deployed successfully!');
  process.exit(0);
}

main();
