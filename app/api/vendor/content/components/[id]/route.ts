import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * PUT - Update component instance
 * DELETE - Delete component instance
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { vendorId, ...updates } = body;
    const { id: componentId } = await params;
    
    if (!vendorId || !componentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Verify component belongs to vendor's section
    const { data: component, error: verifyError } = await supabase
      .from('vendor_component_instances')
      .select('section_id, vendor_storefront_sections!inner(vendor_id)')
      .eq('id', componentId)
      .single();
    
    if (verifyError || !component) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }
    
    // Check vendor ownership
    const section: any = component;
    if (section.vendor_storefront_sections?.vendor_id !== vendorId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Update component
    const { data: updated, error } = await supabase
      .from('vendor_component_instances')
      .update(updates)
      .eq('id', componentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating component:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      component: updated
    });
    
  } catch (error: any) {
    console.error('PUT component error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { vendorId } = body;
    const { id: componentId } = await params;
    
    if (!vendorId || !componentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Verify component belongs to vendor's section
    const { data: component, error: verifyError } = await supabase
      .from('vendor_component_instances')
      .select('section_id, vendor_storefront_sections!inner(vendor_id)')
      .eq('id', componentId)
      .single();
    
    if (verifyError || !component) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }
    
    // Check vendor ownership
    const section: any = component;
    if (section.vendor_storefront_sections?.vendor_id !== vendorId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete component
    const { error } = await supabase
      .from('vendor_component_instances')
      .delete()
      .eq('id', componentId);
    
    if (error) {
      console.error('Error deleting component:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Component deleted'
    });
    
  } catch (error: any) {
    console.error('DELETE component error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

