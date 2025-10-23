import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const vendorId = searchParams.get('vendor_id');

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('vendors')
      .select('*')
      .eq('status', 'active');

    if (slug) {
      query = query.eq('slug', slug);
    } else if (vendorId) {
      query = query.eq('id', vendorId);
    }

    const { data, error } = slug || vendorId ? await query.single() : await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      vendors: slug || vendorId ? [data] : data,
      vendor: slug || vendorId ? data : null
    });

  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

