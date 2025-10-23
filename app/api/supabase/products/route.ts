import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { productCache, generateCacheKey } from '@/lib/cache-manager';
import { monitor } from '@/lib/performance-monitor';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const endTimer = monitor.startTimer('Product List');
  
  try {
    console.log('🚀 Products API called');
    const { searchParams } = new URL(request.url);
    const perPage = parseInt(searchParams.get('per_page') || '200');
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendor_id');
    
    // Generate cache key based on query parameters
    const cacheKey = generateCacheKey('products', {
      perPage,
      category: category || 'all',
      vendorId: vendorId || 'all'
    });
    
    // Check cache first
    const cached = productCache.get(cacheKey);
    if (cached) {
      const duration = performance.now() - startTime;
      endTimer(); // Record in performance monitor
      monitor.recordCacheAccess('products', true); // Record cache hit
      console.log(`⚡ Cache HIT - Returned in ${duration.toFixed(2)}ms`);
      return NextResponse.json(cached, {
        headers: {
          'X-Cache-Status': 'HIT',
          'X-Response-Time': `${duration.toFixed(2)}ms`,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
        }
      });
    }
    
    // Record cache miss
    monitor.recordCacheAccess('products', false);
    
    console.log('🔵 Getting Supabase client...');
    const supabase = getServiceSupabase();
    
    console.log('🔵 Fetching products...');
    // Fetch products from Supabase
    let query = supabase
      .from('products')
      .select('*')
      .in('status', ['publish', 'published', 'active'])
      .order('name', { ascending: true })
      .limit(perPage);
    
    if (category) {
      query = query.eq('primary_category_id', category);
    }
    
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    
    const { data: products, error: productsError } = await query;
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }
    
    console.log(`✅ Fetched ${products?.length || 0} products`);
    if (products && products.length > 0) {
      console.log(`🔵 Sample product ID:`, products[0].id);
    }
    
    // Fetch product categories relationships
    console.log('🔵 Fetching product categories...');
    const { data: productCategoriesData, error: categoriesError } = await supabase
      .from('product_categories')
      .select(`
        product_id,
        category_id,
        is_primary,
        category:categories!inner(id, name, slug)
      `);
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
    }
    
    console.log(`✅ Fetched ${productCategoriesData?.length || 0} product-category relationships`);
    
    // Map categories by product ID
    const categoriesMap = new Map<string, any[]>();
    (productCategoriesData || []).forEach((pc: any) => {
      const productId = pc.product_id?.toString();
      if (productId) {
        if (!categoriesMap.has(productId)) {
          categoriesMap.set(productId, []);
        }
        categoriesMap.get(productId)!.push({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          is_primary: pc.is_primary
        });
      }
    });
    
    // Fetch inventory with locations
    console.log('🔵 Fetching inventory...');
    const { data: allInventory, error: invError } = await supabase
      .from('inventory')
      .select(`
        product_id,
        location_id,
        quantity,
        location:locations!inner(id, name, city, state, is_active)
      `)
      .gt('quantity', 0);
    
    if (invError) {
      console.error('❌ Error fetching inventory:', invError);
    }
    
    console.log(`✅ Fetched ${allInventory?.length || 0} inventory records`);
    if (allInventory && allInventory.length > 0) {
      console.log(`🔵 Sample inventory product_id:`, allInventory[0].product_id, 'type:', typeof allInventory[0].product_id);
    }
    
    // Map inventory by product UUID
    const inventoryMap = new Map<string, any[]>();
    (allInventory || []).forEach((inv: any) => {
      const productId = inv.product_id?.toString();
      if (productId && !inventoryMap.has(productId)) {
        inventoryMap.set(productId, []);
      }
      if (productId) {
        inventoryMap.get(productId)!.push(inv);
      }
    });
    
    // Process products
    const processedProducts = (products || []).map((p: any) => {
      const inventory = inventoryMap.get(p.id) || [];
      const categories = categoriesMap.get(p.id) || [];
      
      // Filter active locations
      const activeInventory = inventory.filter((inv: any) => 
        inv.location?.is_active === true
      );
      
      // Calculate stock
      const totalStock = activeInventory.reduce((sum: number, inv: any) => 
        sum + parseFloat(inv.quantity || 0), 0
      );
      
      // Extract pricing tiers from blueprint_fields (ensure it's an array)
      const blueprintFieldsArray = Array.isArray(p.blueprint_fields) ? p.blueprint_fields : [];
      const pricingTiers = blueprintFieldsArray.find((f: any) => 
        f.key === '_product_price_tiers'
      )?.value || [];
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price || p.regular_price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        featured_image_storage: p.featured_image_storage,
        image_gallery_storage: p.image_gallery_storage,
        stock_quantity: totalStock,
        stock_status: totalStock > 0 ? 'in_stock' : 'out_of_stock',
        inventory: activeInventory,
        vendor_id: p.vendor_id,
        primary_category_id: p.primary_category_id,
        categories: categories,
        blueprint_fields: blueprintFieldsArray,
        meta_data: p.meta_data || {},
        pricing_tiers: pricingTiers
      };
    });
    
    // Filter - only in stock AND has valid price
    const inStockProducts = processedProducts.filter((p: any) => {
      const hasStock = parseFloat(p.stock_quantity || 0) > 0;
      const hasPrice = p.price && parseFloat(p.price) > 0;
      return hasStock && hasPrice;
    });
    
    console.log(`✅ ${products.length} products → ${inStockProducts.length} in stock`);
    
    const responseData = {
      success: true,
      products: inStockProducts
    };
    
    // Store in cache
    productCache.set(cacheKey, responseData);
    
    const duration = performance.now() - startTime;
    endTimer(); // Record in performance monitor
    console.log(`⚡ Cache MISS - Processed in ${duration.toFixed(2)}ms`);
    
    return NextResponse.json(responseData, {
      headers: {
        'X-Cache-Status': 'MISS',
        'X-Response-Time': `${duration.toFixed(2)}ms`,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
    
  } catch (error: any) {
    console.error('❌ FATAL ERROR in products API:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ 
      error: error.message,
      details: error.toString(),
      stack: error.stack 
    }, { status: 500 });
  }
}
