import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET - List sections
 * POST - Create section
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const vendorId = searchParams.get('vendor_id');
    const pageType = searchParams.get('page_type');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Missing vendor_id' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('vendor_storefront_sections')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('section_order', { ascending: true });
    
    if (pageType) {
      query = query.eq('page_type', pageType);
    }
    
    const { data: sections, error } = await query;
    
    if (error) {
      console.error('Error fetching sections:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      sections: sections || []
    });
    
  } catch (error: any) {
    console.error('GET sections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, sectionKey, pageType, sectionOrder } = body;
    
    if (!vendorId || !sectionKey || !pageType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    const { data: section, error } = await supabase
      .from('vendor_storefront_sections')
      .insert({
        vendor_id: vendorId,
        section_key: sectionKey,
        page_type: pageType,
        section_order: sectionOrder ?? 0,
        content_data: {},
        is_enabled: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating section:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      section
    });
    
  } catch (error: any) {
    console.error('POST section error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

