#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const sql = `
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
`;

console.log('🔧 Running migration via Supabase REST API...\n');

try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      query: sql
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error('❌ Migration failed');
    console.error('Status:', response.status, response.statusText);
    console.error('Response:', responseText);

    // Try alternative: use Supabase SQL editor endpoint
    console.log('\n🔄 Trying alternative method...\n');

    const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    console.log('Alt response:', altResponse.status, await altResponse.text());
  } else {
    console.log('✅ Migration completed successfully!');
    console.log('Response:', responseText);
  }
} catch (error) {
  console.error('❌ Error running migration:', error);
}

console.log('\nIf the above failed, the column needs to be added manually in Supabase dashboard.');
