import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId parameter' },
        { status: 400 }
      );
    }

    // Fetch vendor pricing configs and inventory in parallel
    const [inventoryResult, vendorPricingResult] = await Promise.all([
      // Fetch inventory with product details
      supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          quantity,
          reserved_quantity,
          available_quantity,
          products (
            id,
            name,
            price,
            featured_image,
            vendor_id,
            description,
            short_description,
            custom_fields,
            product_categories (
              categories (
                name
              )
            ),
            vendors (
              id,
              store_name,
              logo_url
            )
          )
        `)
        .eq('location_id', locationId)
        .gt('quantity', 0),
      
      // Fetch vendor pricing configs
      supabase
        .from('vendor_pricing_configs')
        .select(`
          vendor_id,
          pricing_values,
          blueprint:pricing_tier_blueprints(
            id,
            name,
            price_breaks
          )
        `)
        .eq('is_active', true)
    ]);

    if (inventoryResult.error) {
      console.error('Error fetching inventory:', inventoryResult.error);
      return NextResponse.json(
        { error: inventoryResult.error.message },
        { status: 500 }
      );
    }

    // Build pricing map by vendor_id
    const vendorPricingMap = new Map();
    
    (vendorPricingResult.data || []).forEach((config: any) => {
      if (!config.blueprint?.price_breaks) return;
      
      const pricingValues = config.pricing_values || {};
      const tiers: any[] = [];
      
      config.blueprint.price_breaks.forEach((priceBreak: any) => {
        const breakId = priceBreak.break_id;
        const vendorPrice = pricingValues[breakId];
        
        // Only add if tier is ENABLED and has a price
        if (vendorPrice && vendorPrice.enabled !== false && vendorPrice.price) {
          tiers.push({
            weight: priceBreak.label || `${priceBreak.qty}${priceBreak.unit || ''}`,
            qty: priceBreak.qty || 1,
            price: parseFloat(vendorPrice.price),
            label: priceBreak.label,
            break_id: breakId,
            sort_order: priceBreak.sort_order || 0,
          });
        }
      });
      
      // Sort by sort_order
      tiers.sort((a, b) => a.sort_order - b.sort_order);
      
      vendorPricingMap.set(config.vendor_id, tiers);
    });

    // Transform data
    const products = (inventoryResult.data || [])
      .filter((inv: any) => inv.products) // Filter out null products
      .map((inv: any) => {
        // Get pricing tiers for this product's vendor
        const pricingTiers = vendorPricingMap.get(inv.products.vendor_id) || [];

        // Get category from product_categories
        const productCategories = inv.products.product_categories || [];
        const category = productCategories.length > 0 && productCategories[0].categories
          ? productCategories[0].categories.name
          : null;

        // Get product fields from custom_fields JSONB
        const blueprintFields = inv.products.custom_fields || [];
        const productFields = Array.isArray(blueprintFields) ? blueprintFields : [];

        // Get vendor info
        const vendor = inv.products.vendors || null;

        return {
          id: inv.products.id,
          name: inv.products.name,
          price: inv.products.price || 0,
          image_url: inv.products.featured_image,
          category: category,
          description: inv.products.description || null,
          short_description: inv.products.short_description || null,
          fields: productFields,
          inventory_quantity: inv.available_quantity,
          inventory_id: inv.id,
          pricing_tiers: pricingTiers,
          vendor: vendor ? {
            id: vendor.id,
            store_name: vendor.store_name,
            logo_url: vendor.logo_url
          } : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error in inventory endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

