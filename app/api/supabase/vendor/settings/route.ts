import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;
    
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('vendor_settings')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No settings yet, return defaults
      return NextResponse.json({
        success: true,
        settings: {
          vendor_id: vendorId,
          notifications: {},
          payout_preferences: {},
          fulfillment_settings: {},
          tax_settings: {},
          business_info: {}
        }
      });
    }
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      settings: data
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;
    
    const body = await request.json();
    const supabase = getServiceSupabase();
    
    // Build update object
    const updates: any = { vendor_id: vendorId };
    
    if (body.notifications !== undefined) updates.notifications = body.notifications;
    if (body.payout_preferences !== undefined) updates.payout_preferences = body.payout_preferences;
    if (body.fulfillment_settings !== undefined) updates.fulfillment_settings = body.fulfillment_settings;
    if (body.tax_settings !== undefined) updates.tax_settings = body.tax_settings;
    if (body.business_info !== undefined) updates.business_info = body.business_info;
    
    const { data, error } = await supabase
      .from('vendor_settings')
      .upsert(updates, { onConflict: 'vendor_id' })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      settings: data
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

