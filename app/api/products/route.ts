/**
 * API: Products
 * GET /api/products
 * Fetches products for component registry smart components
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// Cache for 60 seconds, stale-while-revalidate for 120 seconds
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');
    const productIds = searchParams.get('product_ids')?.split(',').filter(Boolean);
    const categoryIds = searchParams.get('category_ids')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id is required' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Fetch products with embedded pricing
    let query = supabase
      .from('products')
      .select(`
        *,
        inventory(id, quantity, location_id, stock_status)
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'published');

    // Filter by specific product IDs
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    // Filter by categories
    if (categoryIds && categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply limit
    query = query.limit(limit);

    const productsResult = await query;

    if (productsResult.error) {
      throw productsResult.error;
    }

    // Extract pricing tiers from embedded pricing_data
    const productsWithPricing = (productsResult.data || []).map((product: any) => {
      const pricingData = product.pricing_data || {};
      const pricingTiers: any[] = [];

      // Extract tiers from embedded pricing_data
      (pricingData.tiers || []).forEach((tier: any) => {
        if (tier.enabled !== false && tier.price) {
          pricingTiers.push({
            break_id: tier.id,
            label: tier.label,
            quantity: tier.quantity || 1,
            unit: tier.unit || 'g',
            price: parseFloat(tier.price),
            price_per_gram: parseFloat(tier.price) / (tier.quantity || 1),
            sort_order: tier.sort_order || 0,
          });
        }
      });

      pricingTiers.sort((a, b) => a.sort_order - b.sort_order);

      return {
        ...product,
        pricing_tiers: pricingTiers,
      };
    });
    
    return NextResponse.json(
      {
        success: true,
        products: productsWithPricing,
        count: productsWithPricing.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

