import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceSupabase } from "@/lib/supabase/client";
import { MCP_TOOLS, executeMCPTool } from "@/lib/ai/mcp-tools";

/**
 * Claude-Powered Code Generation for Storefronts
 * POST /api/ai/claude-code-gen
 *
 * Capabilities:
 * - Generate component code
 * - Modify existing components
 * - Create entire page layouts
 * - Understand Yacht Club architecture
 */
export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      componentKey,
      currentProps,
      currentCode,
      pageType,
      vendorId,
      action, // 'generate' | 'modify' | 'optimize' | 'debug'
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt required" },
        { status: 400 },
      );
    }

    // Get Claude API key from Supabase
    const supabase = getServiceSupabase();
    const { data: config, error: configError } = await supabase
      .from("ai_config")
      .select("api_key, model, max_tokens, temperature")
      .eq("provider", "anthropic")
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { success: false, error: "AI configuration not found" },
        { status: 500 },
      );
    }

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: config.api_key,
    });

    // Fetch vendor data for context using MCP tools
    let vendorData = null;
    let vendorProducts = null;

    if (vendorId) {
      vendorData = await executeMCPTool("get_vendor_info", {
        vendor_id: vendorId,
      });
      vendorProducts = await executeMCPTool("get_vendor_products", {
        vendor_id: vendorId,
        limit: 10,
      });
    }

    // Build system context about Yacht Club architecture
    const systemContext = buildYachtClubContext(
      action,
      componentKey,
      pageType,
      vendorData,
      vendorProducts,
    );

    // Build user message with all context
    const userMessage = buildUserMessage({
      prompt,
      componentKey,
      currentProps,
      currentCode,
      pageType,
      vendorId,
      action,
    });

    // Check if streaming is requested
    const stream = request.headers.get("accept") === "text/event-stream";

    if (stream) {
      // STREAMING MODE with animations
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const stream = await anthropic.messages.stream({
              model: config.model || "claude-sonnet-4-20250514",
              max_tokens: config.max_tokens || 8000,
              temperature: 1.0,
              system: systemContext,
              tools: MCP_TOOLS as any,
              messages: [
                {
                  role: "user",
                  content: userMessage,
                },
              ],
            });

            let fullText = "";
            let toolInputs: any[] = [];

            // Send initial event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "start", message: "Analyzing vendor data..." })}\n\n`,
              ),
            );

            for await (const event of stream) {
              // Handle tool use
              if (
                event.type === "content_block_start" &&
                (event as any).content_block?.type === "tool_use"
              ) {
                const toolName = (event as any).content_block.name;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "thinking", message: `Using ${toolName}...` })}\n\n`,
                  ),
                );
              }

              if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  const text = event.delta.text;
                  fullText += text;

                  // Stream each character
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "content",
                        text: text,
                        fullText: fullText,
                      })}\n\n`,
                    ),
                  );
                }

                // Collect tool inputs
                if ((event.delta as any).type === "input_json_delta") {
                  // Tool input streaming
                }
              }

              if (event.type === "message_start") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "thinking", message: "Generating components..." })}\n\n`,
                  ),
                );
              }
            }

            // Parse final response
            const parsed = parseClaudeResponse(fullText, action);

            // Get final message with usage stats
            const finalMessage = await stream.finalMessage();

            // Send completion event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  ...parsed,
                  usage: finalMessage.usage,
                })}\n\n`,
              ),
            );

            controller.close();
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: error.message,
                })}\n\n`,
              ),
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // NON-STREAMING MODE (fallback)
    const message = await anthropic.messages.create({
      model: config.model || "claude-3-5-sonnet-20241022",
      max_tokens: config.max_tokens || 8000,
      temperature: 1.0,
      system: systemContext,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse Claude's response
    const parsed = parseClaudeResponse(responseText, action);

    return NextResponse.json({
      success: true,
      ...parsed,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Claude code gen error:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message || "AI generation failed" },
      { status: 500 },
    );
  }
}

/**
 * Build comprehensive system context about Yacht Club
 */
function buildYachtClubContext(
  action: string,
  componentKey?: string,
  pageType?: string,
  vendorData?: any,
  vendorProducts?: any,
): string {
  let vendorContext = "";

  if (vendorData) {
    vendorContext = `\n\n## CURRENT VENDOR CONTEXT
Store Name: ${vendorData.store_name}
Slug: ${vendorData.slug}
Tagline: ${vendorData.tagline || "N/A"}
Brand Colors: Primary ${vendorData.primary_color || "#000"}, Secondary ${vendorData.secondary_color || "#fff"}
Logo: ${vendorData.logo_url || "Not set"}
`;
  }

  if (vendorProducts && vendorProducts.products?.length > 0) {
    vendorContext += `\n## VENDOR PRODUCTS (Sample)
