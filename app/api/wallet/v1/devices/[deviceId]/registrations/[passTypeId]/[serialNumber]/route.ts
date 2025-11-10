/**
 * Apple Wallet Web Service API
 * Device Registration Endpoint
 *
 * POST /api/wallet/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
 * - Register a device to receive push notifications for a pass
 *
 * DELETE /api/wallet/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
 * - Unregister a device from push notifications
 *
 * GET /api/wallet/v1/devices/:deviceId/registrations/:passTypeId
 * - Get serial numbers for passes registered to a device
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface RouteParams {
  params: Promise<{
    deviceId: string;
    passTypeId: string;
    serialNumber: string;
  }>;
}

/**
 * POST - Register device for pass updates
 */
export async function POST(request: NextRequest, segmentData: RouteParams) {
  const params = await segmentData.params;
  try {
    const { deviceId, passTypeId, serialNumber } = params;
    const authHeader = request.headers.get("authorization");

    // Extract auth token
    const authToken = authHeader?.replace("ApplePass ", "");

    if (!authToken) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    // Verify pass exists and token is valid
    const { data: pass, error: passError } = await supabase
      .from("wallet_passes")
      .select("*")
      .eq("serial_number", serialNumber)
      .eq("authentication_token", authToken)
      .eq("status", "active")
      .single();

    if (passError || !pass) {
      return NextResponse.json(
        { error: "Invalid pass or token" },
        { status: 401 },
      );
    }

    // Get push token from request body
    const body = await request.json();
    const pushToken = body.pushToken;

    if (!pushToken) {
      return NextResponse.json(
        { error: "Push token required" },
        { status: 400 },
      );
    }

    // Update pass devices array
    const devices = Array.isArray(pass.devices) ? pass.devices : [];
    const existingDeviceIndex = devices.findIndex(
      (d: any) => d.device_id === deviceId,
    );

    if (existingDeviceIndex >= 0) {
      // Update existing device
      devices[existingDeviceIndex] = {
        device_id: deviceId,
        push_token: pushToken,
        registered_at: new Date().toISOString(),
      };
    } else {
      // Add new device
      devices.push({
        device_id: deviceId,
        push_token: pushToken,
        registered_at: new Date().toISOString(),
      });
    }

    // Update database
    await supabase
      .from("wallet_passes")
      .update({
        devices,
        added_to_wallet_at: pass.added_to_wallet_at || new Date().toISOString(),
      })
      .eq("id", pass.id);

    // Log event
    await supabase.from("wallet_pass_events").insert({
      pass_id: pass.id,
      customer_id: pass.customer_id,
      event_type: "device_registered",
      device_id: deviceId,
      push_token: pushToken,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Device registration error:", error);
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

/**
 * DELETE - Unregister device from pass updates
 */
export async function DELETE(request: NextRequest, segmentData: RouteParams) {
  const params = await segmentData.params;
  try {
    const { deviceId, serialNumber } = params;
    const authHeader = request.headers.get("authorization");
    const authToken = authHeader?.replace("ApplePass ", "");

    if (!authToken) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    // Verify pass
    const { data: pass, error: passError } = await supabase
      .from("wallet_passes")
      .select("*")
      .eq("serial_number", serialNumber)
      .eq("authentication_token", authToken)
      .single();

    if (passError || !pass) {
      return NextResponse.json(
        { error: "Invalid pass or token" },
        { status: 401 },
      );
    }

    // Remove device from array
    const devices = Array.isArray(pass.devices) ? pass.devices : [];
    const updatedDevices = devices.filter((d: any) => d.device_id !== deviceId);

    // Update database
    await supabase
      .from("wallet_passes")
      .update({ devices: updatedDevices })
      .eq("id", pass.id);

    // Log event
    await supabase.from("wallet_pass_events").insert({
      pass_id: pass.id,
      customer_id: pass.customer_id,
      event_type: "device_unregistered",
      device_id: deviceId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Device unregistration error:", error);
    }
    return NextResponse.json(
      { error: "Unregistration failed" },
      { status: 500 },
    );
  }
}
