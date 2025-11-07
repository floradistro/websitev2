import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID required' }, { status: 400 });
    }

    // Check if Vercel is configured
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Vercel integration not configured',
        message: 'Please set VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables'
      }, { status: 500 });
    }

    const supabase = getServiceSupabase();

    // Get domain info
    const { data: domain, error: domainError } = await supabase
      .from('vendor_domains')
      .select('*')
      .eq('id', domainId)
      .eq('vendor_id', vendorId)
      .single();

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (!domain.verified) {
      return NextResponse.json({ 
        error: 'Domain must be verified before adding to Vercel' 
      }, { status: 400 });
    }

    // Add domain to Vercel
    const vercelApiUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`;

    const vercelResponse = await fetch(vercelApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain.domain
      })
    });

    if (!vercelResponse.ok) {
      const errorData = await vercelResponse.json().catch(() => ({}));
      
      // If domain already exists in Vercel, that's okay
      if (errorData.error?.code === 'domain_already_in_use') {
        return NextResponse.json({ 
          success: true, 
          message: 'Domain already configured in Vercel',
          alreadyExists: true
        });
      }

      throw new Error(errorData.error?.message || 'Failed to add domain to Vercel');
    }

    const vercelData = await vercelResponse.json();

    // Update domain metadata with Vercel info
    await supabase
      .from('vendor_domains')
      .update({ 
        metadata: {
          ...domain.metadata,
          vercel_added: true,
          vercel_added_at: new Date().toISOString(),
          vercel_response: vercelData
        }
      })
      .eq('id', domainId);

    return NextResponse.json({ 
      success: true, 
      message: 'Domain added to Vercel successfully',
      vercelData
    });
  } catch (error: any) {
    console.error('Error adding domain to Vercel:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to add domain to Vercel' 
    }, { status: 500 });
  }
}

// Remove domain from Vercel
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;
    const domainName = request.nextUrl.searchParams.get('domain');
    
    if (!vendorId || !domainName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Vercel integration not configured' 
      }, { status: 500 });
    }

    const vercelApiUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domainName}?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domainName}`;

    const vercelResponse = await fetch(vercelApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!vercelResponse.ok) {
      const errorData = await vercelResponse.json().catch(() => ({}));
      console.error('Vercel delete error:', errorData);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Domain removed from Vercel'
    });
  } catch (error: any) {
    console.error('Error removing domain from Vercel:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

