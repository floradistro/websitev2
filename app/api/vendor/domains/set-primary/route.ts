import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// POST - Set a domain as primary
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify domain belongs to vendor and is verified
    const { data: domain, error: fetchError } = await supabase
      .from('vendor_domains')
      .select('*')
      .eq('id', domainId)
      .eq('vendor_id', vendorId)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (!domain.verified) {
      return NextResponse.json({ 
        error: 'Domain must be verified before setting as primary' 
      }, { status: 400 });
    }

    // Unset all other primary domains for this vendor
    await supabase
      .from('vendor_domains')
      .update({ is_primary: false })
      .eq('vendor_id', vendorId);

    // Set this domain as primary
    const { error: updateError } = await supabase
      .from('vendor_domains')
      .update({ is_primary: true })
      .eq('id', domainId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      message: 'Primary domain updated successfully' 
    });
  } catch (error: any) {
    console.error('Error setting primary domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

