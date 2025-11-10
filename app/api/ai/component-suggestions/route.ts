import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { checkAIRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";
/**
 * AI Component Suggestions - Phase 4
 * Analyzes components and provides AI-powered optimization suggestions
 * POST /api/ai/component-suggestions
 */
export async function POST(request: NextRequest) {
  // RATE LIMIT: AI operation
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
    const {
      vendorId,
      componentKey,
      currentProps,
      pageType,
      sectionComponents,
    } = await request.json();

    if (!vendorId || !componentKey) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate AI suggestions based on component type and context
    const suggestions = generateSuggestions(
      componentKey,
      currentProps,
      pageType,
      sectionComponents,
    );

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("AI suggestions error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate suggestions",
      },
      { status: 500 },
    );
  }
}

/**
 * Generate contextual AI suggestions for component optimization
 */
function generateSuggestions(
  componentKey: string,
  currentProps: any,
  pageType: string,
  sectionComponents: string[],
): any[] {
  const suggestions: any[] = [];

  // Text component suggestions
  if (componentKey === "text") {
    if (!currentProps.color || currentProps.color === "#ffffff") {
      suggestions.push({
        id: "text-contrast",
        type: "Accessibility",
        impact: "High",
        title: "Improve Text Contrast",
        description:
          "White text on light backgrounds can be hard to read. Consider using a darker color for better contrast.",
        proposedProps: { color: "#1a1a1a" },
        reason: "Improves readability and accessibility compliance (WCAG AA)",
      });
    }

    if (currentProps.size === "xs" && currentProps.variant === "headline") {
      suggestions.push({
        id: "text-size",
        type: "Design",
        impact: "Medium",
        title: "Increase Headline Size",
        description: "Headlines should be larger to create visual hierarchy",
        proposedProps: { size: "xl" },
        reason: "Headlines draw attention and establish content structure",
      });
    }

    if (
      currentProps.content &&
      currentProps.content.length > 200 &&
      currentProps.size === "lg"
    ) {
      suggestions.push({
        id: "text-readability",
        type: "UX",
        impact: "Medium",
        title: "Optimize Text Size for Readability",
        description: "Long text blocks are easier to read at medium size",
        proposedProps: { size: "md" },
        reason: "Reduces eye strain and improves reading flow",
      });
    }
  }

  // Button component suggestions
  if (componentKey === "button") {
    if (pageType === "home" && currentProps.variant === "ghost") {
      suggestions.push({
        id: "button-cta",
        type: "Conversion",
        impact: "High",
        title: "Use Primary Button for Homepage CTA",
        description:
          "Homepage CTAs should be highly visible to drive conversions",
        proposedProps: { variant: "primary", size: "lg" },
        reason: "Primary buttons increase click-through rates by 30-50%",
      });
    }

    if (!currentProps.text || currentProps.text === "Click me") {
      suggestions.push({
        id: "button-text",
        type: "Copywriting",
        impact: "High",
        title: "Use Action-Oriented Button Text",
        description: "Replace generic text with specific action verbs",
        proposedProps: {
          text: pageType === "home" ? "Shop Now" : "Learn More",
        },
        reason: "Action verbs increase engagement and clarify user intent",
      });
    }
  }

  // Image component suggestions
  if (componentKey === "image") {
    if (!currentProps.alt || currentProps.alt === "Logo") {
      suggestions.push({
        id: "image-alt",
        type: "Accessibility",
        impact: "High",
        title: "Add Descriptive Alt Text",
        description: "Alt text is critical for screen readers and SEO",
        proposedProps: { alt: "Company logo" },
        reason: "Required for WCAG compliance and improves SEO",
      });
    }

    if (currentProps.aspect === "auto" && pageType === "home") {
      suggestions.push({
        id: "image-aspect",
        type: "Performance",
        impact: "Medium",
        title: "Set Fixed Aspect Ratio",
        description: "Prevents layout shift during image loading",
        proposedProps: { aspect: "16:9" },
        reason: "Improves Core Web Vitals (CLS score)",
      });
    }
  }

  // Smart Product Grid suggestions
  if (componentKey === "smart_product_grid") {
    if (currentProps.columns === 5) {
      suggestions.push({
        id: "grid-columns",
        type: "UX",
        impact: "Medium",
        title: "Optimize Grid Columns",
        description:
          "5 columns can feel cramped on most screens. 3-4 columns work better.",
        proposedProps: { columns: 3 },
        reason: "Provides better visual spacing and product focus",
      });
    }

    if (!currentProps.headline) {
      suggestions.push({
        id: "grid-headline",
        type: "Content",
        impact: "Low",
        title: "Add Section Headline",
        description: "Headlines help users scan content and understand context",
        proposedProps: {
          headline: pageType === "home" ? "Featured Products" : "Our Products",
        },
        reason: "Improves content structure and user navigation",
      });
    }

    if (currentProps.maxProducts && currentProps.maxProducts > 20) {
      suggestions.push({
        id: "grid-limit",
        type: "Performance",
        impact: "High",
        title: "Limit Products for Performance",
        description: "Loading too many products at once slows page load",
        proposedProps: { maxProducts: 12 },
        reason: "Faster page loads improve conversion rates",
      });
    }
  }

  // Layout suggestions based on section context
  if (sectionComponents.length > 0) {
    // If section has multiple text components
    const textComponentCount = sectionComponents.filter(
      (c) => c === "text",
    ).length;
    if (textComponentCount > 5 && componentKey === "text") {
      suggestions.push({
        id: "layout-spacing",
        type: "Layout",
        impact: "Low",
        title: "Add Spacer for Better Spacing",
        description: "Too many text elements close together can feel cluttered",
        proposedProps: {},
        reason: "Whitespace improves readability and visual appeal",
      });
    }
  }

  return suggestions;
}
