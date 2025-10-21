import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = '355bed06-13b1-47b2-b3d0-8984c0f291b5'; // duck vendor

console.log('\n🔧 AUTO-CREATING INVENTORY FOR VENDOR PRODUCTS\n');

async function createInventoryForVendor() {
  try {
    // Get vendor's products
    const { data: products } = await supabase
      .from('products')
      .select('id, wordpress_id, name')
      .eq('vendor_id', VENDOR_ID);
    
    console.log(`Found ${products.length} vendor products\n`);
    
    // Get vendor's warehouse location
    const { data: location } = await supabase
      .from('locations')
      .select('id, name')
      .eq('vendor_id', VENDOR_ID)
      .eq('type', 'vendor')
      .limit(1)
      .single();
    
    if (!location) {
      console.log('❌ No vendor warehouse found. Creating one...');
      
      const { data: newLocation } = await supabase
        .from('locations')
        .insert({
          name: 'Duck Vendor Warehouse',
          slug: 'duck-warehouse',
          type: 'vendor',
          vendor_id: VENDOR_ID,
          city: 'Test City',
          state: 'NC',
          is_active: true
        })
        .select()
        .single();
      
      console.log(`✅ Created warehouse: ${newLocation.name}\n`);
      location = newLocation;
    } else {
      console.log(`✅ Using warehouse: ${location.name}\n`);
    }
    
    // Create inventory for each product
    for (const product of products) {
      // Check if inventory already exists
      const { data: existing } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', product.wordpress_id)
        .eq('location_id', location.id)
        .single();
      
      if (existing) {
        console.log(`⏭️  ${product.name} - Already has inventory`);
        continue;
      }
      
      // Create inventory
      const { data: inv, error } = await supabase
        .from('inventory')
        .insert({
          product_id: product.wordpress_id,
          location_id: location.id,
          vendor_id: VENDOR_ID,
          quantity: 0,
          low_stock_threshold: 10,
          notes: 'Auto-created for vendor product'
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ ${product.name} - Error: ${error.message}`);
      } else {
        console.log(`✅ ${product.name} - Inventory created (ID: ${inv.id.substring(0, 8)}...)`);
      }
    }
    
    console.log('\n✅ Complete! Vendor can now manage inventory.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createInventoryForVendor();

