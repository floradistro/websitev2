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
        primary_category:categories!primary_category_id(
          id,
          name,
          slug,
          parent_id
        ),
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

    // Fetch parent categories for products that have a parent_id
    const parentIds = new Set(
      (products || [])
        .map((p: any) => p.primary_category?.parent_id)
        .filter((id: string | null) => id !== null)
    );

    let parentCategoriesMap = new Map();
    if (parentIds.size > 0) {
      const { data: parentCategories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .in('id', Array.from(parentIds));

      parentCategoriesMap = new Map(
        (parentCategories || []).map((cat: any) => [cat.id, cat])
      );
    }

    // Enrich products with parent category data
    const productsWithParents = (products || []).map((product: any) => {
      if (product.primary_category?.parent_id) {
        const parentCategory = parentCategoriesMap.get(product.primary_category.parent_id);
        return {
          ...product,
          primary_category: {
            ...product.primary_category,
            parent_category: parentCategory || null
          }
        };
      }
      return product;
    });

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
    const productsWithPricing = (productsWithParents || []).map((product: any) => {
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

      console.log(`📦 Inventory filter: ${productsWithParents?.length || 0} total products → ${filteredProducts.length} in stock at location ${locationId}`);
    } else {
      console.log(`✅ TV Display: Fetched ${productsWithParents?.length || 0} products (no location filter)`);
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
