import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// POST /api/pos/registers/identify - Identify/claim a register for this device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, locationId, registerId } = body;

    if (!deviceId || !locationId) {
      return NextResponse.json({ error: "deviceId and locationId are required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // If registerId provided, claim that specific register
    if (registerId) {
      const { data: register, error } = await supabase
        .from("pos_registers")
        .update({
          device_id: deviceId,
          last_active_at: new Date().toISOString(),
          last_ip_address:
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        })
        .eq("id", registerId)
        .eq("location_id", locationId)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error claiming register:", err);
        }
        return NextResponse.json({ error: "Failed to claim register" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        register,
        message: `Device claimed register ${register.register_number}`,
      });
    }

    // Otherwise, try to find existing register by device ID
    const { data: existingRegister } = await supabase
      .from("pos_registers")
      .select("*")
      .eq("device_id", deviceId)
      .eq("location_id", locationId)
      .eq("status", "active")
      .single();

    if (existingRegister) {
      // Update last active
      await supabase
        .from("pos_registers")
        .update({
          last_active_at: new Date().toISOString(),
          last_ip_address:
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        })
        .eq("id", existingRegister.id);

      return NextResponse.json({
        success: true,
        register: existingRegister,
        message: `Device identified as ${existingRegister.register_number}`,
      });
    }

    // No existing register found - need to manually assign one
    const { data: availableRegisters } = await supabase
      .from("pos_registers")
      .select("*")
      .eq("location_id", locationId)
      .eq("status", "active")
      .is("device_id", null)
      .order("register_number")
      .limit(10);

    return NextResponse.json({
      success: false,
      needsAssignment: true,
      availableRegisters: availableRegisters || [],
      message: "Please select a register for this device",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST /api/pos/registers/identify:", err);
    }
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
