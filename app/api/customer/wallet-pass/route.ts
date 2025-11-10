import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/middleware";
import { createClient } from "@supabase/supabase-js";
import { walletPassGenerator } from "@/lib/wallet/pass-generator";
import { logger } from "@/lib/logger";
import { generatePassSerialNumber, generateAuthToken } from "@/lib/wallet/config";
import { toError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/customer/wallet-pass?customer_id=xxx&vendor_id=xxx
 * Generate and download Apple Wallet pass for customer
 */
export async function GET(request: NextRequest) {
  
  // SECURITY: Require customer authentication
  const authResult = await requireCustomer(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer_id");
    const vendorId = searchParams.get("vendor_id");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    // Get vendor data (use vendor_id if provided, otherwise get default)
    let vendor;
    if (vendorId) {
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .single();
      vendor = vendorData;
    } else {
      // Get first active vendor (or implement your own logic)
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "active")
        .limit(1)
        .single();
      vendor = vendorData;
    }

    if (!vendor) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    // Check if pass already exists for this customer
    let passRecord;
    const { data: existingPass } = await supabase
      .from("wallet_passes")
      .select("*")
      .eq("customer_id", customerId)
      .eq("vendor_id", vendor.id)
      .eq("status", "active")
      .single();

    if (existingPass) {
      // Pass exists, return updated version
      passRecord = existingPass;

      // Update pass data with latest customer info
      const updatedPassData = {
        points: customer.loyalty_points || 0,
        tier: customer.loyalty_tier || "Bronze",
        member_name: `${customer.first_name} ${customer.last_name}`,
        member_since: customer.created_at,
        barcode_message: `CUSTOMER-${customer.id.substring(0, 8).toUpperCase()}`,
      };

      await supabase
        .from("wallet_passes")
        .update({
          pass_data: updatedPassData,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", existingPass.id);

      passRecord = { ...existingPass, pass_data: updatedPassData };
    } else {
      // Create new pass record
      const serialNumber = generatePassSerialNumber();
      const authToken = generateAuthToken();

      const passData = {
        points: customer.loyalty_points || 0,
        tier: customer.loyalty_tier || "Bronze",
        member_name: `${customer.first_name} ${customer.last_name}`,
        member_since: customer.created_at,
        barcode_message: `CUSTOMER-${customer.id.substring(0, 8).toUpperCase()}`,
      };

      const { data: newPass, error: insertError } = await supabase
        .from("wallet_passes")
        .insert({
          customer_id: customerId,
          vendor_id: vendor.id,
          pass_type: "loyalty", // Required: loyalty, coupon, event, generic
          pass_serial_number: serialNumber,
          serial_number: serialNumber,
          authentication_token: authToken,
          pass_type_identifier: process.env.APPLE_PASS_TYPE_ID || "pass.com.whaletools.wallet",
          status: "active",
          pass_data: passData,
          is_active: true,
        })
        .select()
        .single();

      if (insertError || !newPass) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Failed to create pass record:", insertError);
        }
        return NextResponse.json(
          { success: false, error: "Failed to create pass" },
          { status: 500 },
        );
      }

      passRecord = newPass;
    }

    // Generate the .pkpass file
    const buffer = await walletPassGenerator.generatePass(customer, vendor, passRecord);

    // Log event
    await supabase.from("wallet_pass_events").insert({
      pass_id: passRecord.id,
      customer_id: customerId,
      event_type: "generated",
      user_agent: request.headers.get("user-agent") || undefined,
    });

    // Return the .pkpass file
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${vendor.slug}-loyalty-pass.pkpass"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Wallet pass generation error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate wallet pass",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
