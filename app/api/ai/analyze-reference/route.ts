/**
 * Analyze Reference Website
 * Takes screenshots and analyzes design of a reference URL
 * Used by AI to understand and replicate design patterns
 */

import { NextRequest, NextResponse } from "next/server";
import { VisualAnalyzer } from "@/lib/ai/visual-analyzer";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
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
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Analysis error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to analyze website" },
      { status: 500 },
    );
  }
}
