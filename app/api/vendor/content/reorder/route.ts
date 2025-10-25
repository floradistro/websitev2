import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Reorder Sections
 * POST /api/vendor/content/reorder
 */
export async function POST(request: NextRequest) {
  try {
    const { vendorId, sections } = await request.json();
    
    if (!vendorId || !sections) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Update section orders in bulk
    for (const section of sections) {
      await supabase
        .from('vendor_content_sections')
        .update({ section_order: section.section_order })
        .eq('id', section.id)
        .eq('vendor_id', vendorId);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Section order updated',
    });
    
  } catch (error: any) {
    console.error('Reorder sections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}

