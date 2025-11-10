import { NextRequest, NextResponse } from "next/server";
import { getRecentDeployments } from "@/lib/deployment/vercel";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET /api/vendor/website/vercel-deployments
 * Get actual Vercel deployments for the main project
 * This shows real deployment status from Vercel
 */
export async function GET(request: NextRequest) {
  try {
    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelProjectId) {
      return NextResponse.json({ error: "Vercel project not configured" }, { status: 500 });
    }

    // Get recent deployments from Vercel
    const deployments = await getRecentDeployments(vercelProjectId, 10);

    return NextResponse.json({
      success: true,
      deployments: deployments.deployments || [],
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching Vercel deployments:", err);
    }
    return NextResponse.json(
      {
        error: err.message || "Failed to fetch deployments",
      },
      { status: 500 },
    );
  }
}
