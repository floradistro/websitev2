import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/vendor/custom-fields
 * Get all custom fields for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    
    const { data: customFields, error } = await supabase
      .from('vendor_custom_fields')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('section_key', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, customFields });
  } catch (error: any) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/vendor/custom-fields
 * Add a custom field
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const { section_key, field_id, field_definition, scope_type, scope_value } = await request.json();

    if (!field_id || !field_definition) {
      return NextResponse.json({ 
        error: 'field_id and field_definition required' 
      }, { status: 400 });
    }
    
    // Handle scope - use new system if provided, fall back to section_key
    const finalScopeType = scope_type || 'section_type';
    const finalScopeValue = scope_value || section_key || 'hero';
    const finalSectionKey = section_key || scope_value || 'hero';

    // Validate field_definition has required properties
    if (!field_definition.type || !field_definition.label) {
      return NextResponse.json({ 
        error: 'field_definition must have type and label' 
      }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('vendor_custom_fields')
      .insert({
        vendor_id: vendorId,
        section_key: finalSectionKey,
        field_id: field_id,
        field_definition: field_definition,
        scope_type: finalScopeType,
        scope_value: finalScopeValue
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'A custom field with this ID already exists for this section' 
        }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      customField: data,
      message: 'Custom field added successfully' 
    });
  } catch (error: any) {
    console.error('Error adding custom field:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/vendor/custom-fields
 * Remove a custom field
 */
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const customFieldId = url.searchParams.get('id');

    if (!customFieldId) {
      return NextResponse.json({ error: 'Custom field ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify ownership before deleting
    const { data: field, error: fetchError } = await supabase
      .from('vendor_custom_fields')
      .select('*')
      .eq('id', customFieldId)
      .eq('vendor_id', vendorId)
      .single();

    if (fetchError || !field) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    // Delete the custom field
    const { error: deleteError } = await supabase
      .from('vendor_custom_fields')
      .delete()
      .eq('id', customFieldId);

    if (deleteError) throw deleteError;

    // Note: The actual custom field VALUES in vendor_storefront_sections.custom_fields
    // will remain, but won't be editable anymore (which is fine - data preservation)

    return NextResponse.json({ 
      success: true, 
      message: 'Custom field removed successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting custom field:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