${vendorProducts.products
  .slice(0, 5)
  .map(
    (p: any) =>
      `- ${p.name} (${p.category || "uncategorized"}) - $${p.price || "0"} - Stock: ${p.stock}`,
  )
  .join("\n")}
Total Products: ${vendorProducts.total}
`;
  }

  return `You are Claude Sonnet 4, an expert AI coding assistant integrated into Yacht Club, a multi-vendor cannabis marketplace platform.

## YOUR MISSION
Generate production-ready component configurations for vendor storefronts. You have REAL-TIME access to the vendor's products, categories, and branding through MCP tools.
${vendorContext}

## YOUR ROLE
You help vendors build beautiful, high-converting storefronts using our component-based visual builder.

## YACHT CLUB ARCHITECTURE

### Component System
- **Atomic Components**: text, image, button, icon, spacer, divider, badge
- **Smart Components**: smart_product_grid, smart_product_detail, smart_header, smart_footer, smart_locations, smart_reviews
- **Composite Components**: Multi-component layouts like hero sections, feature grids

### Component Props Schema
Every component has a \`props\` object with specific fields:

**Text Component:**
\`\`\`typescript
{
  content: string;
  variant: 'headline' | 'subheadline' | 'paragraph' | 'label' | 'caption';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  align: 'left' | 'center' | 'right';
  color: string; // hex color
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}
\`\`\`

**Button Component:**
\`\`\`typescript
{
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
}
\`\`\`

**Image Component:**
\`\`\`typescript
{
  src: string;
  alt: string;
  aspect: 'auto' | '1:1' | '4:3' | '16:9' | '21:9' | '3:4';
  fit: 'contain' | 'cover' | 'fill' | 'none';
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  priority?: boolean;
}
\`\`\`

**Smart Product Grid:**
\`\`\`typescript
{
  vendorId: string; // Auto-filled
  columns: 2 | 3 | 4 | 5;
  maxProducts: number;
  headline?: string;
  subheadline?: string;
  showPrice: boolean;
  showQuickAdd: boolean;
  cardStyle: 'minimal' | 'bordered' | 'elevated';
  selectedProductIds?: string[]; // Filter specific products
  selectedCategoryIds?: string[]; // Filter by categories
}
\`\`\`

### Database Schema (Supabase)
\`\`\`sql
-- Sections organize components
vendor_content_sections (
  id UUID,
  vendor_id UUID,
  page_type TEXT, -- 'home' | 'shop' | 'product' | 'about' | 'contact' | 'all'
  section_key TEXT, -- 'hero' | 'features' | 'products' | 'testimonials'
  section_order INTEGER,
  content_data JSONB
)

-- Component instances in sections
vendor_component_instances (
  id UUID,
  vendor_id UUID,
  section_id UUID,
  component_key TEXT, -- References component_templates
  props JSONB, -- The actual component props
  field_bindings JSONB, -- Dynamic data bindings
  position_order INTEGER,
  container_config JSONB,
  is_enabled BOOLEAN
)
\`\`\`

### Best Practices
1. **Accessibility**: Always include alt text, proper color contrast
2. **Performance**: Use priority loading for above-fold images
3. **Mobile-First**: All layouts must be responsive
4. **Cannabis Compliance**: Age gates, disclaimers where needed
5. **Conversion**: Clear CTAs, trust signals, social proof

### Common Patterns

**Hero Section:**
\`\`\`json
[
  {
    "component_key": "text",
    "props": {
      "content": "Premium Cannabis Delivered",
      "variant": "headline",
      "size": "4xl",
      "align": "center",
      "color": "#ffffff"
    }
  },
  {
    "component_key": "text",
    "props": {
      "content": "High-quality products, trusted brands",
      "variant": "subheadline",
      "size": "lg",
      "align": "center",
      "color": "#a3a3a3"
    }
  },
  {
    "component_key": "button",
    "props": {
      "text": "Shop Now",
      "href": "/shop",
      "variant": "primary",
      "size": "xl"
    }
  }
]
\`\`\`

## YOUR TASK
${action === "generate" ? "Generate new component configuration based on user request" : ""}
${action === "modify" ? "Modify existing component props" : ""}
${action === "optimize" ? "Optimize component for performance and conversion" : ""}
${action === "debug" ? "Debug and fix component issues" : ""}

Current context:
- Component: ${componentKey || "Multiple"}
- Page Type: ${pageType || "Unknown"}

## CRITICAL INSTRUCTIONS

1. **Use REAL Vendor Data**: You have access to actual products, categories, and branding. Use them!
   - Product names, prices, descriptions are REAL
   - Categories are REAL
   - Brand colors and logo are REAL
   - Never use placeholder data

2. **Be Specific & Actionable**: 
   - Use exact product names if showing products
   - Use vendor's actual brand colors
   - Reference real categories

3. **Think Creatively** (Temperature 1.0):
   - Unique layouts based on vendor's products
   - Custom text that matches their brand
   - Strategic component placement

4. **Cannabis Compliance**:
   - Always consider age verification
   - Include disclaimers where needed
   - Trust signals are important

5. **Conversion-Focused**:
   - Clear CTAs
   - Trust badges
   - Social proof
   - Easy navigation

## MCP TOOLS AVAILABLE
You have these tools to query the database:
- \`get_vendor_products\`: Fetch product list with prices, categories, stock
- \`get_vendor_categories\`: Get all product categories
- \`get_vendor_info\`: Get branding, colors, logo
- \`get_top_selling_products\`: Get best-sellers

Use these tools to create PERSONALIZED components with REAL data!

## OUTPUT FORMAT (CRITICAL)
You MUST respond with ONLY a JSON code block. No text before or after. Structure:

\`\`\`json
{
  "components": [
    {
      "component_key": "text",
      "props": {
        "content": "Use REAL vendor data here",
        "variant": "headline",
        "size": "4xl",
        "align": "center",
        "color": "#ffffff"
      },
      "reasoning": "Brief explanation"
    }
  ],
  "explanation": "What you created and why",
  "warnings": [],
  "suggestions": []
}
\`\`\`

START your response with \`\`\`json and END with \`\`\`. Nothing else.

## EXAMPLES OF GOOD RESPONSES

User: "Create a hero section"

Good Response:
"I'll create a hero section using the vendor's actual store name and brand colors.

\`\`\`json
{
  "components": [
    {
      "component_key": "text",
      "props": {
        "content": "${vendorData?.store_name || "Premium Cannabis"} - ${vendorData?.tagline || "Quality You Can Trust"}",
        "variant": "headline",
        "size": "4xl",
        "align": "center",
        "color": "${vendorData?.primary_color || "#ffffff"}"
      },
      "reasoning": "Using actual store name and tagline creates authentic brand presence"
    }
  ]
}
\`\`\`"

Be specific, use REAL data, and create components that convert!`;
}

