import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor/pricing-configs-for-display
 * Get vendor pricing configs for TV display (bypasses RLS)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    console.log('💵 Fetching pricing configs for vendor:', vendorId);

    const { data: configs, error } = await supabase
      .from('vendor_pricing_configs')
      .select('blueprint_id, pricing_values')
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching pricing configs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${configs?.length || 0} pricing configs for vendor ${vendorId}`);
    if (configs && configs.length > 0) {
      console.log('   Blueprint IDs:', configs.map(c => c.blueprint_id).join(', '));
    }

    return NextResponse.json({
      success: true,
      configs: configs || []
    });
  } catch (error: any) {
    console.error('Pricing configs API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
