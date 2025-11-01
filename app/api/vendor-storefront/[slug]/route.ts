import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const supabase = getServiceSupabase();
    
    // 1. Get vendor by slug
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    // CRITICAL: Block access to suspended vendors
    if (vendor.status === 'suspended') {
      console.log('❌ Vendor suspended:', slug);
      return NextResponse.json({ 
        error: 'This vendor is currently suspended',
        suspended: true 
      }, { status: 403 });
    }
    
    // 2. Get vendor's products with categories
    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        primary_category:categories!primary_category_id(id, name, slug)
      `)
      .eq('vendor_id', vendor.id)
      .eq('status', 'published');
    
    // 3. Get vendor's locations
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true);
    
    // 4. Get inventory for all products at all vendor locations
    const { data: inventory } = await supabase
      .from('inventory')
      .select(`
        product_id,
        location_id,
        quantity,
        stock_status,
        location:location_id(id, name, city, state)
      `)
      .eq('vendor_id', vendor.id);
    
    // 5. Group inventory by product
    const inventoryByProduct = new Map();
    inventory?.forEach(inv => {
      if (!inventoryByProduct.has(inv.product_id)) {
        inventoryByProduct.set(inv.product_id, []);
      }
      inventoryByProduct.get(inv.product_id).push(inv);
    });
    
    // 6. Add inventory to products and filter to in-stock only
    const productsWithInventory = products?.map(p => {
      const productInventory = inventoryByProduct.get(p.id) || [];
      const totalStock = productInventory.reduce((sum: number, inv: any) => sum + parseFloat(inv.quantity || 0), 0);
      
      // Use stock_quantity from product table (should be synced) or calculated total
      const actualStock = p.stock_quantity || totalStock;
      
      return {
        ...p,
        inventory: productInventory,
        total_stock: actualStock,
        stock_quantity: actualStock,
        stock_status: actualStock > 0 ? 'in_stock' : 'out_of_stock',
        locations: productInventory.map((inv: any) => inv.location)
      };
    }).filter(p => p.total_stock > 0); // Only show products with stock
    
    console.log(`✅ Vendor ${slug}:`, {
      total_products: products?.length || 0,
      in_stock: productsWithInventory?.length || 0,
      products_list: productsWithInventory?.map(p => `${p.name} (${p.total_stock})`)
    });
    
    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.store_name,
        slug: vendor.slug,
        logo_url: vendor.logo_url,
        banner_url: vendor.banner_url,
        store_tagline: vendor.store_tagline,
        description: vendor.store_description,
        brand_colors: vendor.brand_colors,
        social_links: vendor.social_links,
        custom_font: vendor.custom_font,
        custom_css: vendor.custom_css,
        email: vendor.email,
        phone: vendor.phone,
        state: vendor.state,
        region: vendor.region,
        created_at: vendor.created_at
      },
      products: productsWithInventory || [],
      locations: locations || []
    });
    
  } catch (error: any) {
    console.error('Vendor storefront error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

