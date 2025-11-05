import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pos/products/lookup?sku=ABC-123&location_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const sku = searchParams.get('sku');
    const locationId = searchParams.get('location_id');

    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'SKU parameter is required' },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'location_id parameter is required' },
        { status: 400 }
      );
    }

    // Search for product by SKU (case-insensitive)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        slug,
        description,
        short_description,
        regular_price,
        sale_price,
        price,
        on_sale,
        featured_image,
        cost_price,
        stock_status,
        status,
        primary_category_id,
        pricing_data,
        custom_fields,
        categories:primary_category_id(
          id,
          name,
          slug
        )
      `)
      .ilike('sku', sku)
      .eq('status', 'published')
      .single();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
          message: `No product found with SKU: ${sku}`
        },
        { status: 404 }
      );
    }

    // Get inventory for this location
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity, available_quantity, reserved_quantity, stock_status')
      .eq('product_id', product.id)
      .eq('location_id', locationId)
      .single();

    if (inventoryError) {
      console.warn('Inventory not found for product:', product.id, 'at location:', locationId);
    }

    // Get product variants if they exist
    const { data: variants } = await supabase
      .from('product_variations')
      .select(`
        id,
        sku,
        attributes,
        regular_price,
        sale_price,
        price,
        stock_status,
        cost_price
      `)
      .eq('product_id', product.id);

    // Extract pricing tiers from pricing_data
    const pricingData = product.pricing_data || {};
    const pricingTiers: any[] = (pricingData.tiers || [])
      .filter((tier: any) => tier.enabled !== false && tier.price)
      .map((tier: any) => ({
        break_id: tier.id,
        label: tier.label,
        qty: tier.quantity || 1,
        unit: tier.unit || '',
        price: parseFloat(tier.price),
        sort_order: tier.sort_order || 0
      }))
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    // Build response
    const response = {
      success: true,
      product: {
        ...product,
        pricing_tiers: pricingTiers,
        inventory: inventory || {
          quantity: 0,
          available_quantity: 0,
          reserved_quantity: 0,
          stock_status: 'out_of_stock'
        },
        variants: variants || [],
        has_variants: variants && variants.length > 0
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error looking up product by SKU:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to lookup product' },
      { status: 500 }
    );
  }
}

// POST /api/pos/products/lookup - Batch lookup by multiple SKUs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { skus, location_id } = body;

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { success: false, error: 'skus array is required' },
        { status: 400 }
      );
    }

    if (!location_id) {
      return NextResponse.json(
        { success: false, error: 'location_id is required' },
        { status: 400 }
      );
    }

    // Search for products by SKUs
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        regular_price,
        sale_price,
        price,
        on_sale,
        featured_image,
        cost_price,
        stock_status,
        status,
        pricing_data,
        custom_fields
      `)
      .in('sku', skus)
      .eq('status', 'published');

    if (productsError) {
      throw new Error(productsError.message);
    }

    // Get inventory for all products at this location
    const productIds = products?.map(p => p.id) || [];
    const { data: inventories } = await supabase
      .from('inventory')
      .select('product_id, quantity, available_quantity, stock_status')
      .in('product_id', productIds)
      .eq('location_id', location_id);

    // Build inventory map
    const inventoryMap = new Map();
    inventories?.forEach(inv => {
      inventoryMap.set(inv.product_id, inv);
    });

    // Combine products with inventory and pricing tiers
    const productsWithInventory = products?.map(product => {
      // Extract pricing tiers from pricing_data
      const pricingData = product.pricing_data || {};
      const pricingTiers: any[] = (pricingData.tiers || [])
        .filter((tier: any) => tier.enabled !== false && tier.price)
        .map((tier: any) => ({
          break_id: tier.id,
          label: tier.label,
          qty: tier.quantity || 1,
          unit: tier.unit || '',
          price: parseFloat(tier.price),
          sort_order: tier.sort_order || 0
        }))
        .sort((a: any, b: any) => a.sort_order - b.sort_order);

      return {
        ...product,
        pricing_tiers: pricingTiers,
        inventory: inventoryMap.get(product.id) || {
          quantity: 0,
          available_quantity: 0,
          stock_status: 'out_of_stock'
        }
      };
    });

    return NextResponse.json({
      success: true,
      products: productsWithInventory || [],
      found: productsWithInventory?.length || 0,
      requested: skus.length
    });

  } catch (error: any) {
    console.error('Error batch looking up products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to lookup products' },
      { status: 500 }
    );
  }
}
