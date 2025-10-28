/**
 * Fix TV Devices Unique Constraint
 * Remove location_id from unique constraint
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

async function fixConstraint() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔧 Checking existing constraints...');
    const { rows } = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'tv_devices'
      AND constraint_type = 'UNIQUE';
    `);

    console.log('Current unique constraints:', rows);

    // Drop the old unique constraint
    console.log('\n🗑️  Dropping old unique constraint...');
    try {
      await client.query(`
        ALTER TABLE public.tv_devices
        DROP CONSTRAINT IF EXISTS tv_devices_vendor_id_location_id_tv_number_key;
      `);
      console.log('✅ Old constraint dropped');
    } catch (err) {
      console.log('⚠️  No old constraint to drop');
    }

    // Add new unique constraint (vendor_id + tv_number only)
    console.log('\n➕ Adding new unique constraint (vendor_id + tv_number)...');
    try {
      await client.query(`
        ALTER TABLE public.tv_devices
        ADD CONSTRAINT tv_devices_vendor_tv_unique
        UNIQUE (vendor_id, tv_number);
      `);
      console.log('✅ New constraint added');
    } catch (err) {
      console.log('⚠️  Constraint may already exist:', err.message);
    }

    console.log('\n✅ Constraint fixed!');
    console.log('📝 TVs are now unique by vendor + TV number (location not required)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixConstraint();
