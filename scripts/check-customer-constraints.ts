/**
 * Check customer table constraints and indexes
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'SelahEsco123!!',
  ssl: { rejectUnauthorized: false }
});

async function checkConstraints() {
  await client.connect();

  // Check unique constraints
  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'customers'::regclass
  `);

  console.log('\n📋 Customer Table Constraints:\n');
  constraints.rows.forEach(row => {
    console.log(`${row.conname} (${row.contype}): ${row.definition}`);
  });

  // Check indexes
  const indexes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'customers'
  `);

  console.log('\n📊 Customer Table Indexes:\n');
  indexes.rows.forEach(row => {
    console.log(`${row.indexname}:\n  ${row.indexdef}\n`);
  });

  // Check for duplicates by phone
  const phoneDupes = await client.query(`
    SELECT phone, COUNT(*) as count
    FROM customers
    WHERE phone IS NOT NULL
    GROUP BY phone
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);

  console.log('\n🔍 Duplicate Phone Numbers (Top 10):\n');
  if (phoneDupes.rows.length === 0) {
    console.log('✅ No duplicate phone numbers found!');
  } else {
    phoneDupes.rows.forEach(row => {
      console.log(`  ${row.phone}: ${row.count} customers`);
    });
  }

  // Check for duplicates by email
  const emailDupes = await client.query(`
    SELECT email, COUNT(*) as count
    FROM customers
    WHERE email IS NOT NULL
      AND email NOT LIKE '%@walk-in.local'
      AND email NOT LIKE '%@alpine.local'
    GROUP BY email
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);

  console.log('\n📧 Duplicate Real Emails (Top 10):\n');
  if (emailDupes.rows.length === 0) {
    console.log('✅ No duplicate real emails found!');
  } else {
    emailDupes.rows.forEach(row => {
      console.log(`  ${row.email}: ${row.count} customers`);
    });
  }

  // Check for potential name duplicates
  const nameDupes = await client.query(`
    SELECT first_name, last_name, COUNT(*) as count
    FROM customers
    WHERE first_name IS NOT NULL
      AND last_name IS NOT NULL
    GROUP BY first_name, last_name
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);

  console.log('\n👤 Duplicate Names (Top 10):\n');
  if (nameDupes.rows.length === 0) {
    console.log('✅ No duplicate names found!');
  } else {
    nameDupes.rows.forEach(row => {
      console.log(`  ${row.first_name} ${row.last_name}: ${row.count} customers`);
    });
  }

  await client.end();
}

checkConstraints().catch(console.error);
