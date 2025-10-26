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
    
    // Get admin-defined field groups for category
    let adminFieldsQuery = supabase
      .from('category_field_groups')
      .select(`
        id,
        is_required,
        display_order,
        field_group:field_groups(
          id,
          name,
          slug,
          description,
          fields,
          scope,
          is_active
        ),
        category:categories(id, name, slug)
      `)
      .eq('field_group.is_active', true);

    if (categoryId) {
      adminFieldsQuery = adminFieldsQuery.eq('category_id', categoryId);
    }

    const { data: adminAssignments, error: adminError } = await adminFieldsQuery;
    
    if (adminError) throw adminError;

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

    // Format response
    const response = {
      adminFields: (adminAssignments || []).map((assignment: any) => ({
        id: assignment.field_group?.id,
        name: assignment.field_group?.name,
        slug: assignment.field_group?.slug,
        description: assignment.field_group?.description,
        fields: assignment.field_group?.fields,
        scope: assignment.field_group?.scope,
        isRequired: assignment.is_required,
        category: assignment.category,
        source: 'admin'
      })),
      vendorFields: (vendorFields || []).map(field => ({
        id: field.id,
        fieldId: field.field_id,
        definition: field.field_definition,
        categoryId: field.category_id,
        sortOrder: field.sort_order,
        source: 'vendor'
      })),
      merged: [] as any[]
    };

    // Merge fields for easy consumption
    const mergedFields = [];
    
    // Add admin fields first
    for (const adminFieldGroup of response.adminFields) {
      if (Array.isArray(adminFieldGroup.fields)) {
        for (const field of adminFieldGroup.fields) {
          mergedFields.push({
            ...field,
            source: 'admin',
            groupName: adminFieldGroup.name,
            isRequired: adminFieldGroup.isRequired,
            readonly: true // Vendors can't edit admin fields
          });
        }
      }
    }
    
    // Add vendor fields
    for (const vendorField of response.vendorFields) {
      mergedFields.push({
        ...vendorField.definition,
        id: vendorField.fieldId,
        source: 'vendor',
        readonly: false // Vendors can edit their own fields
      });
    }

    response.merged = mergedFields;

    return NextResponse.json({
      success: true,
      ...response
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

