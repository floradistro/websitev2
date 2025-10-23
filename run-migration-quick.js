const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.uaednwpxursknmwdeejn',
  password: 'SelahEsco123!!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');
    
    const sql = fs.readFileSync('supabase/migrations/20251024_multi_tier_distribution.sql', 'utf8');
    
    console.log('🔄 Running multi-tier distribution migration...\n');
    
    await client.query(sql);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Checking vendor tiers...\n');
    
    const result = await client.query('SELECT * FROM public.vendor_tier_summary ORDER BY account_tier');
    console.table(result.rows);
    
    console.log('\n🎯 Checking Flora Distro status...\n');
    const flora = await client.query(`
      SELECT 
        store_name,
        account_tier,
        access_roles,
        can_access_distributor_pricing,
        vendor_type
      FROM public.vendors 
      WHERE id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
    `);
    console.table(flora.rows);
    
    console.log('\n📋 Available pricing blueprints:\n');
    const blueprints = await client.query(`
      SELECT 
        name,
        slug,
        intended_for_tier,
        minimum_access_tier,
        requires_distributor_access
      FROM public.pricing_tier_blueprints
      WHERE is_active = true
      ORDER BY display_order
    `);
    console.table(blueprints.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(() => process.exit(1));

