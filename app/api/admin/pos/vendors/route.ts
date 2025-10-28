import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET - Get all vendors with their POS status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, store_name, slug, logo_url, email, status, pos_enabled')
      .order('store_name');
    
    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendors' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      vendors
    });
    
  } catch (error: any) {
    console.error('Get vendors error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update vendor POS status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, pos_enabled } = body;
    
    if (!vendorId || typeof pos_enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Vendor ID and pos_enabled (boolean) are required' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    const { data: vendor, error } = await supabase
      .from('vendors')
      .update({ pos_enabled, updated_at: new Date().toISOString() })
      .eq('id', vendorId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating vendor POS status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update vendor POS status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      vendor,
      message: `POS ${pos_enabled ? 'enabled' : 'disabled'} for ${vendor.store_name}`
    });
    
  } catch (error: any) {
    console.error('Update vendor POS error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



