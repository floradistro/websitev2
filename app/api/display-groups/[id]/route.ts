import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * DELETE /api/display-groups/[id]
 * Delete a display group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('tv_display_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting display group:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Display group DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/display-groups/[id]
 * Update a display group - GROUPING ONLY (name, description, category assignment)
 * All config (grid, theme, pricing, display settings) is in main menu editor per category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      devices, // Array of { deviceId, position, categories }
    } = body;

    const supabase = getServiceSupabase();

    // Update group - ONLY grouping configuration
    const updateData: any = {
      name,
      description,
      updated_at: new Date().toISOString(),
      // Removed ALL config: grid, theme, display_mode, typography, spacing, pricing, displayConfig
    };

    const { data: group, error: groupError } = await supabase
      .from('tv_display_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (groupError) {
      console.error('Error updating display group:', groupError);
      return NextResponse.json(
        { success: false, error: groupError.message },
        { status: 500 }
      );
    }

    // Update members if devices array is provided
    if (devices && devices.length > 0) {
      // Delete existing members
      await supabase
        .from('tv_display_group_members')
        .delete()
        .eq('group_id', id);

      // Insert new members
      const memberInserts = devices.map((device: any) => ({
        group_id: id,
        device_id: device.deviceId,
        position_in_group: device.position,
        assigned_categories: device.categories || [],
      }));

      const { error: membersError } = await supabase
        .from('tv_display_group_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('Error updating members:', membersError);
        return NextResponse.json(
          { success: false, error: membersError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error: any) {
    console.error('Display group PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
