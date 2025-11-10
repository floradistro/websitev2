/**
 * API: Get variants for a component
 * GET /api/component-registry/variants/:componentKey
 */

import { NextRequest, NextResponse } from "next/server";
import { getComponentVariants } from "@/lib/component-registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ componentKey: string }> },
) {
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
      console.error("Failed to fetch variants:", error);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch variants" },
      { status: 500 },
    );
  }
}
