import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export const runtime = "edge";

/**
 * GET /api/vendor/categories/subcategories
 * Fetch sub-categories for given parent categories
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor_id");
    const parentCategoriesParam = searchParams.get("parent_categories"); // Comma-separated

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    if (!parentCategoriesParam) {
      return NextResponse.json(
        { success: false, error: "parent_categories is required" },
        { status: 400 },
      );
    }

    const parentCategories = parentCategoriesParam.split(",").map((c) => c.trim());

    const supabase = getServiceSupabase();

    // First, fetch the parent category IDs by name
    const { data: parentCats, error: parentError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("vendor_id", vendorId)
      .in("name", parentCategories)
      .is("parent_id", null); // Only top-level categories

    if (parentError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching parent categories:", parentError);
      }
      return NextResponse.json({ success: false, error: parentError.message }, { status: 500 });
    }

    if (!parentCats || parentCats.length === 0) {
      return NextResponse.json({
        success: true,
        subCategories: {},
      });
    }

    // Fetch all sub-categories for these parent IDs
    const parentIds = parentCats.map((cat) => cat.id);

    const { data: subCats, error: subError } = await supabase
      .from("categories")
      .select("id, name, parent_id, display_order")
      .eq("vendor_id", vendorId)
      .in("parent_id", parentIds)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (subError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching sub-categories:", subError);
      }
      return NextResponse.json({ success: false, error: subError.message }, { status: 500 });
    }

    // Group sub-categories by parent category name
    const subCategoriesByParent: { [key: string]: string[] } = {};

    parentCats.forEach((parent) => {
      const subs = (subCats || [])
        .filter((sub) => sub.parent_id === parent.id)
        .map((sub) => sub.name);

      if (subs.length > 0) {
        subCategoriesByParent[parent.name] = subs;
      }
    });

    return NextResponse.json({
      success: true,
      subCategories: subCategoriesByParent,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching sub-categories:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch sub-categories",
      },
      { status: 500 },
    );
  }
}
