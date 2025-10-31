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

  const { data, error } = await supabase.storage
    .from('vendor-product-images')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
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
  const dosageMatch = dosageFolder.match(/(\d+)MG/);
  const dosage = dosageMatch ? `${dosageMatch[1]}mg` : '';
  let lineName = dosageFolder.replace(/\d+MG\s*/i, '').trim();
  const flavor = flavorFolder.replace(/_/g, ' ').trim();

  let productName = `Moonwater ${dosage} ${flavor}`;
  if (lineName) {
    productName += ` - ${lineName}`;
  }

  return {
    name: productName,
    slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };
}

async function uploadCOAs() {
  console.log('🧪 Uploading MOONWATER COA PDFs...\n');

  const dosageFolders = fs.readdirSync(CATALOG_PATH).filter(f =>
    fs.statSync(path.join(CATALOG_PATH, f)).isDirectory() && !f.startsWith('.')
  );

  let totalUploaded = 0;
  let totalFailed = 0;

  for (const dosageFolder of dosageFolders) {
    const dosagePath = path.join(CATALOG_PATH, dosageFolder);
    const flavorFolders = fs.readdirSync(dosagePath).filter(f =>
      fs.statSync(path.join(dosagePath, f)).isDirectory() && !f.startsWith('.')
    );

    console.log(`\n📦 Processing ${dosageFolder}...\n`);

    for (const flavorFolder of flavorFolders) {
      const flavorPath = path.join(dosagePath, flavorFolder);
      const product = parseProduct(dosageFolder, flavorFolder);

      console.log(`   📝 ${product.name}`);

      // Find product in database
      const { data: dbProduct, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .eq('vendor_id', VENDOR_ID)
        .eq('slug', product.slug)
        .single();

      if (productError || !dbProduct) {
        console.error(`      ❌ Product not found in database`);
        totalFailed++;
        continue;
      }

      // Find COA PDF
      const coaDir = path.join(flavorPath, 'COA');

      if (!fs.existsSync(coaDir)) {
        console.log(`      ⚠️  No COA folder found`);
        continue;
      }

      const coaFiles = fs.readdirSync(coaDir).filter(f => /\.pdf$/i.test(f));

      if (coaFiles.length === 0) {
        console.log(`      ⚠️  No COA PDF found`);
        continue;
      }

      const coaFile = coaFiles[0];
      const coaPath = path.join(coaDir, coaFile);
      const storagePath = `${VENDOR_ID}/moonwater/coa/${product.slug}-coa.pdf`;

      // Upload COA to storage
      console.log(`      ⬆️  Uploading: ${coaFile}`);
      const coaUrl = await uploadFile(coaPath, storagePath);

      if (!coaUrl) {
        console.error(`      ❌ Upload failed`);
        totalFailed++;
        continue;
      }

      console.log(`      ✅ Uploaded to storage`);

      // Get file size
      const fileStats = fs.statSync(coaPath);
      const fileSize = fileStats.size;

      // Create vendor_coas entry
      const { data: coaRecord, error: coaError } = await supabase
        .from('vendor_coas')
        .insert({
          vendor_id: VENDOR_ID,
          product_id: dbProduct.id,
          file_name: `${product.slug}-coa.pdf`,
          file_url: coaUrl,
          file_size: fileSize,
          file_type: 'application/pdf',
          lab_name: 'Lab Analysis',
          is_active: true,
          is_verified: false,
          product_name_on_coa: product.name,
          metadata: {
            original_filename: coaFile,
            upload_source: 'catalog_import'
          }
        })
        .select()
        .single();

      if (coaError) {
        console.error(`      ❌ Error creating COA record:`, coaError.message);
        totalFailed++;
        continue;
      }

      console.log(`      ✅ COA attached to product (ID: ${coaRecord.id})`);
      totalUploaded++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🧪 COA Upload Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${totalUploaded}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log('='.repeat(60) + '\n');
}

uploadCOAs();
