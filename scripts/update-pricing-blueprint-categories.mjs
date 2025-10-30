/**
 * Update pricing tier blueprints with applicable categories
 * 
 * This script assigns category IDs to pricing blueprints so they only
 * show for relevant product categories:
 * - Retail Flower templates → Flower category
 * - Retail Edibles → Edibles/Edible categories  
 * - Retail Vape → Vape/Vapes categories
 * - Retail Concentrate → Concentrate/Concentrates categories
 */

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'SelahEsco123!!',
  database: 'postgres'
});

async function updatePricingBlueprintCategories() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Update Retail Flower blueprints
    await client.query(`
      UPDATE pricing_tier_blueprints
      SET applicable_to_categories = ARRAY['3ac166a6-3cc0-4663-91b0-9e155dcc797b']::uuid[]
      WHERE name LIKE 'Retail Flower%'
    `);
    console.log('✅ Updated Retail Flower blueprints');

    // Update Retail Edibles
    await client.query(`
      UPDATE pricing_tier_blueprints
      SET applicable_to_categories = ARRAY['40c8d3b1-ba5e-4179-94c2-9804b958eb9d', 'f46894c2-6053-4117-96c4-651aa409c799']::uuid[]
      WHERE name = 'Retail Edibles'
    `);
    console.log('✅ Updated Retail Edibles blueprint');

    // Update Retail Vape
    await client.query(`
      UPDATE pricing_tier_blueprints
      SET applicable_to_categories = ARRAY['e78c3335-03d0-4723-b1f0-ba87eab72bb1', '7f37a372-6306-4589-ae98-5433c53a6a0e']::uuid[]
      WHERE name = 'Retail Vape'
    `);
    console.log('✅ Updated Retail Vape blueprint');

    // Update Retail Concentrate
    await client.query(`
      UPDATE pricing_tier_blueprints
      SET applicable_to_categories = ARRAY['104a6cf2-cac3-451a-bca6-5bb881d1f38d', '22b5f95e-8470-4733-bc11-9de34f954202']::uuid[]
      WHERE name = 'Retail Concentrate'
    `);
    console.log('✅ Updated Retail Concentrate blueprint');

    // Verify updates
    const result = await client.query(`
      SELECT name, applicable_to_categories 
      FROM pricing_tier_blueprints 
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log('\n📊 Current pricing blueprint categories:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.applicable_to_categories.length} categories`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n✅ Done');
  }
}

updatePricingBlueprintCategories();
