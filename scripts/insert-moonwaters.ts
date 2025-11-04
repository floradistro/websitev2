#!/usr/bin/env tsx

import { Client } from 'pg';

const DB_CONFIG = {
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'SelahEsco123!!',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro
const LOCATION_ID = '8cb9154e-c89c-4f5e-b751-74820e348b8a'; // Charlotte Monroe

// Moonwaters by product ID (from earlier query)
const moonwaters = [
  // 5mg DAY DRINKER
  { id: 'b77dd445-bb34-4719-a50e-19ee89df8345', name: 'Clementine Orange 5mg', qty: 72 },
  { id: 'ab6b9111-4fa0-4f10-a00a-c8fb230fc452', name: 'Fizzy Punch 5mg', qty: 27 },
  { id: '89ec0554-4b91-4efa-948a-fda63d0de6c3', name: 'Fizzy Lemonade 5mg', qty: 23 },
  { id: 'ead53e13-6890-4cc4-bc58-e85148812db8', name: 'Lemon Ginger 5mg', qty: 44 },

  // 10mg GOLDEN HOUR
  { id: 'c2186e96-3a18-4681-8a26-c396a80788d7', name: 'Clementine Orange 10mg', qty: 18 },
  { id: '334a3477-f467-4865-828a-8b34f1a81296', name: 'Fizzy Punch 10mg', qty: 23 },
  { id: '15dfdcab-7b8c-4dcc-96b9-302395d56c17', name: 'Fizzy Lemonade 10mg', qty: 20 },
  { id: 'f5d8e194-b4ca-4eb7-b7ef-243f11d3bbb6', name: 'Lemon Ginger 10mg', qty: 11 },
  { id: '26ee237b-101a-4f0d-a2c6-814e41933eb2', name: 'Berry Twist 10mg', qty: 5 },

  // 30mg DARKSIDE - need to find these, let me check for 30mg
];

async function main() {
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    // First find the 30mg products
    const result30mg = await client.query(
      `SELECT id, name, SUBSTRING(description, 1, 50) as desc
       FROM products
       WHERE vendor_id = $1
       AND name IN ('Clementine Orange', 'Fizzy Punch', 'Fizzy Lemonade', 'Lemon Ginger')
       AND description ILIKE '%30%mg%'
       ORDER BY name`,
      [VENDOR_ID]
    );

    console.log('30mg products found:');
    const moonwaters30mg = [
      { id: '', name: 'Clementine Orange 30mg', qty: 18 },
      { id: '', name: 'Fizzy Punch 30mg', qty: 11 },
      { id: '', name: 'Fizzy Lemonade 30mg', qty: 35 },
      { id: '', name: 'Lemon Ginger 30mg', qty: 27 },
    ];

    for (const row of result30mg.rows) {
      console.log(`  ${row.name}: ${row.id}`);
      const match = moonwaters30mg.find(m => m.name.includes(row.name));
      if (match) {
        match.id = row.id;
      }
    }
    console.log('');

    const allMoonwaters = [...moonwaters, ...moonwaters30mg.filter(m => m.id)];

    let successCount = 0;
    let errorCount = 0;

    for (const { id, name, qty } of allMoonwaters) {
      try {
        await client.query(
          `INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (product_id, location_id)
           DO UPDATE SET quantity = $4, updated_at = NOW()`,
          [id, LOCATION_ID, VENDOR_ID, qty]
        );

        console.log(`✅ ${name}: ${qty}`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Error updating ${name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
