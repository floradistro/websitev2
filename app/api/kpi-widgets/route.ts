import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Fetch all KPI widgets for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Vendor ID is required" }, { status: 400 });
    }

    const { data: widgets, error } = await supabase
      .from("custom_kpi_widgets")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("is_visible", true)
      .order("position", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching KPI widgets:", error);
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch KPI widgets" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      widgets: widgets || [],
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in GET /api/kpi-widgets:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST - Save a new KPI widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, kpi } = body;

    if (!vendorId || !kpi) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get the current max position
    const { data: existingWidgets } = await supabase
      .from("custom_kpi_widgets")
      .select("position")
      .eq("vendor_id", vendorId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      existingWidgets && existingWidgets.length > 0 ? existingWidgets[0].position + 1 : 0;

    // Insert the new widget
    const { data: newWidget, error } = await supabase
      .from("custom_kpi_widgets")
      .insert({
        vendor_id: vendorId,
        title: kpi.title,
        value: String(kpi.value),
        subtitle: kpi.subtitle,
        change: kpi.change,
        change_label: kpi.changeLabel,
        visualization: kpi.visualization || "number",
        data: kpi.data || null,
        original_prompt: kpi.originalPrompt || "",
        query: kpi.query,
        position: nextPosition,
        is_visible: true,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error saving KPI widget:", error);
      }
      return NextResponse.json(
        { success: false, error: "Failed to save KPI widget" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      widget: newWidget,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST /api/kpi-widgets:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a KPI widget
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("id");

    if (!widgetId) {
      return NextResponse.json({ success: false, error: "Widget ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("custom_kpi_widgets").delete().eq("id", widgetId);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting KPI widget:", error);
      }
      return NextResponse.json(
        { success: false, error: "Failed to delete KPI widget" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in DELETE /api/kpi-widgets:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
