import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  errors: 0
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║      🖼️  IMAGE MIGRATION TO SUPABASE STORAGE 🖼️                 ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function migrateImages() {
  try {
    console.log('📥 Fetching products from Supabase...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, wordpress_id, name, featured_image, image_gallery');
    
    if (error) throw error;
    
    stats.total = products.length;
    console.log(`✅ Found ${products.length} products\n`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      console.log(`[${i + 1}/${products.length}] ${product.name}`);
      
      try {
        // Skip if no featured image
        if (!product.featured_image) {
          console.log(`   ⏭️  No featured image`);
          stats.skipped++;
          continue;
        }
        
        // Check if already migrated
        if (product.featured_image.includes('supabase.co')) {
          console.log(`   ⏭️  Already migrated`);
          stats.skipped++;
          continue;
        }
        
        // Download image from WordPress
        const imageUrl = product.featured_image;
        const imageExt = imageUrl.split('.').pop().split('?')[0];
        const fileName = `${product.wordpress_id || product.id}.${imageExt}`;
        const storagePath = `featured/${fileName}`;
        
        console.log(`   📥 Downloading: ${imageUrl.substring(0, 60)}...`);
        
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        // Upload to Supabase Storage
        console.log(`   📤 Uploading to Supabase...`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(storagePath, imageResponse.data, {
            contentType: imageResponse.headers['content-type'] || `image/${imageExt}`,
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          if (uploadError.message.includes('already exists')) {
            console.log(`   ⏭️  Already exists in storage`);
          } else {
            throw uploadError;
          }
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(storagePath);
        
        // Update product record
        const { error: updateError } = await supabase
          .from('products')
          .update({
            featured_image_storage: publicUrl,
            // Keep old URL as backup
            featured_image: product.featured_image
          })
          .eq('id', product.id);
        
        if (updateError) throw updateError;
        
        stats.migrated++;
        console.log(`   ✅ Migrated to: ${publicUrl.substring(0, 60)}...`);
        
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✅ Image migration complete!');
    console.log(`   Migrated: ${stats.migrated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

async function main() {
  try {
    await migrateImages();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║                   🎉 MIGRATION COMPLETE! 🎉                     ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 FINAL STATISTICS:');
    console.log(`   Total products: ${stats.total}`);
    console.log(`   Migrated: ${stats.migrated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}\n`);
    
    console.log('✨ All product images are now in Supabase Storage!');
    console.log('🔗 View: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/storage/buckets/product-images\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

