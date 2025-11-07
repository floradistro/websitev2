import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

/**
 * GET /api/vendor/style
 * Fetch vendor's applied style preset (Wilson's Template)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json({ error: 'vendor_id required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get vendor's applied style (global)
    const { data: appliedStyle } = await supabase
      .from('vendor_applied_styles')
      .select(`
        style_overrides,
        preset:style_presets(
          color_palette,
          typography,
          spacing_scale,
          border_radius,
          effects
        )
      `)
      .eq('vendor_id', vendorId)
      .is('section_id', null) // Global style
      .single();

    if (appliedStyle && appliedStyle.preset) {
      // Merge preset with any overrides
      const style = {
        ...appliedStyle.preset,
        ...appliedStyle.style_overrides,
      };

      return NextResponse.json({ success: true, style });
    }

    // If no applied style, return default Wilson's
    return NextResponse.json({ 
      success: true, 
      style: null // Will use default in hook
    });

  } catch (error: any) {
    console.error('Error fetching style:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/vendor/style
 * Update vendor's style overrides
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const { overrides } = await request.json();

    const supabase = getServiceSupabase();

    // Upsert style overrides
    const { error } = await supabase
      .from('vendor_applied_styles')
      .upsert({
        vendor_id: vendorId,
        preset_id: 'b17045df-9bf8-4abe-8d5b-bfd09ed3ccd0', // Wilson's Template ID
        style_overrides: overrides,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating style:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

