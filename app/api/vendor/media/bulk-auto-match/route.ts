import { getServiceSupabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";

// Match image filename to product name using fuzzy matching
// Same algorithm as NewProductClient.tsx
const matchImageToProduct = (
  filename: string,
  products: Array<{ id: string; name: string }>,
): { id: string; name: string } | null => {
  // Remove file extension and clean filename
  const cleanFilename = filename
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .trim();

  // Try exact match first
  for (const product of products) {
    const cleanProductName = product.name.toLowerCase().trim();
    if (cleanFilename === cleanProductName) {
      return product;
    }
  }

  // Try partial match (filename contains product name or vice versa)
  for (const product of products) {
    const cleanProductName = product.name
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .trim();
    if (
      cleanFilename.includes(cleanProductName) ||
      cleanProductName.includes(cleanFilename)
    ) {
      return product;
    }
  }

  // Try word-based matching
  const filenameWords = cleanFilename.split(" ").filter(Boolean);
  for (const product of products) {
    const productWords = product.name.toLowerCase().split(" ").filter(Boolean);
    const matchingWords = filenameWords.filter((word) =>
      productWords.includes(word),
    );
    if (
      matchingWords.length >= 2 ||
      (matchingWords.length === 1 && productWords.length === 1)
    ) {
      return product;
    }
  }

  return null;
};

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    const { onlyUnlinked = true, categoryFilter = null } = await request.json();

    // Get all products for this vendor
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .order("name");

    if (productsError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching products:", productsError);
      }
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No products found to match against",
        matched: 0,
        unmatched: 0,
        total: 0,
        results: [],
      });
    }

    // Get media files to process
    let mediaQuery = supabase
      .from("vendor_media")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("status", "active");

    if (onlyUnlinked) {
      // Only get images that have no linked products or empty array
      mediaQuery = mediaQuery.or(
        "linked_product_ids.is.null,linked_product_ids.eq.{}",
      );
    }

    if (categoryFilter) {
      mediaQuery = mediaQuery.eq("category", categoryFilter);
    }

    const { data: mediaFiles, error: mediaError } = await mediaQuery.order(
      "created_at",
      { ascending: false },
    );

    if (mediaError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching media:", mediaError);
      }
      return NextResponse.json(
        { error: "Failed to fetch media files" },
        { status: 500 },
      );
    }

    if (!mediaFiles || mediaFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No media files found to process",
        matched: 0,
        unmatched: 0,
        total: 0,
        results: [],
      });
    }

    // Process matches
    const results: Array<{
      mediaId: string;
      fileName: string;
      matched: boolean;
      productId?: string;
      productName?: string;
    }> = [];

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const mediaFile of mediaFiles) {
      const match = matchImageToProduct(mediaFile.file_name, products);

      if (match) {
        // Update the media file to link to the product
        const existingLinks = mediaFile.linked_product_ids || [];
        const updatedLinks = Array.from(new Set([...existingLinks, match.id]));

        const { error: updateError } = await supabase
          .from("vendor_media")
          .update({
            linked_product_ids: updatedLinks,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mediaFile.id);

        if (updateError) {
          if (process.env.NODE_ENV === "development") {
            console.error(`Error updating media ${mediaFile.id}:`, updateError);
          }
          results.push({
            mediaId: mediaFile.id,
            fileName: mediaFile.file_name,
            matched: false,
          });
          unmatchedCount++;
        } else {
          results.push({
            mediaId: mediaFile.id,
            fileName: mediaFile.file_name,
            matched: true,
            productId: match.id,
            productName: match.name,
          });
          matchedCount++;
        }
      } else {
        results.push({
          mediaId: mediaFile.id,
          fileName: mediaFile.file_name,
          matched: false,
        });
        unmatchedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Matched ${matchedCount} of ${mediaFiles.length} images`,
      matched: matchedCount,
      unmatched: unmatchedCount,
      total: mediaFiles.length,
      results,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Bulk auto-match error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to auto-match images" },
      { status: 500 },
    );
  }
}
