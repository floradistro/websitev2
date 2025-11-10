import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { productCache, vendorCache, inventoryCache } from "@/lib/cache-manager";

export const dynamic = "force-dynamic";
export const revalidate = 30; // Cache for 30 seconds

/**
 * GET - Fetch ALL products from ALL vendors for admin
 * No filtering by status or vendor - shows everything
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100); // Max 100 for speed
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendor_id");
    const withWholesale = searchParams.get("with_wholesale") === "true";

    const offset = (page - 1) * limit;

    const supabase = getServiceSupabase();

    // Build query - NO STATUS FILTER for admin, show ALL products
    let query = supabase.from("products").select(
      `
        *,
        custom_fields,
        vendor:vendors(
          id,
          store_name,
          slug,
          email,
          vendor_type,
          wholesale_enabled,
          logo_url
        ),
        category:categories!primary_category_id(
          id,
          name,
          slug
        )
      `,
      { count: "exact" },
    );

    // Optional filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    // Order and paginate
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Error fetching admin products:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch products", details: error.message },
        { status: 500 },
      );
    }

    // Get product IDs for batch fetching related data
    const productIds = products?.map((p) => p.id) || [];

    // Batch fetch COAs
    const { data: allCoas } = await supabase
      .from("vendor_coas")
      .select("*")
      .in("product_id", productIds);

    // Batch fetch pricing tier assignments with blueprint data
    const { data: allPricingAssignments } = await supabase
      .from("product_pricing_assignments")
      .select(
        `
        product_id,
        blueprint:pricing_tier_blueprints(
          id,
          name,
          slug,
          tier_type,
          price_breaks
        ),
        price_overrides
      `,
      )
      .in("product_id", productIds)
      .eq("is_active", true);

    // Create lookup maps
    const coasByProduct = new Map<string, any[]>();
    (allCoas || []).forEach((coa) => {
      if (!coasByProduct.has(coa.product_id)) {
        coasByProduct.set(coa.product_id, []);
      }
      coasByProduct.get(coa.product_id)!.push(coa);
    });

    // Get vendor IDs to fetch pricing configs
    const vendorIds = Array.from(
      new Set(products?.map((p) => p.vendor_id).filter(Boolean) || []),
    );

    // Batch fetch vendor pricing configs
    const { data: vendorPricingConfigs } = await supabase
      .from("vendor_pricing_configs")
      .select("*")
      .in("vendor_id", vendorIds)
      .eq("is_active", true);

    // Create lookup map for vendor pricing configs
    const vendorPricingMap = new Map<string, any>(); // key: vendorId_blueprintId
    (vendorPricingConfigs || []).forEach((config) => {
      vendorPricingMap.set(
        `${config.vendor_id}_${config.blueprint_id}`,
        config,
      );
    });

    // Create lookup map for pricing assignments by product
    const pricingByProduct = new Map<string, any[]>();
    (allPricingAssignments || []).forEach((assignment) => {
      if (!pricingByProduct.has(assignment.product_id)) {
        pricingByProduct.set(assignment.product_id, []);
      }
      pricingByProduct.get(assignment.product_id)!.push(assignment);
    });

    // Process products to include images array and related data
    let processedProducts =
      products?.map((product) => {
        const images: string[] = [];

        // Add featured_image if it exists
        if (product.featured_image) {
          images.push(product.featured_image);
        }

        // Or convert featured_image_storage to public URL
        if (product.featured_image_storage && !product.featured_image) {
          const publicUrl = `https://uaednwpxursknmwdeejn.supabase.co/storage/v1/object/public/vendor-product-images/${product.featured_image_storage}`;
          images.push(publicUrl);
        }

        // Process blueprint fields into a clean object
        const custom_fields: any = {};
        if (product.custom_fields && Array.isArray(product.custom_fields)) {
          product.custom_fields.forEach((field: any) => {
            if (field) {
              const name = field.field_name || field.label || "";
              const value = field.field_value || field.value || "";
              if (name && value) {
                custom_fields[name] = value;
              }
            }
          });
        }

        // Get COAs and pricing tiers for this product
        const coas = (coasByProduct.get(product.id) || []).map((coa) => ({
          id: coa.id,
          file_name: coa.file_name,
          file_url: coa.file_url,
          lab_name: coa.lab_name,
          test_date: coa.test_date,
          batch_number: coa.batch_number,
          test_results: coa.test_results,
          is_verified: coa.is_verified || false,
        }));

        // Process pricing tiers from blueprint assignments
        const pricingAssignments = pricingByProduct.get(product.id) || [];
        const pricing_tiers: any[] = [];

        pricingAssignments.forEach((assignment) => {
          const blueprint = assignment.blueprint as any;
          if (!blueprint) return;

          // Get vendor's pricing config for this blueprint
          const vendorConfig = vendorPricingMap.get(
            `${product.vendor_id}_${blueprint.id}`,
          );
          const vendorPricing = vendorConfig?.pricing_values || {};
          const productOverrides = assignment.price_overrides || {};

          // Merge pricing: vendor config + product overrides
          const finalPricing = { ...vendorPricing, ...productOverrides };

          // Process each price break in the blueprint
          if (blueprint.price_breaks && Array.isArray(blueprint.price_breaks)) {
            blueprint.price_breaks.forEach((priceBreak: any) => {
              const breakId = priceBreak.break_id;
              const pricing = finalPricing[breakId];

              if (pricing && pricing.enabled !== false) {
                pricing_tiers.push({
                  id: `${blueprint.id}_${breakId}`,
                  label: priceBreak.label,
                  quantity: priceBreak.qty || priceBreak.min_qty || 0,
                  unit: priceBreak.unit || "units",
                  price: parseFloat(pricing.price || 0),
                  min_quantity: priceBreak.min_qty,
                  max_quantity: priceBreak.max_qty,
                  blueprint_name: blueprint.name,
                });
              }
            });
          }
        });

        return {
          ...product,
          images,
          custom_fields,
          coas,
          pricing_tiers,
          tier_count: pricing_tiers.length, // Add tier count for display
        };
      }) || [];

    // Get vendor stats
    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, store_name")
      .eq("status", "active");

    return NextResponse.json({
      success: true,
      products: processedProducts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: {
        totalProducts: count || 0,
        totalVendors: vendors?.length || 0,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Admin products GET error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete a product
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const forceDelete = searchParams.get("force") === "true";

    if (!productId) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ No product ID provided");
      }
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get product details

    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId);

    if (fetchError) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Fetch error:", fetchError);
      }
      return NextResponse.json(
        { error: `Database error: ${fetchError.message}` },
        { status: 500 },
      );
    }

    if (!products || products.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Product not found:", productId);
      }
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = products[0];

    // Check if product has inventory
    const { data: inventory } = await supabase
      .from("inventory")
      .select("id, quantity, location:location_id(name)")
      .eq("product_id", product.id);

    if (inventory && inventory.length > 0 && !forceDelete) {
      const totalQty = inventory.reduce(
        (sum, inv) => sum + parseFloat(inv.quantity || "0"),
        0,
      );

      if (totalQty > 0) {
        const locationsList = inventory
          .filter((inv) => parseFloat(inv.quantity || "0") > 0)
          .map((inv) => {
            const location = inv.location as any;
            return `${location?.name || "Unknown"}: ${inv.quantity}g`;
          })
          .join(", ");

        return NextResponse.json(
          {
            error: `Cannot delete product with existing inventory. Current stock: ${totalQty}g at ${inventory.length} location(s). (${locationsList})`,
            has_inventory: true,
            inventory_count: inventory.length,
            total_quantity: totalQty,
          },
          { status: 400 },
        );
      }
    }

    // If force delete, remove all inventory first
    if (forceDelete && inventory && inventory.length > 0) {
      // Create stock movements for audit trail
      for (const inv of inventory) {
        await supabase.from("stock_movements").insert({
          inventory_id: inv.id,
          product_id: product.id,
          movement_type: "adjustment",
          quantity: -parseFloat(inv.quantity || "0"),
          quantity_before: parseFloat(inv.quantity || "0"),
          quantity_after: 0,
          reason: "Product deleted by admin (force)",
          notes: `Product "${product.name}" force deleted with inventory`,
        });
      }

      // Delete all inventory records
      await supabase.from("inventory").delete().eq("product_id", product.id);
    }

    // Delete the product (will cascade to related records)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Error deleting product:", deleteError);
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Invalidate all caches after deletion

    productCache.invalidatePattern("products:.*");
    vendorCache.clear();
    inventoryCache.clear();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Delete product error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 },
    );
  }
}
