import { getServiceSupabase } from '../lib/supabase/client';

async function matchFloraImages() {
  const supabase = getServiceSupabase();
  
  console.log('🔍 Starting Flora Distro image matching...\n');
  
  // 1. Find Flora Distro vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, store_name')
    .or('slug.eq.flora-distro,store_name.ilike.%Flora Distro%')
    .single();
  
  if (vendorError || !vendor) {
    console.error('❌ Flora Distro vendor not found');
    return;
  }
  
  console.log(`✅ Found vendor: ${vendor.store_name} (ID: ${vendor.id})\n`);
  
  // 2. List all images in Flora Distro's media library
  const { data: imageFiles, error: imagesError } = await supabase.storage
    .from('vendor-product-images')
    .list(vendor.id, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (imagesError || !imageFiles) {
    console.error('❌ Error listing images:', imagesError);
    return;
  }
  
  console.log(`📸 Found ${imageFiles.length} images in media library\n`);
  
  // 3. Get all Flora Distro flower products (category: flower)
  const { data: flowerCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'flower')
    .single();
  
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug, featured_image_storage, vendor_id')
    .eq('vendor_id', vendor.id)
    .eq('primary_category_id', flowerCategory?.id)
    .order('name');
  
  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
    return;
  }
  
  console.log(`🌸 Found ${products?.length || 0} flower products\n`);
  console.log('─'.repeat(80) + '\n');
  
  // 4. Match images to products
  const matched: any[] = [];
  const unmatched: any[] = [];
  let attachedCount = 0;
  
  for (const imageFile of imageFiles) {
    const imageName = imageFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const imageNameClean = imageName
      .replace(/[_-]/g, ' ')
      .toLowerCase()
      .trim();
    
    let bestMatch: any = null;
    let bestScore = 0;
    
    // Try to find matching product
    for (const product of products || []) {
      const productNameClean = product.name
        .toLowerCase()
        .replace(/[_-]/g, ' ')
        .trim();
      
      // Exact match
      if (imageNameClean === productNameClean) {
        bestMatch = product;
        bestScore = 100;
        break;
      }
      
      // Partial match (contains)
      if (productNameClean.includes(imageNameClean) || imageNameClean.includes(productNameClean)) {
        const score = 75;
        if (score > bestScore) {
          bestMatch = product;
          bestScore = score;
        }
      }
      
      // Word overlap
      const imageWords = imageNameClean.split(' ');
      const productWords = productNameClean.split(' ');
      const overlap = imageWords.filter(w => productWords.includes(w)).length;
      const score = (overlap / Math.max(imageWords.length, productWords.length)) * 50;
      
      if (score > bestScore && score > 25) {
        bestMatch = product;
        bestScore = score;
      }
    }
    
    if (bestMatch && bestScore >= 50) {
      // Check if product already has an image
      if (!bestMatch.featured_image_storage) {
        // Get public URL for this image
        const { data: { publicUrl } } = supabase.storage
          .from('vendor-product-images')
          .getPublicUrl(`${vendor.id}/${imageFile.name}`);
        
        // Update product with image
        const { error: updateError } = await supabase
          .from('products')
          .update({ featured_image_storage: publicUrl })
          .eq('id', bestMatch.id);
        
        if (updateError) {
          console.error(`❌ Failed to attach ${imageFile.name} to ${bestMatch.name}:`, updateError.message);
        } else {
          console.log(`✅ ATTACHED: ${imageFile.name} → ${bestMatch.name} (${bestScore}% match)`);
          matched.push({
            image: imageFile.name,
            product: bestMatch.name,
            score: bestScore,
            action: 'attached'
          });
          attachedCount++;
        }
      } else {
        console.log(`⏭️  SKIPPED: ${imageFile.name} → ${bestMatch.name} (already has image)`);
        matched.push({
          image: imageFile.name,
          product: bestMatch.name,
          score: bestScore,
          action: 'skipped'
        });
      }
    } else {
      console.log(`❌ NO MATCH: ${imageFile.name}`);
      unmatched.push({
        image: imageFile.name,
        reason: bestMatch ? `Low confidence (${bestScore}%)` : 'No similar product found'
      });
    }
  }
  
  // 5. Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 MATCHING SUMMARY\n');
  console.log(`Total Images: ${imageFiles.length}`);
  console.log(`Matched: ${matched.length}`);
  console.log(`  - Attached: ${attachedCount}`);
  console.log(`  - Skipped (already has image): ${matched.filter(m => m.action === 'skipped').length}`);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log('═'.repeat(80) + '\n');
  
  if (unmatched.length > 0) {
    console.log('❌ UNMATCHED IMAGES:\n');
    unmatched.forEach(item => {
      console.log(`   ${item.image} - ${item.reason}`);
    });
    console.log('');
  }
  
  if (attachedCount > 0) {
    console.log(`✅ Successfully attached ${attachedCount} images to products!`);
  }
}

matchFloraImages().catch(console.error);

