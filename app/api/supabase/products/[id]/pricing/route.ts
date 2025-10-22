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

    // Get product to find vendor_id
    let productQuery = supabase
      .from('products')
      .select('vendor_id')
      .eq('id', productId);

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

    // Get product's assigned pricing blueprints with vendor configs
    const { data: assignments, error: assignmentError } = await supabase
      .from('product_pricing_assignments')
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
      .eq('product_id', productId)
      .eq('is_active', true);

    if (assignmentError) {
      console.error('Error fetching product pricing assignments:', assignmentError);
    }

    // Get vendor's pricing configs for the assigned blueprints
    const blueprintIds = assignments?.map(a => a.blueprint_id) || [];
    
    let configs: any[] = [];
    if (blueprintIds.length > 0) {
      const { data: vendorConfigs, error: configError } = await supabase
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
        .in('blueprint_id', blueprintIds)
        .eq('is_active', true);
      
      if (configError) {
        console.error('Error fetching pricing configs:', configError);
        return NextResponse.json({
          success: true,
          pricingTiers: []
        });
      }
      
      configs = vendorConfigs || [];
    }

    // Transform vendor pricing configs to pricing tiers format
    const pricingTiers: any[] = [];

    if (configs && configs.length > 0) {
      // Prioritize pricing tiers by type:
      // 1. Product-specific assignments (via assignments)
      // 2. Category-based pricing
      // 3. Weight-based for flower/concentrates
      // 4. Quantity-based for other products
      // 5. Percentage-based (discounts) as secondary options
      
      // Group configs by tier type
      const weightBasedConfigs = configs.filter((c: any) => c.blueprint?.tier_type === 'weight');
      const quantityBasedConfigs = configs.filter((c: any) => c.blueprint?.tier_type === 'quantity');
      const percentageBasedConfigs = configs.filter((c: any) => c.blueprint?.tier_type === 'percentage');
      
      // Determine which config to use as primary
      let primaryConfig = null;
      
      // Check if product has assignments - use the first assignment's config
      if (assignments && assignments.length > 0) {
        const primaryBlueprintId = assignments[0].blueprint_id;
        primaryConfig = configs.find((c: any) => c.blueprint_id === primaryBlueprintId);
      }
      
      // If no primary config from assignments, use the most appropriate one
      if (!primaryConfig) {
        // For now, prefer weight-based if available (common for cannabis)
        primaryConfig = weightBasedConfigs[0] || quantityBasedConfigs[0];
      }
      
      // Only process the primary config if one exists
      if (primaryConfig) {
        const blueprint = primaryConfig.blueprint;
        const pricingValues = primaryConfig.pricing_values || {};

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
      }

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

