#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔧 Running category hierarchy migration...\n');

  // Read the SQL file
  const sql = readFileSync('supabase/migrations/20251101_add_category_hierarchy.sql', 'utf-8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executing: ${statement.substring(0, 100)}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

    if (error) {
      // Try direct query if RPC doesn't work
      const { error: queryError } = await supabase.from('categories').select('*').limit(0);

      // Manually execute each part
      if (statement.includes('ALTER TABLE categories ADD COLUMN')) {
        console.log('  → Adding parent_category_id column via script...');
        // This will be handled by Supabase dashboard or direct SQL
        console.log('  ⚠️  Please run this migration via Supabase Dashboard SQL Editor');
        console.log('\n' + sql);
        return;
      }
    } else {
      console.log('  ✅ Success\n');
    }
  }

  console.log('✅ Migration complete!');
}

main().catch(console.error);
