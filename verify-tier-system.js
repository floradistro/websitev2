const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function verify() {
  console.log('🔍 Verifying Multi-Tier Distribution System Installation...\n');
  
  try {
    // Check if columns exist by querying vendors
    console.log('1️⃣ Checking vendors table for tier columns...');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, store_name, account_tier, access_roles, can_access_distributor_pricing')
      .limit(5);
    
    if (vendorError) {
      console.error('❌ Vendors table check failed:', vendorError.message);
      if (vendorError.message.includes('account_tier') || vendorError.message.includes('access_roles')) {
        console.log('\n⚠️  COLUMNS NOT FOUND!');
        console.log('📋 Please run the SQL migration first:');
        console.log('   1. Open Supabase Dashboard SQL Editor');
        console.log('   2. Run: supabase/migrations/20251024_multi_tier_distribution.sql\n');
        return;
      }
    } else {
      console.log('✅ Vendors table has tier columns');
      if (vendors && vendors.length > 0) {
        console.table(vendors.map(v => ({
          store_name: v.store_name,
          tier: v.account_tier || 'null',
          roles: v.access_roles ? v.access_roles.join(', ') : 'null',
          distributor_access: v.can_access_distributor_pricing ? 'Yes' : 'No'
        })));
      }
    }
    
    // Check Flora Distro specifically
    console.log('\n2️⃣ Checking Flora Distro status...');
    const { data: flora, error: floraError } = await supabase
      .from('vendors')
      .select('store_name, account_tier, access_roles, can_access_distributor_pricing, vendor_type')
      .eq('id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
      .single();
    
    if (flora) {
      console.log('✅ Flora Distro found!');
      console.table([{
        name: flora.store_name,
        tier: flora.account_tier,
        type: flora.vendor_type,
        distributor_access: flora.can_access_distributor_pricing ? 'Yes' : 'No',
        roles: flora.access_roles ? flora.access_roles.join(', ') : 'none'
      }]);
      
      if (flora.account_tier === 1 && flora.can_access_distributor_pricing) {
        console.log('🎉 Flora Distro is correctly configured as Tier 1 Distributor!\n');
      } else {
        console.log('⚠️  Flora Distro needs to be upgraded to Tier 1\n');
      }
    }
    
    // Check pricing blueprints
    console.log('3️⃣ Checking pricing blueprints...');
    const { data: blueprints, error: blueprintError } = await supabase
      .from('pricing_tier_blueprints')
      .select('name, slug, intended_for_tier, minimum_access_tier, requires_distributor_access, is_active')
      .eq('is_active', true)
      .order('display_order');
    
    if (blueprintError) {
      console.error('❌ Blueprints check failed:', blueprintError.message);
    } else if (blueprints) {
      console.log(`✅ Found ${blueprints.length} active pricing blueprints:`);
      console.table(blueprints.map(b => ({
        name: b.name,
        slug: b.slug,
        intended_tier: b.intended_for_tier || 'not set',
        min_tier: b.minimum_access_tier || 'not set',
        requires_approval: b.requires_distributor_access ? 'Yes' : 'No'
      })));
      
      const distributorBlueprint = blueprints.find(b => b.slug === 'distributor-bulk');
      if (distributorBlueprint) {
        console.log('🎉 Distributor Bulk blueprint exists!\n');
      } else {
        console.log('⚠️  Distributor Bulk blueprint not found\n');
      }
    }
    
    // Check products tier visibility
    console.log('4️⃣ Checking products table for tier columns...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('name, minimum_tier_required, distributor_only')
      .limit(5);
    
    if (productError) {
      if (productError.message.includes('minimum_tier_required')) {
        console.log('⚠️  Products table missing tier columns (run migration)\n');
      } else {
        console.error('❌ Products check failed:', productError.message);
      }
    } else {
      console.log('✅ Products table has tier columns\n');
    }
    
    // Check distributor access requests table
    console.log('5️⃣ Checking distributor access requests table...');
    const { data: requests, error: requestError } = await supabase
      .from('distributor_access_requests')
      .select('count', { count: 'exact', head: true });
    
    if (requestError) {
      console.log('⚠️  Distributor access requests table not found (run migration)\n');
    } else {
      console.log('✅ Distributor access requests table exists\n');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const allGood = 
      !vendorError && 
      flora?.account_tier === 1 && 
      blueprints?.some(b => b.slug === 'distributor-bulk') &&
      !productError;
    
    if (allGood) {
      console.log('✅ All systems GO! Multi-tier distribution is installed correctly.');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Configure distributor pricing for Flora Distro');
      console.log('   2. Build frontend components');
      console.log('   3. Test with different tier levels');
    } else {
      console.log('⚠️  Some components missing. Please run the SQL migration:');
      console.log('   supabase/migrations/20251024_multi_tier_distribution.sql');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verify();

