import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get vendor's pricing configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id is required' },
        { status: 400 }
      );
    }

    // Get vendor's pricing configs with blueprint details
    const { data: configs, error: configError } = await supabase
      .from('vendor_pricing_configs')
      .select(`
        *,
        blueprint:pricing_tier_blueprints (
          id,
          name,
          slug,
          description,
          tier_type,
          price_breaks,
          is_active
        )
      `)
      .eq('vendor_id', vendorId);

    if (configError) throw configError;

    // Get available blueprints that vendor hasn't configured yet
    const configuredBlueprintIds = (configs || []).map((c: any) => c.blueprint_id);
    
    let blueprintsQuery = supabase
      .from('pricing_tier_blueprints')
      .select('*')
      .eq('is_active', true);
    
    // Only apply the NOT IN filter if there are configured blueprints
    if (configuredBlueprintIds.length > 0) {
      blueprintsQuery = blueprintsQuery.not('id', 'in', `(${configuredBlueprintIds.join(',')})`);
    }
    
    const { data: availableBlueprints, error: blueprintsError } = await blueprintsQuery
      .order('display_order', { ascending: true });

    if (blueprintsError) throw blueprintsError;

    return NextResponse.json({
      success: true,
      configs: configs || [],
      available_blueprints: availableBlueprints || []
    });
  } catch (error: any) {
    console.error('Error fetching vendor pricing configs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create vendor pricing configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      vendor_id, 
      blueprint_id, 
      pricing_values,
      notes = null,
      is_active = true
    } = body;

    if (!vendor_id || !blueprint_id || !pricing_values) {
      return NextResponse.json(
        { success: false, error: 'vendor_id, blueprint_id, and pricing_values are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vendor_pricing_configs')
      .insert({
        vendor_id,
        blueprint_id,
        pricing_values,
        notes,
        is_active
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      config: data
    });
  } catch (error: any) {
    console.error('Error creating vendor pricing config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update vendor pricing configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, vendor_id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Verify vendor owns this config
    const { data: existing, error: fetchError } = await supabase
      .from('vendor_pricing_configs')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (vendor_id && existing.vendor_id !== vendor_id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('vendor_pricing_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      config: data
    });
  } catch (error: any) {
    console.error('Error updating vendor pricing config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete vendor pricing configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const vendorId = searchParams.get('vendor_id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Verify vendor owns this config
    if (vendorId) {
      const { data: existing, error: fetchError } = await supabase
        .from('vendor_pricing_configs')
        .select('vendor_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (existing.vendor_id !== vendorId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from('vendor_pricing_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting vendor pricing config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

