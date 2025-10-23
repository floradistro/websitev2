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
    console.log('🔍 Checking DNS for:', domain.domain);
    const dnsConfigured = await checkDNSConfiguration(domain.domain);
    console.log('📊 DNS check result:', dnsConfigured);
    
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

      // Automatically add domain to Vercel
      console.log('🚀 Auto-adding domain to Vercel...');
      try {
        await addDomainToVercel(domain.domain, domainId);
        console.log('✅ Domain added to Vercel successfully!');
      } catch (vercelError: any) {
        console.error('⚠️  Vercel add failed (non-critical):', vercelError.message);
        // Don't fail verification if Vercel add fails
      }

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

// Helper function to add domain to Vercel
async function addDomainToVercel(domain: string, domainId: string): Promise<void> {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    throw new Error('Vercel credentials not configured');
  }

  const supabase = getServiceSupabase();

  // Add root domain
  const vercelApiUrl = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`;

  const rootResponse = await fetch(vercelApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: domain })
  });

  if (!rootResponse.ok && rootResponse.status !== 409) {
    const error = await rootResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to add root domain');
  }

  // Add www subdomain
  const wwwResponse = await fetch(vercelApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: `www.${domain}` })
  });

  if (!wwwResponse.ok && wwwResponse.status !== 409) {
    console.warn('Failed to add www subdomain (non-critical)');
  }

  // Update domain metadata
  await supabase
    .from('vendor_domains')
    .update({
      metadata: {
        vercel_added: true,
        vercel_added_at: new Date().toISOString()
      }
    })
    .eq('id', domainId);
}

// Helper function to check DNS configuration
async function checkDNSConfiguration(domain: string): Promise<boolean> {
  try {
    // Use Google's DNS-over-HTTPS API to check A records
    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`,
      {
        headers: {
          'Accept': 'application/dns-json'
        }
      }
    );
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    console.log('🌐 DNS A records:', JSON.stringify(data.Answer, null, 2));
    
    // Check if any A records point to Vercel IPs
    const vercelIPs = ['76.76.21.21', '76.76.21.142'];
    const hasVercelIP = data.Answer?.some((record: any) => 
      record.type === 1 && vercelIPs.includes(record.data)
    );
    
    console.log('✅ Has Vercel IP:', hasVercelIP);
    
    if (hasVercelIP) {
      return true;
    }
    
    // Also check CNAME for www subdomain
    const wwwResponse = await fetch(
      `https://dns.google/resolve?name=www.${domain}&type=CNAME`,
      {
        headers: {
          'Accept': 'application/dns-json'
        }
      }
    );
    
    if (wwwResponse.ok) {
      const wwwData = await wwwResponse.json();
      const hasCNAME = wwwData.Answer?.some((record: any) => 
        record.type === 5 && record.data.includes('vercel-dns.com')
      );
      
      return hasCNAME;
    }
    
    return false;
  } catch (error) {
    console.error('DNS check error:', error);
    return false;
  }
}

