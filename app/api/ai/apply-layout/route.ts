import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

/**
 * Apply AI Layout Recommendation to Menu
 *
 * POST /api/ai/apply-layout
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, menuId, modifications = null } = body;

    if (!recommendationId || !menuId) {
      return NextResponse.json(
        { success: false, error: "Recommendation ID and Menu ID required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // 1. Load the recommendation
    const { data: recommendation, error: recError } = await supabase
      .from("ai_layout_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json(
        { success: false, error: "Recommendation not found" },
        { status: 404 },
      );
    }

    const layout = recommendation.recommended_layout;

    // 2. Apply modifications if provided
    const finalLayout = modifications
      ? { ...layout, ...modifications }
      : layout;

    // 3. Update menu with AI-optimized layout
    const { data: updatedMenu, error: menuError } = await supabase
      .from("tv_menus")
      .update({
        display_mode: finalLayout.displayMode,
        config_data: {
          ai_optimized: true,
          ai_recommendation_id: recommendationId,
          categories: finalLayout.categories || [],
          grid_config: {
            columns: finalLayout.gridColumns,
            rows: finalLayout.gridRows,
          },
          typography: finalLayout.typography,
          spacing: finalLayout.spacing,
          content_strategy: finalLayout.contentStrategy,
          carousel_config: finalLayout.carouselConfig,
        },
      })
      .eq("id", menuId)
      .select()
      .single();

    if (menuError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to update menu:", menuError);
      }
      return NextResponse.json(
        { success: false, error: menuError.message },
        { status: 500 },
      );
    }

    // 4. Mark recommendation as applied
    await supabase
      .from("ai_layout_recommendations")
      .update({
        was_applied: true,
        applied_at: new Date().toISOString(),
        user_feedback: modifications ? "modified" : "accepted",
        user_modifications: modifications,
      })
      .eq("id", recommendationId);

    return NextResponse.json({
      success: true,
      menu: updatedMenu,
      message: "AI layout applied successfully",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Apply layout error:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
