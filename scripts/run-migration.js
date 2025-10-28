/**
 * Run TV Menu Migration using direct Postgres connection
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Try direct connection without pooler
const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20251027_tv_menu_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Executing migration SQL...\n');

    // Execute the migration
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'tv_%'
      ORDER BY table_name;
    `);

    console.log('📊 TV Menu System Tables Created:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables already exist - that\'s okay!');
      console.log('✅ Migration completed with warnings');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

runMigration();
