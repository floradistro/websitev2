import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from("vendor_coas")
      .select(
        `
        *,
        products:product_id (
          id,
          name,
          slug,
          sku,
          featured_image,
          regular_price,
          sale_price,
          price,
          type,
          status,
          stock_status,
          primary_category_id,
          categories:primary_category_id (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .eq("is_active", true);

    // Filter by product if specified
    if (productId) {
      query = query.eq("product_id", productId);
    }

    query = query.order("upload_date", { ascending: false });

    // Fetch COAs for vendor with comprehensive product details
    const { data: coas, error: coasError } = await query;

    if (coasError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching COAs:", coasError);
      }
      return NextResponse.json({ error: coasError.message }, { status: 500 });
    }

    // Transform data to match frontend interface with comprehensive details
    const transformedCoas = (coas || []).map((coa) => {
      const product = Array.isArray(coa.products) ? coa.products[0] : coa.products;
      const category = product?.categories;
      const testResults = coa.test_results || {};

      // Calculate if COA is expired (90 days)
      const isExpired = coa.expiry_date
        ? new Date(coa.expiry_date) < new Date()
        : coa.test_date &&
          new Date().getTime() - new Date(coa.test_date).getTime() > 90 * 24 * 60 * 60 * 1000;

      return {
        id: coa.id,
        productId: product?.id || null,
        productName: product?.name || null,
        productNameOnCoa: coa.product_name_on_coa || null,
        productSku: product?.sku || null,
        productImage: product?.featured_image || null,
        productPrice: product?.price || product?.regular_price || null,
        productCategory: category?.name || null,
        productCategorySlug: category?.slug || null,
        productSlug: product?.slug || null,
        productStatus: product?.status || null,
        productStockStatus: product?.stock_status || null,
        coaNumber: coa.batch_number || `COA-${coa.id.slice(0, 8)}`,
        testDate: coa.test_date,
        uploadDate: coa.upload_date,
        expiryDate: coa.expiry_date,
        status: isExpired ? "expired" : coa.is_verified ? "approved" : "pending",
        fileUrl: coa.file_url,
        fileName: coa.file_name,
        fileSize: coa.file_size,
        fileType: coa.file_type,
        testingLab: coa.lab_name || "N/A",
        batchNumber: coa.batch_number || "N/A",
        // Cannabinoids
        thc: testResults.thc ? `${testResults.thc}%` : "N/A",
        cbd: testResults.cbd ? `${testResults.cbd}%` : "N/A",
        thca: testResults.thca ? `${testResults.thca}%` : null,
        cbda: testResults.cbda ? `${testResults.cbda}%` : null,
        cbg: testResults.cbg ? `${testResults.cbg}%` : null,
        cbn: testResults.cbn ? `${testResults.cbn}%` : null,
        totalCannabinoids: testResults.total_cannabinoids
          ? `${testResults.total_cannabinoids}%`
          : null,
        // Terpenes
        terpenes: testResults.terpenes || null,
        totalTerpenes: testResults.total_terpenes ? `${testResults.total_terpenes}%` : null,
        // Safety tests
        pesticides:
          testResults.pesticides_passed !== undefined ? testResults.pesticides_passed : null,
        heavyMetals:
          testResults.heavy_metals_passed !== undefined ? testResults.heavy_metals_passed : null,
        microbials:
          testResults.microbials_passed !== undefined ? testResults.microbials_passed : null,
        mycotoxins:
          testResults.mycotoxins_passed !== undefined ? testResults.mycotoxins_passed : null,
        solvents: testResults.solvents_passed !== undefined ? testResults.solvents_passed : null,
        // Metadata
        metadata: coa.metadata || {},
        // Raw test results for detailed view
        rawTestResults: testResults,
      };
    });

    // If no COAs found in vendor_coas table, check products meta_data for legacy coa_url
    if (transformedCoas.length === 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, meta_data, created_at")
        .eq("vendor_id", vendorId)
        .eq("status", "published")
        .not("meta_data->coa_url", "is", null);

      if (!productsError && products) {
        const legacyCoas = products
          .filter((p) => p.meta_data?.coa_url)
          .map((p) => ({
            id: `legacy-${p.id}`,
            productId: p.id,
            productName: p.name || null,
            coaNumber: `COA-${p.id.slice(0, 8)}`,
            testDate: p.created_at,
            uploadDate: p.created_at,
            status: "approved" as const,
            fileUrl: p.meta_data.coa_url,
            thc: p.meta_data.thc_percentage || "N/A",
            cbd: p.meta_data.cbd_percentage || "N/A",
            testingLab: p.meta_data.lab_name || "N/A",
            batchNumber: p.meta_data.batch_number || "N/A",
            fileName: "Certificate of Analysis",
            fileSize: null,
          }));

        return NextResponse.json({
          success: true,
          coas: legacyCoas,
          total: legacyCoas.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      coas: transformedCoas,
      total: transformedCoas.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Vendor COAs API error:", err);
    }
    return NextResponse.json({ error: err.message || "Failed to fetch COAs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("product_id") as string;
    const labName = formData.get("lab_name") as string;
    const testDate = formData.get("test_date") as string;
    const expiryDate = formData.get("expiry_date") as string | null;
    const batchNumber = formData.get("batch_number") as string;
    const productNameOnCoa = formData.get("product_name_on_coa") as string | null;

    // Parse test results JSON
    const testResultsStr = formData.get("test_results") as string;
    let testResults = {};
    if (testResultsStr) {
      try {
        testResults = JSON.parse(testResultsStr);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Failed to parse test_results:", e);
        }
      }
    }

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Validate file type and size
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only PDF and image files are allowed" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      // 25MB limit
      return NextResponse.json({ error: "File size must be less than 25MB" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${vendorId}/${productId}/${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-coas")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Storage upload error:", uploadError);
      }
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL (for private bucket, this will require signed URL for viewing)
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-coas").getPublicUrl(fileName);

    // Create COA record
    const { data: coaData, error: coaError } = await supabase
      .from("vendor_coas")
      .insert({
        vendor_id: vendorId,
        product_id: productId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        lab_name: labName || null,
        test_date: testDate || null,
        expiry_date: expiryDate || null,
        batch_number: batchNumber || null,
        product_name_on_coa: productNameOnCoa || null,
        test_results: testResults,
        is_active: true,
        is_verified: false, // Admin needs to verify
      })
      .select()
      .single();

    if (coaError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("COA creation error:", coaError);
      }
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from("vendor-coas").remove([fileName]);
      return NextResponse.json({ error: coaError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coa: coaData,
      message: "COA uploaded successfully and pending verification",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("COA upload error:", err);
    }
    return NextResponse.json({ error: err.message || "Failed to upload COA" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const coaId = searchParams.get("id");

    if (!coaId) {
      return NextResponse.json({ error: "COA ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify COA belongs to vendor
    const { data: coa, error: fetchError } = await supabase
      .from("vendor_coas")
      .select("*")
      .eq("id", coaId)
      .eq("vendor_id", vendorId)
      .single();

    if (fetchError || !coa) {
      return NextResponse.json({ error: "COA not found" }, { status: 404 });
    }

    // Update COA to associate with new product
    const { error: updateError } = await supabase
      .from("vendor_coas")
      .update({ product_id })
      .eq("id", coaId)
      .eq("vendor_id", vendorId);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("COA update error:", updateError);
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "COA assigned to product successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("COA update error:", err);
    }
    return NextResponse.json({ error: err.message || "Failed to update COA" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const coaId = searchParams.get("id");

    if (!coaId) {
      return NextResponse.json({ error: "COA ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get COA details first
    const { data: coa, error: fetchError } = await supabase
      .from("vendor_coas")
      .select("*")
      .eq("id", coaId)
      .eq("vendor_id", vendorId)
      .single();

    if (fetchError || !coa) {
      return NextResponse.json({ error: "COA not found" }, { status: 404 });
    }

    // Soft delete - mark as inactive
    const { error: deleteError } = await supabase
      .from("vendor_coas")
      .update({ is_active: false })
      .eq("id", coaId)
      .eq("vendor_id", vendorId);

    if (deleteError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("COA delete error:", deleteError);
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "COA deleted successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("COA delete error:", err);
    }
    return NextResponse.json({ error: err.message || "Failed to delete COA" }, { status: 500 });
  }
}
