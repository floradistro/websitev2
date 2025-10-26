import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET - Fetch vendor's cost-plus pricing configurations
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    const { data: configs, error } = await supabase
      .from('vendor_cost_plus_configs')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cost-plus configs:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      configs: configs || []
    });

  } catch (error: any) {
    console.error('Cost-plus pricing GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch configurations'
    }, { status: 500 });
  }
}

/**
 * POST - Create or update cost-plus pricing configuration
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, cost_unit, markup_tiers, applies_to_categories } = body;

    if (!name || !markup_tiers || markup_tiers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Name and markup tiers are required'
      }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Create config
    const { data: config, error } = await supabase
      .from('vendor_cost_plus_configs')
      .insert({
        vendor_id: vendorId,
        name,
        cost_unit: cost_unit || 'pound',
        markup_tiers,
        applies_to_categories: applies_to_categories || [],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cost-plus config:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Cost-plus pricing config created:', config.name);

    return NextResponse.json({
      success: true,
      config,
      message: 'Configuration saved successfully'
    });

  } catch (error: any) {
    console.error('Cost-plus pricing POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save configuration'
    }, { status: 500 });
  }
}





