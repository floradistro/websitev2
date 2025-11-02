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

    // Fetch products with all necessary relationships
    // NOTE: We fetch ALL inventory records and filter in JavaScript below
    // Using .eq('inventory.location_id') would exclude products without inventory records entirely
    const query = supabase
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
        inventory!product_id(
          id,
          quantity,
          location_id
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('name');

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Error fetching TV display products:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch vendor pricing configs for this vendor
    const { data: vendorConfigs, error: pricingError } = await supabase
      .from('vendor_pricing_configs')
      .select('blueprint_id, pricing_values')
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    if (pricingError) {
      console.error('❌ Error fetching vendor pricing configs:', pricingError);
    }

    // Build a map of blueprint_id -> pricing_values for quick lookup
    const vendorPricingMap = new Map(
      (vendorConfigs || []).map((config: any) => [config.blueprint_id, config.pricing_values])
    );

    // Transform products to add pricing_tiers field
    const productsWithPricing = (products || []).map((product: any) => {
      // Get the product's pricing assignment
      const assignment = product.pricing_assignments?.[0];
      if (!assignment || !assignment.blueprint) {
        return product;
      }

      const blueprintId = assignment.blueprint_id;
      const vendorPricing = vendorPricingMap.get(blueprintId) || {};
      const productOverrides = assignment.price_overrides || {};

      // Merge vendor pricing with product-specific overrides
      const pricing_tiers = { ...vendorPricing, ...productOverrides };

      return {
        ...product,
        pricing_tiers
      };
    });

    // Filter products to only show those with inventory > 0 at this location
    let filteredProducts = productsWithPricing || [];

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
