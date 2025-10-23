const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function addColumns() {
  console.log('🔄 Phase 1: Adding tier columns...\n');
  
  try {
    // Add columns to vendors
    const vendorUpdates = [
      { id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf', account_tier: 1, access_roles: ['distributor', 'wholesaler', 'vendor'], can_access_distributor_pricing: true }
    ];
    
    console.log('📝 Updating vendors table with sample data first...');
    for (const update of vendorUpdates) {
      const { error } = await supabase
        .from('vendors')
        .update(update)
        .eq('id', update.id);
      
      if (error) {
        console.log(`⚠️  Note: ${error.message} (columns may not exist yet)`);
      } else {
        console.log(`✅ Updated ${update.id}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Migration needed: ${error.message}`);
  }
  
  console.log('\n⚠️  Column additions require SQL migration.');
  console.log('📋 Please run the following SQL in Supabase Dashboard SQL Editor:\n');
  console.log('==================================================\n');
  console.log(`
-- Add tier columns to vendors
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS account_tier INTEGER DEFAULT 3 CHECK (account_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS access_roles TEXT[] DEFAULT ARRAY['vendor'],
  ADD COLUMN IF NOT EXISTS can_access_distributor_pricing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributor_access_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distributor_access_approved_by UUID;

-- Add tier columns to customers  
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS account_tier INTEGER DEFAULT 3 CHECK (account_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS access_roles TEXT[] DEFAULT ARRAY['customer'];

-- Add tier columns to pricing blueprints
ALTER TABLE public.pricing_tier_blueprints
  ADD COLUMN IF NOT EXISTS intended_for_tier INTEGER DEFAULT 3 CHECK (intended_for_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS minimum_access_tier INTEGER DEFAULT 3 CHECK (minimum_access_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS requires_distributor_access BOOLEAN DEFAULT false;

-- Add tier columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS minimum_tier_required INTEGER DEFAULT 3 CHECK (minimum_tier_required IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS distributor_only BOOLEAN DEFAULT false;
  `);
  console.log('\n==================================================\n');
  console.log('✅ After running above SQL, run: node apply-tier-migration-part2.js\n');
}

addColumns();

