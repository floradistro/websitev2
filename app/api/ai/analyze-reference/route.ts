/**
 * Analyze Reference Website
 * Takes screenshots and analyzes design of a reference URL
 * Used by AI to understand and replicate design patterns
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { VisualAnalyzer } from "@/lib/ai/visual-analyzer";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { checkAIRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";
export async function POST(request: NextRequest) {
  // RATE LIMIT: AI operation
  const rateLimitResult = checkAIRateLimit(request, RateLimitConfigs.ai);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { url, viewport } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const analyzer = new VisualAnalyzer();
    const analysis = await analyzer.analyzeWebsite(url, { viewport });

    return NextResponse.json({
      success: true,
      analysis: {
        url: analysis.url,
        title: analysis.metadata.title,
        colorScheme: analysis.metadata.colorScheme,
        screenshot: `data:image/png;base64,${analysis.screenshot}`,
        insights: analysis.insights,
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Analysis error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to analyze website" },
      { status: 500 },
    );
  }
}
