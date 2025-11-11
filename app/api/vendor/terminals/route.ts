import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    // Get terminal ID from query params
    const { searchParams } = new URL(request.url);
    const terminalId = searchParams.get("id");

    if (!terminalId) {
      return NextResponse.json(
        { success: false, error: "Terminal ID required" },
        { status: 400 }
      );
    }

    // Get terminal with location info
    const { data: terminal, error: fetchError } = await supabase
      .from("pos_registers")
      .select("id, vendor_id, location_id, register_name, register_number, device_name, hardware_model, allow_cash, allow_card, payment_processor_id, status")
      .eq("id", terminalId)
      .single();

    if (fetchError || !terminal) {
      return NextResponse.json(
        { success: false, error: "Terminal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, terminal });
  } catch (error) {
    logger.error("Error in GET /api/vendor/terminals", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    // Get terminal ID from query params
    const { searchParams } = new URL(request.url);
    const terminalId = searchParams.get("id");

    if (!terminalId) {
      return NextResponse.json(
        { success: false, error: "Terminal ID required" },
        { status: 400 }
      );
    }

    // Verify terminal belongs to user's vendor before deleting
    const { data: terminal, error: fetchError } = await supabase
      .from("pos_registers")
      .select("id, vendor_id, location_id")
      .eq("id", terminalId)
      .single();

    if (fetchError || !terminal) {
      return NextResponse.json(
        { success: false, error: "Terminal not found" },
        { status: 404 }
      );
    }

    // Delete the terminal
    const { error: deleteError } = await supabase
      .from("pos_registers")
      .delete()
      .eq("id", terminalId);

    if (deleteError) {
      logger.error("Failed to delete terminal", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete terminal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in DELETE /api/vendor/terminals", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    const body = await request.json();
    const {
      locationId,
      registerName,
      registerNumber,
      deviceName,
      hardwareModel,
      allowCash,
      allowCard,
      paymentProcessorId,
    } = body;

    // Validate required fields
    if (!locationId || !registerName || !registerNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify location belongs to vendor
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .eq("vendor_id", vendorId)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { success: false, error: "Location not found or access denied" },
        { status: 403 }
      );
    }

    // Create the terminal
    const { data: terminal, error: terminalError} = await supabase
      .from("pos_registers")
      .insert({
        location_id: locationId,
        vendor_id: vendorId,
        register_name: registerName,
        register_number: registerNumber,
        device_name: deviceName || null,
        hardware_model: hardwareModel || null,
        allow_cash: allowCash ?? true,
        allow_card: allowCard ?? true,
        payment_processor_id: paymentProcessorId || null,
        status: "active",
      })
      .select()
      .single();

    if (terminalError) {
      logger.error("Failed to create terminal", terminalError);
      return NextResponse.json(
        { success: false, error: "Failed to create terminal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      terminal,
    });
  } catch (error) {
    logger.error("Error in POST /api/vendor/terminals", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    // Get terminal ID from query params
    const { searchParams } = new URL(request.url);
    const terminalId = searchParams.get("id");

    if (!terminalId) {
      return NextResponse.json(
        { success: false, error: "Terminal ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      registerName,
      registerNumber,
      deviceName,
      hardwareModel,
      allowCash,
      allowCard,
      paymentProcessorId,
    } = body;

    // Validate required fields
    if (!registerName || !registerNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify terminal belongs to user's vendor before updating
    const { data: terminal, error: fetchError } = await supabase
      .from("pos_registers")
      .select("id, vendor_id, location_id")
      .eq("id", terminalId)
      .single();

    if (fetchError || !terminal) {
      return NextResponse.json(
        { success: false, error: "Terminal not found" },
        { status: 404 }
      );
    }

    // Update the terminal
    const { data: updatedTerminal, error: updateError } = await supabase
      .from("pos_registers")
      .update({
        register_name: registerName,
        register_number: registerNumber,
        device_name: deviceName || null,
        hardware_model: hardwareModel || null,
        allow_cash: allowCash ?? true,
        allow_card: allowCard ?? true,
        payment_processor_id: paymentProcessorId || null,
      })
      .eq("id", terminalId)
      .select()
      .single();

    if (updateError) {
      logger.error("Failed to update terminal", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update terminal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      terminal: updatedTerminal,
    });
  } catch (error) {
    logger.error("Error in PUT /api/vendor/terminals", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
