import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { vendorId, firstName, lastName, dateOfBirth } = body;

    if (!vendorId || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields: vendorId, firstName, lastName" },
        { status: 400 },
      );
    }

    // Strategy: Match by name first, then optionally verify with DOB if available
    // We'll be flexible with name matching (case-insensitive)

    const firstNameLower = firstName.toLowerCase().trim();
    const lastNameLower = lastName.toLowerCase().trim();

    // First, try exact name match
    let { data: exactMatches, error: exactError } = await supabase
      .from("vendor_customers")
      .select(
        `
        id,
        vendor_customer_number,
        loyalty_points,
        loyalty_tier,
        total_orders,
        total_spent,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          display_name,
          date_of_birth
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .ilike("customers.first_name", firstNameLower)
      .ilike("customers.last_name", lastNameLower);

    if (exactError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error searching for customer:", exactError);
      }
      return NextResponse.json({ error: exactError.message }, { status: 500 });
    }

    // Filter results
    let matches = (exactMatches || []).filter((vc: any) => vc.customers);

    // If we have multiple matches and a DOB, use it to narrow down
    if (matches.length > 1 && dateOfBirth) {
      const dobMatches = matches.filter((vc: any) => vc.customers.date_of_birth === dateOfBirth);

      if (dobMatches.length > 0) {
        matches = dobMatches;
      }
    }

    // If we have a single match, return it
    if (matches.length === 1) {
      const match = matches[0];
      const customerData = match.customers?.[0];
      const customer = {
        id: customerData?.id,
        first_name: customerData?.first_name || "",
        last_name: customerData?.last_name || "",
        email: customerData?.email,
        phone: customerData?.phone,
        display_name: customerData?.display_name,
        date_of_birth: customerData?.date_of_birth,
        loyalty_points: match.loyalty_points || 0,
        loyalty_tier: match.loyalty_tier || "bronze",
        vendor_customer_number: match.vendor_customer_number,
        total_orders: match.total_orders || 0,
        total_spent: match.total_spent || 0,
      };

      return NextResponse.json({
        customer,
        matchType: "exact",
      });
    }

    // If we have multiple matches, return them all for manual selection
    if (matches.length > 1) {
      const customers = matches.map((match: any) => {
        const customerData = match.customers?.[0];
        return {
          id: customerData?.id,
          first_name: customerData?.first_name || "",
          last_name: customerData?.last_name || "",
          email: customerData?.email,
          phone: customerData?.phone,
          display_name: customerData?.display_name,
          date_of_birth: customerData?.date_of_birth,
          loyalty_points: match.loyalty_points || 0,
          loyalty_tier: match.loyalty_tier || "bronze",
          vendor_customer_number: match.vendor_customer_number,
          total_orders: match.total_orders || 0,
          total_spent: match.total_spent || 0,
        };
      });

      return NextResponse.json({
        customers,
        matchType: "multiple",
        message: "Multiple customers found with this name",
      });
    }

    // No match found
    return NextResponse.json({
      customer: null,
      matchType: "none",
      message: "No customer found",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in match-by-id endpoint:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
