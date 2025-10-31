import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/vendor/product-fields
 * Get all product fields for vendor (admin required + vendor custom)
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get vendor's custom product fields
    let vendorFieldsQuery = supabase
      .from('vendor_product_fields')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      vendorFieldsQuery = vendorFieldsQuery.or(`category_id.eq.${categoryId},category_id.is.null`);
    }

    const { data: vendorFields, error: vendorError } = await vendorFieldsQuery;
    
    if (vendorError) throw vendorError;

    // Format response - ONLY vendor fields
    const fields = (vendorFields || []).map(field => ({
      id: field.id,
      fieldId: field.field_id,
      definition: field.field_definition,
      categoryId: field.category_id,
      sortOrder: field.sort_order,
      ...field.field_definition // Spread definition fields at top level
    }));

    return NextResponse.json({
      success: true,
      fields
    });
  } catch (error: any) {
    console.error('Error fetching product fields:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/vendor/product-fields
 * Create a custom product field
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const { field_id, field_definition, category_id } = await request.json();

    if (!field_id || !field_definition) {
      return NextResponse.json({ 
        error: 'field_id and field_definition required' 
      }, { status: 400 });
    }

    // Validate field_definition has required properties
    if (!field_definition.type || !field_definition.label) {
      return NextResponse.json({ 
        error: 'field_definition must have type and label' 
      }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('vendor_product_fields')
      .insert({
        vendor_id: vendorId,
        field_id: field_id,
        field_definition: field_definition,
        category_id: category_id || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'A field with this ID already exists for this category' 
        }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      field: data,
      message: 'Product field added successfully' 
    });
  } catch (error: any) {
    console.error('Error adding product field:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/vendor/product-fields
 * Update a custom product field
 */
export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const { id, field_definition, category_id, is_active, sort_order } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Field ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Build update data
    const updateData: any = {};
    if (field_definition !== undefined) updateData.field_definition = field_definition;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from('vendor_product_fields')
      .update(updateData)
      .eq('id', id)
      .eq('vendor_id', vendorId) // Ensure vendor owns this field
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ 
        error: 'Field not found or unauthorized' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      field: data,
      message: 'Product field updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating product field:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/vendor/product-fields
 * Delete a custom product field
 */
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('vendor_product_fields')
      .delete()
      .eq('id', fieldId)
      .eq('vendor_id', vendorId); // Ensure vendor owns this field

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Product field deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting product field:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

