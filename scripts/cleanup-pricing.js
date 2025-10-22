#!/usr/bin/env node
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupPricing() {
  console.log('🧹 Cleaning up all pricing configurations...\n');
  
  const vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro
  
  try {
    // 1. Delete all vendor pricing configs
    console.log('Deleting vendor pricing configurations...');
    const { data: configs, error: configError } = await supabase
      .from('vendor_pricing_configs')
      .delete()
      .eq('vendor_id', vendorId)
      .select();
    
    if (configError) {
      console.error('Error deleting configs:', configError);
    } else {
      console.log(`✅ Deleted ${configs?.length || 0} vendor pricing configurations\n`);
    }

    // 2. Delete all product pricing assignments for this vendor's products
    console.log('Getting vendor products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendorId);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
    } else if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      
      console.log(`Found ${products.length} products, removing pricing assignments...`);
      const { data: assignments, error: assignError } = await supabase
        .from('product_pricing_assignments')
        .delete()
        .in('product_id', productIds)
        .select();
      
      if (assignError) {
        console.error('Error deleting assignments:', assignError);
      } else {
        console.log(`✅ Deleted ${assignments?.length || 0} product pricing assignments\n`);
      }
    }

    // 3. Show available blueprints for reference
    console.log('📋 Available pricing blueprints (for reference):');
    const { data: blueprints } = await supabase
      .from('pricing_tier_blueprints')
      .select('name, slug, tier_type, description')
      .eq('is_active', true)
      .order('display_order');
    
    if (blueprints) {
      blueprints.forEach(bp => {
        console.log(`  - ${bp.name} (${bp.tier_type}): ${bp.description}`);
      });
    }

    console.log('\n✨ Pricing system has been reset to a clean state!');
    console.log('Vendors can now configure their own pricing from scratch.');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

cleanupPricing();