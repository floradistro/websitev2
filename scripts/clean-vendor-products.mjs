import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = '355bed06-13b1-47b2-b3d0-8984c0f291b5';

console.log('\n🧹 CLEANING UP VENDOR PRODUCTS\n');

async function cleanUp() {
  // 1. Update vendor's products to 'published' status
  console.log('1. Publishing vendor products...');
  const { data: updated, error } = await supabase
    .from('products')
    .update({ status: 'published' })
    .eq('vendor_id', VENDOR_ID)
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`   ✅ Updated ${updated.length} products to published\n`);
  }
  
  // 2. Ensure vendor_products links exist
  console.log('2. Ensuring vendor_products links...');
  const { data: products } = await supabase
    .from('products')
    .select('id, wordpress_id, name')
    .eq('vendor_id', VENDOR_ID);
  
  for (const product of products) {
    const { data: link } = await supabase
      .from('vendor_products')
      .select('id')
      .eq('vendor_id', VENDOR_ID)
      .eq('wordpress_product_id', product.wordpress_id)
      .single();
    
    if (!link) {
      await supabase
        .from('vendor_products')
        .insert({
          vendor_id: VENDOR_ID,
          wordpress_product_id: product.wordpress_id,
          status: 'approved'
        });
      console.log(`   ✅ Created link for ${product.name}`);
    }
  }
  
  console.log('\n3. Final status:');
  const { data: final } = await supabase
    .from('products')
    .select('name, status')
    .eq('vendor_id', VENDOR_ID);
  
  final.forEach(p => {
    console.log(`   ${p.name}: ${p.status}`);
  });
  
  console.log('\n✅ Clean up complete!\n');
}

cleanUp();

