/**
 * Fix TV Devices Schema - Make location_id nullable
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

async function fixSchema() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔧 Making location_id nullable in tv_devices...');

    await client.query(`
      ALTER TABLE public.tv_devices
      ALTER COLUMN location_id DROP NOT NULL;
    `);

    console.log('✅ location_id is now nullable\n');

    console.log('✅ Schema fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixSchema();
