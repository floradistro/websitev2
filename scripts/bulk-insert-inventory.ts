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

// Product name to quantity mapping
const updates = [
  // FLOWER
  { name: 'Blow Pop', qty: 112 },
  { name: 'Bolo Candy', qty: 68 },
  { name: 'Gary Payton', qty: 45 },
  { name: 'Ghost Rider', qty: 113 },
  { name: 'GG4', qty: 73 },
  { name: 'Lava Cake', qty: 12 },
  { name: 'Lemon Runtz', qty: 56 },
  { name: 'Pez Runtz', qty: 109 },
  { name: 'Pink Runtz', qty: 71 },
  { name: 'Pink Soufflé', qty: 73 },
  { name: 'Runtz', qty: 53 },
  { name: 'Super Runtz', qty: 60 },

  // VAPES
  { name: 'Pink Lemonade', qty: 45 },
  { name: 'Orange Candy Crush', qty: 16 },
  { name: 'Sprite', qty: 43 },
  { name: 'Gelato 33', qty: 2 },

  // GUMMIES
  { name: 'Apple Gummies', qty: 10 },
  { name: 'Blueberry Gummies', qty: 1 },
  { name: 'Cherry Gummies', qty: 20 },
  { name: 'Grape Gummies', qty: 15 },
  { name: 'Green Tea Gummies', qty: 9 },
  { name: 'Honey Gummies', qty: 8 },
  { name: 'Raspberry Gummies', qty: 12 },

  // COOKIES
  { name: 'Snickerdoodle Cookies', qty: 20 },
  { name: 'Peanut Butter Cookies', qty: 19 },
  { name: 'Chewy Chocolate Chip', qty: 2 },
  { name: 'Chocolate Chip Cookies', qty: 17 },
  { name: 'Thin Mint Cookies', qty: 3 },
  { name: 'Oreo Cookies', qty: 4 },

  // HASH HOLES
  { name: 'Caramel Delight 2.5g', qty: 9 },
  { name: 'Fire Breath 2.5g', qty: 8 },

  // CONCENTRATES
  { name: 'Fatso', qty: 6 },
  { name: 'Apple Kush', qty: 14 },
  { name: 'Sinmint', qty: 9 },
  { name: 'Mac Cocktail', qty: 7 },

  // HASH HOLES - 1.3g
  { name: 'Kush Mint 1.3g', qty: 7 },
  { name: 'Gas Clay / Gaslicious Clay 1.3g', qty: 6 },
  { name: 'Gummy Bear 1.3g', qty: 6 },

  // HASH HOLES - 2.5g
  { name: 'Sour Diesel 2.5g', qty: 6 },
  { name: 'Grape Gas 2.5g', qty: 8 },
  { name: 'Mellow Flower 2.5g', qty: 10 },
  { name: 'Rocky Road 2.5g', qty: 10 },
];

async function main() {
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;

    for (const { name, qty } of updates) {
      try {
        // First find the product ID
        const productResult = await client.query(
          `SELECT id FROM products WHERE name = $1 AND vendor_id = $2 LIMIT 1`,
          [name, VENDOR_ID]
        );

        if (productResult.rows.length === 0) {
          console.log(`⚠️  Product not found: ${name}`);
          notFoundCount++;
          continue;
        }

        const productId = productResult.rows[0].id;

        // Insert or update inventory
        await client.query(
          `INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (product_id, location_id)
           DO UPDATE SET quantity = $4, updated_at = NOW()`,
          [productId, LOCATION_ID, VENDOR_ID, qty]
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
    console.log(`   ⚠️  Not Found: ${notFoundCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
