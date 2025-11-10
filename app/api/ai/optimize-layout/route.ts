import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { LayoutOptimizer } from "@/lib/ai/layout-optimizer";
import { LLMLayoutConsultant } from "@/lib/ai/llm-layout-consultant";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * AI Layout Optimization API
 *
 * POST /api/ai/optimize-layout
 *
 * Analyzes display profile, product data, and business context
 * Returns AI-optimized layout recommendations
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, menuId, vendorId, useLLM = false } = body;

    if (!deviceId || !vendorId) {
      return NextResponse.json(
        { success: false, error: "Device ID and Vendor ID required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // 1. Load display profile
    const { data: profile, error: profileError } = await supabase
      .from("tv_display_profiles")
      .select("*")
      .eq("device_id", deviceId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Display profile not found. Please configure display settings first.",
          needsProfile: true,
        },
        { status: 404 },
      );
    }

    // 2. Load product data
    const { data: products } = await supabase
      .from("products")
      .select(
        `
        *,
        product_categories(
          category:categories(name)
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .eq("status", "published");

    // Extract categories
    const categorySet = new Set<string>();
    products?.forEach((p: any) => {
      p.product_categories?.forEach((pc: any) => {
        if (pc.category?.name) {
          categorySet.add(pc.category.name);
        }
      });
    });
    const categories = [...categorySet];

    // Count fields per product (for complexity estimation)
    const sampleProduct = products?.[0];
    const avgFields = sampleProduct ? Object.keys(sampleProduct).length : 5;

    // Check for active promotions
    const { data: promotions } = await supabase
      .from("promotions")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString());

    const productContext = {
      totalProducts: products?.length || 0,
      avgFieldsPerProduct: avgFields,
      hasImages: products?.some((p: any) => p.featured_image_storage) || false,
      hasTieredPricing: true, // Assume true for dispensaries
      activePromotions: promotions?.length || 0,
      categories,
    };

    // 3. Run rule-based AI optimization
    const ruleBasedLayout = LayoutOptimizer.optimize(
      {
        screenWidthInches: profile.screen_width_inches,
        screenHeightInches: profile.screen_height_inches,
        resolutionWidth: profile.resolution_width,
        resolutionHeight: profile.resolution_height,
        viewingDistanceFeet: profile.viewing_distance_feet,
        locationType: profile.location_type,
        ambientLighting: profile.ambient_lighting,
        dwellTimeSeconds: profile.avg_dwell_time_seconds,
      },
      productContext,
    );

    let finalRecommendation: {
      aiType: string;
      layout: any;
      reasoning: any;
      alternatives: any[];
      customizationTips: any[];
      confidence: number;
    } = {
      aiType: "rule_based",
      layout: ruleBasedLayout,
      reasoning: ruleBasedLayout.reasoning,
      alternatives: [],
      customizationTips: [],
      confidence: ruleBasedLayout.confidenceScore,
    };

    // 4. Optionally enhance with LLM
    if (useLLM && process.env.ANTHROPIC_API_KEY) {
      try {
        const llmConsultant = new LLMLayoutConsultant(process.env.ANTHROPIC_API_KEY);

        // Load vendor for store context
        const { data: vendor } = await supabase
          .from("vendors")
          .select("store_name")
          .eq("id", vendorId)
          .single();

        const llmRecommendation = await llmConsultant.getRecommendation(
          {
            storeName: vendor?.store_name || "Store",
            storeType: profile.store_type,
            brandVibe: profile.brand_vibe,
            targetAudience: profile.target_audience || "general customers",
          },
          {
            profile,
            location: profile.location_type,
            adjacentTo: profile.adjacent_to,
            customerBehavior: profile.customer_behavior || "browsing products",
          },
          {
            data: productContext,
            businessGoals: profile.business_goals || ["maximize sales"],
          },
          ruleBasedLayout,
        );

        finalRecommendation = {
          aiType: "hybrid",
          layout: llmRecommendation.layout,
          reasoning: [llmRecommendation.reasoning],
          alternatives: llmRecommendation.alternatives,
          customizationTips: llmRecommendation.customizationTips,
          confidence: llmRecommendation.confidence,
        };
      } catch (llmError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("LLM enhancement failed, using rule-based:", llmError);
        }
      }
    }

    // 5. Save recommendation to database
    const { data: savedRecommendation, error: saveError } = await supabase
      .from("ai_layout_recommendations")
      .insert({
        device_id: deviceId,
        vendor_id: vendorId,
        menu_id: menuId || null,
        ai_type: finalRecommendation.aiType,
        recommended_layout: finalRecommendation.layout,
        confidence_score: finalRecommendation.confidence,
        reasoning: finalRecommendation.reasoning,
        alternatives: finalRecommendation.alternatives,
        customization_tips: finalRecommendation.customizationTips,
        product_count_at_time: productContext.totalProducts,
        categories_at_time: categories,
      })
      .select()
      .single();

    if (saveError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to save recommendation:", saveError);
      }
    }

    return NextResponse.json({
      success: true,
      recommendation: finalRecommendation,
      recommendationId: savedRecommendation?.id,
      applySuggestion: {
        endpoint: "/api/ai/apply-layout",
        payload: {
          recommendationId: savedRecommendation?.id,
          menuId: menuId,
        },
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("AI layout optimization error:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/ai/optimize-layout?deviceId=xxx
 *
 * Get latest recommendation for a device
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Device ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: recommendation } = await supabase
      .from("ai_layout_recommendations")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching recommendation:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
