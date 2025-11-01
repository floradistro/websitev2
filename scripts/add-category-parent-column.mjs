#!/usr/bin/env node

/**
 * Add parent_category_id column to categories table via Supabase API
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔧 Adding parent_category_id column to categories table...\n');

  // Use Supabase's admin API to execute raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Add parent_category_id column
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);

      -- Add comment
      COMMENT ON COLUMN categories.parent_category_id IS 'Parent category for hierarchical organization';
    `
  });

  if (error) {
    console.log('⚠️  RPC method not available. You will need to run this SQL manually in Supabase Dashboard:\n');
    console.log('-- Add parent_category_id to categories table');
    console.log('ALTER TABLE categories');
    console.log('ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;');
    console.log('');
    console.log('-- Create index for faster parent category lookups');
    console.log('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);');
    console.log('');
    console.log('-- Add comment');
    console.log("COMMENT ON COLUMN categories.parent_category_id IS 'Parent category for hierarchical organization';");
    console.log('\n📝 After running this SQL in Supabase Dashboard, run:');
    console.log('   node scripts/organize-category-hierarchy.mjs');
  } else {
    console.log('✅ Column added successfully!');
    console.log('\n📝 Now run: node scripts/organize-category-hierarchy.mjs');
  }
}

main().catch(console.error);
