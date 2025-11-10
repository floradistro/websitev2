import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET - Fetch single product details for admin
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: productId } = await params;

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        vendor:vendors(
          id,
          store_name,
          slug,
          email,
          vendor_type,
          wholesale_enabled
        ),
        category:categories!primary_category_id(
          id,
          name,
          slug
        )
      `,
      )
      .eq("id", productId)
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Get product error:", err);
      }
      return NextResponse.json(
        { error: "Product not found", details: err.message },
        { status: 404 },
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Get product error:", err);
    }
    return NextResponse.json(
      { error: "Failed to get product", details: err.message },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update product (including wholesale settings)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: productId } = await params;
    const body = await request.json();

    // Extract fields to update
    const updateData: any = {};

    // Basic fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.regular_price !== undefined) updateData.regular_price = body.regular_price;
    if (body.sale_price !== undefined) updateData.sale_price = body.sale_price;
    if (body.status !== undefined) updateData.status = body.status;

    // Wholesale fields
    if (body.is_wholesale !== undefined) updateData.is_wholesale = body.is_wholesale;
    if (body.wholesale_only !== undefined) updateData.wholesale_only = body.wholesale_only;
    if (body.wholesale_price !== undefined) updateData.wholesale_price = body.wholesale_price;
    if (body.minimum_wholesale_quantity !== undefined)
      updateData.minimum_wholesale_quantity = body.minimum_wholesale_quantity;

    // Update timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Update product error:", updateError);
      }
      return NextResponse.json(
        { error: "Failed to update product", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Update product error:", err);
    }
    return NextResponse.json(
      { error: "Failed to update product", details: err.message },
      { status: 500 },
    );
  }
}
