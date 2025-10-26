import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function PATCH(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { product_id, updates } = body;
    
    if (!product_id || !updates) {
      return NextResponse.json(
        { success: false, error: 'Product ID and updates required' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Verify product belongs to vendor
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, vendor_id')
      .eq('id', product_id)
      .single();
    
    if (fetchError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    if (product.vendor_id !== vendorId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.cost_price !== undefined) updateData.cost_price = updates.cost_price;
    if (updates.description !== undefined) updateData.description = updates.description;
    
    // Handle custom fields - save to blueprint_fields in proper format
    if (updates.custom_fields) {
      const fieldsArray = Object.entries(updates.custom_fields).map(([field_name, field_value]) => {
        // Convert field_name to proper label format (e.g., thc_percentage → THC Content)
        const labelMap: any = {
          'thc_percentage': 'THC Content',
          'cbd_percentage': 'CBD Content',
          'strain_type': 'Strain Type',
          'lineage': 'Genetics',
          'terpenes': 'Dominant Terpenes',
          'effects': 'Effects',
          'nose': 'Aroma',
          'taste': 'Flavors'
        };
        
        return {
          type: 'text',
          label: labelMap[field_name] || field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: field_value
        };
      }).filter(f => f.value); // Only include non-empty values
      
      updateData.blueprint_fields = fieldsArray;
    }
    
    console.log('Updating product with data:', updateData);
    
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating product:', updateError);
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
    console.error('Product update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

