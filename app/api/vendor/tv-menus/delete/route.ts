import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const { menuId } = await request.json();

    if (!menuId) {
      return NextResponse.json({ success: false, error: "Menu ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // First unassign from all devices
    await supabase.from("tv_devices").update({ active_menu_id: null }).eq("active_menu_id", menuId);

    // Then delete menu
    const { error } = await supabase.from("tv_menus").delete().eq("id", menuId);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting menu:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in delete menu API:", error);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
