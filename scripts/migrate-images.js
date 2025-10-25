#!/usr/bin/env node
/**
 * Migrate legacy product images to Flora Distro vendor bucket
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function main() {
  console.log('='.repeat(80));
  console.log('MIGRATING PRODUCT IMAGES TO FLORA DISTRO');
  console.log('='.repeat(80));
  
  // List legacy images
  const { data: legacyImages, error: listError } = await supabase
    .storage
    .from('product-images')
    .list('featured');
  
  if (listError) {
    console.error('❌ Error listing images:', listError);
    return;
  }
  
  console.log(`\n📂 Found ${legacyImages.length} legacy images`);
  console.log(`\n🔄 Migrating to vendor-product-images/${FLORA_VENDOR_ID}/...\n`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const image of legacyImages) {
    try {
      const sourcePath = `featured/${image.name}`;
      const destPath = `${FLORA_VENDOR_ID}/${image.name}`;
      
      // Download from source
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('product-images')
        .download(sourcePath);
      
      if (downloadError) {
        console.error(`❌ Download failed: ${sourcePath}`);
        errors++;
        continue;
      }
      
      // Upload to destination
      const { error: uploadError } = await supabase
        .storage
        .from('vendor-product-images')
        .upload(destPath, fileData, {
          contentType: image.metadata?.mimetype || 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`❌ Upload failed: ${destPath} - ${uploadError.message}`);
        errors++;
        continue;
      }
      
      migrated++;
      if (migrated % 10 === 0) {
        console.log(`   ${migrated}/${legacyImages.length} migrated...`);
      }
      
    } catch (e) {
      console.error(`❌ Error: ${e.message}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Migration complete:`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${legacyImages.length}`);
}

main();

