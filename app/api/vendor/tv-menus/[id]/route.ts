import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

/**
 * GET - Get single TV menu by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getServiceSupabase();

  try {
    const { id } = await context.params;

    const { data: menu, error } = await supabase
      .from("tv_menus")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching TV menu:", error);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      menu,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("TV menu fetch error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch TV menu",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update TV menu
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getServiceSupabase();

  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      name,
      description,
      config_data,
      menu_type,
      is_active,
      is_template,
      display_order,
    } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (config_data !== undefined) updates.config_data = config_data;
    if (menu_type !== undefined) updates.menu_type = menu_type;
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_template !== undefined) updates.is_template = is_template;
    if (display_order !== undefined) updates.display_order = display_order;

    const { data: menu, error } = await supabase
      .from("tv_menus")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating TV menu:", error);
      }
      throw error;
    }

    // If menu was activated, send update command to all devices using this menu
    if (is_active && menu) {
      await sendMenuUpdateCommand(menu.id);
    }

    return NextResponse.json({
      success: true,
      menu,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("TV menu update error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update TV menu",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete TV menu
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getServiceSupabase();

  try {
    const { id } = await context.params;

    const { error } = await supabase.from("tv_menus").delete().eq("id", id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting TV menu:", error);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("TV menu deletion error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete TV menu",
      },
      { status: 500 },
    );
  }
}

/**
 * Helper: Send update command to all devices using this menu
 */
async function sendMenuUpdateCommand(menuId: string) {
  const supabase = getServiceSupabase();

  try {
    // Get all devices using this menu
    const { data: devices } = await supabase
      .from("tv_devices")
      .select("id")
      .eq("active_menu_id", menuId);

    if (!devices || devices.length === 0) return;

    // Send reload command to each device
    const commands = devices.map((device) => ({
      tv_device_id: device.id,
      command_type: "reload",
      payload: { menu_id: menuId },
    }));

    await supabase.from("tv_commands").insert(commands);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error sending menu update commands:", error);
    }
  }
}
