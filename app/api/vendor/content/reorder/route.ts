import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Reorder Sections - Optimized Bulk Update
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
    
    // Use Promise.all for parallel updates (much faster)
    const updates = sections.map((section: any) =>
      supabase
        .from('vendor_storefront_sections')
        .update({ section_order: section.section_order })
        .eq('id', section.id)
        .eq('vendor_id', vendorId)
    );
    
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Reorder errors:', errors);
      return NextResponse.json(
        { success: false, error: 'Some updates failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${sections.length} sections`,
    });
    
  } catch (error: any) {
    console.error('Reorder sections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}
