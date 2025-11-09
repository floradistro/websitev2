import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';
import type {
  VendorBranding,
  GetBrandingResponse,
  BrandingError
} from '@/types/branding';

export async function GET(request: NextRequest): Promise<NextResponse<GetBrandingResponse | BrandingError>> {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('vendors')
      .select('logo_url, banner_url, store_description, store_tagline, brand_colors, social_links, custom_css, custom_font, business_hours, return_policy, shipping_policy')
      .eq('id', vendorId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branding: data as VendorBranding
    });

  } catch (error) {
    console.error('Error fetching branding:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<GetBrandingResponse | BrandingError>> {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const supabase = getServiceSupabase();

    // Build update object with proper typing
    const updates: Partial<VendorBranding> = {};

    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.banner_url !== undefined) updates.banner_url = body.banner_url;
    if (body.store_description !== undefined) updates.store_description = body.store_description;
    if (body.store_tagline !== undefined) updates.store_tagline = body.store_tagline;
    if (body.brand_colors !== undefined) updates.brand_colors = body.brand_colors;
    if (body.social_links !== undefined) updates.social_links = body.social_links;
    if (body.custom_css !== undefined) updates.custom_css = body.custom_css;
    if (body.custom_font !== undefined) updates.custom_font = body.custom_font;
    if (body.business_hours !== undefined) updates.business_hours = body.business_hours;
    if (body.return_policy !== undefined) updates.return_policy = body.return_policy;
    if (body.shipping_policy !== undefined) updates.shipping_policy = body.shipping_policy;

    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branding: data as VendorBranding
    });

  } catch (error) {
    console.error('Error updating branding:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

