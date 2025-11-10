/**
 * API: Reviews
 * GET /api/reviews
 * Fetches reviews for component registry smart components
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendor_id");
    const productId = searchParams.get("product_id");
    const minRating = parseInt(searchParams.get("min_rating") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get vendor's products first
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendorId);

    const productIds = products?.map((p) => p.id) || [];

    // Build query
    let query = supabase.from("product_reviews").select(`
        id,
        rating,
        review_text,
        verified_purchase,
        created_at,
        customer_id,
        product_id
      `);

    if (productIds.length > 0) {
      query = query.in("product_id", productIds);
    }

    // Filter by specific product
    if (productId) {
      query = query.eq("product_id", productId);
    }

    // Filter by minimum rating
    if (minRating > 1) {
      query = query.gte("rating", minRating);
    }

    // Only approved reviews
    query = query.eq("status", "approved");

    // Order by date and limit
    query = query.order("created_at", { ascending: false }).limit(limit);

    const { data: reviews, error } = await query;

    if (error) {
      throw error;
    }

    // Flatten customer and product data
    const flattenedReviews =
      reviews?.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        verified: review.verified_purchase,
        created_at: review.created_at,
        customer_name: "Customer", // Simplified for now
        product_name: "Product", // Simplified for now
      })) || [];

    return NextResponse.json({
      success: true,
      reviews: flattenedReviews,
      count: flattenedReviews.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Reviews API error:", error);
    }
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}
