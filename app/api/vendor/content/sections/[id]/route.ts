import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * DELETE - Delete section
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { vendorId } = body;
    const { id: sectionId } = await params;
    
    if (!vendorId || !sectionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Delete all components in this section first
    await supabase
      .from('vendor_component_instances')
      .delete()
      .eq('section_id', sectionId);
    
    // Delete the section
    const { error } = await supabase
      .from('vendor_storefront_sections')
      .delete()
      .eq('id', sectionId)
      .eq('vendor_id', vendorId);
    
    if (error) {
      console.error('Error deleting section:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Section deleted'
    });
    
  } catch (error: any) {
    console.error('DELETE section error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

