const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPricingTables() {
  console.log('Creating pricing tier tables...');
  
  try {
    // Check if tables exist
    const { data: tables, error: tableError } = await supabase
      .from('pricing_tier_blueprints')
      .select('id')
      .limit(1);
    
    if (!tableError) {
      console.log('✅ Pricing tables already exist');
      
      // Check if we have any blueprints
      const { data: blueprints, error: blueprintError } = await supabase
        .from('pricing_tier_blueprints')
        .select('*');
      
      if (blueprints && blueprints.length > 0) {
        console.log(`Found ${blueprints.length} pricing blueprints`);
      } else {
        console.log('No pricing blueprints found, creating sample blueprints...');
        await createSampleBlueprints();
      }
      
      return;
    }
    
    console.log('Tables do not exist, creating them now...');
    
    // Create pricing_tier_blueprints table
    const { error: createBlueprintsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.pricing_tier_blueprints (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          tier_type TEXT DEFAULT 'weight' CHECK (tier_type IN ('weight', 'quantity', 'percentage', 'flat', 'custom')),
          price_breaks JSONB NOT NULL DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          is_default BOOLEAN DEFAULT false,
          display_order INTEGER DEFAULT 0,
          applicable_to_categories UUID[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID REFERENCES public.users(id)
        );
      `
    });
    
    if (createBlueprintsError) {
      console.error('Error creating pricing_tier_blueprints table:', createBlueprintsError);
      // Table might already exist, continue
    }
    
    // Create vendor_pricing_configs table
    const { error: createConfigsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.vendor_pricing_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
          blueprint_id UUID NOT NULL REFERENCES public.pricing_tier_blueprints(id) ON DELETE CASCADE,
          pricing_values JSONB NOT NULL DEFAULT '{}',
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(vendor_id, blueprint_id)
        );
      `
    });
    
    if (createConfigsError) {
      console.error('Error creating vendor_pricing_configs table:', createConfigsError);
      // Table might already exist, continue
    }
    
    // Create product_pricing_assignments table
    const { error: createAssignmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.product_pricing_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
          blueprint_id UUID NOT NULL REFERENCES public.pricing_tier_blueprints(id) ON DELETE CASCADE,
          price_overrides JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          assigned_by UUID REFERENCES public.users(id),
          UNIQUE(product_id, blueprint_id)
        );
      `
    });
    
    if (createAssignmentsError) {
      console.error('Error creating product_pricing_assignments table:', createAssignmentsError);
      // Table might already exist, continue
    }
    
    console.log('✅ Pricing tables created successfully');
    
    // Create sample blueprints
    await createSampleBlueprints();
    
  } catch (error) {
    console.error('Error creating pricing tables:', error);
  }
}

async function createSampleBlueprints() {
  console.log('Creating sample pricing blueprints...');
  
  const blueprints = [
    {
      name: 'Cannabis Flower Weight Tiers',
      slug: 'cannabis-flower-weight',
      description: 'Standard weight-based pricing for cannabis flower products',
      tier_type: 'weight',
      price_breaks: [
        { break_id: '1g', label: '1 gram', qty: 1, unit: 'g', sort_order: 1 },
        { break_id: '3_5g', label: 'Eighth (3.5g)', qty: 3.5, unit: 'g', sort_order: 2 },
        { break_id: '7g', label: 'Quarter (7g)', qty: 7, unit: 'g', sort_order: 3 },
        { break_id: '14g', label: 'Half Ounce (14g)', qty: 14, unit: 'g', sort_order: 4 },
        { break_id: '28g', label: 'Ounce (28g)', qty: 28, unit: 'g', sort_order: 5 }
      ],
      is_active: true,
      is_default: true,
      display_order: 1
    },
    {
      name: 'Concentrate Weight Tiers',
      slug: 'concentrate-weight',
      description: 'Weight-based pricing for concentrates and extracts',
      tier_type: 'weight',
      price_breaks: [
        { break_id: '0_5g', label: '0.5 gram', qty: 0.5, unit: 'g', sort_order: 1 },
        { break_id: '1g', label: '1 gram', qty: 1, unit: 'g', sort_order: 2 },
        { break_id: '2g', label: '2 grams', qty: 2, unit: 'g', sort_order: 3 },
        { break_id: '3_5g', label: '3.5 grams', qty: 3.5, unit: 'g', sort_order: 4 },
        { break_id: '7g', label: '7 grams', qty: 7, unit: 'g', sort_order: 5 }
      ],
      is_active: true,
      display_order: 2
    },
    {
      name: 'Wholesale Quantity Tiers',
      slug: 'wholesale-quantity',
      description: 'Quantity-based discounts for bulk wholesale orders',
      tier_type: 'quantity',
      price_breaks: [
        { break_id: 'tier_1', label: 'Tier 1 (10-49 units)', min_qty: 10, max_qty: 49, sort_order: 1 },
        { break_id: 'tier_2', label: 'Tier 2 (50-99 units)', min_qty: 50, max_qty: 99, sort_order: 2 },
        { break_id: 'tier_3', label: 'Tier 3 (100-249 units)', min_qty: 100, max_qty: 249, sort_order: 3 },
        { break_id: 'tier_4', label: 'Tier 4 (250+ units)', min_qty: 250, max_qty: null, sort_order: 4 }
      ],
      is_active: true,
      display_order: 3
    },
    {
      name: 'Edibles Unit Pricing',
      slug: 'edibles-unit',
      description: 'Per-unit pricing for edible products',
      tier_type: 'quantity',
      price_breaks: [
        { break_id: 'single', label: 'Single Unit', qty: 1, sort_order: 1 },
        { break_id: 'pack_5', label: '5-Pack', qty: 5, sort_order: 2 },
        { break_id: 'pack_10', label: '10-Pack', qty: 10, sort_order: 3 },
        { break_id: 'case_20', label: 'Case (20 units)', qty: 20, sort_order: 4 }
      ],
      is_active: true,
      display_order: 4
    }
  ];
  
  for (const blueprint of blueprints) {
    const { error } = await supabase
      .from('pricing_tier_blueprints')
      .insert(blueprint);
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`Blueprint "${blueprint.name}" already exists, skipping...`);
      } else {
        console.error(`Error creating blueprint "${blueprint.name}":`, error);
      }
    } else {
      console.log(`✅ Created blueprint: ${blueprint.name}`);
    }
  }
  
  console.log('✅ Sample blueprints created successfully');
}

// Run the script
createPricingTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
