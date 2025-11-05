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

    // Fetch inventory with product details (simplified - no multi-table pricing joins)
    const { data: inventoryData, error: inventoryError } = await supabase
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
          pricing_data,
          primary_category:categories!primary_category_id(id, name),
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
      .gt('quantity', 0);

    const inventoryResult = { data: inventoryData, error: inventoryError };

    if (inventoryResult.error) {
      console.error('Error fetching inventory:', inventoryResult.error);
      return NextResponse.json(
        { error: inventoryResult.error.message },
        { status: 500 }
      );
    }

    // Transform data - simplified pricing from embedded pricing_data
    const products = (inventoryResult.data || [])
      .filter((inv: any) => inv.products) // Filter out null products
      .map((inv: any) => {
        // Get pricing from embedded pricing_data (new system)
        const pricingData = inv.products.pricing_data || {};
        const pricingTiers: any[] = (pricingData.tiers || [])
          .filter((tier: any) => tier.enabled !== false && tier.price) // Only enabled tiers with prices
          .map((tier: any) => ({
            weight: tier.label,
            qty: tier.quantity || 1,
            price: parseFloat(tier.price),
            label: tier.label,
            break_id: tier.id,
            sort_order: tier.sort_order || 0
          }))
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

        // If no tiers, fall back to single price
        if (pricingTiers.length === 0 && inv.products.price) {
          pricingTiers.push({
            break_id: 'single',
            label: 'Single Price',
            qty: 1,
            unit: '',
            price: parseFloat(inv.products.price),
            sort_order: 1
          });
        }

        // Get category - try primary_category first, then fall back to product_categories
        let category = null;
        if (inv.products.primary_category) {
          category = inv.products.primary_category.name;
        } else {
          const productCategories = inv.products.product_categories || [];
          if (productCategories.length > 0 && productCategories[0].categories) {
            category = productCategories[0].categories.name;
          }
        }

        // Get product fields from custom_fields JSONB
        // custom_fields is an object like { "strain_type": "Indica", "terpenes": "..." }
        // Convert to array of { label, value, type } objects
        const customFields = inv.products.custom_fields || {};
        const productFields = Object.entries(customFields).map(([key, value]) => ({
          label: key,
          value: String(value || ''),
          type: typeof value === 'number' ? 'number' : 'text'
        }));

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

