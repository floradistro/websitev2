/**
 * Merge duplicate Fahad Khan accounts
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

async function mergeDuplicates() {
  await client.connect();

  console.log('\n🔍 Finding Fahad Khan duplicates...\n');

  // Find all Fahad Khan accounts
  const result = await client.query(`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      loyalty_points,
      total_spent,
      total_orders,
      created_at
    FROM customers
    WHERE first_name ILIKE 'Fahad'
      AND last_name ILIKE 'Khan'
      AND first_name NOT ILIKE '%Farooq%'
    ORDER BY loyalty_points DESC, created_at ASC
  `);

  console.log(`Found ${result.rows.length} "Fahad Khan" accounts:\n`);

  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ID: ${row.id}`);
    console.log(`   Created: ${row.created_at}`);
    console.log(`   Email: ${row.email || 'none'}`);
    console.log(`   Phone: ${row.phone || 'none'}`);
    console.log(`   Points: ${row.loyalty_points}`);
    console.log(`   Spent: $${row.total_spent}`);
    console.log(`   Orders: ${row.total_orders}\n`);
  });

  if (result.rows.length <= 1) {
    console.log('✅ No duplicates to merge!');
    await client.end();
    return;
  }

  // PRIMARY account = highest points (most active)
  const primary = result.rows[0];
  const duplicates = result.rows.slice(1);

  console.log(`\n📌 PRIMARY ACCOUNT (keeping this one):`);
  console.log(`   ID: ${primary.id}`);
  console.log(`   Points: ${primary.loyalty_points}`);
  console.log(`   Email: ${primary.email}`);
  console.log(`   Phone: ${primary.phone}\n`);

  console.log(`🔄 MERGING ${duplicates.length} duplicate(s)...\n`);

  for (const dup of duplicates) {
    console.log(`\n   Merging account ${dup.id}...`);

    // Reassign orders
    const ordersResult = await client.query(`
      UPDATE orders
      SET customer_id = $1
      WHERE customer_id = $2
      RETURNING id
    `, [primary.id, dup.id]);
    console.log(`   ✅ Reassigned ${ordersResult.rowCount} orders`);

    // Reassign loyalty transactions
    const loyaltyResult = await client.query(`
      UPDATE loyalty_transactions
      SET customer_id = $1
      WHERE customer_id = $2
      RETURNING id
    `, [primary.id, dup.id]);
    console.log(`   ✅ Reassigned ${loyaltyResult.rowCount} loyalty transactions`);

    // Add points/spend to primary
    await client.query(`
      UPDATE customers
      SET
        loyalty_points = loyalty_points + $1,
        total_spent = total_spent + $2,
        total_orders = total_orders + $3
      WHERE id = $4
    `, [dup.loyalty_points, dup.total_spent, dup.total_orders, primary.id]);
    console.log(`   ✅ Added ${dup.loyalty_points} points, $${dup.total_spent} spent`);

    // Soft delete duplicate
    await client.query(`
      UPDATE customers
      SET
        is_active = false,
        email = 'merged.' || id || '@deleted.local'
      WHERE id = $1
    `, [dup.id]);
    console.log(`   ✅ Soft-deleted duplicate account`);
  }

  // Get final primary account state
  const finalResult = await client.query(`
    SELECT
      id,
      email,
      phone,
      loyalty_points,
      total_spent,
      total_orders
    FROM customers
    WHERE id = $1
  `, [primary.id]);

  const final = finalResult.rows[0];

  console.log('\n' + '='.repeat(60));
  console.log('✅ MERGE COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 FINAL ACCOUNT STATE:`);
  console.log(`   ID: ${final.id}`);
  console.log(`   Email: ${final.email}`);
  console.log(`   Phone: ${final.phone}`);
  console.log(`   Points: ${final.loyalty_points}`);
  console.log(`   Total Spent: $${final.total_spent}`);
  console.log(`   Total Orders: ${final.total_orders}\n`);

  await client.end();
}

mergeDuplicates().catch(console.error);
