import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { getPaymentProcessorById } from "@/lib/payment-processors";

/**
 * GET /api/vendor/payment-processors
 * List all payment processors for vendor's locations
 */
export async function GET(request: NextRequest) {
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

    // Query payment processors
    let query = supabase
      .from("payment_processors")
      .select(
        `
        *,
        location:locations(id, name, slug)
      `,
      )
      .eq("vendor_id", userData.vendor_id)
      .order("created_at", { ascending: false });

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data: processors, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching payment processors:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch payment processors" },
        { status: 500 },
      );
    }

    return NextResponse.json({ processors });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Payment processors API error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/vendor/payment-processors
 * Create or update payment processor configuration
 */
export async function POST(request: NextRequest) {
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
    const { action, id, ...processorData } = body;

    // Handle different actions
    switch (action) {
      case "create":
        return await createProcessor(
          supabase,
          userData.vendor_id,
          user.id,
          processorData,
        );

      case "update":
        return await updateProcessor(
          supabase,
          userData.vendor_id,
          id,
          processorData,
        );

      case "delete":
        return await deleteProcessor(supabase, userData.vendor_id, id);

      case "test":
        return await testProcessor(id);

      case "set_default":
        return await setDefaultProcessor(
          supabase,
          userData.vendor_id,
          id,
          processorData.location_id,
        );

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Payment processors API error:", error);
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

async function createProcessor(
  supabase: any,
  vendorId: string,
  userId: string,
  data: any,
) {
  // Validate required fields
  if (!data.location_id || !data.processor_type || !data.processor_name) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: location_id, processor_type, processor_name",
      },
      { status: 400 },
    );
  }

  // Verify location belongs to vendor
  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", data.location_id)
    .eq("vendor_id", vendorId)
    .single();

  if (locationError || !location) {
    return NextResponse.json(
      { error: "Location not found or access denied" },
      { status: 403 },
    );
  }

  // Create processor
  const processorData = {
    vendor_id: vendorId,
    location_id: data.location_id,
    processor_type: data.processor_type,
    processor_name: data.processor_name,
    is_active: data.is_active ?? true,
    is_default: data.is_default ?? false,
    environment: data.environment || "production",
    created_by: userId,

    // Dejavoo fields
    dejavoo_authkey: data.dejavoo_authkey,
    dejavoo_tpn: data.dejavoo_tpn,
    dejavoo_merchant_id: data.dejavoo_merchant_id,
    dejavoo_store_number: data.dejavoo_store_number,
    dejavoo_v_number: data.dejavoo_v_number,

    // Other processor fields
    authorizenet_api_login_id: data.authorizenet_api_login_id,
    authorizenet_transaction_key: data.authorizenet_transaction_key,
    stripe_publishable_key: data.stripe_publishable_key,
    stripe_secret_key: data.stripe_secret_key,

    settings: data.settings || {},
  };

  const { data: processor, error } = await supabase
    .from("payment_processors")
    .insert(processorData)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating processor:", error);
    }
    return NextResponse.json(
      { error: "Failed to create processor" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    processor,
    message: "Payment processor created successfully",
  });
}

async function updateProcessor(
  supabase: any,
  vendorId: string,
  id: string,
  data: any,
) {
  if (!id) {
    return NextResponse.json(
      { error: "Processor ID required" },
      { status: 400 },
    );
  }

  // Verify processor belongs to vendor
  const { data: existing, error: checkError } = await supabase
    .from("payment_processors")
    .select("id")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single();

  if (checkError || !existing) {
    return NextResponse.json(
      { error: "Processor not found or access denied" },
      { status: 403 },
    );
  }

  // Update processor
  const updateData = {
    processor_name: data.processor_name,
    is_active: data.is_active,
    environment: data.environment,

    // Update processor-specific fields
    dejavoo_authkey: data.dejavoo_authkey,
    dejavoo_tpn: data.dejavoo_tpn,
    dejavoo_merchant_id: data.dejavoo_merchant_id,
    dejavoo_store_number: data.dejavoo_store_number,
    dejavoo_v_number: data.dejavoo_v_number,

    authorizenet_api_login_id: data.authorizenet_api_login_id,
    authorizenet_transaction_key: data.authorizenet_transaction_key,
    stripe_publishable_key: data.stripe_publishable_key,
    stripe_secret_key: data.stripe_secret_key,

    settings: data.settings,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(
    (key) =>
      updateData[key as keyof typeof updateData] === undefined &&
      delete updateData[key as keyof typeof updateData],
  );

  const { data: processor, error } = await supabase
    .from("payment_processors")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating processor:", error);
    }
    return NextResponse.json(
      { error: "Failed to update processor" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    processor,
    message: "Payment processor updated successfully",
  });
}

async function deleteProcessor(supabase: any, vendorId: string, id: string) {
  if (!id) {
    return NextResponse.json(
      { error: "Processor ID required" },
      { status: 400 },
    );
  }

  // Verify processor belongs to vendor
  const { data: existing, error: checkError } = await supabase
    .from("payment_processors")
    .select("id, is_default")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single();

  if (checkError || !existing) {
    return NextResponse.json(
      { error: "Processor not found or access denied" },
      { status: 403 },
    );
  }

  if (existing.is_default) {
    return NextResponse.json(
      {
        error:
          "Cannot delete default processor. Set another processor as default first.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("payment_processors")
    .delete()
    .eq("id", id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting processor:", error);
    }
    return NextResponse.json(
      { error: "Failed to delete processor" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Payment processor deleted successfully",
  });
}

async function testProcessor(id: string) {
  if (!id) {
    return NextResponse.json(
      { error: "Processor ID required" },
      { status: 400 },
    );
  }

  try {
    const processor = await getPaymentProcessorById(id);
    const success = await processor.testConnection();

    // Update test status
    const supabase = getServiceSupabase();
    await supabase
      .from("payment_processors")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_status: success ? "success" : "failed",
        last_test_error: success ? null : "Connection test failed",
      })
      .eq("id", id);

    return NextResponse.json({
      success,
      message: success
        ? "Connection test successful"
        : "Connection test failed",
    });
  } catch (error) {
    const supabase = getServiceSupabase();
    await supabase
      .from("payment_processors")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_status: "failed",
        last_test_error:
          error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", id);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 },
    );
  }
}

async function setDefaultProcessor(
  supabase: any,
  vendorId: string,
  id: string,
  locationId: string,
) {
  if (!id || !locationId) {
    return NextResponse.json(
      { error: "Processor ID and location ID required" },
      { status: 400 },
    );
  }

  // Verify processor belongs to vendor and location
  const { data: processor, error: checkError } = await supabase
    .from("payment_processors")
    .select("id, location_id")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .eq("location_id", locationId)
    .single();

  if (checkError || !processor) {
    return NextResponse.json(
      { error: "Processor not found or access denied" },
      { status: 403 },
    );
  }

  // Unset other defaults for this location
  await supabase
    .from("payment_processors")
    .update({ is_default: false })
    .eq("location_id", locationId)
    .eq("vendor_id", vendorId);

  // Set this processor as default
  const { data: updated, error } = await supabase
    .from("payment_processors")
    .update({ is_default: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error setting default processor:", error);
    }
    return NextResponse.json(
      { error: "Failed to set default processor" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    processor: updated,
    message: "Default processor updated successfully",
  });
}
