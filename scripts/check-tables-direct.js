#!/usr/bin/env node
const { Pool } = require('pg');

const connectionString = `postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  console.log('🔍 Checking which wholesale tables exist in database...\n');

  const tables = [
    'suppliers',
    'wholesale_customers',
    'purchase_orders',
    'purchase_order_items',
    'purchase_order_payments',
    'inventory_reservations'
  ];

  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);

      if (exists) {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   → ${countResult.rows[0].count} rows`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    }
  }

  await pool.end();
}

checkTables().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
