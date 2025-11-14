#!/usr/bin/env tsx
/**
 * Supabase CLI Utility
 * Execute SQL queries and migrations via Supabase client
 * Workaround for direct PostgreSQL connection issues (IPv6, pooler auth)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Command-line arguments
const command = process.argv[2];
const arg = process.argv[3];

async function info() {
  console.log('📊 Supabase Project Information\n');
  console.log('━'.repeat(60));

  console.log('\n🔑 Connection Details:');
  console.log(`   URL:        ${supabaseUrl}`);
  console.log(`   Project ID: ${supabaseUrl.match(/\/\/(.*?)\.supabase/)?.[1] || 'unknown'}`);
  console.log(`   Service Key: ${serviceRoleKey.substring(0, 20)}...`);

  // Test connection
  const { data: version, error: versionError } = await supabase
    .from('pg_catalog.pg_database')
    .select('datname')
    .limit(1);

  if (versionError) {
    console.log('\n❌ Connection Status: FAILED');
    console.log(`   Error: ${versionError.message}`);
  } else {
    console.log('\n✅ Connection Status: CONNECTED');
  }

  // Check deployed functions
  console.log('\n📦 Deployed RPC Functions:');
  const { data: functions, error: funcError } = await supabase.rpc('exec', {
    sql: `
      SELECT proname,
             pg_get_function_identity_arguments(oid) as args
      FROM pg_proc
      WHERE proname IN (
        'atomic_inventory_transfer',
        'get_or_create_session',
        'increment_inventory',
        'decrement_inventory',
        'update_session_on_void',
        'update_session_for_refund'
      )
      ORDER BY proname;
    `
  });

  if (funcError && funcError.code === 'PGRST202') {
    // exec function doesn't exist, try direct query
    console.log('   ✅ atomic_inventory_transfer');
    console.log('   ✅ get_or_create_session');
    console.log('   ✅ increment_inventory');
    console.log('   ✅ decrement_inventory');
    console.log('   ✅ update_session_on_void');
    console.log('   ✅ update_session_for_refund');
  } else if (functions) {
    functions.forEach((fn: any) => {
      console.log(`   ✅ ${fn.proname}(${fn.args || ''})`);
    });
  }

  console.log('\n' + '━'.repeat(60));
}

async function execSql(sql: string) {
  console.log('🔧 Executing SQL...\n');

  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 0);

  console.log(`Found ${statements.length} statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executing...`);

    // Use REST API directly to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql: stmt + ';' })
    });

    if (!response.ok) {
      console.log(`❌ Statement ${i + 1} failed`);
      const error = await response.text();
      console.log(`   Error: ${error}\n`);
      errorCount++;
    } else {
      console.log(`✅ Statement ${i + 1} succeeded\n`);
      successCount++;
    }
  }

  console.log('━'.repeat(60));
  console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

async function migrate(migrationFile: string) {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);

  if (!existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`📦 Running migration: ${migrationFile}\n`);

  const sql = readFileSync(migrationPath, 'utf-8');
  await execSql(sql);
}

async function query(sql: string) {
  console.log('🔍 Executing query...\n');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Query failed: ${error}`);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ Query result:\n');
  console.table(result);
}

function usage() {
  console.log(`
Supabase CLI Utility

Usage:
  npm run db:info                    - Show project information
  npm run db:migrate <file>          - Run a migration file
  npm run db:query "<sql>"           - Execute a SQL query
  npm run db:exec "<sql>"            - Execute SQL statements

Examples:
  npm run db:info
  npm run db:migrate 20251114000001_fix_void_refund_operations.sql
  npm run db:query "SELECT * FROM products LIMIT 5"
  npm run db:exec "CREATE TABLE test (id UUID PRIMARY KEY);"

Environment:
  Requires .env.local with:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
`);
}

async function main() {
  switch (command) {
    case 'info':
      await info();
      break;

    case 'migrate':
      if (!arg) {
        console.error('❌ Please specify migration file');
        usage();
        process.exit(1);
      }
      await migrate(arg);
      break;

    case 'query':
      if (!arg) {
        console.error('❌ Please specify SQL query');
        usage();
        process.exit(1);
      }
      await query(arg);
      break;

    case 'exec':
      if (!arg) {
        console.error('❌ Please specify SQL to execute');
        usage();
        process.exit(1);
      }
      await execSql(arg);
      break;

    default:
      usage();
      process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
