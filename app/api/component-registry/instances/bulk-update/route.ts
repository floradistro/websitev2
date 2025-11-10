/**
 * API: Bulk update component instances
 * POST /api/component-registry/instances/bulk-update
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, instances } = body;

    if (!vendorId || !instances) {
      return NextResponse.json(
        { success: false, error: "vendorId and instances are required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Update each instance
    for (const instance of instances) {
      if (instance.id.startsWith("temp_")) {
        // New component - insert
        const { id, ...insertData } = instance;
        await supabase.from("vendor_component_instances").insert({
          ...insertData,
          vendor_id: vendorId,
        });
      } else {
        // Existing component - update
        await supabase
          .from("vendor_component_instances")
          .update({
            props: instance.props,
            field_bindings: instance.field_bindings,
            position_order: instance.position_order,
            is_enabled: instance.is_enabled,
            is_visible: instance.is_visible,
          })
          .eq("id", instance.id)
          .eq("vendor_id", vendorId);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Components updated successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Bulk update error:", error);
    }
    return NextResponse.json(
      { success: false, error: "Failed to update components" },
      { status: 500 },
    );
  }
}
