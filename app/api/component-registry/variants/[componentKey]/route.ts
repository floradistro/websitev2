/**
 * API: Get variants for a component
 * GET /api/component-registry/variants/:componentKey
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { getComponentVariants } from "@/lib/component-registry";

import { logger } from "@/lib/logger";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ componentKey: string }> },
) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { componentKey } = await params;

    const variants = await getComponentVariants(componentKey);

    return NextResponse.json({
      success: true,
      componentKey,
      variants,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Failed to fetch variants:", error);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch variants" },
      { status: 500 },
    );
  }
}
