import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import Anthropic from "@anthropic-ai/sdk";
import Exa from "exa-js";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { checkAIRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";

// Vercel serverless function timeout: 60 seconds for AI autofill with web search
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface StrainData {
  strain_type?: string;
  thca_percentage?: number;
  delta_9_percentage?: number;
  terpene_profile?: string[];
  effects?: string[];
  lineage?: string;
  nose?: string;
  flavor?: string;
  taste?: string;
}

const SYSTEM_PROMPT = `Extract factual cannabis strain data from sources. Return ONLY JSON.

RULES:
- Never guess or make up data
- Use "Unknown" or null for missing info
- Be concise and factual
- Extract dominant terpenes (Myrcene, Limonene, Caryophyllene, Pinene, etc.)
- Extract flavor notes (citrus, diesel, earthy, sweet, berry, etc.)

JSON format:
{
  "strain_type": "Sativa" | "Indica" | "Hybrid" | "Unknown",
  "thca_percentage": number | null,
  "delta_9_percentage": number | null,
  "terpene_profile": ["Myrcene", "Limonene"] | [],
  "effects": ["Relaxing", "Euphoric"] | [],
  "lineage": "Parent1 x Parent2" | "Unknown",
  "nose": "brief aroma description" | "Unknown",
  "flavor": "brief flavor description" | "Unknown",
  "taste": "brief taste notes" | "Unknown"
}`;

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

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (message: string) => {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify({ message })}\n\n`),
    );
  };

  const sendComplete = async (productId: string, data: StrainData) => {
    await writer.write(
      encoder.encode(
        `data: ${JSON.stringify({ productId, data, complete: true })}\n\n`,
      ),
    );
  };

  const sendError = async (productId: string, error: string) => {
    await writer.write(
      encoder.encode(
        `data: ${JSON.stringify({ productId, error, complete: true })}\n\n`,
      ),
    );
  };

  // Start processing in background
  (async () => {
    try {
      // Initialize AI clients inside function to get fresh env vars
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });

      const exa = new Exa(process.env.EXASEARCH_API_KEY!);

      const body = await request.json();
      const { productIds } = body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        await sendError("", "No product IDs provided");
        await writer.close();
        return;
      }

      await sendProgress(
        `# Strain Research\n\nProcessing ${productIds.length} products`,
      );

      // Fetch products with category info
      const { data: products, error: fetchError } = await supabase
        .from("products")
        .select(
          `
          id, 
          name, 
          meta_data,
          primary_category_id,
          product_categories(
            category:categories(
              id,
              name,
              slug
            )
          )
        `,
        )
        .in("id", productIds);

      if (fetchError) {
        await sendProgress(`\n❌ Database error: ${fetchError.message}`);
        await sendError("", `Failed to fetch products: ${fetchError.message}`);
        await writer.close();
        return;
      }

      if (!products || products.length === 0) {
        await sendProgress(`\n⚠️ No products found with those IDs`);
        await sendError("", "No products found");
        await writer.close();
        return;
      }

      await sendProgress(`Found ${products.length} products in database`);

      // Get field groups to know what fields to extract
      const { data: fieldGroups } = await supabase.from("category_field_groups")
        .select(`
          field_group:field_groups(fields)
        `);

      // Build list of available fields
      const availableFields = new Set<string>();
      fieldGroups?.forEach((fg: any) => {
        fg.field_group?.fields?.forEach((field: any) => {
          availableFields.add(field.slug);
        });
      });

      // Process each product
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const strainName = product.name.trim();

        await sendProgress(`\n---\n\n## ${product.name}`);
        await sendProgress(`\`Product ${i + 1} of ${products.length}\``);

        try {
          // Step 1: Search with Exa
          await sendProgress(`\nSearching web...`);

          let searchResults;
          try {
            searchResults = await exa.searchAndContents(
              `${strainName} cannabis strain THC terpenes effects lineage genetics`,
              {
                type: "auto",
                useAutoprompt: true,
                numResults: 5,
                text: true,
              },
            );
          } catch (exaError: any) {
            await sendProgress(`Error: ${exaError.message}`);
            await sendError(product.id, exaError.message);
            continue;
          }

          if (!searchResults.results || searchResults.results.length === 0) {
            await sendProgress(`No results found`);
            await sendError(product.id, "No research data found");
            continue;
          }

          // Show sources
          await sendProgress(`\nSources (${searchResults.results.length}):`);
          searchResults.results.slice(0, 3).forEach((r, idx) => {
            sendProgress(`\`${idx + 1}. ${r.title}\``);
          });

          // Step 2: Combine search results
          const researchContext = searchResults.results
            .map((result) => `Source: ${result.title}\n${result.text}\n---\n`)
            .join("\n");

          await sendProgress(`\nAnalyzing with Claude...`);

          // Step 3: Ask Claude to analyze
          const availableFieldsList = Array.from(availableFields).join(", ");

          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            temperature: 1,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `Analyze "${strainName}" strain. Extract: ${availableFieldsList}

SOURCES:
${researchContext}

Return ONLY JSON.`,
              },
            ],
          });

          const claudeResponse = response.content[0];
          if (claudeResponse.type !== "text") {
            throw new Error("Unexpected response type");
          }

          // Parse Claude's response
          let strainData: StrainData;
          try {
            const jsonMatch = claudeResponse.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            strainData = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            await sendProgress(`Failed to parse response`);
            await sendError(product.id, "Failed to parse AI response");
            continue;
          }

          // Show extracted fields as code block
          const fieldsOutput = [];
          if (strainData.strain_type && strainData.strain_type !== "Unknown") {
            fieldsOutput.push(`strain_type: "${strainData.strain_type}"`);
          }
          if (strainData.thca_percentage !== null) {
            fieldsOutput.push(`thca_percentage: ${strainData.thca_percentage}`);
          }
          if (strainData.delta_9_percentage !== null) {
            fieldsOutput.push(
              `delta_9_percentage: ${strainData.delta_9_percentage}`,
            );
          }
          if (strainData.terpene_profile?.length) {
            fieldsOutput.push(
              `terpene_profile: [${strainData.terpene_profile.map((t) => `"${t}"`).join(", ")}]`,
            );
          }
          if (strainData.effects?.length) {
            fieldsOutput.push(
              `effects: [${strainData.effects.map((e) => `"${e}"`).join(", ")}]`,
            );
          }
          if (strainData.lineage && strainData.lineage !== "Unknown") {
            fieldsOutput.push(`lineage: "${strainData.lineage}"`);
          }
          if (strainData.flavor && strainData.flavor !== "Unknown") {
            fieldsOutput.push(`flavor: "${strainData.flavor}"`);
          }
          if (strainData.nose && strainData.nose !== "Unknown") {
            fieldsOutput.push(`aroma: "${strainData.nose}"`);
          }

          if (fieldsOutput.length > 0) {
            await sendProgress(
              `\n\`\`\`json\n{\n  ${fieldsOutput.join(",\n  ")}\n}\n\`\`\``,
            );
          }

          // Step 4: Update product in Supabase
          await sendProgress(`\nSaving to database...`);

          const currentMetaData = (product.meta_data as any) || {};
          const updatedMetaData = {
            ...currentMetaData,
            ...(strainData.strain_type &&
              strainData.strain_type !== "Unknown" && {
                strain_type: strainData.strain_type,
              }),
            ...(strainData.thca_percentage !== null && {
              thca_percentage: strainData.thca_percentage,
            }),
            ...(strainData.delta_9_percentage !== null && {
              delta_9_percentage: strainData.delta_9_percentage,
            }),
            ...(strainData.terpene_profile?.length && {
              terpene_profile: strainData.terpene_profile,
            }),
            ...(strainData.effects?.length && { effects: strainData.effects }),
            ...(strainData.lineage &&
              strainData.lineage !== "Unknown" && {
                lineage: strainData.lineage,
              }),
            ...(strainData.nose &&
              strainData.nose !== "Unknown" && { nose: strainData.nose }),
            ...(strainData.flavor &&
              strainData.flavor !== "Unknown" && { flavor: strainData.flavor }),
            ...(strainData.taste &&
              strainData.taste !== "Unknown" && { taste: strainData.taste }),
          };

          const { error: updateError } = await supabase
            .from("products")
            .update({ meta_data: updatedMetaData })
            .eq("id", product.id);

          if (updateError) {
            await sendProgress(`Database error: ${updateError.message}`);
            await sendError(product.id, "Failed to update product");
            continue;
          }

          await sendProgress(`Saved successfully`);
          await sendComplete(product.id, strainData);
        } catch (error) {
          const err = toError(error);
          if (process.env.NODE_ENV === "development") {
            logger.error(`Error processing product ${product.id}:`, err);
          }
          await sendProgress(`❌ Error: ${err.message}`);
          await sendError(product.id, err.message);
        }
      }

      await sendProgress(
        `\n---\n\n## Batch Complete\n\nProcessed ${products.length} products`,
      );
      await writer.close();
    } catch (error) {
      const err = toError(error);
      if (process.env.NODE_ENV === "development") {
        logger.error("Fatal error:", err);
      }
      await sendError("", err.message);
      await writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
