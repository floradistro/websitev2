import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Products API called');
    const { searchParams } = new URL(request.url);
    const perPage = parseInt(searchParams.get('per_page') || '200');
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendor_id');
    
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
      
      // Filter active locations
      const activeInventory = inventory.filter((inv: any) => 
        inv.location?.is_active === true
      );
      
      // Calculate stock
      const totalStock = activeInventory.reduce((sum: number, inv: any) => 
        sum + parseFloat(inv.quantity || 0), 0
      );
      
      // Extract pricing tiers from blueprint_fields
      const pricingTiers = p.blueprint_fields?.find((f: any) => 
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
        blueprint_fields: p.blueprint_fields || [],
        meta_data: p.meta_data || {},
        pricing_tiers: pricingTiers
      };
    });
    
    // Filter - only in stock
    const inStockProducts = processedProducts.filter((p: any) => 
      parseFloat(p.stock_quantity || 0) > 0
    );
    
    console.log(`✅ ${products.length} products → ${inStockProducts.length} in stock`);
    
    return NextResponse.json({
      success: true,
      products: inStockProducts
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
