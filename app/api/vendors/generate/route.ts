import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * POST - Trigger AI storefront generation
 * Calls the Agent SDK server to generate complete storefront
 */
export async function POST(request: NextRequest) {
  try {
    const { vendorId, vendorData } = await request.json();

    if (!vendorId || !vendorData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: vendorId, vendorData",
        },
        { status: 400 },
      );
    }

    const agentUrl = process.env.MCP_AGENT_URL || "http://localhost:3001";
    const agentSecret = process.env.MCP_AGENT_SECRET || "yacht-club-secret-2025";

    // Call AI Agent server
    const response = await fetch(`${agentUrl}/api/generate-storefront`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agentSecret}`,
      },
      body: JSON.stringify({
        vendorId,
        vendorData,
      }),
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    });

    if (!response.ok) {
      const error = await response.text();
      if (process.env.NODE_ENV === "development") {
        logger.error("Agent server error", new Error(error), { status: response.status });
      }
      throw new Error(`Agent server error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
    } else {
    }

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Generation trigger error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to trigger generation",
      },
      { status: 500 },
    );
  }
}
