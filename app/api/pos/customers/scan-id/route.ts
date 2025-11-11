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

    // If not found by DL#, try exact name + DOB match
    if (!customer && scannedData.firstName && scannedData.lastName && scannedData.dateOfBirth) {
      const { data: nameMatches } = await supabase
        .from("customers")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("first_name", scannedData.firstName)
        .eq("last_name", scannedData.lastName)
        .eq("date_of_birth", scannedData.dateOfBirth);

      if (nameMatches && nameMatches.length > 0) {
        logger.info("[ID Scan] Found customer by exact name+DOB", { customerId: nameMatches[0].id });
        customer = nameMatches[0];
      }
    }

    // If still not found, try fuzzy matching on name variants
    if (!customer && scannedData.firstName && scannedData.lastName && scannedData.dateOfBirth) {
      const { data: allCustomers } = await supabase
        .from("customers")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("date_of_birth", scannedData.dateOfBirth);

      if (allCustomers && allCustomers.length > 0) {
        const firstName = scannedData.firstName.toLowerCase().trim();
        const lastName = scannedData.lastName.toLowerCase().trim();

        // Find potential matches with name similarity
        const potentialMatches = allCustomers
          .map((c) => {
            const cFirst = (c.first_name || "").toLowerCase().trim();
            const cLast = (c.last_name || "").toLowerCase().trim();

            // Calculate similarity score
            let score = 0;

            // Exact match on last name is critical (highest weight)
            if (cLast === lastName) score += 50;
            // Last name starts with same (typos, truncation)
            else if (cLast.startsWith(lastName) || lastName.startsWith(cLast)) score += 30;
            // Last name contains (hyphenated names)
            else if (cLast.includes(lastName) || lastName.includes(cLast)) score += 20;

            // First name exact match
            if (cFirst === firstName) score += 30;
            // First name starts with same (nicknames, abbreviations)
            else if (cFirst.startsWith(firstName) || firstName.startsWith(cFirst)) score += 20;
            // First name contains
            else if (cFirst.includes(firstName) || firstName.includes(cFirst)) score += 10;

            // Middle name matching (if present in scanned data)
            if (scannedData.middleName && c.first_name) {
              const middle = scannedData.middleName.toLowerCase().trim();
              const fullName = c.first_name.toLowerCase().trim();
              if (fullName.includes(middle)) score += 15;
            }

            return { customer: c, score };
          })
          .filter((m) => m.score >= 50) // Only consider strong matches
          .sort((a, b) => b.score - a.score);

        if (potentialMatches.length > 0) {
          const bestMatch = potentialMatches[0];
          logger.info("[ID Scan] Found fuzzy match", {
            customerId: bestMatch.customer.id,
            score: bestMatch.score,
            matchName: `${bestMatch.customer.first_name} ${bestMatch.customer.last_name}`,
            scannedName: `${scannedData.firstName} ${scannedData.lastName}`,
          });
          customer = bestMatch.customer;
        }
      }
    }

    // Step 2: If customer exists, return for confirmation
    if (customer) {
      // Check if it's an exact match (DL#) or fuzzy match (name/DOB)
      const isExactMatch =
        scannedData.licenseNumber && customer.drivers_license_number === scannedData.licenseNumber;

      return NextResponse.json({
        success: true,
        customer,
        isNew: false,
        requiresConfirmation: !isExactMatch, // Fuzzy matches require user confirmation
        matchType: isExactMatch ? "license" : "name_dob",
        message: isExactMatch ? "Exact match by license number" : "Potential match found - please confirm",
      });
    }

    // Step 3: No match found - return null (don't auto-create)
    logger.info("[ID Scan] No customer match found", {
      name: `${scannedData.firstName} ${scannedData.lastName}`,
    });

    return NextResponse.json({
      success: true,
      customer: null,
      isNew: false,
      requiresConfirmation: false,
      message: "No matching customer found",
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
