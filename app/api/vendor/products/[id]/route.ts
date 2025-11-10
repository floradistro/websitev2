import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { updateProductSchema, safeValidateProductData } from "@/lib/validations/product";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const productId = id;
    const supabase = getServiceSupabase();

    // Get product with all details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        price,
        regular_price,
        cost_price,
        description,
        status,
        stock_quantity,
        custom_fields,
        meta_data,
        pricing_data,
        featured_image_storage,
        image_gallery_storage,
        primary_category_id,
        categories:primary_category_id(id, name)
      `,
      )
      .eq("id", productId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (productError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Database error fetching product:", productError);
      }
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found or access denied" },
        { status: 404 },
      );
    }

    // Get COAs
    const { data: coas } = await supabase
      .from("vendor_coas")
      .select("*")
      .eq("product_id", productId)
      .eq("vendor_id", vendorId);

    // Get pricing from embedded pricing_data (new simplified system)
    const pricingData = product.pricing_data || {};
    const pricingMode: "single" | "tiered" = pricingData.mode || "single";
    const pricingTemplateId: string | null = pricingData.template_id || null;
    const pricing: any[] = (pricingData.tiers || []).map((tier: any) => ({
      label: tier.label,
      qty: tier.quantity || 1,
      unit: tier.unit || "g",
      price: tier.price || 0,
    }));

    // Get images
    const images: string[] = [];
    if (product.featured_image_storage) {
      images.push(product.featured_image_storage);
    }
    // Add gallery images
    if (product.image_gallery_storage && Array.isArray(product.image_gallery_storage)) {
      const additionalImages = product.image_gallery_storage.filter(
        (img: string) => img && img !== product.featured_image_storage,
      );
      images.push(...additionalImages);
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        category: (product.categories as any)?.name || "",
        category_id: product.primary_category_id || "",
        price: parseFloat(product.price) || 0,
        regular_price: parseFloat(product.price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        description: product.description || "",
        status: product.status || "pending",
        stock_quantity: parseFloat(product.stock_quantity) || 0,
        total_stock: parseFloat(product.stock_quantity) || 0,
        custom_fields: product.custom_fields || {}, // Vendors have full autonomy over custom fields
        pricing_mode: pricingMode,
        pricing_template_id: pricingTemplateId || null,
        coas: (coas || []).map((coa) => ({
          id: coa.id,
          file_name: coa.file_name,
          file_url: coa.file_url,
          lab_name: coa.lab_name,
          test_date: coa.test_date,
          batch_number: coa.batch_number,
          test_results: coa.test_results,
          is_verified: coa.is_verified || false,
        })),
        pricing_tiers: pricing.map((tier: any) => ({
          label: tier.label,
          quantity: tier.qty,
          unit: tier.unit,
          price: tier.price,
          min_quantity: tier.qty,
          max_quantity: null,
        })),
        images,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Product GET error:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const productId = id;
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = safeValidateProductData(updateProductSchema, body);

    if (!validation.success) {
      const errorMessages = validation.errors.issues.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errorMessages,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    const supabase = getServiceSupabase();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id, vendor_id")
      .eq("id", productId)
      .maybeSingle();

    if (fetchError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Database error verifying product ownership:", fetchError);
      }
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found or access denied. Please refresh the page.",
        },
        { status: 404 },
      );
    }

    // Build update data from validated input
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.sku !== undefined) updateData.sku = validatedData.sku;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.cost_price !== undefined) updateData.cost_price = validatedData.cost_price;
    if (validatedData.stock_quantity !== undefined)
      updateData.stock_quantity = validatedData.stock_quantity;
    if (validatedData.stock_status !== undefined)
      updateData.stock_status = validatedData.stock_status;
    if (validatedData.manage_stock !== undefined)
      updateData.manage_stock = validatedData.manage_stock;

    // Update custom_fields - vendors have full autonomy over custom fields
    if (validatedData.custom_fields) {
      updateData.custom_fields = validatedData.custom_fields;
    }

    // Update field visibility
    if (validatedData.field_visibility) {
      updateData.field_visibility = validatedData.field_visibility;
    }

    // Update media
    if (validatedData.featured_image_storage !== undefined) {
      updateData.featured_image_storage = validatedData.featured_image_storage;
    }
    if (validatedData.image_gallery_storage !== undefined) {
      updateData.image_gallery_storage = validatedData.image_gallery_storage;
    }

    // Handle pricing template assignment - store in pricing_data
    if (body.pricing_template_id || body.pricing_mode || body.pricing_tiers) {
      // Get current pricing_data
      const { data: currentProduct } = await supabase
        .from("products")
        .select("pricing_data")
        .eq("id", productId)
        .maybeSingle();

      const currentPricingData = currentProduct?.pricing_data || {};

      // Build updated pricing_data
      const updatedPricingData: any = { ...currentPricingData };

      if (body.pricing_mode) {
        updatedPricingData.mode = body.pricing_mode;
      }

      if (body.pricing_template_id) {
        updatedPricingData.template_id = body.pricing_template_id;

        // Fetch template to get name and tiers
        const { data: template } = await supabase
          .from("pricing_tier_templates")
          .select("name, default_tiers")
          .eq("id", body.pricing_template_id)
          .maybeSingle();

        if (template) {
          updatedPricingData.template_name = template.name;
          // Convert default_tiers to tiers format
          updatedPricingData.tiers = (template.default_tiers || []).map((tier: any) => ({
            id: tier.id,
            label: tier.label,
            quantity: tier.quantity,
            unit: tier.unit,
            price: tier.default_price,
            enabled: true,
            sort_order: tier.sort_order,
          }));
        }
      } else if (body.pricing_tiers) {
        // Manual tiers (not from template)
        updatedPricingData.tiers = body.pricing_tiers.map((tier: any, index: number) => ({
          label: tier.weight || tier.label,
          quantity: tier.qty || tier.quantity || 1,
          unit: "g",
          price: parseFloat(tier.price),
          enabled: true,
          sort_order: index + 1,
        }));
      }

      updateData.pricing_data = updatedPricingData;
    }

    // Update product
    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .maybeSingle();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Update error:", updateError);
      }
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Product update affected 0 rows - record may have been deleted");
      }
      return NextResponse.json(
        {
          success: false,
          error: "Product not found or was deleted during update. Please refresh the page.",
          product_id: productId,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Product PUT error:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const productId = id;
    const supabase = getServiceSupabase();

    // Verify ownership before deletion
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id, vendor_id, name")
      .eq("id", productId)
      .maybeSingle();

    if (fetchError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Database error fetching product for deletion:", fetchError);
      }
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found or already deleted" },
        { status: 404 },
      );
    }

    if (existing.vendor_id !== vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Cannot delete products from other vendors",
        },
        { status: 403 },
      );
    }

    // Delete the product (CASCADE will handle related records)
    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);

    if (deleteError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Delete error:", deleteError);
      }
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Product "${existing.name}" deleted successfully`,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Product DELETE error:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
