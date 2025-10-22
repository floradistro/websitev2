import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if productId is UUID or WordPress ID
    const isUUID = productId.includes('-');
    
    // Get product to find vendor_id
    let productQuery = supabase
      .from('products')
      .select('vendor_id');

    if (isUUID) {
      productQuery = productQuery.eq('id', productId);
    } else {
      productQuery = productQuery.eq('wordpress_id', productId);
    }

    const { data: product, error: productError } = await productQuery.single();

    if (productError || !product) {
      return NextResponse.json({
        success: true,
        pricingTiers: []
      });
    }

    // If product has no vendor, return empty tiers
    if (!product.vendor_id) {
      return NextResponse.json({
        success: true,
        pricingTiers: []
      });
    }

    // Get vendor's pricing configs with blueprint details
    const { data: configs, error: configError } = await supabase
      .from('vendor_pricing_configs')
      .select(`
        *,
        blueprint:pricing_tier_blueprints (
          id,
          name,
          slug,
          tier_type,
          price_breaks
        )
      `)
      .eq('vendor_id', product.vendor_id)
      .eq('is_active', true);

    if (configError) {
      console.error('Error fetching pricing configs:', configError);
      return NextResponse.json({
        success: true,
        pricingTiers: []
      });
    }

    // Transform vendor pricing configs to pricing tiers format
    const pricingTiers: any[] = [];

    if (configs && configs.length > 0) {
      // For each config, create tiers from blueprint price_breaks + vendor pricing_values
      configs.forEach((config: any) => {
        const blueprint = config.blueprint;
        const pricingValues = config.pricing_values || {};

        if (blueprint && blueprint.price_breaks && Array.isArray(blueprint.price_breaks)) {
          blueprint.price_breaks.forEach((priceBreak: any) => {
            const breakId = priceBreak.break_id;
            const vendorPrice = pricingValues[breakId];

            // Only add if vendor has set a price for this break
            if (vendorPrice && vendorPrice.enabled && vendorPrice.price) {
              pricingTiers.push({
                weight: priceBreak.label || `${priceBreak.qty}${priceBreak.unit || ''}`,
                qty: priceBreak.qty || 1,
                price: parseFloat(vendorPrice.price),
                tier_name: priceBreak.label,
                break_id: breakId,
                blueprint_name: blueprint.name,
                sort_order: priceBreak.sort_order || 0
              });
            }
          });
        }
      });

      // Sort by sort_order
      pricingTiers.sort((a, b) => a.sort_order - b.sort_order);
    }

    return NextResponse.json({
      success: true,
      pricingTiers: pricingTiers
    });

  } catch (error: any) {
    console.error('Error fetching product pricing:', error);
    return NextResponse.json(
      { success: true, pricingTiers: [] }, // Return empty instead of error to not break product page
      { status: 200 }
    );
  }
}

