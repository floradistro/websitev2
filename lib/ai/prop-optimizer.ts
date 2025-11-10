/**
 * AI Prop Optimizer - Controls Component DNA
 * This is the brain that optimizes component props based on analytics
 */

import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ComponentAnalytics {
  views: number;
  clicks: number;
  conversions: number;
  addToCarts: number;
  bounceRate: number;
  dwellTime: number;
}

interface OptimizationResult {
  originalProps: Record<string, any>;
  optimizedProps: Record<string, any>;
  reasoning: string;
  expectedImpact: {
    conversionRate: string;
    bounceRate: string;
    engagement: string;
  };
}

export class PropOptimizer {
  private claude: Anthropic;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  /**
   * Optimize component props using AI based on performance metrics
   */
  async optimizeComponentProps(
    componentId: string,
    vendorId: string,
    currentProps: Record<string, any>,
    analytics: ComponentAnalytics,
  ): Promise<OptimizationResult> {
    // Calculate current performance
    const conversionRate =
      analytics.views > 0 ? (analytics.conversions / analytics.views) * 100 : 0;
    const clickRate =
      analytics.views > 0 ? (analytics.clicks / analytics.views) * 100 : 0;
    const cartRate =
      analytics.views > 0 ? (analytics.addToCarts / analytics.views) * 100 : 0;

    // Ask Claude to optimize
    const response = await this.claude.messages.create({
      model: "claude-3-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `
You are optimizing e-commerce component props to improve conversion.

Component: ${componentId}
Current Props: ${JSON.stringify(currentProps, null, 2)}

Performance Metrics:
- Views: ${analytics.views}
- Click Rate: ${clickRate.toFixed(2)}%
- Cart Add Rate: ${cartRate.toFixed(2)}%  
- Conversion Rate: ${conversionRate.toFixed(2)}%
- Bounce Rate: ${analytics.bounceRate}%
- Avg Dwell Time: ${analytics.dwellTime}s

Optimization Rules:
1. If bounce rate > 40%, simplify (reduce columns, hide complex features)
2. If dwell time < 10s, make more engaging (add animations, better headlines)
3. If click rate < 5%, strengthen CTAs (better button text, colors)
4. If cart rate < conversion rate, improve product display
5. Keep all existing prop keys, just optimize values

Return ONLY valid JSON in this format:
{
  "optimizedProps": { ...improved props... },
  "reasoning": "Why these changes will help",
  "expectedImpact": {
    "conversionRate": "+X%",
    "bounceRate": "-Y%",
    "engagement": "+Z%"
  }
}
        `,
        },
      ],
    });

    const result = JSON.parse(
      response.content[0].type === "text" ? response.content[0].text : "{}",
    );

    // Update database with new DNA
    await supabase
      .from("vendor_component_instances")
      .update({
        props: result.optimizedProps,
        ai_optimized_at: new Date().toISOString(),
        performance_score: conversionRate / 100,
      })
      .eq("id", componentId);

    // Log optimization for learning
    await this.logOptimization({
      componentId,
      vendorId,
      before: currentProps,
      after: result.optimizedProps,
      metrics: {
        conversionRate,
        clickRate,
        cartRate,
        bounceRate: analytics.bounceRate,
        dwellTime: analytics.dwellTime,
      },
      reasoning: result.reasoning,
    });

    return {
      originalProps: currentProps,
      optimizedProps: result.optimizedProps,
      reasoning: result.reasoning,
      expectedImpact: result.expectedImpact,
    };
  }

  /**
   * Learn from all optimizations to find patterns
   */
  async findWinningPatterns(componentKey: string) {
    const { data } = await supabase
      .from("vendor_component_instances")
      .select("props, performance_score")
      .eq("component_key", componentKey)
      .gte("performance_score", 0.15) // 15%+ conversion
      .order("performance_score", { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return null;

    // Extract common patterns from high performers
    const patterns: Record<string, any> = {};

    // Find most common prop values in top performers
    data.forEach((instance) => {
      Object.entries(instance.props).forEach(([key, value]) => {
        if (!patterns[key]) patterns[key] = {};
        const valueStr = JSON.stringify(value);
        patterns[key][valueStr] =
          (patterns[key][valueStr] || 0) + instance.performance_score;
      });
    });

    // Get best value for each prop
    const winningProps: Record<string, any> = {};
    Object.entries(patterns).forEach(([key, values]) => {
      const best = Object.entries(values as Record<string, number>).sort(
        ([, a], [, b]) => b - a,
      )[0];
      if (best) {
        winningProps[key] = JSON.parse(best[0]);
      }
    });

    return winningProps;
  }

  /**
   * Apply collective intelligence to new vendor
   */
  async bootstrapVendor(vendorId: string, vendorType: string) {
    // Get all component types
    const { data: components } = await supabase
      .from("vendor_component_instances")
      .select("id, component_key, props")
      .eq("vendor_id", vendorId);

    if (!components) return;

    // Apply winning patterns to each component
    for (const component of components) {
      const winningProps = await this.findWinningPatterns(
        component.component_key,
      );

      if (winningProps) {
        // Merge winning props with existing
        const optimizedProps = {
          ...component.props,
          ...winningProps,
        };

        await supabase
          .from("vendor_component_instances")
          .update({
            props: optimizedProps,
            ai_optimized_at: new Date().toISOString(),
          })
          .eq("id", component.id);
      }
    }
  }

  private async logOptimization(data: any) {
    // Store optimization history for ML training
    await supabase.from("ai_optimization_history").insert(data);
  }
}
