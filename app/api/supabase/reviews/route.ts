import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireCustomer } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get("product_id");
    const customerId = searchParams.get("customer_id");
    const status = searchParams.get("status") || "approved";
    const rating = searchParams.get("rating");

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const offset = (page - 1) * perPage;

    const supabase = getServiceSupabase();

    let query = supabase.from("product_reviews").select(
      `
        *,
        product:product_id(id, name, slug, featured_image),
        customer:customer_id(id, email, first_name, last_name),
        vendor:vendor_id(id, store_name)
      `,
      { count: "exact" },
    );

    // Filters
    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (rating) {
      query = query.eq("rating", parseInt(rating));
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching reviews:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: data || [],
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require customer authentication (Phase 3)
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) return authResult;
    const { customerId } = authResult;

    const body = await request.json();
    const { product_id, rating, title, review_text, order_id } = body;

    if (!product_id || !rating || !review_text) {
      return NextResponse.json(
        {
          error: "Missing required fields: product_id, rating, review_text",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Check if verified purchase
    let verifiedPurchase = false;
    if (order_id) {
      const { data: orderItem } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order_id)
        .eq("product_id", product_id)
        .single();

      verifiedPurchase = !!orderItem;
    }

    const { data: review, error: reviewError } = await supabase
      .from("product_reviews")
      .insert({
        product_id,
        customer_id: customerId,
        order_id,
        rating: parseInt(rating),
        title,
        review_text,
        verified_purchase: verifiedPurchase,
        status: "pending", // Requires approval
      })
      .select()
      .single();

    if (reviewError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating review:", reviewError);
      }
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
