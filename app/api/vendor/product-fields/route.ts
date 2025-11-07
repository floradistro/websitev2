import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

/**
 * GET /api/vendor/product-fields
 * Get all product fields for vendor with inheritance support
 *
 * Steve Jobs Style: Subcategories inherit parent fields automatically
 * - Fields "just work" without the user thinking about hierarchy
 * - Subcategory-specific fields come first, then inherited parent fields
 * - Inherited fields are marked so UI can show subtle indicator
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // NO CATEGORY ID PROVIDED - Return all vendor fields for categories list view
    if (!categoryId) {
      const { data: allFields, error } = await supabase
        .from('vendor_product_fields')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const fields = (allFields || []).map(field => ({
        id: field.id,
        fieldId: field.field_id,
        definition: field.field_definition,
        categoryId: field.category_id,
        sortOrder: field.sort_order,
        inherited: false,
        source: field.category_id ? 'category' : 'global',
        ...field.field_definition
      }));

      return NextResponse.json({
        success: true,
        fields
      });
    }

    // CATEGORY ID PROVIDED - Return fields with inheritance
    // Check if it's a subcategory
    let parentCategoryId: string | null = null;
    const { data: category } = await supabase
      .from('categories')
      .select('parent_id')
      .eq('id', categoryId)
      .single();

    parentCategoryId = category?.parent_id || null;

    // Get subcategory-specific fields
    const subcategoryFields: any[] = [];
    const { data: subcatData, error: subcatError } = await supabase
      .from('vendor_product_fields')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!subcatError && subcatData) {
      subcategoryFields.push(...subcatData);
    }

    // Get parent category fields (if this is a subcategory)
    const parentFields: any[] = [];
    if (parentCategoryId) {
      const { data, error } = await supabase
        .from('vendor_product_fields')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('category_id', parentCategoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        parentFields.push(...data);
      }
    }

    // Get category-agnostic fields (no category_id)
    const globalFields: any[] = [];
    const { data: globalData, error: globalError } = await supabase
      .from('vendor_product_fields')
      .select('*')
      .eq('vendor_id', vendorId)
      .is('category_id', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!globalError && globalData) {
      globalFields.push(...globalData);
    }

    // Merge fields: subcategory-specific > parent inherited > global
    // Remove duplicates (subcategory fields override parent fields with same field_id)
    const fieldMap = new Map();

    // Add parent fields first (lowest priority)
    parentFields.forEach(field => {
      fieldMap.set(field.field_id, {
        id: field.id,
        fieldId: field.field_id,
        definition: field.field_definition,
        categoryId: field.category_id,
        sortOrder: field.sort_order,
        inherited: true, // Mark as inherited from parent
        source: 'parent',
        ...field.field_definition
      });
    });

    // Add global fields (mid priority)
    globalFields.forEach(field => {
      if (!fieldMap.has(field.field_id)) {
        fieldMap.set(field.field_id, {
          id: field.id,
          fieldId: field.field_id,
          definition: field.field_definition,
          categoryId: field.category_id,
          sortOrder: field.sort_order,
          inherited: false,
          source: 'global',
          ...field.field_definition
        });
      }
    });

    // Add subcategory-specific fields last (highest priority - can override)
    subcategoryFields.forEach(field => {
      fieldMap.set(field.field_id, {
        id: field.id,
        fieldId: field.field_id,
        definition: field.field_definition,
        categoryId: field.category_id,
        sortOrder: field.sort_order,
        inherited: false,
        source: 'category',
        ...field.field_definition
      });
    });

    const fields = Array.from(fieldMap.values());

    return NextResponse.json({
      success: true,
      fields,
      _debug: {
        categoryId,
        parentCategoryId,
        subcategoryFieldsCount: subcategoryFields.length,
        parentFieldsCount: parentFields.length,
        globalFieldsCount: globalFields.length,
        totalMerged: fields.length
      }
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
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

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
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

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
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;
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

