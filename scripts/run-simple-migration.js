/**
 * Run Simple TV Menu Migration (no foreign keys initially)
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const tables = [
      {
        name: 'tv_menus',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_menus (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vendor_id UUID NOT NULL,
            location_id UUID,
            name TEXT NOT NULL,
            description TEXT,
            config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            menu_type TEXT DEFAULT 'product_menu' CHECK (menu_type IN ('product_menu', 'advertisement', 'mixed', 'custom')),
            is_active BOOLEAN DEFAULT false,
            is_template BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0,
            subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
            subscription_expires_at TIMESTAMPTZ,
            version INTEGER DEFAULT 1,
            parent_version_id UUID,
            created_by UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_menus_vendor ON public.tv_menus(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_tv_menus_location ON public.tv_menus(location_id);
          CREATE INDEX IF NOT EXISTS idx_tv_menus_active ON public.tv_menus(is_active);
          CREATE INDEX IF NOT EXISTS idx_tv_menus_template ON public.tv_menus(is_template);
          CREATE INDEX IF NOT EXISTS idx_tv_menus_type ON public.tv_menus(menu_type);
        `
      },
      {
        name: 'tv_devices',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_devices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vendor_id UUID NOT NULL,
            location_id UUID NOT NULL,
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
            UNIQUE(vendor_id, location_id, tv_number)
          );

          CREATE INDEX IF NOT EXISTS idx_tv_devices_vendor ON public.tv_devices(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_tv_devices_location ON public.tv_devices(location_id);
          CREATE INDEX IF NOT EXISTS idx_tv_devices_status ON public.tv_devices(connection_status);
          CREATE INDEX IF NOT EXISTS idx_tv_devices_identifier ON public.tv_devices(device_identifier);
        `
      },
      {
        name: 'tv_playlists',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_playlists (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vendor_id UUID NOT NULL,
            location_id UUID,
            name TEXT NOT NULL,
            description TEXT,
            rotation_type TEXT DEFAULT 'sequential' CHECK (rotation_type IN ('sequential', 'random', 'weighted')),
            transition_duration INTEGER DEFAULT 5,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_playlists_vendor ON public.tv_playlists(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_tv_playlists_location ON public.tv_playlists(location_id);
        `
      },
      {
        name: 'tv_playlist_items',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_playlist_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            playlist_id UUID NOT NULL,
            menu_id UUID,
            content_id UUID,
            duration INTEGER DEFAULT 30,
            display_order INTEGER DEFAULT 0,
            weight INTEGER DEFAULT 1,
            conditions JSONB DEFAULT '{}'::jsonb,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_playlist ON public.tv_playlist_items(playlist_id);
          CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_menu ON public.tv_playlist_items(menu_id);
          CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_content ON public.tv_playlist_items(content_id);
          CREATE INDEX IF NOT EXISTS idx_tv_playlist_items_order ON public.tv_playlist_items(display_order);
        `
      },
      {
        name: 'tv_content',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_content (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vendor_id UUID NOT NULL,
            name TEXT NOT NULL,
            content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'html', 'url', 'component')),
            content_url TEXT,
            content_html TEXT,
            content_component TEXT,
            content_data JSONB DEFAULT '{}'::jsonb,
            background_color TEXT,
            duration INTEGER DEFAULT 10,
            start_date TIMESTAMPTZ,
            end_date TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            view_count INTEGER DEFAULT 0,
            click_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_content_vendor ON public.tv_content(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_tv_content_type ON public.tv_content(content_type);
          CREATE INDEX IF NOT EXISTS idx_tv_content_dates ON public.tv_content(start_date, end_date);
        `
      },
      {
        name: 'tv_schedules',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vendor_id UUID NOT NULL,
            location_id UUID,
            name TEXT NOT NULL,
            description TEXT,
            target_menu_id UUID,
            target_playlist_id UUID,
            target_device_ids UUID[],
            target_device_tags TEXT[],
            day_of_week INTEGER[],
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            start_date DATE,
            end_date DATE,
            priority INTEGER DEFAULT 0,
            conditions JSONB DEFAULT '{}'::jsonb,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_schedules_vendor ON public.tv_schedules(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_tv_schedules_location ON public.tv_schedules(location_id);
          CREATE INDEX IF NOT EXISTS idx_tv_schedules_time ON public.tv_schedules(start_time, end_time);
          CREATE INDEX IF NOT EXISTS idx_tv_schedules_dates ON public.tv_schedules(start_date, end_date);
          CREATE INDEX IF NOT EXISTS idx_tv_schedules_priority ON public.tv_schedules(priority);
        `
      },
      {
        name: 'tv_commands',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_commands (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tv_device_id UUID NOT NULL,
            command_type TEXT NOT NULL CHECK (command_type IN (
              'refresh', 'update_theme', 'switch_menu', 'switch_playlist',
              'restart', 'reload', 'clear_cache', 'screenshot', 'update_config'
            )),
            payload JSONB DEFAULT '{}'::jsonb,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
            executed_at TIMESTAMPTZ,
            error_message TEXT,
            expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_commands_device ON public.tv_commands(tv_device_id);
          CREATE INDEX IF NOT EXISTS idx_tv_commands_status ON public.tv_commands(status);
          CREATE INDEX IF NOT EXISTS idx_tv_commands_created ON public.tv_commands(created_at);
        `
      },
      {
        name: 'tv_display_analytics',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tv_display_analytics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tv_menu_id UUID,
            tv_playlist_id UUID,
            tv_content_id UUID,
            tv_device_id UUID,
            vendor_id UUID NOT NULL,
            location_id UUID,
            display_duration INTEGER,
            products_displayed INTEGER,
            categories_displayed TEXT[],
            load_time INTEGER,
            errors_count INTEGER DEFAULT 0,
            session_id TEXT,
            displayed_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tv_analytics_menu ON public.tv_display_analytics(tv_menu_id);
          CREATE INDEX IF NOT EXISTS idx_tv_analytics_playlist ON public.tv_display_analytics(tv_playlist_id);
          CREATE INDEX IF NOT EXISTS idx_tv_analytics_content ON public.tv_display_analytics(tv_content_id);
          CREATE INDEX IF NOT EXISTS idx_tv_analytics_device ON public.tv_display_analytics(tv_device_id);
          CREATE INDEX IF NOT EXISTS idx_tv_analytics_vendor ON public.tv_display_analytics(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_tv_analytics_location ON public.tv_display_analytics(location_id);
          CREATE INDEX IF NOT EXISTS idx_tv_analytics_displayed_at ON public.tv_display_analytics(displayed_at);
        `
      }
    ];

    console.log('📊 Creating tables...\n');

    for (const table of tables) {
      try {
        console.log(`Creating ${table.name}...`);
        await client.query(table.sql);
        console.log(`✅ ${table.name} created`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${table.name} already exists`);
        } else {
          console.error(`❌ ${table.name} error:`, error.message);
        }
      }
    }

    console.log('\n📋 Enabling RLS...\n');

    const rlsTables = ['tv_menus', 'tv_devices', 'tv_playlists', 'tv_playlist_items', 'tv_content', 'tv_schedules', 'tv_commands', 'tv_display_analytics'];

    for (const tableName of rlsTables) {
      try {
        await client.query(`ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`);
        console.log(`✅ RLS enabled on ${tableName}`);
      } catch (error) {
        console.log(`⚠️  RLS on ${tableName}:`, error.message.substring(0, 50));
      }
    }

    console.log('\n🔐 Creating RLS policies...\n');

    const policies = [
      // TV Menus policies
      `DROP POLICY IF EXISTS "Vendors manage own TV menus" ON public.tv_menus;`,
      `CREATE POLICY "Vendors manage own TV menus" ON public.tv_menus FOR ALL USING (vendor_id::text = auth.uid()::text);`,

      `DROP POLICY IF EXISTS "Public can view active menus" ON public.tv_menus;`,
      `CREATE POLICY "Public can view active menus" ON public.tv_menus FOR SELECT USING (is_active = true);`,

      `DROP POLICY IF EXISTS "Service role full access tv_menus" ON public.tv_menus;`,
      `CREATE POLICY "Service role full access tv_menus" ON public.tv_menus FOR ALL USING (auth.jwt()->>'role' = 'service_role');`,

      // Grants
      `GRANT ALL ON public.tv_menus TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_devices TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_playlists TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_playlist_items TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_content TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_schedules TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_commands TO authenticated, service_role, anon;`,
      `GRANT ALL ON public.tv_display_analytics TO authenticated, service_role, anon;`
    ];

    for (const policy of policies) {
      try {
        await client.query(policy);
        console.log(`✅ Policy applied`);
      } catch (error) {
        console.log(`⚠️  Policy:`, error.message.substring(0, 50));
      }
    }

    console.log('\n📊 Verifying tables...\n');

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'tv_%'
      ORDER BY table_name;
    `);

    console.log('TV Menu System Tables:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
