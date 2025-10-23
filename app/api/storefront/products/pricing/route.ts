import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Product IDs array required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Fetch pricing for all products in batch
    const pricingMap: { [key: string]: any[] } = {};
    
    for (const productId of productIds) {
      const { data: pricingConfig } = await supabase
        .from('vendor_pricing_configs')
        .select(`
          id,
          pricing_values,
          display_unit,
          blueprint:pricing_tier_blueprints (
            id,
            name,
            slug,
            tier_breaks
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .single();

      if (pricingConfig && pricingConfig.blueprint?.tier_breaks) {
        const tiers: any[] = [];
        const pricingValues = pricingConfig.pricing_values || {};
        
        pricingConfig.blueprint.tier_breaks.forEach((tier: any) => {
          const breakId = tier.break_id;
          const tierData = pricingValues[breakId];
          
          if (tierData && tierData.enabled && tierData.price) {
            tiers.push({
              weight: tier.label || tier.weight || breakId,
              label: tier.label,
              qty: tier.quantity || 1,
              price: parseFloat(tierData.price),
              tier_name: tier.label || breakId,
              break_id: breakId,
              blueprint_name: pricingConfig.blueprint.name,
              sort_order: tier.sort_order || 0
            });
          }
        });
        
        tiers.sort((a, b) => a.sort_order - b.sort_order);
        pricingMap[productId] = tiers;
      } else {
        pricingMap[productId] = [];
      }
    }

    return NextResponse.json({ success: true, pricingMap });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

