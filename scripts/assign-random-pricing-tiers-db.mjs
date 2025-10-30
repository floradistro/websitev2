#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

const PRICING_TIERS = [
  {
    id: 'a0c471db-a9d4-406a-bd5d-9b9e98bafd4d',
    name: 'Exotic'
  },
  {
    id: '97261244-d8dc-4a68-b710-d98727907d55',
    name: 'Top Shelf'
  },
  {
    id: '53131b33-7947-49f6-838c-f531ee19bb47',
    name: 'Deals'
  }
];

const DB_CONN = `PGPASSWORD="SelahEsco123!!" psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres`;

async function query(sql) {
  const { stdout } = await execAsync(`${DB_CONN} -c "${sql}"`);
  return stdout;
}

async function main() {
  console.log('🎲 Randomly assigning pricing tiers to flower products...\n');

  // Get all products
  const result = await query(`
    SELECT id, name
    FROM products
    WHERE vendor_id = '${VENDOR_ID}'
    ORDER BY name;
  `);

  // Parse the result
  const lines = result.split('\n').filter(line => line.includes('|') && !line.includes('---'));
  const products = lines.slice(1).map(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2 && parts[0].length > 0) {
      return { id: parts[0], name: parts[1] };
    }
    return null;
  }).filter(p => p !== null);

  console.log(`📦 Found ${products.length} products\n`);

  // Filter for flower products
  const flowerProducts = products.filter(p => {
    const name = p.name.toLowerCase();
    return !name.includes('concentrate') &&
           !name.includes('gummy') &&
           !name.includes('vape') &&
           !name.includes('cart') &&
           !name.includes('mg') &&
           !name.includes('cookie') &&
           !name.includes('bulk') &&
           !name.includes('tart') &&
           !name.includes('pie') &&
           !name.includes('bros') &&
           p.name.trim().length > 3 &&
           p.name.trim().length < 100;
  });

  console.log(`🌸 Filtered to ${flowerProducts.length} flower products\n`);

  // Randomly assign pricing tiers
  let counts = { exotic: 0, topShelf: 0, deals: 0 };

  for (const product of flowerProducts) {
    // Randomly pick a tier (0, 1, or 2)
    const randomIndex = Math.floor(Math.random() * PRICING_TIERS.length);
    const tier = PRICING_TIERS[randomIndex];

    try {
      // Insert pricing assignment (upsert)
      await query(`
        INSERT INTO product_pricing_assignments (product_id, blueprint_id, price_overrides, is_active)
        VALUES ('${product.id}', '${tier.id}', '{}', true)
        ON CONFLICT (product_id, blueprint_id)
        DO UPDATE SET is_active = true;
      `);

      console.log(`✅ ${product.name} → ${tier.name}`);

      if (randomIndex === 0) counts.exotic++;
      else if (randomIndex === 1) counts.topShelf++;
      else counts.deals++;

    } catch (error) {
      console.error(`❌ Error assigning ${product.name}:`, error.message);
    }
  }

  console.log('\n\n📊 Assignment Summary:');
  console.log(`🔥 Exotic: ${counts.exotic} products`);
  console.log(`⭐ Top Shelf: ${counts.topShelf} products`);
  console.log(`💰 Deals: ${counts.deals} products`);
  console.log(`\n✨ Total: ${counts.exotic + counts.topShelf + counts.deals} products assigned`);
  console.log('\n🎬 Refresh your TV display to see the pricing!');
}

main().catch(console.error);