/**
 * Build user message with full context
 */
function buildUserMessage(context: any): string {
  const {
    prompt,
    componentKey,
    currentProps,
    currentCode,
    pageType,
    vendorId,
    action,
  } = context;

  let message = `Action: ${action}\n\n`;

  if (componentKey) {
    message += `Component Type: ${componentKey}\n`;
  }

  if (pageType) {
    message += `Page Type: ${pageType}\n`;
  }

  if (vendorId) {
    message += `Vendor ID: ${vendorId}\n`;
  }

  if (currentProps) {
    message += `\nCurrent Props:\n\`\`\`json\n${JSON.stringify(currentProps, null, 2)}\n\`\`\`\n`;
  }

  if (currentCode) {
    message += `\nCurrent Code:\n\`\`\`typescript\n${currentCode}\n\`\`\`\n`;
  }

  message += `\n\nUser Request:\n${prompt}\n`;
  message += `\n\nIMPORTANT: Start your response with \`\`\`json and end with \`\`\`. Output ONLY the JSON code block, nothing else.`;

  return message;
}

/**
 * Parse Claude's response into structured format
 */
function parseClaudeResponse(responseText: string, action: string): any {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;

    const parsed = JSON.parse(jsonText);

    return {
      components: parsed.components || [],
      explanation: parsed.explanation || "",
      warnings: parsed.warnings || [],
      suggestions: parsed.suggestions || [],
      rawResponse: responseText,
    };
  } catch (error) {
    // If parsing fails, return raw text
    return {
      components: [],
      explanation: responseText,
      warnings: ["Failed to parse structured response"],
      suggestions: [],
      rawResponse: responseText,
    };
  }
}

/**
 * GET endpoint to check AI config status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { data: config, error } = await supabase
      .from("ai_config")
      .select("provider, model, created_at")
      .eq("provider", "anthropic")
      .single();

    if (error || !config) {
      return NextResponse.json({
        success: false,
        configured: false,
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      provider: config.provider,
      model: config.model,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
