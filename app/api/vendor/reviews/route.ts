import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Get vendor reviews from real database
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Fetch real reviews from database
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        product_id,
        rating,
        comment,
        verified_purchase,
        created_at,
        updated_at,
        response,
        response_date,
        product:products!inner(id, name, vendor_id),
        customer:customers(id, first_name, last_name)
      `,
      )
      .eq("products.vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching reviews:", err);
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Map to frontend format
    const mappedReviews = (reviews || []).map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product?.name || "Unknown Product",
      customerName: r.customer ? `${r.customer.first_name} ${r.customer.last_name}` : "Anonymous",
      rating: r.rating,
      date: r.created_at,
      comment: r.comment || "",
      verified: r.verified_purchase || false,
      response: r.response || undefined,
      responseDate: r.response_date || undefined,
    }));

    return NextResponse.json({
      success: true,
      reviews: mappedReviews,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Reviews API error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

/**
 * Submit response to a review
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { reviewId, response } = await request.json();

    if (!reviewId || !response) {
      return NextResponse.json({ error: "Review ID and response required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Update review with vendor response
    const { data: review, error } = await supabase
      .from("reviews")
      .update({
        response,
        response_date: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error updating review:", err);
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Review response error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to submit response" },
      { status: 500 },
    );
  }
}
