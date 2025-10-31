#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔧 Running migration: add visible_price_breaks column\n');
console.log('This will modify the tv_display_groups table structure.\n');

// Use direct fetch to Supabase REST API with raw SQL
const runSQL = async (sql) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
};

// The SQL to run
const sql = `
-- Add visible_price_breaks column
ALTER TABLE tv_display_groups
ADD COLUMN IF NOT EXISTS visible_price_breaks TEXT[] DEFAULT '{}';

COMMENT ON COLUMN tv_display_groups.visible_price_breaks IS
'Array of price break IDs to display on TV menus (e.g., {1g,3_5g,28g})';
`;

console.log('SQL to execute:');
console.log(sql);
console.log('\n---\n');

// Instructions for manual execution
console.log('⚠️  Supabase Client Library cannot execute DDL statements.');
console.log('Please run this migration manually:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new');
console.log('2. Paste the SQL above');
console.log('3. Click "Run"\n');
console.log('Or run via psql if you have direct database access.');
