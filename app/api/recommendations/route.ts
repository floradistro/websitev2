import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    const { orderHistory, currentProduct, wishlist, allProducts } = await request.json();

    // Use Claude Sonnet 4.5 for recommendations
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    // Build simple context for Claude
    const productsContext = allProducts
      .slice(0, 30)
      .map(
        (p: any) =>
          `ID: ${p.id}, Name: ${p.name}, Category: ${p.categories?.[0]?.name || "Unknown"}`,
      )
      .join("\n");

    const prompt = `You are a cannabis product expert. Based on this data, recommend 4-6 product IDs.

Current Product: ${currentProduct?.name || "N/A"}
Customer previously bought: ${orderHistory.length} items
Customer wishlist: ${wishlist.length} items

Available Products:
${productsContext}

Return ONLY a JSON array of product IDs. Example: [707, 786, 798, 773]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || "[]";

    // Extract product IDs - handle both string and number formats
    let recommendedIds: number[] = [];
    try {
      const parsed = JSON.parse(responseText.match(/\[[\d,\s]+\]/)?.[0] || "[]");
      recommendedIds = parsed.map((id: any) => parseInt(id.toString()));
    } catch {
      recommendedIds = [];
    }

    // Filter products to only return recommended ones
    const recommendations = allProducts
      .filter((p: any) => recommendedIds.includes(p.id))
      .slice(0, 6);

    // If we got recommendations, return them
    if (recommendations.length > 0) {
      return NextResponse.json({
        success: true,
        recommendations,
        ai: true,
      });
    }

    // Fallback if no matches
    throw new Error("No valid recommendations");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("AI recommendation error:", err);
    }
    // Fallback: Return similar category products or popular items
    try {
      const { allProducts, currentProduct } = await request.json();

      let fallback = allProducts;

      // If we have current product, prioritize same category
      if (currentProduct?.categories?.[0]?.id) {
        const sameCategory = allProducts.filter(
          (p: any) =>
            p.categories?.some((c: any) => c.id === currentProduct.categories[0].id) &&
            p.id !== currentProduct.id &&
            p.stock_status === "in_stock",
        );

        if (sameCategory.length >= 4) {
          fallback = sameCategory;
        }
      }

      // Get top products by stock
      fallback = fallback
        .filter((p: any) => p.stock_status === "in_stock")
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);

      return NextResponse.json({
        success: true,
        recommendations: fallback,
        fallback: true,
      });
    } catch {
      return NextResponse.json({
        success: false,
        recommendations: [],
        error: err.message,
      });
    }
  }
}
