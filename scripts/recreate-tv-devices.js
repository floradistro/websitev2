/**
 * Recreate TV Devices Table with Correct Schema
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

async function recreateTable() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🗑️  Dropping old tv_devices table...');
    await client.query(`DROP TABLE IF EXISTS public.tv_devices CASCADE;`);
    console.log('✅ Old table dropped\n');

    console.log('📊 Creating new tv_devices table...');
    await client.query(`
      CREATE TABLE public.tv_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL,
        location_id UUID,
        tv_number INTEGER NOT NULL,
        device_name TEXT NOT NULL,
        device_identifier TEXT UNIQUE,
        active_menu_id UUID,
        active_playlist_id UUID,
        connection_status TEXT DEFAULT 'offline' CHECK (connection_status IN ('online', 'offline', 'error')),
        last_seen_at TIMESTAMPTZ,
        last_command_at TIMESTAMPTZ,
        last_heartbeat_at TIMESTAMPTZ,
        user_agent TEXT,
        ip_address INET,
        screen_resolution TEXT,
        browser_info JSONB,
        override_config JSONB DEFAULT '{}'::jsonb,
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(vendor_id, tv_number)
      );
    `);
    console.log('✅ Table created\n');

    console.log('📑 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tv_devices_vendor ON public.tv_devices(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_tv_devices_location ON public.tv_devices(location_id);
      CREATE INDEX IF NOT EXISTS idx_tv_devices_status ON public.tv_devices(connection_status);
      CREATE INDEX IF NOT EXISTS idx_tv_devices_identifier ON public.tv_devices(device_identifier);
    `);
    console.log('✅ Indexes created\n');

    console.log('🔐 Enabling RLS...');
    await client.query(`ALTER TABLE public.tv_devices ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS enabled\n');

    console.log('🔑 Creating RLS policies...');
    await client.query(`
      DROP POLICY IF EXISTS "Vendors manage own devices" ON public.tv_devices;
      CREATE POLICY "Vendors manage own devices"
        ON public.tv_devices FOR ALL
        USING (vendor_id::text = auth.uid()::text);

      DROP POLICY IF EXISTS "Public can register devices" ON public.tv_devices;
      CREATE POLICY "Public can register devices"
        ON public.tv_devices FOR INSERT
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Public can update device status" ON public.tv_devices;
      CREATE POLICY "Public can update device status"
        ON public.tv_devices FOR UPDATE
        USING (true);

      DROP POLICY IF EXISTS "Service role full access tv_devices" ON public.tv_devices;
      CREATE POLICY "Service role full access tv_devices"
        ON public.tv_devices FOR ALL
        USING (auth.jwt()->>'role' = 'service_role');
    `);
    console.log('✅ RLS policies created\n');

    console.log('✅ Granting permissions...');
    await client.query(`
      GRANT ALL ON public.tv_devices TO authenticated, service_role, anon;
    `);
    console.log('✅ Permissions granted\n');

    console.log('✅ tv_devices table recreated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

recreateTable();
