#!/usr/bin/env node
/**
 * Create products from image names - SIMPLE
 * Product name = image filename (cleaned)
 * Auto-classify type, add descriptions, link images
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const BUCKET = 'vendor-product-images';

function getProductInfo(filename) {
  // Remove extension
  let name = filename.replace(/\.(png|jpeg|jpg)$/i, '');
  
  // Skip numbered files
  if (/^\d+$/.test(name) || /^product_\d+$/i.test(name)) {
    return null;
  }
  
  // Convert to display name
  const displayName = name.split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  
  // Classify product type
  const lower = name.toLowerCase();
  let type = 'flower';
  let category = 'Flower';
  let price = 10.00;
  let unit = 'gram';
  let specs = {};
  
  if (lower.includes('gummy') || lower.includes('gummies') || lower.includes('cookie')) {
    type = 'edible';
    category = 'Edibles';
    price = 20.00;
    unit = 'package';
    specs = { total_thc: '100mg', per_piece: '10mg', pieces: 10 };
  } else if (lower.includes('vape') || lower.includes('cart') || lower.includes('disposable')) {
    type = 'vape';
    category = 'Vapes';
    price = 35.00;
    unit = 'each';
    specs = { size: '1ml', type: 'Disposable Vape' };
  } else if (lower.includes('concentrate') || lower.includes('crumble') || lower.includes('wax')) {
    type = 'concentrate';
    category = 'Concentrates';
    price = 25.00;
    unit = 'gram';
    specs = { consistency: 'Crumble' };
  }
  
  // Generate descriptions
  const shortDesc = type === 'flower' 
    ? `Premium ${displayName}. Hand-selected. Lab-tested. Never stale.`
    : type === 'vape'
    ? `1ml disposable vape. Pure distillate. ${displayName} strain profile.`
    : type === 'concentrate'
    ? `Premium crumble concentrate. ${displayName}. High potency.`
    : `100mg total THC. 10 pieces × 10mg. Precisely dosed.`;
  
  const longDesc = type === 'flower'
    ? `${displayName} represents premium craft cannabis at its finest.\n\nEach batch is meticulously cultivated using organic methods, hand-trimmed by expert growers, and lab-tested for potency and purity. We focus on terpene preservation and cannabinoid expression to deliver exceptional flavor and effect profiles.\n\nSmall batch production ensures consistent quality. Every gram is hand-inspected before packaging.\n\nFresh. Potent. Pure.`
    : type === 'vape'
    ? `Our 1ml disposable vapes deliver clean, consistent vapor from first draw to last.\n\nFilled with premium cannabis distillate and natural terpenes inspired by ${displayName}. No cutting agents. No additives. Just pure potency in a discreet, convenient format.\n\nRechargeable battery ensures you use every drop. Lab-tested for safety and potency.\n\nReady to use. No setup required.`
    : type === 'concentrate'
    ? `${displayName} crumble is extracted using advanced hydrocarbon methods that preserve the full spectrum of cannabinoids and terpenes.\n\nPerfect consistency for dabbing. Easy to handle. Maximum flavor retention. Our extraction process ensures solvent-free purity.\n\nLab-verified potency. Small batch extraction. Craft quality.`
    : `Each package contains 10 precisely dosed pieces, delivering consistent 10mg THC per serving.\n\nMade with premium cannabis extract and natural ingredients. No cannabis taste. Predictable, reliable effects.\n\nPerfect for controlled dosing. Child-resistant packaging. Lab-tested for accuracy.\n\nStart low. Go slow. Enjoy responsibly.`;
  
  return {
    name: displayName,
    slug: name,
    type,
    category,
    price,
    unit,
    specs,
    shortDesc,
    longDesc,
    filename
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('CREATING PRODUCTS FROM IMAGE NAMES');
  console.log('='.repeat(80));
  
  // Get all images
  const { data: objects } = await supabase
    .storage
    .from(BUCKET)
    .list(FLORA_VENDOR_ID);
  
  console.log(`\n📂 Found ${objects.length} images`);
  
  // Get/create categories
  const { data: cats } = await supabase.from('categories').select('*');
  const categoryMap = {};
  cats?.forEach(c => { categoryMap[c.name] = c.id; });
  
  for (const catName of ['Flower', 'Vapes', 'Concentrates', 'Edibles']) {
    if (!categoryMap[catName]) {
      const { data } = await supabase.from('categories')
        .insert({ name: catName, slug: catName.toLowerCase(), is_active: true })
        .select().single();
      if (data) categoryMap[catName] = data.id;
    }
  }
  
  console.log(`\n🌿 Creating products...\n`);
  
  let created = 0, skipped = 0;
  
  for (const obj of objects) {
    const info = getProductInfo(obj.name);
    if (!info) {
      skipped++;
      continue;
    }
    
    const imageUrl = `https://uaednwpxursknmwdeejn.supabase.co/storage/v1/object/public/${BUCKET}/${FLORA_VENDOR_ID}/${info.filename}`;
    
    const { error } = await supabase.from('products').insert({
      vendor_id: FLORA_VENDOR_ID,
      name: info.name,
      slug: info.slug,
      short_description: info.shortDesc,
      description: info.longDesc,
      regular_price: info.price,
      status: 'published',
      featured_image: imageUrl,
      type: 'simple',
      manage_stock: true,
      stock_quantity: 0,
      meta_data: {
        product_type: info.type,
        unit: info.unit,
        specs: info.specs
      }
    });
    
    if (error) {
      console.error(`❌ ${info.name}: ${error.message}`);
      continue;
    }
    
    // Link category
    const { data: product } = await supabase.from('products')
      .select('id').eq('slug', info.slug).eq('vendor_id', FLORA_VENDOR_ID).single();
    
    if (product && categoryMap[info.category]) {
      await supabase.from('product_categories')
        .insert({ product_id: product.id, category_id: categoryMap[info.category] });
    }
    
    created++;
    console.log(`✓ ${info.name} (${info.type}) - $${info.price}/${info.unit}`);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ DONE: ${created} created, ${skipped} skipped`);
}

main();

