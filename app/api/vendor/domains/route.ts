import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// GET - List all domains for a vendor
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    
    const { data: domains, error } = await supabase
      .from('vendor_domains')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, domains });
  } catch (error: any) {
    console.error('Error fetching vendor domains:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a new custom domain
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Clean and validate domain
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Basic domain validation
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if domain already exists
    const { data: existing } = await supabase
      .from('vendor_domains')
      .select('id, vendor_id')
      .eq('domain', cleanDomain)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'This domain is already registered to a vendor' 
      }, { status: 409 });
    }

    // Create domain entry
    const { data: newDomain, error } = await supabase
      .from('vendor_domains')
      .insert({
        vendor_id: vendorId,
        domain: cleanDomain,
        verified: false,
        dns_configured: false,
        ssl_status: 'pending',
        is_primary: false,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      domain: newDomain,
      message: 'Domain added successfully. Please configure DNS and verify ownership.'
    });
  } catch (error: any) {
    console.error('Error adding domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a custom domain
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('id');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify domain belongs to vendor
    const { data: domain } = await supabase
      .from('vendor_domains')
      .select('id')
      .eq('id', domainId)
      .eq('vendor_id', vendorId)
      .single();

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('vendor_domains')
      .delete()
      .eq('id', domainId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Domain removed successfully' });
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

