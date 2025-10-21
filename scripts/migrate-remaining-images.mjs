import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n🗑️  REMOVING WORDPRESS IMAGE URLS - SUPABASE ONLY!\n');

async function removeWordPressUrls() {
  try {
    // Update all products to remove WordPress URLs, keep only Supabase Storage
    const { data: products } = await supabase
      .from('products')
      .select('id, name, featured_image, featured_image_storage')
      .not('featured_image', 'is', null);
    
    console.log(`Found ${products.length} products with WordPress image URLs\n`);
    
    let updated = 0;
    let removed = 0;
    
    for (const product of products) {
      if (product.featured_image_storage) {
        // Has Supabase Storage URL, remove WordPress URL
        await supabase
          .from('products')
          .update({ 
            featured_image: null,
            image_gallery: [] 
          })
          .eq('id', product.id);
        
        removed++;
        console.log(`✅ ${product.name} - Using Supabase Storage only`);
      } else {
        // No Supabase Storage URL, keep WordPress URL
        console.log(`⚠️  ${product.name} - Still needs WordPress URL (no Supabase image)`);
        updated++;
      }
    }
    
    console.log(`\n✅ Complete!`);
    console.log(`   Removed WordPress URLs: ${removed}`);
    console.log(`   Kept WordPress URLs: ${updated} (no Supabase alternative)\n`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

removeWordPressUrls();

