import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 401 }
      );
    }
    
    const productId = id;
    const supabase = getServiceSupabase();
    
    // Get product with all details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        cost_price,
        description,
        status,
        stock_quantity,
        blueprint_fields,
        featured_image_storage,
        image_gallery_storage,
        primary_category_id,
        categories:primary_category_id(id, name)
      `)
      .eq('id', productId)
      .eq('vendor_id', vendorId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get COAs
    const { data: coas } = await supabase
      .from('vendor_coas')
      .select('*')
      .eq('product_id', productId)
      .eq('vendor_id', vendorId);

    // Get vendor pricing config (same as POS)
    const { data: vendorPricingConfig, error: pricingError } = await supabase
      .from('vendor_pricing_configs')
      .select(`
        pricing_values,
        blueprint:pricing_tier_blueprints(
          id,
          name,
          price_breaks
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .single();

    console.log(`[Product API] Vendor pricing config:`, vendorPricingConfig);
    if (pricingError) console.error('[Product API] Pricing error:', pricingError);

    // Extract pricing tiers from vendor config (same logic as POS)
    const pricing: any[] = [];
    const blueprint = Array.isArray(vendorPricingConfig?.blueprint)
      ? vendorPricingConfig.blueprint[0]
      : vendorPricingConfig?.blueprint;

    if (blueprint?.price_breaks && vendorPricingConfig) {
      const pricingValues = vendorPricingConfig.pricing_values || {};

      blueprint.price_breaks.forEach((priceBreak: any) => {
        const breakId = priceBreak.break_id;
        const vendorPrice = pricingValues[breakId];

        // Only add if tier is ENABLED and has a price
        if (vendorPrice && vendorPrice.enabled !== false && vendorPrice.price) {
          pricing.push({
            label: priceBreak.label || `${priceBreak.qty}${priceBreak.unit || ''}`,
            qty: priceBreak.qty || 1,
            unit: priceBreak.unit || 'g',
            price: parseFloat(vendorPrice.price),
            break_id: breakId,
            sort_order: priceBreak.sort_order || 0,
          });
        }
      });

      // Sort by sort_order
      pricing.sort((a, b) => a.sort_order - b.sort_order);
    }

    console.log(`[Product API] Extracted pricing tiers:`, pricing);

    // Extract custom fields - handle both array and object formats
    const custom_fields: any = {};
    if (product.blueprint_fields) {
      if (Array.isArray(product.blueprint_fields)) {
        // Legacy array format: [{ field_name: 'x', field_value: 'y' }]
        product.blueprint_fields.forEach((field: any) => {
          if (field) {
            // Handle both field_name/field_value and label/value formats
            const name = field.field_name || field.label || '';
            const value = field.field_value || field.value || '';

            if (name && value) {
              custom_fields[name.toLowerCase().replace(/\s+/g, '_')] = value;
            }
          }
        });
      } else if (typeof product.blueprint_fields === 'object') {
        // New object format: { field_name: value }
        Object.entries(product.blueprint_fields).forEach(([key, value]) => {
          if (key && value) {
            custom_fields[key.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        });
      }
    }

    // Get images
    const images: string[] = [];
    if (product.featured_image_storage) {
      images.push(product.featured_image_storage);
    }
    // Add gallery images
    if (product.image_gallery_storage && Array.isArray(product.image_gallery_storage)) {
      const additionalImages = product.image_gallery_storage.filter((img: string) => img && img !== product.featured_image_storage);
      images.push(...additionalImages);
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        category: product.categories?.name || '',
        category_id: product.primary_category_id || '',
        price: parseFloat(product.price) || 0,
        regular_price: parseFloat(product.price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        description: product.description || '',
        status: product.status || 'pending',
        stock_quantity: parseFloat(product.stock_quantity) || 0,
        total_stock: parseFloat(product.stock_quantity) || 0,
        custom_fields,
        blueprint_fields: product.blueprint_fields || {},
        coas: (coas || []).map(coa => ({
          id: coa.id,
          file_name: coa.file_name,
          file_url: coa.file_url,
          lab_name: coa.lab_name,
          test_date: coa.test_date,
          batch_number: coa.batch_number,
          test_results: coa.test_results,
          is_verified: coa.is_verified || false
        })),
        pricing_tiers: pricing.map((tier: any) => ({
          label: tier.label,
          quantity: tier.qty,
          unit: tier.unit,
          price: tier.price,
          min_quantity: tier.qty,
          max_quantity: null
        })),
        images
      }
    });
  } catch (error: any) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 401 }
      );
    }
    
    const productId = id;
    const body = await request.json();
    
    const supabase = getServiceSupabase();
    
    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, vendor_id')
      .eq('id', productId)
      .single();
    
    if (fetchError || !existing || existing.vendor_id !== vendorId) {
      return NextResponse.json(
        { success: false, error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (body.name) updateData.name = body.name;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.cost_price !== undefined) updateData.cost_price = body.cost_price;

    // Update custom fields - store as object format { field_name: value }
    if (body.custom_fields) {
      updateData.blueprint_fields = body.custom_fields;
    }

    // Update product
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updated
    });
  } catch (error: any) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
