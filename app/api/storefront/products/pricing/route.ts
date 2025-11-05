import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Product IDs array required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch products with embedded pricing_data
    const { data: products, error } = await supabase
      .from('products')
      .select('id, pricing_data')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching product pricing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build pricing map from embedded pricing_data
    const pricingMap: { [key: string]: any[] } = {};

    (products || []).forEach((product: any) => {
      const pricingData = product.pricing_data || {};
      const tiers: any[] = [];

      // Extract tiers from embedded pricing_data
      (pricingData.tiers || []).forEach((tier: any) => {
        if (tier.enabled !== false && tier.price) {
          tiers.push({
            weight: tier.label,
            label: tier.label,
            qty: tier.quantity || 1,
            price: parseFloat(tier.price),
            tier_name: tier.label,
            break_id: tier.id,
            blueprint_name: pricingData.template_name || 'Custom',
            sort_order: tier.sort_order || 0
          });
        }
      });

      tiers.sort((a, b) => a.sort_order - b.sort_order);
      pricingMap[product.id] = tiers;
    });

    return NextResponse.json({ success: true, pricingMap });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

