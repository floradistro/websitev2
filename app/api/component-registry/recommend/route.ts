/**
 * API: Get recommended components for field types
 * POST /api/component-registry/recommend
 * Body: { fieldTypes: ['product_picker', 'category_picker'] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getRecommendedComponents } from "@/lib/component-registry";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldTypes } = body;

    if (!Array.isArray(fieldTypes) || fieldTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: "fieldTypes array is required" },
        { status: 400 },
      );
    }

    const recommendations = await getRecommendedComponents(fieldTypes);

    return NextResponse.json({
      success: true,
      fieldTypes,
      recommendations,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Failed to get recommendations:", error);
    }
    return NextResponse.json(
      { success: false, error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}
