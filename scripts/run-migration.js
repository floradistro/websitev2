const { Client } = require('pg');
const fs = require('fs');

// Connection string - Direct connection (not pooler)
const connectionString = 'postgresql://postgres.uaednwpxursknmwdeejn:SelahEsco123!!@aws-0-us-west-1.pooler.supabase.com:5432/postgres';

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${filePath}`);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`   Executing SQL (${sql.length} characters)...`);

    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Starting migrations...\n');

  const migrations = process.argv.slice(2);

  if (migrations.length === 0) {
    console.log('Usage: node scripts/run-migration.js <path-to-migration.sql>');
    console.log('\nExample:');
    console.log('  node scripts/run-migration.js supabase/migrations/20251028_promotions_system.sql');
    process.exit(1);
  }

  for (const migration of migrations) {
    await runMigration(migration);
  }

  console.log('✨ All migrations complete!');
  process.exit(0);
}

main();
