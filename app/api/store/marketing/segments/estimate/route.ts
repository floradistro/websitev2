/**
 * Segment Size Estimation API
 * Calculate how many customers match segment rules
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { rules } = body;

    const count = await calculateSegmentSize(vendorId, rules || []);

    return NextResponse.json({
      count,
      rules: rules || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Segment estimation error:", err);
    }
    return NextResponse.json(
      { error: "Failed to estimate segment size", message: err.message },
      { status: 500 },
    );
  }
}

/**
 * Calculate segment size based on rules
 */
async function calculateSegmentSize(vendorId: string, rules: any[]): Promise<number> {
  if (!rules || rules.length === 0) {
    // No rules = all customers
    const { count } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);
    return count || 0;
  }

  // Build dynamic query based on rules
  let query = supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  for (const rule of rules) {
    const { type, config } = rule;

    switch (type) {
      case "lifetime_value":
        if (config.min !== undefined && config.min !== "") {
          query = query.gte("lifetime_value", parseFloat(config.min));
        }
        if (config.max !== undefined && config.max !== "") {
          query = query.lte("lifetime_value", parseFloat(config.max));
        }
        break;

      case "order_count":
        if (config.min !== undefined && config.min !== "") {
          query = query.gte("total_orders", parseInt(config.min));
        }
        break;

      case "last_order":
        if (config.days_ago && config.days_ago !== "" && config.operator) {
          const date = new Date();
          date.setDate(date.getDate() - parseInt(config.days_ago));
          const dateStr = date.toISOString();

          if (config.operator === "more than") {
            query = query.lt("last_order_date", dateStr);
          } else {
            query = query.gt("last_order_date", dateStr);
          }
        }
        break;

      case "location":
        // Location-based filtering would require more complex geo queries
        // For now, we'll skip this
        break;

      // Add more rule types as needed
    }
  }

  const { count } = await query;
  return count || 0;
}
