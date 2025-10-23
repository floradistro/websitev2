import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('slug')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Return preview URL
    const previewUrl = `https://${vendor.slug}.yachtclub.com`;

    return NextResponse.json({ 
      success: true,
      previewUrl,
      slug: vendor.slug
    });
  } catch (error: any) {
    console.error('Error generating preview URL:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

