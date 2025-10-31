#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('🔧 Adding visible_price_breaks column to tv_display_groups table...\n');

// First, create a function that can execute arbitrary SQL
const createExecFunction = `
CREATE OR REPLACE FUNCTION exec_migration_sql()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add visible_price_breaks column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tv_display_groups'
    AND column_name = 'visible_price_breaks'
  ) THEN
    ALTER TABLE tv_display_groups
    ADD COLUMN visible_price_breaks TEXT[] DEFAULT '{}';

    COMMENT ON COLUMN tv_display_groups.visible_price_breaks IS
    'Array of price break IDs to display on TV menus (e.g., {1g,3_5g,28g})';

    RAISE NOTICE 'Column visible_price_breaks added to tv_display_groups';
  ELSE
    RAISE NOTICE 'Column visible_price_breaks already exists';
  END IF;
END;
$$;
`;

try {
  console.log('Step 1: Creating migration function...');

  // We can't create functions via REST API, so let's try a different approach
  // Use the pg library to connect directly
  const { default: pg } = await import('pg');
  const { Client } = pg;

  const client = new Client({
    host: 'db.uaednwpxursknmwdeejn.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'SelahEsco123!!',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected to database\n');

  console.log('Step 2: Adding visible_price_breaks column...');

  const result = await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tv_display_groups'
        AND column_name = 'visible_price_breaks'
      ) THEN
        ALTER TABLE tv_display_groups
        ADD COLUMN visible_price_breaks TEXT[] DEFAULT '{}';

        COMMENT ON COLUMN tv_display_groups.visible_price_breaks IS
        'Array of price break IDs to display on TV menus (e.g., {1g,3_5g,28g})';

        RAISE NOTICE 'Column visible_price_breaks added to tv_display_groups';
      ELSE
        RAISE NOTICE 'Column visible_price_breaks already exists';
      END IF;
    END $$;
  `);

  console.log('✅ Migration completed successfully!\n');
  console.log('Result:', result);

  // Verify the column was added
  const verify = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'tv_display_groups'
    AND column_name = 'visible_price_breaks';
  `);

  if (verify.rows.length > 0) {
    console.log('\n✅ Verification: Column exists');
    console.log('Column details:', verify.rows[0]);
  } else {
    console.log('\n⚠️  Column not found after migration');
  }

  await client.end();

} catch (error) {
  console.error('❌ Error running migration:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
