import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const wordpressUrl = 'https://api.floradistro.com';
const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let stats = {
  categories: { fetched: 0, migrated: 0, skipped: 0, errors: 0 },
  products: { fetched: 0, migrated: 0, skipped: 0, errors: 0 }
};

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║      🚀 WORDPRESS → SUPABASE PRODUCT MIGRATION 🚀               ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n');

// ============================================================================
// PHASE 1: MIGRATE CATEGORIES
// ============================================================================

async function migrateCategories() {
  console.log('📁 PHASE 1: Migrating Categories');
  console.log('─'.repeat(70));
  
  try {
    // Fetch categories from WordPress
    console.log('📥 Fetching categories from WordPress...');
    
    const response = await axios.get(
      `${wordpressUrl}/wp-json/wc/v3/products/categories`,
      {
        params: {
          per_page: 100,
          consumer_key: consumerKey,
          consumer_secret: consumerSecret
        }
      }
    );
    
    const wpCategories = response.data;
    stats.categories.fetched = wpCategories.length;
    
    console.log(`✅ Found ${wpCategories.length} categories in WordPress\n`);
    
    // Map to store WordPress ID → Supabase UUID
    const categoryMap = new Map();
    
    // First pass: Create all categories without parent references
    for (const wpCat of wpCategories) {
      try {
        console.log(`   Processing: ${wpCat.name}`);
        
        const categoryData = {
          wordpress_id: wpCat.id,
          name: wpCat.name,
          slug: wpCat.slug,
          description: wpCat.description || null,
          image_url: wpCat.image?.src || null,
          display_order: wpCat.menu_order || 0,
          is_active: wpCat.display !== 'none',
          product_count: wpCat.count || 0,
          metadata: {
            wordpress_data: wpCat
          }
        };
        
        // Try to insert
        const { data, error } = await supabase
          .from('categories')
          .upsert(categoryData, {
            onConflict: 'wordpress_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') { // Unique violation
            stats.categories.skipped++;
            console.log(`   ⏭️  Skipped (already exists)`);
            
            // Get existing
            const { data: existing } = await supabase
              .from('categories')
              .select('id')
              .eq('wordpress_id', wpCat.id)
              .single();
            
            if (existing) {
              categoryMap.set(wpCat.id, existing.id);
            }
          } else {
            throw error;
          }
        } else {
          categoryMap.set(wpCat.id, data.id);
          stats.categories.migrated++;
          console.log(`   ✅ Migrated`);
        }
      } catch (error) {
        stats.categories.errors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Second pass: Update parent references
    console.log('\n📊 Updating category hierarchy...');
    
    for (const wpCat of wpCategories.filter(c => c.parent > 0)) {
      try {
        const childId = categoryMap.get(wpCat.id);
        const parentId = categoryMap.get(wpCat.parent);
        
        if (childId && parentId) {
          await supabase
            .from('categories')
            .update({ parent_id: parentId })
            .eq('id', childId);
          
          console.log(`   ✅ Linked "${wpCat.name}" to parent`);
        }
      } catch (error) {
        console.error(`   ❌ Error linking: ${error.message}`);
      }
    }
    
    console.log('\n✅ Categories migration complete!');
    console.log(`   Migrated: ${stats.categories.migrated}`);
    console.log(`   Skipped: ${stats.categories.skipped}`);
    console.log(`   Errors: ${stats.categories.errors}\n`);
    
    return categoryMap;
    
  } catch (error) {
    console.error('❌ Fatal error migrating categories:', error);
    throw error;
  }
}

// ============================================================================
// PHASE 2: MIGRATE PRODUCTS
// ============================================================================

async function migrateProducts(categoryMap) {
  console.log('\n📦 PHASE 2: Migrating Products');
  console.log('─'.repeat(70));
  
  try {
    // Fetch products from WordPress (paginated)
    console.log('📥 Fetching products from WordPress...');
    
    let page = 1;
    let hasMore = true;
    let allProducts = [];
    
    while (hasMore) {
      const response = await axios.get(
        `${wordpressUrl}/wp-json/wc/v3/products`,
        {
          params: {
            per_page: 100,
            page,
            consumer_key: consumerKey,
            consumer_secret: consumerSecret
          }
        }
      );
      
      allProducts = [...allProducts, ...response.data];
      
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
      hasMore = page < totalPages;
      page++;
      
      console.log(`   Fetched page ${page - 1}/${totalPages} (${response.data.length} products)`);
    }
    
    stats.products.fetched = allProducts.length;
    console.log(`\n✅ Found ${allProducts.length} products in WordPress\n`);
    
    // Migrate each product
    for (let i = 0; i < allProducts.length; i++) {
      const wpProduct = allProducts[i];
      
      try {
        console.log(`[${i + 1}/${allProducts.length}] ${wpProduct.name}`);
        
        // Map categories
        const primaryCategoryId = wpProduct.categories?.[0]?.id 
          ? categoryMap.get(wpProduct.categories[0].id) 
          : null;
        
        // Prepare images
        const featuredImage = wpProduct.images?.[0]?.src || null;
        const imageGallery = wpProduct.images?.slice(1).map(img => img.src) || [];
        
        // Prepare product data
        const productData = {
          wordpress_id: wpProduct.id,
          name: wpProduct.name,
          slug: wpProduct.slug,
          description: wpProduct.description || null,
          short_description: wpProduct.short_description || null,
          sku: wpProduct.sku || null,
          type: wpProduct.type || 'simple',
          status: wpProduct.status === 'publish' ? 'published' : wpProduct.status,
          regular_price: wpProduct.regular_price ? parseFloat(wpProduct.regular_price) : null,
          sale_price: wpProduct.sale_price ? parseFloat(wpProduct.sale_price) : null,
          primary_category_id: primaryCategoryId,
          featured_image: featuredImage,
          image_gallery: imageGallery,
          attributes: wpProduct.attributes || {},
          blueprint_fields: wpProduct.meta_data || [],
          manage_stock: wpProduct.manage_stock || false,
          stock_quantity: wpProduct.stock_quantity ? parseFloat(wpProduct.stock_quantity) : null,
          stock_status: wpProduct.stock_status || 'instock',
          backorders_allowed: wpProduct.backorders !== 'no',
          weight: wpProduct.weight ? parseFloat(wpProduct.weight) : null,
          length: wpProduct.dimensions?.length ? parseFloat(wpProduct.dimensions.length) : null,
          width: wpProduct.dimensions?.width ? parseFloat(wpProduct.dimensions.width) : null,
          height: wpProduct.dimensions?.height ? parseFloat(wpProduct.dimensions.height) : null,
          featured: wpProduct.featured || false,
          virtual: wpProduct.virtual || false,
          downloadable: wpProduct.downloadable || false,
          sold_individually: wpProduct.sold_individually || false,
          reviews_allowed: wpProduct.reviews_allowed !== false,
          average_rating: wpProduct.average_rating ? parseFloat(wpProduct.average_rating) : 0,
          rating_count: wpProduct.rating_count || 0,
          meta_data: {
            wordpress_data: wpProduct,
            migrated_at: new Date().toISOString()
          }
        };
        
        // Insert product
        const { data: product, error } = await supabase
          .from('products')
          .upsert(productData, {
            onConflict: 'wordpress_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') {
            stats.products.skipped++;
            console.log(`   ⏭️  Skipped (already exists)`);
          } else {
            throw error;
          }
        } else {
          // Link all categories
          if (wpProduct.categories && wpProduct.categories.length > 0 && product) {
            const categoryLinks = wpProduct.categories
              .map((wpCat, index) => {
                const catId = categoryMap.get(wpCat.id);
                if (!catId) return null;
                
                return {
                  product_id: product.id,
                  category_id: catId,
                  is_primary: index === 0
                };
              })
              .filter(Boolean);
            
            if (categoryLinks.length > 0) {
              await supabase
                .from('product_categories')
                .upsert(categoryLinks, {
                  onConflict: 'product_id,category_id'
                });
            }
          }
          
          stats.products.migrated++;
          console.log(`   ✅ Migrated`);
        }
        
      } catch (error) {
        stats.products.errors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✅ Products migration complete!');
    console.log(`   Migrated: ${stats.products.migrated}`);
    console.log(`   Skipped: ${stats.products.skipped}`);
    console.log(`   Errors: ${stats.products.errors}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error migrating products:', error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    const categoryMap = await migrateCategories();
    await migrateProducts(categoryMap);
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║                   🎉 MIGRATION COMPLETE! 🎉                     ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    console.log('📊 FINAL STATISTICS:');
    console.log('─'.repeat(70));
    console.log(`\n📁 CATEGORIES:`);
    console.log(`   Fetched:  ${stats.categories.fetched}`);
    console.log(`   Migrated: ${stats.categories.migrated}`);
    console.log(`   Skipped:  ${stats.categories.skipped}`);
    console.log(`   Errors:   ${stats.categories.errors}`);
    
    console.log(`\n📦 PRODUCTS:`);
    console.log(`   Fetched:  ${stats.products.fetched}`);
    console.log(`   Migrated: ${stats.products.migrated}`);
    console.log(`   Skipped:  ${stats.products.skipped}`);
    console.log(`   Errors:   ${stats.products.errors}`);
    
    console.log('\n✨ All data is now in Supabase!');
    console.log('🔗 View in Supabase: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/editor\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

