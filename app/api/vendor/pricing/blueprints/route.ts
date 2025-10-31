import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/vendor/pricing/blueprints?vendor_id=xxx
 * Get all pricing blueprints for a vendor (for selecting pricing tiers)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get all pricing blueprints for this vendor
    const { data: blueprints, error } = await supabase
      .from('pricing_blueprints')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('name');

    if (error) {
      console.error('Error fetching pricing blueprints:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      blueprints: blueprints || [],
    });
  } catch (error: any) {
    console.error('Pricing blueprints GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
