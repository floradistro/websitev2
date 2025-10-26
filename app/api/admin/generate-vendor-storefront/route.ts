import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { vendorId } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendorId is required' },
        { status: 400 }
      );
    }

    // Fetch vendor data from database
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Call MCP Agent to generate storefront
    const agentResponse = await fetch('http://localhost:3001/api/generate-storefront', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer yacht-club-secret-key-2025',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vendorId: vendor.id,
        vendorData: {
          store_name: vendor.store_name || vendor.business_name,
          slug: vendor.slug,
          vendor_type: vendor.vendor_type || 'retail',
          store_tagline: vendor.tagline || `Welcome to ${vendor.store_name}`
        }
      })
    });

    const result = await agentResponse.json();

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Storefront generation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

