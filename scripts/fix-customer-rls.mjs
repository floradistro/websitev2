#!/usr/bin/env node

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

console.log('🚀 Fixing customer RLS policies...\n');

try {
  await client.connect();
  console.log('✅ Connected to database\n');

  // Drop and recreate policies
  console.log('1️⃣ Dropping old policies...');

  await client.query(`DROP POLICY IF EXISTS "Vendors can view all customers" ON public.customers;`);
  await client.query(`DROP POLICY IF EXISTS "Vendors can update customers" ON public.customers;`);
  await client.query(`DROP POLICY IF EXISTS "Vendors can insert customers" ON public.customers;`);
  await client.query(`DROP POLICY IF EXISTS "Anon can view customers" ON public.customers;`);

  console.log('✅ Old policies dropped\n');

  console.log('2️⃣ Creating new policies...');

  // Allow authenticated users (vendors) to view all customers
  await client.query(`
    CREATE POLICY "Vendors can view all customers"
      ON public.customers FOR SELECT
      TO authenticated
      USING (true);
  `);
  console.log('  ✅ View policy created');

  // Allow authenticated users to update customers
  await client.query(`
    CREATE POLICY "Vendors can update customers"
      ON public.customers FOR UPDATE
      TO authenticated
      USING (true);
  `);
  console.log('  ✅ Update policy created');

  // Allow authenticated users to insert customers
  await client.query(`
    CREATE POLICY "Vendors can insert customers"
      ON public.customers FOR INSERT
      TO authenticated
      WITH CHECK (true);
  `);
  console.log('  ✅ Insert policy created');

  // Allow anon users to view customers (for public features)
  await client.query(`
    CREATE POLICY "Anon can view customers"
      ON public.customers FOR SELECT
      TO anon
      USING (true);
  `);
  console.log('  ✅ Anon view policy created\n');

  console.log('✅ All RLS policies updated successfully!\n');

  // Verify by counting customers
  const result = await client.query('SELECT COUNT(*) FROM public.customers;');
  console.log(`📊 Total customers in database: ${result.rows[0].count}\n`);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
