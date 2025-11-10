import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      if (process.env.NODE_ENV === "development") {
        logger.error("[Products API] Auth failed:", authResult);
      }
      return authResult;
    }
    const { vendorId } = authResult;

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = searchParams.get("limit");
    // If limit is 'all' or 0, fetch all products (no limit)
    const limit =
      limitParam === "all" || limitParam === "0"
        ? 10000
        : Math.min(parseInt(limitParam || "20"), 100); // Max 100 per page (unless requesting all)
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    const supabase = getServiceSupabase();

    // If category filter is provided, get the category ID first
    let categoryId: string | null = null;
    if (category && category !== "all") {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("vendor_id", vendorId)
        .eq("name", category)
        .single();

      if (categoryData) {
        categoryId = categoryData.id;
      }
    }

    // Build query
    let query = supabase
      .from("products")
      .select(
        "id, name, sku, regular_price, cost_price, description, status, featured_image_storage, image_gallery_storage, primary_category_id, custom_fields, meta_data, pricing_data, categories:primary_category_id(name)",
        { count: "exact" },
      )
      .eq("vendor_id", vendorId);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (categoryId) {
      query = query.eq("primary_category_id", categoryId);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch products with count
    const productsStart = Date.now();
    const {
      data: products,
      error: productsError,
      count,
    } = await query.range(from, to).order("name");

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        total: count || 0,
        stats: {
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
        },
        page,
        limit,
        totalPages: 0,
        elapsed_ms: Date.now() - startTime,
      });
    }

    const productIds = products.map((p) => p.id);

    // PERFORMANCE FIX: Only fetch inventory for current page products, not ALL products
    // Stats can be calculated from the count returned by the products query
    const relatedStart = Date.now();
    const { data: inventoryRecords } = await supabase
      .from("inventory")
      .select("product_id, quantity")
      .in("product_id", productIds);

    // PERFORMANCE FIX: Skip expensive stats calculation - frontend doesn't need it
    // The 'count' from the products query gives us the total
    // Individual product stock is calculated below from inventoryRecords
    const statsStart = Date.now();
    const inStock = 0; // Can add back later if needed, but expensive
    const lowStock = 0;
    const outOfStock = 0;

    // Build inventory map - sum quantities across all locations per product
    const inventoryMap = new Map<string, number>();
    (inventoryRecords || []).forEach((inv: any) => {
      const currentQty = inventoryMap.get(inv.product_id) || 0;
      inventoryMap.set(inv.product_id, currentQty + parseFloat(inv.quantity || "0"));
    });

    // Fetch pricing templates (NEW SYSTEM) if any products use them
    const templateIds = new Set<string>();
    (products || []).forEach((p: any) => {
      // Check both pricing_data and meta_data for template_id
      const templateId = p.pricing_data?.template_id || p.meta_data?.pricing_template_id;
      if (templateId) templateIds.add(templateId);
    });

    let templatesMap = new Map<string, any>();
    if (templateIds.size > 0) {
      const { data: templates } = await supabase
        .from("pricing_tier_templates")
        .select("id, default_tiers")
        .in("id", Array.from(templateIds));

      (templates || []).forEach((tmpl: any) => {
        templatesMap.set(tmpl.id, tmpl);
      });
    }

    const formattedProducts = (products || []).map((product: any) => {
      // Build images array: featured image first, then gallery images
      const images: string[] = [];

      // Add featured image
      if (product.featured_image_storage) {
        images.push(product.featured_image_storage);
      }

      // Add gallery images if they exist
      if (product.image_gallery_storage && Array.isArray(product.image_gallery_storage)) {
        // Filter out featured image to avoid duplicates
        const additionalImages = product.image_gallery_storage.filter(
          (img: string) => img && img !== product.featured_image_storage,
        );
        images.push(...additionalImages);
      }

      // Get pricing mode from pricing_data or meta_data
      const pricingMode = product.pricing_data?.mode || product.meta_data?.pricing_mode || "single";

      // Get LIVE pricing from NEW template system ONLY - no fallback to stale data
      let pricingTiers = [];
      const templateId =
        product.pricing_data?.template_id || product.meta_data?.pricing_template_id;
      if (pricingMode === "tiered" && templateId && templatesMap.has(templateId)) {
        const template = templatesMap.get(templateId);
        // Convert template default_tiers to pricing_tiers format
        pricingTiers = (template.default_tiers || []).map((tier: any) => ({
          weight: tier.label,
          qty: tier.quantity,
          price: String(tier.default_price || 0),
        }));
      }
      // NO FALLBACK - if no template, no pricing tiers returned

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        category: product.categories?.name || "Uncategorized", // Get category from primary_category_id relation
        price: parseFloat(product.regular_price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
        description: product.description || "",
        status: product.status || "pending",
        total_stock: inventoryMap.get(product.id) || 0, // LIVE inventory from all locations
        custom_fields: product.custom_fields || {}, // Vendors have full autonomy over custom fields
        pricing_mode: pricingMode,
        pricing_tiers: pricingTiers, // Include tiers for display
        images: images,
      };
    });

    const elapsed = Date.now() - startTime;
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json(
      {
        success: true,
        products: formattedProducts,
        total: count || 0,
        stats: {
          inStock,
          lowStock,
          outOfStock,
        },
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        elapsed_ms: elapsed,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
          "X-Response-Time": `${elapsed}ms`,
          "CDN-Cache-Control": "max-age=60",
          "X-Total-Count": String(count || 0),
          "X-Page": String(page),
          "X-Total-Pages": String(totalPages),
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Full products API error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
