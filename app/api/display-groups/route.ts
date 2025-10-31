import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Display Groups API
 * Manage groups of displays for video wall cohesion
 */

/**
 * GET /api/display-groups?vendor_id=xxx
 * List all display groups for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get groups with their members
    const { data: groups, error } = await supabase
      .from('tv_display_groups')
      .select(`
        *,
        members:tv_display_group_members(
          *,
          device:tv_devices(
            id,
            device_name,
            tv_number,
            connection_status
          )
        )
      `)
      .eq('vendor_id', vendorId)
      .order('display_order');

    if (error) {
      console.error('Error fetching display groups:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      groups: groups || [],
    });
  } catch (error: any) {
    console.error('Display groups GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/display-groups
 * Create a new display group
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendorId,
      locationId,
      name,
      description,
      theme,
      displayMode,
      typography,
      spacing,
      gridColumns,
      gridRows,
      pricingTierId, // Which pricing tier (filters products)
      visible_price_breaks, // Which sizes to show (e.g., ['1g', '3_5g'])
      displayConfig,
      devices, // Array of { deviceId, position, categories }
    } = body;

    if (!vendorId || !name || !devices || devices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('tv_display_groups')
      .insert({
        vendor_id: vendorId,
        location_id: locationId,
        name,
        description,
        shared_theme: theme || 'midnight-elegance',
        shared_display_mode: displayMode || 'dense',
        shared_typography: typography || {
          productNameSize: 22,
          priceSize: 36,
          detailsSize: 16,
        },
        shared_spacing: spacing || {
          cardPadding: 16,
          gridGap: 16,
          margins: 24,
        },
        shared_grid_columns: gridColumns || 6, // Default to 6 columns (6×5 = 30 products)
        shared_grid_rows: gridRows || 5, // Default to 5 rows
        pricing_tier_id: pricingTierId || null, // Which tier of products to show
        visible_price_breaks: visible_price_breaks || [], // Which sizes to show
        display_config: displayConfig || {
          show_images: true,
          show_header: false,
          show_strain_type: true,
          show_thc: true,
          show_cbd: true,
          show_brand: false,
        },
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      return NextResponse.json(
        { success: false, error: groupError.message },
        { status: 500 }
      );
    }

    // Add members
    const memberInserts = devices.map((device: any) => ({
      group_id: group.id,
      device_id: device.deviceId,
      position_in_group: device.position,
      assigned_categories: device.categories || [],
    }));

    const { error: membersError } = await supabase
      .from('tv_display_group_members')
      .insert(memberInserts);

    if (membersError) {
      console.error('Error adding members:', membersError);
      // Rollback group creation
      await supabase.from('tv_display_groups').delete().eq('id', group.id);
      return NextResponse.json(
        { success: false, error: membersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error: any) {
    console.error('Display groups POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
