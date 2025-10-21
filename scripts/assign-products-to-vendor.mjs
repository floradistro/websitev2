import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = '355bed06-13b1-47b2-b3d0-8984c0f291b5'; // duck vendor
const VENDOR_WP_USER_ID = 163; // duck's WordPress user ID

console.log('\n🔗 ASSIGNING PRODUCTS TO VENDOR\n');

async function assignProductsToVendor() {
  try {
    // Find products that belong to this vendor in WordPress (author = 163)
    const productNames = ['quck', 'sunshine', 'hi', 'dog pe'];
    
    for (const name of productNames) {
      const { data: products } = await supabase
        .from('products')
        .select('id, wordpress_id, name, vendor_id')
        .ilike('name', `%${name}%`)
        .limit(1);
      
      if (products && products.length > 0) {
        const product = products[0];
        
        // Assign to vendor
        const { error } = await supabase
          .from('products')
          .update({ vendor_id: VENDOR_ID })
          .eq('id', product.id);
        
        if (error) {
          console.log(`❌ ${product.name} - Error: ${error.message}`);
        } else {
          console.log(`✅ ${product.name} - Assigned to vendor`);
          
          // Create vendor_products link
          await supabase
            .from('vendor_products')
            .insert({
              vendor_id: VENDOR_ID,
              wordpress_product_id: product.wordpress_id,
              status: 'approved'
            })
            .select();
        }
      } else {
        console.log(`⚠️  ${name} - Not found in Supabase`);
      }
    }
    
    console.log('\n✅ Products assigned! Refresh vendor inventory page.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

assignProductsToVendor();

