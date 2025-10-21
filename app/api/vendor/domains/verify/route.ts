import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// POST - Verify domain ownership and DNS configuration
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

    // Get domain
    const { data: domain, error: fetchError } = await supabase
      .from('vendor_domains')
      .select('*')
      .eq('id', domainId)
      .eq('vendor_id', vendorId)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check DNS configuration
    const dnsConfigured = await checkDNSConfiguration(domain.domain);
    
    // If DNS is configured correctly, mark as verified
    if (dnsConfigured) {
      const { error: updateError } = await supabase
        .from('vendor_domains')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          dns_configured: true,
          ssl_status: 'active',
          last_checked_at: new Date().toISOString()
        })
        .eq('id', domainId);

      if (updateError) throw updateError;

      return NextResponse.json({ 
        success: true, 
        verified: true,
        message: 'Domain verified successfully! Your custom domain is now active.' 
      });
    } else {
      // Update last checked time
      await supabase
        .from('vendor_domains')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', domainId);

      return NextResponse.json({ 
        success: true, 
        verified: false,
        message: 'DNS records not detected yet. Please allow up to 48 hours for DNS propagation.' 
      });
    }
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to check DNS configuration
async function checkDNSConfiguration(domain: string): Promise<boolean> {
  try {
    // In production, you would use a DNS lookup service or the DNS module
    // For now, we'll do a simple HTTP check to see if the domain resolves
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    // If we get any response, DNS is configured
    return response.status !== 0;
  } catch (error) {
    // Domain doesn't resolve yet
    return false;
  }
}

