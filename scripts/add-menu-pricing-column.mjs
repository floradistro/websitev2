#!/usr/bin/env node

import { default as pg } from 'pg';
const { Client } = pg;

console.log('🔧 Adding visible_price_breaks column to tv_menus table...\n');

const client = new Client({
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'SelahEsco123!!',
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('✅ Connected to database\n');

  console.log('Step 1: Adding visible_price_breaks column to tv_menus...');

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tv_menus'
        AND column_name = 'visible_price_breaks'
      ) THEN
        ALTER TABLE tv_menus
        ADD COLUMN visible_price_breaks TEXT[] DEFAULT '{}';

        COMMENT ON COLUMN tv_menus.visible_price_breaks IS
        'Array of price break IDs to display for this specific menu (e.g., {1g,3_5g,28g}). Overrides display group settings.';

        RAISE NOTICE 'Column visible_price_breaks added to tv_menus';
      ELSE
        RAISE NOTICE 'Column visible_price_breaks already exists in tv_menus';
      END IF;
    END $$;
  `);

  console.log('✅ Migration completed successfully!\n');

  // Verify the column was added
  const verify = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'tv_menus'
    AND column_name = 'visible_price_breaks';
  `);

  if (verify.rows.length > 0) {
    console.log('✅ Verification: Column exists in tv_menus');
    console.log('Column details:', verify.rows[0]);
  } else {
    console.log('⚠️  Column not found after migration');
  }

  await client.end();
  console.log('\n✅ Per-menu pricing configuration is now available!');

} catch (error) {
  console.error('❌ Error running migration:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
