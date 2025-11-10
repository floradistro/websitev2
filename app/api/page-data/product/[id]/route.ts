import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const startTime = Date.now();

  try {
    const { id } = params;
    const supabase = getServiceSupabase();

    // Try to find by UUID first, then by slug
    let productQuery = supabase.from("products").select(`
        *,
        vendor:vendors(
          id,
          store_name,
          slug,
          logo_url,
          state,
          city
        ),
        primary_category:categories!primary_category_id(id, name, slug),
        inventory(
          id,
          quantity,
          location_id,
          stock_status,
          low_stock_threshold,
          location:locations(id, name, city, state)
        )
      `);

    // Check if id looks like UUID or is a slug
    if (id.includes("-") && id.length === 36) {
      productQuery = productQuery.eq("id", id);
    } else {
      productQuery = productQuery.eq("slug", id);
    }

    // Get product first
    const productResult = await productQuery.single();

    if (productResult.error) throw productResult.error;
    if (!productResult.data) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const p = productResult.data;

    // Now get pricing tiers using the actual product UUID
    const pricingResult = await supabase
      .from("product_pricing_assignments")
      .select(
        `
        product_id,
        price_overrides,
        blueprint:pricing_tier_blueprints(
          id,
          name,
          price_breaks
        )
      `,
      )
      .eq("product_id", p.id)
      .eq("is_active", true)
      .single();

    // Get related products from same vendor with inventory
    const relatedResult = await supabase
      .from("products")
      .select(
        `
        id, 
        name, 
        slug, 
        price, 
        featured_image_storage,
        inventory(quantity)
      `,
      )
      .eq("vendor_id", p.vendor_id)
      .eq("status", "published")
      .neq("id", id)
      .limit(4);

    // Extract blueprint fields (handle both array and object)
    const fields: { [key: string]: any } = {};
    const blueprintFields = p.custom_fields || {};

    // Label to field_id mapping
    const labelToFieldId: { [key: string]: string } = {
      "Strain Type": "strain_type",
      Genetics: "genetics",
      "THC Content": "thc_content",
      "CBD Content": "cbd_content",
      "Dominant Terpenes": "terpenes",
      Effects: "effects",
      Flavors: "flavors",
      Lineage: "lineage",
      Nose: "nose",
    };

    if (Array.isArray(blueprintFields)) {
      // Handle all array formats
      blueprintFields.forEach((field: any) => {
        if (field) {
          // New format with label/value from our strain update
          if (field.label && field.value !== undefined) {
            const fieldId =
              labelToFieldId[field.label] || field.label.toLowerCase().replace(/\s+/g, "_");
            fields[fieldId] = field.value;
          }
          // Old format: {field_name, field_value}
          else if (field.field_name && field.field_value !== undefined) {
            fields[field.field_name] = field.field_value;
          }
          // Another format: {field_id, value}
          else if (field.field_id && field.value !== undefined) {
            fields[field.field_id] = field.value;
          }
        }
      });
    } else if (typeof blueprintFields === "object" && blueprintFields !== null) {
      // New format: direct object
      Object.assign(fields, blueprintFields);
    }

    // Format images array for frontend
    const images: any[] = [];
    if (p.featured_image_storage) {
      images.push({ src: p.featured_image_storage, id: 0, name: p.name });
    }
    if (p.image_gallery_storage && Array.isArray(p.image_gallery_storage)) {
      p.image_gallery_storage.forEach((imgUrl: string, idx: number) => {
        if (imgUrl && imgUrl !== p.featured_image_storage) {
          images.push({ src: imgUrl, id: idx + 1, name: p.name });
        }
      });
    }

    // Build pricing tiers from assignment
    let pricingTiers: any[] = [];
    const blueprint = Array.isArray(pricingResult.data?.blueprint)
      ? pricingResult.data.blueprint[0]
      : pricingResult.data?.blueprint;
    if (blueprint?.price_breaks && pricingResult.data) {
      const basePrice = p.price ? parseFloat(p.price) : 0;
      pricingTiers = blueprint.price_breaks.map((priceBreak: any) => {
        const overridePrice = pricingResult.data?.price_overrides?.[priceBreak.break_id];

        return {
          qty: priceBreak.qty,
          weight: `${priceBreak.qty}${priceBreak.unit}`,
          price: overridePrice || basePrice * priceBreak.qty,
          label: priceBreak.label,
          min_quantity: priceBreak.qty,
        };
      });
    }

    // Calculate actual stock from inventory
    const totalStock =
      p.inventory?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0;
    const actualStockStatus = totalStock > 0 ? "instock" : "outofstock";

    // Build response
    const product = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      price: p.price,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      stock_quantity: totalStock, // Use calculated total from inventory
      stock_status: actualStockStatus, // Use calculated status
      images: images, // Formatted images array
      featured_image_storage: p.featured_image_storage,
      image_gallery_storage: p.image_gallery_storage,
      categories: p.primary_category ? [p.primary_category] : [],
      inventory: p.inventory || [],
      total_stock: totalStock, // Use already calculated value
      fields: fields,
      pricing_tiers: pricingTiers,
      vendor: p.vendor,
      meta_data: p.meta_data || {},
      created_at: p.created_at,
      updated_at: p.updated_at,
    };

    const relatedProducts = (relatedResult.data || []).map((rp: any) => {
      // Calculate actual stock from inventory
      const rpTotalStock =
        rp.inventory?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0;
      const rpStockStatus = rpTotalStock > 0 ? "instock" : "outofstock";

      return {
        id: rp.id,
        name: rp.name,
        slug: rp.slug,
        price: rp.price,
        images: rp.featured_image_storage
          ? [{ src: rp.featured_image_storage, id: 0, name: rp.name }]
          : [],
        stock_quantity: rpTotalStock,
        stock_status: rpStockStatus,
      };
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          product: product,
          relatedProducts: relatedProducts,
        },
        meta: {
          responseTime: `${responseTime}ms`,
          hasInventory: product.inventory.length > 0,
          totalStock: product.total_stock,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    );
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error(`❌ Error in /api/page-data/product/${params.id}:`, err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch product data",
      },
      { status: 500 },
    );
  }
}
