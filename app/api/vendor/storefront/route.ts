import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch vendor's current storefront settings
export async function GET(request: NextRequest) {
  try {
    // Try to get vendor ID from various sources
    const vendorId = request.cookies.get('vendor_id')?.value ||
                     request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, slug, template_id, template_config, logo_url, brand_colors, store_name, hero_headline, hero_subheadline, hero_image_url')
      .eq('id', vendorId)
      .single();

    if (error || !vendor) {
      console.error('Vendor fetch error:', error);
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error('GET /api/vendor/storefront error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// PUT - Update vendor's template selection
export async function PUT(request: NextRequest) {
  try {
    // Try to get vendor ID from various sources
    const vendorId = request.cookies.get('vendor_id')?.value ||
                     request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { template_id, template_config } = body;

    // Validate template_id
    const validTemplates = ['minimalist', 'default', 'luxury', 'bold', 'organic'];
    if (template_id && !validTemplates.includes(template_id)) {
      return NextResponse.json({ success: false, error: 'Invalid template' }, { status: 400 });
    }

    // Build updates object
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (template_id) updates.template_id = template_id;
    if (template_config !== undefined) updates.template_config = template_config;

    // Update vendor's template
    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId);

    if (error) {
      console.error('Template update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Template updated successfully',
      template_id: template_id 
    });
  } catch (error) {
    console.error('PUT /api/vendor/storefront error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

