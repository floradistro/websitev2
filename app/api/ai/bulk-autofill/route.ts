import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Exa from "exa-js";

import { logger } from "@/lib/logger";
// Increase timeout for bulk processing (can take 2-5 minutes for large batches)
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Extract cannabis STRAIN DATA ONLY from web sources (strain databases, seed banks, cannabis info sites). Return ONLY a JSON array with REAL DATA.

CRITICAL RULES - READ CAREFULLY:
- NEVER use placeholder text like "Unknown", "N/A", "TBD", or generic descriptions
- If you CANNOT find real data from sources, use null or empty array []
- Only extract ACTUAL strain data found in the provided sources
- Do NOT make up, guess, or use placeholder values
- FOCUS ON STRAIN INFO: lineage/genetics, terpenes, effects, aroma descriptors
- Extract lineage/genetics (e.g., "Gelato x Wedding Cake", "OG Kush x Durban Poison") - THIS IS CRITICAL
- Extract ACTUAL terpene names (like "Myrcene", "Limonene", "Caryophyllene", "Pinene") from sources
- Extract ACTUAL effects (like "Relaxing", "Euphoric", "Uplifting", "Focused") from sources
- Extract ACTUAL aroma/flavor descriptors (single words like "Candy", "Cake", "Glue", "Gas", "Sherb", "Pine", "Citrus", "Berry", "Diesel", "Fruity")
- For description: Use REAL strain description from sources, or null if not found
- DO NOT extract lab test percentages (THC%, CBD%) - focus on strain genetics and characteristics

Return JSON array with one object per product:
[
  {
    "product_name": "exact product name from sources",
    "strain_type": "Sativa" | "Indica" | "Hybrid" | null (ONLY if found in sources),
    "lineage": "Parent1 x Parent2" | null (CRITICAL - extract actual genetics/lineage from sources),
    "terpene_profile": ["Myrcene", "Limonene", "Caryophyllene"] | [] (ONLY actual terpene names from sources),
    "effects": ["Relaxing", "Euphoric", "Uplifting"] | [] (ONLY actual effects from sources),
    "nose": ["Candy", "Cake", "Gas", "Pine"] | [] (ONLY actual aroma descriptors from sources),
    "description": "actual strain description from sources" | null (REAL description or null),
    "suggested_pricing": {
      "tier_type": "exotic" | "top-shelf" | "mid-shelf" | "value" | null,
      "price_range": "high" | "medium" | "low" | null
    }
  }
]

PRIORITY FIELDS (search extra hard for these):
1. lineage - VERY IMPORTANT, look for "bred by", "cross of", "genetics", "parents"
2. terpene_profile - look for "dominant terpenes", "terps", "terpene content"
3. effects - look for "effects", "high", "feeling"
4. nose - look for "aroma", "smell", "flavor", "taste"

REMEMBER: Empty/null is better than fake placeholder data. Search THOROUGHLY in sources for lineage, terpenes, effects, and aroma before marking as null.`;

export async function POST(request: NextRequest) {
  try {
    // Check for required API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Missing ANTHROPIC_API_KEY");
      }
      return NextResponse.json(
        {
          error: "AI service not configured",
          results: [],
        },
        { status: 500 },
      );
    }

    if (!process.env.EXASEARCH_API_KEY) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Missing EXASEARCH_API_KEY");
      }
      return NextResponse.json(
        {
          error: "Search service not configured",
          results: [],
        },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const exa = new Exa(process.env.EXASEARCH_API_KEY);

    const { products, category } = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Products array required" }, { status: 400 });
    }

    // Process in batches of 5 for optimal performance
    const BATCH_SIZE = 5;
    const results: any[] = [];

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(products.length / BATCH_SIZE);

      try {
        // Single web search for all products in batch - comprehensive query for all strain data
        const searchQuery =
          batch.map((p: any) => p.name).join(", ") +
          ` ${category || "cannabis"} strain genetics lineage parent strains terpene profile nose aroma effects THCa percentage indica sativa hybrid`;

        const searchResults = await exa.searchAndContents(searchQuery, {
          type: "auto",
          useAutoprompt: true,
          numResults: Math.min(15, batch.length * 3), // 3 results per product for better data coverage
          text: true,
        });

        if (!searchResults.results || searchResults.results.length === 0) {
          if (process.env.NODE_ENV === "development") {
            logger.warn(`⚠️ No search results for batch ${batchNum}`);
          }
          // Add null results for this batch
          batch.forEach((product: any) => {
            results.push({
              product_name: product.name,
              success: false,
              error: "No search results found",
            });
          });
          continue;
        }

        // Combine search results
        const context = searchResults.results.map((r) => `${r.title}\n${r.text}`).join("\n---\n");

        // Claude extraction for entire batch
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          temperature: 0,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Extract STRAIN DATA for these ${batch.length} products:\n${batch.map((p: any, idx: number) => `${idx + 1}. ${p.name}`).join("\n")}\n\nFOCUS ON:\n- LINEAGE/GENETICS (Parent1 x Parent2) - MOST IMPORTANT\n- Terpene profile (Myrcene, Limonene, etc.)\n- Effects (Relaxing, Euphoric, etc.)\n- Nose/Aroma (Candy, Gas, Pine, etc.)\n- Strain type (Sativa/Indica/Hybrid)\n\nSearch THOROUGHLY in sources for lineage and genetics information.\n\nSOURCES:\n${context.substring(0, 15000)}\n\nReturn ONLY a JSON array with ${batch.length} objects, one per product in order.`,
            },
          ],
        });

        const claudeText = response.content[0];
        if (claudeText.type !== "text") {
          throw new Error("Invalid response");
        }

        // Parse JSON array
        const jsonMatch = claudeText.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          if (process.env.NODE_ENV === "development") {
            logger.error(`❌ No JSON found in batch ${batchNum}`);
          }
          batch.forEach((product: any) => {
            results.push({
              product_name: product.name,
              success: false,
              error: "Failed to extract data",
            });
          });
          continue;
        }

        const batchData = JSON.parse(jsonMatch[0]);

        // Match results to products
        batch.forEach((product: any, idx: number) => {
          const data =
            batchData[idx] ||
            batchData.find(
              (d: any) =>
                d.product_name?.toLowerCase().includes(product.name.toLowerCase()) ||
                product.name.toLowerCase().includes(d.product_name?.toLowerCase()),
            );

          if (data) {
            results.push({
              product_name: product.name,
              success: true,
              suggestions: data,
            });
          } else {
            results.push({
              product_name: product.name,
              success: false,
              error: "No data matched",
            });
          }
        });
      } catch (error: any) {
        if (process.env.NODE_ENV === "development") {
          logger.error(`❌ Error in batch ${batchNum}:`, error.message);
        }
        // Add error results for this batch
        batch.forEach((product: any) => {
          results.push({
            product_name: product.name,
            success: false,
            error: error.message || "Processing failed",
          });
        });
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < products.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      total: products.length,
      successful: successCount,
      failed: products.length - successCount,
      results,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Bulk autofill error:", error);
    }
    return NextResponse.json(
      {
        error: error.message || "Bulk autofill failed",
        results: [],
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
