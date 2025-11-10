import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { checkAIRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  // RATE LIMIT: AI generation
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
    const { prompt, vendorId } = await request.json();

    if (!prompt || !vendorId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch vendor data for context
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendorId)
      .limit(100);

    const { data: inventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("vendor_id", vendorId);

    // Create context for Claude
    const context = {
      totalProducts: products?.length || 0,
      categories: [...new Set(products?.map((p) => p.category))],
      hasInventory: inventory && inventory.length > 0,
    };

    // Call Claude to generate KPI
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a data analytics expert. A cannabis dispensary vendor wants to track this metric:

"${prompt}"

Available data context:
- Total Products: ${context.totalProducts}
- Product Categories: ${context.categories.join(", ")}
- Has Inventory Data: ${context.hasInventory}

Generate a KPI widget configuration in JSON format with the following structure:
{
  "id": "unique-id",
  "title": "Short KPI Title (2-4 words)",
  "value": "The actual metric value or calculation",
  "change": number (optional - percentage change),
  "changeLabel": "string (optional - e.g., 'vs last month')",
  "subtitle": "Brief description",
  "visualization": "number" | "chart" | "progress" | "list",
  "query": "The SQL query or data fetching logic needed",
  "data": [] (optional - for visualizations like lists or progress bars)
}

Make it actionable and relevant. Return ONLY valid JSON, no markdown or explanation.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let kpiConfig;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?|\n?```/g, "").trim();
      kpiConfig = JSON.parse(jsonText);
    } catch (parseError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to parse Claude response:", responseText);
      }
      return NextResponse.json(
        { success: false, error: "Failed to generate valid KPI configuration" },
        { status: 500 },
      );
    }

    // Fetch real data based on common KPI patterns
    try {
      // Get sales data if relevant
      if (
        prompt.toLowerCase().includes("sales") ||
        prompt.toLowerCase().includes("revenue")
      ) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: salesData } = await supabase
          .from("order_items")
          .select("quantity, price")
          .eq("vendor_id", vendorId)
          .gte("created_at", thirtyDaysAgo.toISOString());

        if (salesData && salesData.length > 0) {
          const totalRevenue = salesData.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
          );
          kpiConfig.value = `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }

      // Get top products if requested
      if (
        prompt.toLowerCase().includes("top") &&
        prompt.toLowerCase().includes("product")
      ) {
        const { data: topProducts } = await supabase
          .from("products")
          .select("name, price, category")
          .eq("vendor_id", vendorId)
          .eq("status", "approved")
          .limit(5);

        if (
          topProducts &&
          topProducts.length > 0 &&
          kpiConfig.visualization === "list"
        ) {
          kpiConfig.data = topProducts.map((p) => ({
            label: p.name,
            value: `$${p.price}`,
          }));
        }
      }

      // Get low stock items if requested
      if (
        prompt.toLowerCase().includes("stock") ||
        prompt.toLowerCase().includes("inventory")
      ) {
        const { data: stockData } = await supabase
          .from("inventory")
          .select("product_id, quantity, threshold")
          .eq("vendor_id", vendorId);

        if (stockData) {
          // Filter client-side for items where quantity < threshold
          const lowStockItems = stockData.filter(
            (item) => item.quantity < (item.threshold || 0),
          );
          kpiConfig.value = lowStockItems.length;
        }
      }
    } catch (dataError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Data fetching error:", dataError);
      }
      // Continue with the generated config even if data fetching fails
    }

    return NextResponse.json({
      success: true,
      kpi: kpiConfig,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error generating KPI:", error);
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
