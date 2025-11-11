import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import type { AAMVAData } from "@/lib/id-scanner/aamva-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ScanIDRequest {
  scannedData: AAMVAData;
  vendorId: string;
  locationId: string;
}

/**
 * POST /api/pos/customers/scan-id
 * Handles ID scan -> customer lookup/creation flow
 * 1. Searches for existing customer by DL# or name+DOB
 * 2. If not found, creates new customer with scanned data
 * 3. Returns customer record
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const supabase = getServiceSupabase();

  try {
    const body = (await request.json()) as ScanIDRequest;
    const { scannedData, vendorId, locationId } = body;

    if (!scannedData || !vendorId || !locationId) {
      return NextResponse.json(
        { error: "Missing required fields: scannedData, vendorId, locationId" },
        { status: 400 }
      );
    }

    logger.info("[ID Scan] Searching for customer", {
      licenseNumber: scannedData.licenseNumber,
      name: `${scannedData.firstName} ${scannedData.lastName}`,
      dob: scannedData.dateOfBirth,
    });

    // Step 1: Search for existing customer
    let customer = null;

    // First, try to find by driver's license number (most accurate)
    if (scannedData.licenseNumber) {
      const { data: dlMatch } = await supabase
        .from("customers")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("drivers_license_number", scannedData.licenseNumber)
        .single();

      if (dlMatch) {
        logger.info("[ID Scan] Found customer by DL#", { customerId: dlMatch.id });
        customer = dlMatch;
      }
    }

    // If not found by DL#, try name + DOB
    if (!customer && scannedData.firstName && scannedData.lastName && scannedData.dateOfBirth) {
      const { data: nameMatches } = await supabase
        .from("customers")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("first_name", scannedData.firstName)
        .eq("last_name", scannedData.lastName)
        .eq("date_of_birth", scannedData.dateOfBirth);

      if (nameMatches && nameMatches.length > 0) {
        logger.info("[ID Scan] Found customer by name+DOB", { customerId: nameMatches[0].id });
        customer = nameMatches[0];
      }
    }

    // Step 2: If customer exists, return it
    if (customer) {
      return NextResponse.json({
        success: true,
        customer,
        isNew: false,
        message: "Customer found",
      });
    }

    // Step 3: Create new customer
    logger.info("[ID Scan] Creating new customer", {
      name: `${scannedData.firstName} ${scannedData.lastName}`,
    });

    const fullAddress = [
      scannedData.streetAddress,
      scannedData.city,
      scannedData.state,
      scannedData.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert({
        vendor_id: vendorId,
        first_name: scannedData.firstName || "",
        last_name: scannedData.lastName || "",
        email: null, // Will be added later if needed
        phone: null, // Will be added later if needed
        date_of_birth: scannedData.dateOfBirth,
        drivers_license_number: scannedData.licenseNumber,
        address: fullAddress || null,
        city: scannedData.city,
        state: scannedData.state,
        zip_code: scannedData.zipCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      logger.error("[ID Scan] Failed to create customer", createError);
      throw createError;
    }

    logger.info("[ID Scan] New customer created", { customerId: newCustomer.id });

    return NextResponse.json({
      success: true,
      customer: newCustomer,
      isNew: true,
      message: "New customer created",
    });
  } catch (error) {
    const err = toError(error);
    logger.error("[ID Scan] Error processing ID scan", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process ID scan",
      },
      { status: 500 }
    );
  }
}
