import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Save or update display profile
 * POST /api/ai/display-profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deviceId,
      vendorId,
      screenWidthInches,
      screenHeightInches,
      resolutionWidth,
      resolutionHeight,
      viewingDistanceFeet,
      locationType,
      ambientLighting,
      avgDwellTimeSeconds,
      customerBehavior,
      adjacentTo,
      storeType,
      brandVibe,
      targetAudience,
      businessGoals,
    } = body;

    if (!deviceId || !vendorId) {
      return NextResponse.json(
        { success: false, error: 'Device ID and Vendor ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if profile exists
    const { data: existing } = await supabase
      .from('tv_display_profiles')
      .select('id')
      .eq('device_id', deviceId)
      .single();

    let result;

    if (existing) {
      // Update existing profile
      result = await supabase
        .from('tv_display_profiles')
        .update({
          screen_width_inches: screenWidthInches,
          screen_height_inches: screenHeightInches,
          resolution_width: resolutionWidth,
          resolution_height: resolutionHeight,
          viewing_distance_feet: viewingDistanceFeet,
          location_type: locationType,
          ambient_lighting: ambientLighting,
          avg_dwell_time_seconds: avgDwellTimeSeconds,
          customer_behavior: customerBehavior || null,
          adjacent_to: adjacentTo || null,
          store_type: storeType,
          brand_vibe: brandVibe,
          target_audience: targetAudience || null,
          business_goals: businessGoals || [],
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabase
        .from('tv_display_profiles')
        .insert({
          device_id: deviceId,
          vendor_id: vendorId,
          screen_width_inches: screenWidthInches,
          screen_height_inches: screenHeightInches,
          resolution_width: resolutionWidth,
          resolution_height: resolutionHeight,
          viewing_distance_feet: viewingDistanceFeet,
          location_type: locationType,
          ambient_lighting: ambientLighting,
          avg_dwell_time_seconds: avgDwellTimeSeconds,
          customer_behavior: customerBehavior || null,
          adjacent_to: adjacentTo || null,
          store_type: storeType,
          brand_vibe: brandVibe,
          target_audience: targetAudience || null,
          business_goals: businessGoals || [],
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving profile:', result.error);
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profileId: result.data.id,
      profile: result.data,
    });
  } catch (error: any) {
    console.error('Save profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get display profile for a device
 * GET /api/ai/display-profile?deviceId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: profile, error } = await supabase
      .from('tv_display_profiles')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Profile not found', hasProfile: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
      hasProfile: true,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
