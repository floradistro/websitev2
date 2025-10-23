import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Initialize a new storefront for code generation
 * POST /api/ai-agent/init-storefront
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceSupabase();
    
    // Check if vendor already has a storefront in progress
    const { data: existing } = await supabase
      .from('vendor_storefronts')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json({
        success: true,
        storefrontId: existing.id,
        isNew: false,
      });
    }
    
    // Create new storefront
    const { data: storefront, error } = await supabase
      .from('vendor_storefronts')
      .insert({
        vendor_id: vendorId,
        status: 'draft',
        template: 'custom',
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log(`✅ Created storefront: ${storefront.id}`);
    
    return NextResponse.json({
      success: true,
      storefrontId: storefront.id,
      isNew: true,
    });
    
  } catch (error: any) {
    console.error('❌ Init storefront error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

