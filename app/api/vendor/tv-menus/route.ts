import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

/**
 * GET - List all TV menus for a vendor
 */
export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();

  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendor_id");
    const locationId = searchParams.get("location_id");
    const isActive = searchParams.get("is_active");
    const isTemplate = searchParams.get("is_template");

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "vendor_id is required",
        },
        { status: 400 },
      );
    }

    let query = supabase
      .from("tv_menus")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (isTemplate !== null) {
      query = query.eq("is_template", isTemplate === "true");
    }

    const { data: menus, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching TV menus:", error);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      menus: menus || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("TV menus API error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch TV menus",
      },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new TV menu
 */
export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const {
      vendor_id,
      location_id,
      name,
      description,
      config_data,
      menu_type = "product_menu",
      is_active = false,
      is_template = false,
    } = body;

    if (!vendor_id || !name || !config_data) {
      return NextResponse.json(
        {
          success: false,
          error: "vendor_id, name, and config_data are required",
        },
        { status: 400 },
      );
    }

    const { data: menu, error } = await supabase
      .from("tv_menus")
      .insert({
        vendor_id,
        location_id,
        name,
        description,
        config_data,
        menu_type,
        is_active,
        is_template,
        subscription_status: "active",
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating TV menu:", error);
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      menu,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("TV menu creation error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create TV menu",
      },
      { status: 500 },
    );
  }
}
