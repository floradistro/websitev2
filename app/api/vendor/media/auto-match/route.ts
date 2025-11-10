import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function calculateMatchScore(productName: string, fileName: string): number {
  const normalizeString = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const normalizedProduct = normalizeString(productName);
  const normalizedFile = normalizeString(fileName);

  // Exact match
  if (normalizedProduct === normalizedFile) return 100;

  // Contains match
  if (normalizedFile.includes(normalizedProduct)) return 90;
  if (normalizedProduct.includes(normalizedFile)) return 85;

  // Fuzzy match using Levenshtein distance
  const distance = levenshtein(normalizedProduct, normalizedFile);
  const maxLength = Math.max(normalizedProduct.length, normalizedFile.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { minConfidence = 70 } = body; // Minimum confidence score (0-100)

    const supabase = getServiceSupabase();

    // Get all products without images
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, sku")
      .eq("vendor_id", vendorId)
      .or("featured_image_storage.is.null,featured_image_storage.eq.");

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // Get all media files
    const { data: mediaFiles, error: mediaError } = await supabase
      .from("vendor_media")
      .select("id, file_name, file_path")
      .eq("vendor_id", vendorId)
      .eq("status", "active");

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    if (!products || !mediaFiles) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: "No products or media files found",
      });
    }

    const matches: Array<{
      productId: string;
      productName: string;
      mediaId: string;
      fileName: string;
      filePath: string;
      score: number;
      confidence: "high" | "medium" | "low";
    }> = [];

    // Find best match for each product
    for (const product of products) {
      let bestMatch: any = null;
      let bestScore = 0;

      for (const media of mediaFiles) {
        const fileNameWithoutExt = media.file_name.replace(/\.[^/.]+$/, "");

        // Try matching against product name
        const nameScore = calculateMatchScore(product.name, fileNameWithoutExt);

        // Try matching against SKU if available
        const skuScore = product.sku ? calculateMatchScore(product.sku, fileNameWithoutExt) : 0;

        const score = Math.max(nameScore, skuScore);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = media;
        }
      }

      if (bestMatch && bestScore >= minConfidence) {
        let confidence: "high" | "medium" | "low";
        if (bestScore >= 90) confidence = "high";
        else if (bestScore >= 75) confidence = "medium";
        else confidence = "low";

        matches.push({
          productId: product.id,
          productName: product.name,
          mediaId: bestMatch.id,
          fileName: bestMatch.file_name,
          filePath: bestMatch.file_path,
          score: bestScore,
          confidence,
        });
      }
    }

    // Sort by confidence (high → low)
    matches.sort((a, b) => b.score - a.score);

    const highConfidence = matches.filter((m) => m.confidence === "high").length;
    const mediumConfidence = matches.filter((m) => m.confidence === "medium").length;
    const lowConfidence = matches.filter((m) => m.confidence === "low").length;

    return NextResponse.json({
      success: true,
      matches,
      stats: {
        total: matches.length,
        high: highConfidence,
        medium: mediumConfidence,
        low: lowConfidence,
        productsWithoutImages: products.length,
        totalMediaFiles: mediaFiles.length,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Apply auto-match suggestions
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { matches } = body; // Array of { productId, filePath }

    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ error: "Matches array required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    let linked = 0;
    let failed = 0;

    for (const match of matches) {
      const { error } = await supabase
        .from("products")
        .update({
          featured_image_storage: match.filePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.productId)
        .eq("vendor_id", vendorId);

      if (error) {
        failed++;
        if (process.env.NODE_ENV === "development") {
          logger.error(`Failed to link ${match.productId}:`, err);
        }
      } else {
        linked++;
      }
    }

    return NextResponse.json({
      success: true,
      linked,
      failed,
      total: matches.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
