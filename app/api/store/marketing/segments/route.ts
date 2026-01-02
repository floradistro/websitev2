/**
 * Customer Segments API
 * Create and manage customer segments
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

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    // Get segments for this vendor
    const { data: segments, error } = await supabase
      .from("customer_segments")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Segments fetch error:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch segments", message: error.message },
        { status: 500 },
      );
    }

    // Calculate customer count for each segment
    const segmentsWithCounts = await Promise.all(
      (segments || []).map(async (segment) => {
        const count = await calculateSegmentSize(vendorId, segment.segment_rules);
        return {
          ...segment,
          customer_count: count,
        };
      }),
    );

    return NextResponse.json(segmentsWithCounts);
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Segments API error:", err);
    }
    return NextResponse.json(
      { error: "Failed to load segments", message: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { name, description, rules } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Segment name required" }, { status: 400 });
    }

    // Create segment
    const { data: segment, error: createError } = await supabase
      .from("customer_segments")
      .insert({
        vendor_id: vendorId,
        name,
        description: description || "",
        segment_rules: rules || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Segment creation error:", createError);
      }
      return NextResponse.json(
        { error: "Failed to create segment", message: createError.message },
        { status: 500 },
      );
    }

    // Calculate initial customer count
    const customerCount = await calculateSegmentSize(vendorId, rules || []);

    return NextResponse.json({
      success: true,
      segment: {
        ...segment,
        customer_count: customerCount,
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Segment creation error:", err);
    }
    return NextResponse.json(
      { error: "Failed to create segment", message: err.message },
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
        if (config.min !== undefined) {
          query = query.gte("lifetime_value", config.min);
        }
        if (config.max !== undefined) {
          query = query.lte("lifetime_value", config.max);
        }
        break;

      case "order_count":
        if (config.min !== undefined) {
          query = query.gte("total_orders", config.min);
        }
        break;

      case "last_order":
        if (config.days_ago && config.operator) {
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

      // Add more rule types as needed
    }
  }

  const { count } = await query;
  return count || 0;
}
