import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Public API endpoint for TV displays to fetch products
 * Uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const locationId = searchParams.get('location_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id required' },
        { status: 400 }
      );
    }

    console.log('📺 TV Display: Fetching products for vendor:', vendorId, 'location:', locationId);

    const supabase = getServiceSupabase();

    // Fetch products with all necessary relationships, filtered by location inventory
    let query = supabase
      .from('products')
      .select(`
        *,
        pricing_assignments:product_pricing_assignments(
          blueprint_id,
          price_overrides,
          is_active,
          blueprint:pricing_tier_blueprints(
            id,
            name,
            slug,
            price_breaks,
            display_unit
          )
        ),
        primary_category:categories!primary_category_id(name),
        inventory:inventory_items(
          id,
          quantity,
          location_id
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'published');

    // Filter by location if provided
    if (locationId) {
      query = query.eq('inventory.location_id', locationId);
    }

    const { data: products, error } = await query.order('name');

    if (error) {
      console.error('❌ Error fetching TV display products:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filter products to only show those with inventory > 0 at this location
    let filteredProducts = products || [];

    if (locationId && filteredProducts.length > 0) {
      filteredProducts = filteredProducts.filter((product: any) => {
        // Check if product has inventory items for this location
        const locationInventory = product.inventory?.find((inv: any) =>
          inv.location_id === locationId && inv.quantity > 0
        );
        return !!locationInventory;
      });

      console.log(`📦 Inventory filter: ${products?.length || 0} total products → ${filteredProducts.length} in stock at location ${locationId}`);
    } else {
      console.log(`✅ TV Display: Fetched ${products?.length || 0} products (no location filter)`);
    }

    return NextResponse.json({
      success: true,
      products: filteredProducts
    });

  } catch (error: any) {
    console.error('❌ TV Display products API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
