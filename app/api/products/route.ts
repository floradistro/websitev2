/**
 * API: Products
 * GET /api/products
 * Fetches products for component registry smart components
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// Cache for 60 seconds, stale-while-revalidate for 120 seconds
export const revalidate = 60;

// In-memory cache for pricing configs (per vendor)
const pricingCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

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
    
    // Fetch products and pricing config in parallel for better performance
    const [productsResult, pricingTiers] = await Promise.all([
      // Products query
      (async () => {
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
        
        return query;
      })(),
      // Pricing config query (with caching)
      (async () => {
        // Check cache first
        const cached = pricingCache.get(vendorId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return cached.data;
        }
        
        const { data: vendorPricingConfigs } = await supabase
          .from('vendor_pricing_configs')
          .select(`
            vendor_id,
            pricing_values,
            blueprint:pricing_tier_blueprints(
              id,
              name,
              slug,
              tier_type,
              price_breaks
            )
          `)
          .eq('vendor_id', vendorId)
          .eq('is_active', true);
        
        // Build pricing tiers from vendor config
        let pricingTiers: any[] = [];
        if (vendorPricingConfigs && vendorPricingConfigs.length > 0) {
          const config: any = vendorPricingConfigs[0];
          if (config.blueprint?.price_breaks) {
            const pricingValues = config.pricing_values || {};
            
            config.blueprint.price_breaks.forEach((priceBreak: any) => {
              const breakId = priceBreak.break_id;
              const breakData = pricingValues[breakId];
              
              if (breakData?.enabled) {
                pricingTiers.push({
                  break_id: breakId,
                  label: priceBreak.label,
                  quantity: priceBreak.qty,
                  unit: priceBreak.unit,
                  price: parseFloat(breakData.price),
                  price_per_gram: parseFloat(breakData.price) / priceBreak.qty,
                  sort_order: priceBreak.sort_order || 0,
                });
              }
            });
            
            pricingTiers.sort((a, b) => a.sort_order - b.sort_order);
          }
        }
        
        // Cache the result
        pricingCache.set(vendorId, {
          data: pricingTiers,
          timestamp: Date.now(),
        });
        
        return pricingTiers;
      })(),
    ]);
    
    if (productsResult.error) {
      throw productsResult.error;
    }
    
    // Add pricing tiers to all products
    const productsWithPricing = (productsResult.data || []).map((product: any) => ({
      ...product,
      pricing_tiers: pricingTiers,
    }));
    
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

