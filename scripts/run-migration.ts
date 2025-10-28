/**
 * Run a specific migration file
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile: string) {
  console.log(`📝 Running migration: ${migrationFile}\n`);

  const migrationPath = resolve(__dirname, '../supabase/migrations', migrationFile);
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('SQL:', sql, '\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration completed successfully');
  console.log('Result:', data);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-file>');
  process.exit(1);
}

runMigration(migrationFile).then(() => process.exit(0));
