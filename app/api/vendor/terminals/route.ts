import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { requireVendor } from "@/lib/auth/middleware";
/**
 * GET /api/vendor/terminals
 * List all POS terminals/registers for vendor
 */
export async function GET(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's vendor_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("vendor_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.vendor_id) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Get location filter from query
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");

    // Use the terminal_overview view for comprehensive data
    let query = supabase
      .from("terminal_overview")
      .select("*")
      .eq("vendor_id", userData.vendor_id)
      .order("location_name", { ascending: true });

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data: terminals, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching terminals:", error);
      }
      return NextResponse.json({ error: "Failed to fetch terminals" }, { status: 500 });
    }

    return NextResponse.json({ terminals });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Terminals API error:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/vendor/terminals
 * Create or update terminal configuration
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's vendor_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("vendor_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.vendor_id) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, id, ...terminalData } = body;

    // Handle different actions
    switch (action) {
      case "create":
        return await createTerminal(supabase, userData.vendor_id, terminalData);

      case "update":
        return await updateTerminal(supabase, userData.vendor_id, id, terminalData);

      case "delete":
        return await deleteTerminal(supabase, userData.vendor_id, id);

      case "activate":
        return await setTerminalStatus(supabase, userData.vendor_id, id, "active");

      case "deactivate":
        return await setTerminalStatus(supabase, userData.vendor_id, id, "inactive");

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Terminals API error:", error);
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function createTerminal(supabase: any, vendorId: string, data: any) {
  // Validate required fields
  if (!data.location_id || !data.register_name) {
    return NextResponse.json(
      { error: "Missing required fields: location_id, register_name" },
      { status: 400 },
    );
  }

  // Verify location belongs to vendor
  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id, name")
    .eq("id", data.location_id)
    .eq("vendor_id", vendorId)
    .single();

  if (locationError || !location) {
    return NextResponse.json({ error: "Location not found or access denied" }, { status: 403 });
  }

  // Generate register number if not provided
  if (!data.register_number) {
    const locationCode = location.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 3);

    // Count existing registers for this location
    const { count } = await supabase
      .from("pos_registers")
      .select("*", { count: "exact", head: true })
      .eq("location_id", data.location_id);

    data.register_number = `REG-${locationCode}-${String((count || 0) + 1).padStart(3, "0")}`;
  }

  // Get default payment processor for location if not specified
  if (!data.payment_processor_id) {
    const { data: defaultProcessor } = await supabase
      .from("payment_processors")
      .select("id")
      .eq("location_id", data.location_id)
      .eq("is_default", true)
      .eq("is_active", true)
      .single();

    if (defaultProcessor) {
      data.payment_processor_id = defaultProcessor.id;
    }
  }

  // Create terminal
  const terminalData = {
    vendor_id: vendorId,
    location_id: data.location_id,
    register_number: data.register_number,
    register_name: data.register_name,
    device_name: data.device_name,
    device_type: data.device_type || "android_tablet",
    payment_processor_id: data.payment_processor_id,
    dejavoo_config_id: data.dejavoo_config_id,
    processor_type: data.processor_type,
    hardware_model: data.hardware_model,
    serial_number: data.serial_number,
    status: data.status || "active",
    allow_cash: data.allow_cash ?? true,
    allow_card: data.allow_card ?? true,
    allow_refunds: data.allow_refunds ?? true,
    allow_voids: data.allow_voids ?? true,
    supports_nfc: data.supports_nfc ?? false,
    supports_emv: data.supports_emv ?? false,
    supports_magstripe: data.supports_magstripe ?? false,
    supports_ebt: data.supports_ebt ?? false,
    settings: data.settings || {},
  };

  const { data: terminal, error } = await supabase
    .from("pos_registers")
    .insert(terminalData)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error creating terminal:", error);
    }
    return NextResponse.json({ error: "Failed to create terminal" }, { status: 500 });
  }

  return NextResponse.json({
    terminal,
    message: "Terminal created successfully",
  });
}

async function updateTerminal(supabase: any, vendorId: string, id: string, data: any) {
  if (!id) {
    return NextResponse.json({ error: "Terminal ID required" }, { status: 400 });
  }

  // Verify terminal belongs to vendor
  const { data: existing, error: checkError } = await supabase
    .from("pos_registers")
    .select("id")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single();

  if (checkError || !existing) {
    return NextResponse.json({ error: "Terminal not found or access denied" }, { status: 403 });
  }

  // Update terminal
  const updateData = {
    register_name: data.register_name,
    device_name: data.device_name,
    device_type: data.device_type,
    payment_processor_id: data.payment_processor_id,
    dejavoo_config_id: data.dejavoo_config_id,
    processor_type: data.processor_type,
    hardware_model: data.hardware_model,
    serial_number: data.serial_number,
    firmware_version: data.firmware_version,
    status: data.status,
    allow_cash: data.allow_cash,
    allow_card: data.allow_card,
    allow_refunds: data.allow_refunds,
    allow_voids: data.allow_voids,
    supports_nfc: data.supports_nfc,
    supports_emv: data.supports_emv,
    supports_magstripe: data.supports_magstripe,
    supports_ebt: data.supports_ebt,
    default_printer_id: data.default_printer_id,
    require_manager_approval: data.require_manager_approval,
    settings: data.settings,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(
    (key) =>
      updateData[key as keyof typeof updateData] === undefined &&
      delete updateData[key as keyof typeof updateData],
  );

  const { data: terminal, error } = await supabase
    .from("pos_registers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error updating terminal:", error);
    }
    return NextResponse.json({ error: "Failed to update terminal" }, { status: 500 });
  }

  return NextResponse.json({
    terminal,
    message: "Terminal updated successfully",
  });
}

async function deleteTerminal(supabase: any, vendorId: string, id: string) {
  if (!id) {
    return NextResponse.json({ error: "Terminal ID required" }, { status: 400 });
  }

  // Verify terminal belongs to vendor
  const { data: existing, error: checkError } = await supabase
    .from("pos_registers")
    .select("id, current_session_id")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single();

  if (checkError || !existing) {
    return NextResponse.json({ error: "Terminal not found or access denied" }, { status: 403 });
  }

  // Check if terminal has an active session
  if (existing.current_session_id) {
    return NextResponse.json(
      {
        error: "Cannot delete terminal with active session. Close the session first.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("pos_registers").delete().eq("id", id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error deleting terminal:", error);
    }
    return NextResponse.json({ error: "Failed to delete terminal" }, { status: 500 });
  }

  return NextResponse.json({ message: "Terminal deleted successfully" });
}

async function setTerminalStatus(supabase: any, vendorId: string, id: string, status: string) {
  if (!id) {
    return NextResponse.json({ error: "Terminal ID required" }, { status: 400 });
  }

  // Verify terminal belongs to vendor
  const { data: existing, error: checkError } = await supabase
    .from("pos_registers")
    .select("id, current_session_id")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single();

  if (checkError || !existing) {
    return NextResponse.json({ error: "Terminal not found or access denied" }, { status: 403 });
  }

  // Don't allow deactivation if there's an active session
  if (status === "inactive" && existing.current_session_id) {
    return NextResponse.json(
      {
        error: "Cannot deactivate terminal with active session. Close the session first.",
      },
      { status: 400 },
    );
  }

  const { data: terminal, error } = await supabase
    .from("pos_registers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error updating terminal status:", error);
    }
    return NextResponse.json({ error: "Failed to update terminal status" }, { status: 500 });
  }

  return NextResponse.json({
    terminal,
    message: `Terminal ${status === "active" ? "activated" : "deactivated"} successfully`,
  });
}
