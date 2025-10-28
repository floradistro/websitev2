const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Connecting to database...\n');

  const client = new Client({
    host: 'db.uaednwpxursknmwdeejn.supabase.co',
    port: 5432,
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

    // Read migration files
    const migrations = [
      path.join(__dirname, '../supabase/migrations/20251028_promotions_system.sql'),
      path.join(__dirname, '../supabase/migrations/20251028_tv_menu_inventory_integration.sql')
    ];

    for (const migrationPath of migrations) {
      console.log(`📄 Loading ${path.basename(migrationPath)}...`);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`🔧 Executing migration...\n`);

      // Execute the entire SQL
      await client.query(sql);

      console.log(`✅ ${path.basename(migrationPath)} executed successfully!\n`);
    }

    console.log('🎉 All migrations completed!');
    console.log('📊 Systems now active:');
    console.log('   - Promotions system (product, category, tier, global)');
    console.log('   - TV Menu inventory integration');
    console.log('   - Real-time cache sync');
    console.log('   - Product filtering rules\n');

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
