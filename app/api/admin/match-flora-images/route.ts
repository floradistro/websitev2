import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // 1. Find Flora Distro vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, store_name")
      .or("slug.eq.flora-distro,store_name.ilike.%Flora Distro%")
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: "Flora Distro vendor not found" },
        { status: 404 },
      );
    }

    // 2. List all images in Flora Distro's media library
    const { data: imageFiles, error: imagesError } = await supabase.storage
      .from("vendor-product-images")
      .list(vendor.id, {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (imagesError || !imageFiles) {
      return NextResponse.json(
        { error: "Error listing images" },
        { status: 500 },
      );
    }

    // 3. Get flower category ID
    const { data: flowerCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "flower")
      .single();

    // 4. Get all Flora Distro flower products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, slug, featured_image_storage, vendor_id")
      .eq("vendor_id", vendor.id)
      .eq("primary_category_id", flowerCategory?.id)
      .order("name");

    if (productsError) {
      return NextResponse.json(
        { error: "Error fetching products" },
        { status: 500 },
      );
    }

    // 5. Match images to products
    const matched: any[] = [];
    const unmatched: any[] = [];
    let attachedCount = 0;

    for (const imageFile of imageFiles) {
      const imageName = imageFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const imageNameClean = imageName
        .replace(/[_-]/g, " ")
        .toLowerCase()
        .trim();

      let bestMatch: any = null;
      let bestScore = 0;

      // Try to find matching product
      for (const product of products || []) {
        const productNameClean = product.name
          .toLowerCase()
          .replace(/[_-]/g, " ")
          .trim();

        // Exact match
        if (imageNameClean === productNameClean) {
          bestMatch = product;
          bestScore = 100;
          break;
        }

        // Partial match (contains)
        if (
          productNameClean.includes(imageNameClean) ||
          imageNameClean.includes(productNameClean)
        ) {
          const score = 75;
          if (score > bestScore) {
            bestMatch = product;
            bestScore = score;
          }
        }

        // Word overlap
        const imageWords = imageNameClean
          .split(" ")
          .filter((w: string) => w.length > 2);
        const productWords = productNameClean
          .split(" ")
          .filter((w: string) => w.length > 2);
        const overlap = imageWords.filter((w: string) =>
          productWords.includes(w),
        ).length;
        const score =
          overlap > 0
            ? (overlap / Math.max(imageWords.length, productWords.length)) * 60
            : 0;

        if (score > bestScore && score > 30) {
          bestMatch = product;
          bestScore = score;
        }
      }

      if (bestMatch && bestScore >= 50) {
        // Check if product already has an image
        if (!bestMatch.featured_image_storage) {
          // Get public URL for this image
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("vendor-product-images")
            .getPublicUrl(`${vendor.id}/${imageFile.name}`);

          // Update product with image
          const { error: updateError } = await supabase
            .from("products")
            .update({ featured_image_storage: publicUrl })
            .eq("id", bestMatch.id);

          if (updateError) {
            if (process.env.NODE_ENV === "development") {
              console.error(
                `❌ Failed to attach ${imageFile.name} to ${bestMatch.name}`,
              );
            }
            unmatched.push({
              image: imageFile.name,
              reason: `Update error: ${updateError.message}`,
            });
          } else {
            matched.push({
              image: imageFile.name,
              product: bestMatch.name,
              productId: bestMatch.id,
              score: bestScore,
              action: "attached",
              url: publicUrl,
            });
            attachedCount++;
          }
        } else {
          matched.push({
            image: imageFile.name,
            product: bestMatch.name,
            productId: bestMatch.id,
            score: bestScore,
            action: "skipped",
            existingImage: bestMatch.featured_image_storage,
          });
        }
      } else {
        unmatched.push({
          image: imageFile.name,
          reason: bestMatch
            ? `Low confidence (${bestScore}% - ${bestMatch.name})`
            : "No similar product found",
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalImages: imageFiles.length,
        totalProducts: products?.length || 0,
        matched: matched.length,
        attached: attachedCount,
        skipped: matched.filter((m) => m.action === "skipped").length,
        unmatched: unmatched.length,
      },
      matched,
      unmatched,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
