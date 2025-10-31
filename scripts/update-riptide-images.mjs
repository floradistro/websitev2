#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase setup
const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const CATALOG_PATH = '/Users/whale/Downloads/MOONWATER CATELOG/MOONWATER CATELOG';

// Upload file to Supabase storage
async function uploadFile(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

  const { data, error } = await supabase.storage
    .from('vendor-product-images')
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: '3600'
    });

  if (error) {
    console.error(`❌ Upload failed for ${fileName}:`, error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('vendor-product-images')
    .getPublicUrl(storagePath);

  return publicUrl;
}

async function updateRiptideProducts() {
  console.log('🌙 Updating RIPTIDE Products with Images...\n');

  const riptidePath = path.join(CATALOG_PATH, '60MG RIPTIDE ');
  const flavorFolders = fs.readdirSync(riptidePath).filter(f =>
    fs.statSync(path.join(riptidePath, f)).isDirectory() && !f.startsWith('.')
  );

  for (const flavorFolder of flavorFolders) {
    const flavorPath = path.join(riptidePath, flavorFolder);
    const flavor = flavorFolder.replace(/_/g, ' ').trim();
    const productName = `Moonwater 60mg ${flavor} - RIPTIDE`;
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    console.log(`\n📝 ${productName}`);

    // Find product images
    let imageDir = path.join(flavorPath, 'PRODUCT IMAGE');
    if (!fs.existsSync(imageDir)) {
      imageDir = path.join(flavorPath, 'PRODUCT IMAGES');
    }

    let productImages = [];

    if (fs.existsSync(imageDir)) {
      const imageFiles = fs.readdirSync(imageDir)
        .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
        .sort();

      for (const imageFile of imageFiles) {
        const imagePath = path.join(imageDir, imageFile);
        const storagePath = `${VENDOR_ID}/moonwater/${slug}-${imageFile}`;
        const url = await uploadFile(imagePath, storagePath);
        if (url) {
          productImages.push(url);
          console.log(`   ✅ Uploaded: ${imageFile}`);
        }
      }
    }

    // Update product in database
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        featured_image_storage: productImages[0] || null,
        image_gallery_storage: productImages
      })
      .eq('vendor_id', VENDOR_ID)
      .eq('slug', slug)
      .select();

    if (updateError) {
      console.error(`   ❌ Error updating product:`, updateError.message);
    } else {
      console.log(`   ✅ Product updated with ${productImages.length} images`);
    }
  }

  console.log('\n✅ Riptide products updated!\n');
}

updateRiptideProducts();
