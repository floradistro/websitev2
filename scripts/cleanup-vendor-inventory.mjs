import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = '355bed06-13b1-47b2-b3d0-8984c0f291b5';

console.log('\n🧹 CLEANING UP VENDOR INVENTORY\n');

async function cleanup() {
  // 1. Get vendor's actual products
  const { data: vendorProducts } = await supabase
    .from('products')
    .select('wordpress_id, name')
    .eq('vendor_id', VENDOR_ID);
  
  const vendorProductIds = vendorProducts.map(p => p.wordpress_id);
  console.log(`Vendor owns: ${vendorProducts.map(p => p.name).join(', ')}`);
  console.log(`Product IDs: ${vendorProductIds.join(', ')}\n`);
  
  // 2. Get all inventory assigned to vendor
  const { data: allInventory } = await supabase
    .from('inventory')
    .select('id, product_id, quantity')
    .eq('vendor_id', VENDOR_ID);
  
  console.log(`Found ${allInventory.length} inventory records\n`);
  
  // 3. Delete inventory that doesn't match vendor's products
  let deleted = 0;
  for (const inv of allInventory) {
    if (!vendorProductIds.includes(inv.product_id)) {
      console.log(`❌ Deleting: product_id ${inv.product_id} (not vendor's product)`);
      await supabase
        .from('inventory')
        .delete()
        .eq('id', inv.id);
      deleted++;
    } else {
      console.log(`✅ Keeping: product_id ${inv.product_id} (vendor's product)`);
    }
  }
  
  console.log(`\n🧹 Deleted ${deleted} invalid records`);
  console.log(`✅ Kept ${allInventory.length - deleted} valid records\n`);
}

cleanup();

