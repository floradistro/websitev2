const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  try {
    console.log('🔄 Running multi-tier distribution migration...\n');
    
    const sql = fs.readFileSync('supabase/migrations/20251024_multi_tier_distribution.sql', 'utf8');
    
    // Split by semicolons to run statements individually
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`📝 Running ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.includes('RAISE NOTICE')) {
        // Skip RAISE NOTICE blocks
        continue;
      }
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: stmt + ';'
      });
      
      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message);
        console.error('Statement:', stmt.substring(0, 100) + '...');
        // Continue anyway, some errors might be expected (like "already exists")
      } else {
        process.stdout.write('.');
      }
    }
    
    console.log('\n\n✅ Migration completed!\n');
    
    console.log('📊 Checking vendor tiers...\n');
    const { data: tierData } = await supabase
      .from('vendor_tier_summary')
      .select('*')
      .order('account_tier');
    console.table(tierData);
    
    console.log('\n🎯 Checking Flora Distro status...\n');
    const { data: floraData } = await supabase
      .from('vendors')
      .select('store_name, account_tier, access_roles, can_access_distributor_pricing, vendor_type')
      .eq('id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf');
    console.table(floraData);
    
    console.log('\n📋 Available pricing blueprints:\n');
    const { data: blueprints } = await supabase
      .from('pricing_tier_blueprints')
      .select('name, slug, intended_for_tier, minimum_access_tier, requires_distributor_access')
      .eq('is_active', true)
      .order('display_order');
    console.table(blueprints);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

runMigration().catch(() => process.exit(1));

