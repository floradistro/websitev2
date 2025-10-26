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
        product_categories(
          category:categories(name)
        )
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

    // Get pricing tiers
    const { data: pricing } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('product_id', productId);

    // Extract custom fields - handle both formats
    const custom_fields: any = {};
    if (product.blueprint_fields && Array.isArray(product.blueprint_fields)) {
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
    }

    // Get images
    const images: string[] = [];
    if (product.featured_image_storage) {
      const publicUrl = `https://uaednwpxursknmwdeejn.supabase.co/storage/v1/object/public/vendor-product-images/${product.featured_image_storage}`;
      images.push(publicUrl);
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        category: (product.product_categories?.[0]?.category as any)?.name || '',
        price: parseFloat(product.price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        description: product.description || '',
        status: product.status || 'pending',
        stock_quantity: parseFloat(product.stock_quantity) || 0,
        custom_fields,
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
        pricing_tiers: (pricing || []).map(tier => ({
          id: tier.id,
          label: tier.label || tier.tier_name,
          quantity: tier.quantity,
          unit: tier.unit || 'g',
          price: tier.price,
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity
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

    // Update custom fields
    if (body.custom_fields) {
      const fieldsArray = Object.entries(body.custom_fields).map(([field_name, field_value]) => ({
        field_name,
        field_value
      }));
      updateData.blueprint_fields = fieldsArray;
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
