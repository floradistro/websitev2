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

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id required' },
        { status: 400 }
      );
    }

    console.log('📺 TV Display: Fetching products for vendor:', vendorId);

    const supabase = getServiceSupabase();

    // Fetch products with all necessary relationships
    const { data: products, error } = await supabase
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
        primary_category:categories!primary_category_id(name)
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('name');

    if (error) {
      console.error('❌ Error fetching TV display products:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ TV Display: Fetched ${products?.length || 0} products`);

    return NextResponse.json({
      success: true,
      products: products || []
    });

  } catch (error: any) {
    console.error('❌ TV Display products API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
