#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase setup
const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Flora Distro vendor ID
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const CATALOG_PATH = '/Users/whale/Downloads/MOONWATER CATELOG/MOONWATER CATELOG';

// Get Beverages category ID
async function getBeveragesCategoryId() {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('vendor_id', VENDOR_ID)
    .eq('slug', 'beverages')
    .single();

  if (error) {
    console.error('❌ Error fetching Beverages category:', error);
    throw error;
  }

  return data.id;
}

// Upload file to Supabase storage
async function uploadFile(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  if (ext === '.pdf') contentType = 'application/pdf';

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

// Parse product from folder structure
function parseProduct(dosageFolder, flavorFolder) {
  // Extract dosage from folder name (e.g., "10MG GOLDEN HOUR " -> "10mg")
  const dosageMatch = dosageFolder.match(/(\d+)MG/);
  const dosage = dosageMatch ? `${dosageMatch[1]}mg` : '';

  // Extract line name (e.g., "GOLDEN HOUR", "DARKSIDE", "RIPTIDE")
  let lineName = dosageFolder.replace(/\d+MG\s*/i, '').trim();

  // Clean up flavor name
  const flavor = flavorFolder.replace(/_/g, ' ').trim();

  // Product name: "Moonwater [Dosage] [Flavor] - [Line]"
  let productName = `Moonwater ${dosage} ${flavor}`;
  if (lineName) {
    productName += ` - ${lineName}`;
  }

  return {
    name: productName,
    dosage,
    flavor,
    lineName,
    slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };
}

// Main import function
async function importMoonwaterCatalog() {
  console.log('🌙 Starting MOONWATER Catalog Import...\n');

  try {
    // Get Beverages category
    console.log('📂 Fetching Beverages category...');
    const categoryId = await getBeveragesCategoryId();
    console.log(`✅ Beverages category ID: ${categoryId}\n`);

    const dosageFolders = fs.readdirSync(CATALOG_PATH).filter(f =>
      fs.statSync(path.join(CATALOG_PATH, f)).isDirectory() && !f.startsWith('.')
    );

    console.log(`📦 Found ${dosageFolders.length} dosage categories:\n`);
    dosageFolders.forEach(d => console.log(`   - ${d}`));
    console.log('');

    let totalProducts = 0;
    let successCount = 0;
    let failCount = 0;

    // Process each dosage folder
    for (const dosageFolder of dosageFolders) {
      const dosagePath = path.join(CATALOG_PATH, dosageFolder);
      const flavorFolders = fs.readdirSync(dosagePath).filter(f =>
        fs.statSync(path.join(dosagePath, f)).isDirectory() && !f.startsWith('.')
      );

      console.log(`\n🔵 Processing ${dosageFolder} (${flavorFolders.length} flavors)...\n`);

      // Process each flavor
      for (const flavorFolder of flavorFolders) {
        totalProducts++;
        const flavorPath = path.join(dosagePath, flavorFolder);
        const product = parseProduct(dosageFolder, flavorFolder);

        console.log(`   📝 ${product.name}`);

        try {
          // Find product images (check both "PRODUCT IMAGE" and "PRODUCT IMAGES")
          let imageDir = path.join(flavorPath, 'PRODUCT IMAGE');
          if (!fs.existsSync(imageDir)) {
            imageDir = path.join(flavorPath, 'PRODUCT IMAGES');
          }

          let productImages = [];

          if (fs.existsSync(imageDir)) {
            const imageFiles = fs.readdirSync(imageDir)
              .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
              .sort(); // Sort to get consistent ordering

            for (const imageFile of imageFiles) {
              const imagePath = path.join(imageDir, imageFile);
              const storagePath = `${VENDOR_ID}/moonwater/${product.slug}-${imageFile}`;
              const url = await uploadFile(imagePath, storagePath);
              if (url) {
                productImages.push(url);
                console.log(`      ✅ Uploaded: ${imageFile}`);
              }
            }
          }

          // Find COA PDF
          const coaDir = path.join(flavorPath, 'COA');
          let coaUrl = null;

          if (fs.existsSync(coaDir)) {
            const coaFiles = fs.readdirSync(coaDir).filter(f => /\.pdf$/i.test(f));
            if (coaFiles.length > 0) {
              const coaPath = path.join(coaDir, coaFiles[0]);
              const storagePath = `${VENDOR_ID}/moonwater/coa/${product.slug}-coa.pdf`;
              coaUrl = await uploadFile(coaPath, storagePath);
              if (coaUrl) {
                console.log(`      ✅ Uploaded COA: ${coaFiles[0]}`);
              }
            }
          }

          // Create product in database
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              vendor_id: VENDOR_ID,
              name: product.name,
              slug: product.slug,
              primary_category_id: categoryId,
              type: 'simple',
              status: 'published',
              product_visibility: 'internal',
              sku: `MOON-${product.slug.toUpperCase()}`,
              description: `${product.flavor} flavor beverage with ${product.dosage} THC`,
              featured_image_storage: productImages[0] || null,
              image_gallery_storage: productImages,
              meta_data: {
                dosage: product.dosage,
                flavor: product.flavor,
                line: product.lineName,
                coa_url: coaUrl
              },
              manage_stock: false,
              stock_status: 'instock'
            })
            .select()
            .single();

          if (productError) {
            console.error(`      ❌ Error creating product:`, productError.message);
            failCount++;
            continue;
          }

          console.log(`      ✅ Product created: ${newProduct.id}`);
          successCount++;

        } catch (error) {
          console.error(`      ❌ Error processing ${product.name}:`, error.message);
          failCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🌙 MOONWATER Catalog Import Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total Products: ${totalProducts}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
importMoonwaterCatalog();
