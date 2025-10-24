// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all content sections for vendor
export async function GET(request: NextRequest) {
  try {
    // Get vendor_id from multiple sources
    const vendorId = request.cookies.get('vendor_id')?.value ||
                     request.headers.get('x-vendor-id') ||
                     request.nextUrl.searchParams.get('vendor_id');

    if (!vendorId) {
      console.error('No vendor_id found');
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const pageType = request.nextUrl.searchParams.get('page_type') || null;

    let query = supabase
      .from('vendor_storefront_sections')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('page_type', { ascending: true })
      .order('section_order', { ascending: true });

    if (pageType) {
      query = query.eq('page_type', pageType);
    }

    const { data: sections, error } = await query;

    if (error) {
      console.error('Error fetching sections:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sections: sections || [] });
  } catch (error) {
    console.error('GET /api/vendor/content error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// POST - Create or update a content section
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.cookies.get('vendor_id')?.value ||
                     request.headers.get('x-vendor-id') ||
                     request.nextUrl.searchParams.get('vendor_id');

    if (!vendorId) {
      console.error('POST: No vendor_id found');
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { page_type, section_key, content_data, section_order, is_enabled } = body;

    if (!page_type || !section_key || !content_data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: page_type, section_key, content_data' 
      }, { status: 400 });
    }

    // Upsert section
    const { data, error } = await supabase
      .from('vendor_storefront_sections')
      .upsert({
        vendor_id: vendorId,
        page_type,
        section_key,
        content_data,
        section_order: section_order || 0,
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'vendor_id,page_type,section_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting section:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, section: data });
  } catch (error) {
    console.error('POST /api/vendor/content error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// DELETE - Delete a content section
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.cookies.get('vendor_id')?.value ||
                     request.headers.get('x-vendor-id') ||
                     request.nextUrl.searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const pageType = request.nextUrl.searchParams.get('page_type');
    const sectionKey = request.nextUrl.searchParams.get('section_key');

    if (!pageType || !sectionKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required params: page_type, section_key' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('vendor_storefront_sections')
      .delete()
      .eq('vendor_id', vendorId)
      .eq('page_type', pageType)
      .eq('section_key', sectionKey);

    if (error) {
      console.error('Error deleting section:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    console.error('DELETE /api/vendor/content error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// PUT - Toggle section visibility
export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.cookies.get('vendor_id')?.value ||
                     request.headers.get('x-vendor-id') ||
                     request.nextUrl.searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { page_type, section_key, is_enabled } = body;

    if (!page_type || !section_key || is_enabled === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: page_type, section_key, is_enabled' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('vendor_storefront_sections')
      .update({ 
        is_enabled, 
        updated_at: new Date().toISOString() 
      })
      .eq('vendor_id', vendorId)
      .eq('page_type', pageType)
      .eq('section_key', sectionKey);

    if (error) {
      console.error('Error updating section visibility:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Section visibility updated' });
  } catch (error) {
    console.error('PUT /api/vendor/content error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

