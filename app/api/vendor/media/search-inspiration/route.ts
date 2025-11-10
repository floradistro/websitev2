import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const exa = new Exa("c6064aa5-e664-4bb7-9de9-d09ff153aa53");

/**
 * POST /api/vendor/media/search-inspiration
 * Search for visual inspiration using Exa
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { query, numResults = 5 } = body;

    if (!query) {
      return NextResponse.json({ error: "Search query required" }, { status: 400 });
    }

    // Search with Exa
    const searchResults = await exa.searchAndContents(query, {
      type: "neural",
      useAutoprompt: true,
      numResults: numResults,
      text: true,
      highlights: true,
    });

    // Extract relevant information
    const inspiration = searchResults.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.text?.substring(0, 200) || "",
      highlights: result.highlights || [],
      score: result.score,
    }));

    return NextResponse.json({
      success: true,
      query,
      results: inspiration,
      count: inspiration.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Exa search error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to search for inspiration" },
      { status: 500 },
    );
  }
}
