const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Connecting to database...\n');

  const client = new Client({
    host: 'db.uaednwpxursknmwdeejn.supabase.co',
    port: 6543,
    database: 'postgres',
    user: 'postgres.uaednwpxursknmwdeejn',
    password: 'SelahEsco123!!',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_rbac_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Loaded migration file');
    console.log('🔧 Executing RBAC migration...\n');

    // Execute the entire SQL
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');
    console.log('📊 RBAC System is now active:');
    console.log('   - User roles: vendor_admin, manager, employee');
    console.log('   - App permissions table created');
    console.log('   - Location assignments table created');
    console.log('   - Activity logging enabled');
    console.log('   - RLS policies applied\n');

  } catch (error) {
    console.error('❌ Error applying migration:');
    console.error(error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

applyMigration();
