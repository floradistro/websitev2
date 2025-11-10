import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Exa from "exa-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

// ============================================================================
// TYPES
// ============================================================================

interface StrainInfo {
  product_name: string;
  strain_type: string | null;
  lineage: string | null;
  terpene_profile: string[];
  effects: string[];
  nose: string[];
  description: string | null;
}

// ============================================================================
// CONFIG
// ============================================================================

const CONFIG = {
  BATCH_SIZE: 5, // Process in batches of 5
  SEARCH_RESULTS: 15, // Increased for better coverage
  MAX_CHARS: 6000, // More context
  AI_TOKENS: 8000,
  MAX_RETRIES: 5, // Increased retries
  REQUIRE_ALL_FIELDS: true, // MANDATORY: All fields must be filled
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

function validateStrainData(
  strain: StrainInfo,
  requestedFields: string[],
): {
  valid: boolean;
  missing: string[];
  score: number;
} {
  const missing: string[] = [];
  let score = 0;

  // Check each requested field
  if (requestedFields.includes("lineage")) {
    if (strain.lineage) {
      score += 4;
    } else {
      missing.push("lineage");
    }
  }

  if (requestedFields.includes("terpene_profile")) {
    if (strain.terpene_profile.length > 0) {
      score += 2;
    } else {
      missing.push("terpene_profile");
    }
  }

  if (requestedFields.includes("effects")) {
    if (strain.effects.length > 0) {
      score += 2;
    } else {
      missing.push("effects");
    }
  }

  if (requestedFields.includes("nose")) {
    if (strain.nose.length > 0) {
      score += 1;
    } else {
      missing.push("nose");
    }
  }

  if (requestedFields.includes("description")) {
    if (strain.description) {
      score += 1;
    } else {
      missing.push("description");
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    score,
  };
}

// ============================================================================
// SEARCH
// ============================================================================

async function searchStrain(name: string, category: string, exa: Exa, attempt: number = 1) {
  // Build variations
  const variations = [name];

  if (name.includes("Soufflé") || name.includes("Souffle")) {
    variations.push(name.replace(/Soufflé|Souffle/gi, "Soufflé"));
    variations.push(name.replace(/Soufflé|Souffle/gi, "Souffle"));
  }

  if (/Pop(?!s)/i.test(name)) {
    variations.push(name.replace(/Pop/i, "Pops"));
  }

  // Special handling for Runtz variants
  if (name.includes("Runtz")) {
    variations.push(name.replace(/Runtz/i, "Runts")); // Common misspelling
    variations.push(name + " strain"); // Add explicit "strain"
  }

  if (attempt > 1) {
    variations.push(name.replace(/\s+/g, ""));
    variations.push(name.replace(/\s+/g, "-"));
    variations.push(name + " weed");
    variations.push(name + " cannabis");
  }

  if (attempt > 2) {
    // Even more aggressive on attempt 3+
    variations.push(name + " genetics");
    variations.push(name + " lineage");
    variations.push(name + " bred by");
  }

  const query =
    variations.map((v) => `"${v}"`).join(" OR ") +
    ` ${category} strain genetics lineage parent strains bred from terpenes effects`;

  try {
    const response = await exa.searchAndContents(query, {
      type: "auto",
      useAutoprompt: true,
      numResults: CONFIG.SEARCH_RESULTS,
      text: { maxCharacters: CONFIG.MAX_CHARS },
    });

    return response.results || [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error(`❌ [${name}] Search error:`, err.message);
    }
    return [];
  }
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

const TOOL = {
  name: "extract_strain",
  description: "Extract verified cannabis strain data",
  input_schema: {
    type: "object" as const,
    properties: {
      product_name: { type: "string" },
      strain_type: { type: "string", enum: ["Sativa", "Indica", "Hybrid"] },
      lineage: {
        type: "string",
        description: 'Parent genetics (e.g., "OG Kush x Durban")',
      },
      terpene_profile: { type: "array", items: { type: "string" } },
      effects: { type: "array", items: { type: "string" } },
      nose: { type: "array", items: { type: "string" } },
      description: { type: "string" },
    },
    required: ["product_name"],
  },
};

async function extractData(
  name: string,
  sources: any[],
  requestedFields: string[],
  anthropic: Anthropic,
  attempt: number,
): Promise<StrainInfo | null> {
  if (sources.length === 0) return null;

  const context = sources
    .map((s, i) => `SOURCE ${i + 1}: ${s.title}\n${s.text}`)
    .join("\n\n---\n\n")
    .substring(0, 35000);

  const fieldList = requestedFields.join(", ");
  const urgency =
    attempt > 1
      ? `\n\n🚨🚨🚨 CRITICAL RETRY ${attempt}/${CONFIG.MAX_RETRIES}: LINEAGE IS ABSOLUTELY MANDATORY! 🚨🚨🚨\nThis is attempt ${attempt} - we MUST find lineage data or the system will fail!\nSearch EVERY source THOROUGHLY for parent strains, genetics, breeding information!`
      : "";

  const prompt = `Extract cannabis strain data for "${name}".

REQUESTED FIELDS (ALL MANDATORY): ${fieldList}${urgency}

🎯 ABSOLUTE PRIORITY: LINEAGE/GENETICS
Search EXTREMELY thoroughly for parent strains. Look for:
- "X x Y" patterns (e.g., "Runtz x Zkittlez", "OG Kush x Durban")
- "cross of", "cross between"
- "bred from", "bred by crossing"
- "genetics:", "lineage:", "parents:"
- "descended from", "offspring of"
- Even PARTIAL info is valuable (e.g., "Runtz cross", "OG Kush phenotype")

STRAIN NAME VARIATIONS:
- "Pez Runtz" could be "Pez" + "Runtz", check both
- "Blo Pop" = "Blow Pop" = "Blowpop"
- "Soufflé" = "Souffle" = "Soufle"
- Check with/without spaces, with/without hyphens

OTHER FIELDS:
- Terpenes: Myrcene, Limonene, Caryophyllene, Pinene, Linalool, Humulene, Ocimene, Terpinolene
- Effects: Relaxing, Euphoric, Uplifting, Creative, Focused, Energetic, Sleepy, Happy, Calm
- Nose/Aroma: Citrus, Pine, Diesel, Earthy, Sweet, Berry, Gas, Fruity, Floral, Spicy, Herbal

IMPORTANT: Only return data actually found in sources. Use null/empty if genuinely not found.

SOURCES:
${context}

Use extract_strain tool with ALL available data.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: CONFIG.AI_TOKENS,
      temperature: 0,
      tools: [TOOL],
      messages: [{ role: "user", content: prompt }],
    });

    const tool = response.content.find((c) => c.type === "tool_use");
    if (!tool || tool.type !== "tool_use") return null;

    const data = tool.input as any;

    return {
      product_name: name,
      strain_type: data.strain_type || null,
      lineage: data.lineage || null,
      terpene_profile: Array.isArray(data.terpene_profile) ? data.terpene_profile : [],
      effects: Array.isArray(data.effects) ? data.effects : [],
      nose: Array.isArray(data.nose) ? data.nose : [],
      description: data.description || null,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error(`❌ [${name}] AI error:`, err.message);
    }
    return null;
  }
}

// ============================================================================
// PROCESS WITH RETRY
// ============================================================================

async function processProduct(
  name: string,
  category: string,
  requestedFields: string[],
  exa: Exa,
  anthropic: Anthropic,
): Promise<StrainInfo> {
  let bestResult: StrainInfo | null = null;
  let bestScore = 0;

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    const sources = await searchStrain(name, category, exa, attempt);
    const extracted = await extractData(name, sources, requestedFields, anthropic, attempt);

    if (!extracted) {
      continue;
    }

    const validation = validateStrainData(extracted, requestedFields);

    if (validation.score > bestScore) {
      bestResult = extracted;
      bestScore = validation.score;
    }

    if (validation.valid) {
      return extracted;
    }

    if (attempt < CONFIG.MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return (
    bestResult || {
      product_name: name,
      strain_type: null,
      lineage: null,
      terpene_profile: [],
      effects: [],
      nose: [],
      description: null,
    }
  );
}

// ============================================================================
// MAIN ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (data: any) => {
        if (isClosed) return; // Don't try to send if already closed
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Stream error:", err);
          }
          isClosed = true; // Mark as closed if error
        }
      };

      const closeStream = () => {
        if (isClosed) return;
        try {
          controller.close();
          isClosed = true;
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error closing stream:", err);
          }
        }
      };

      try {
        if (!process.env.ANTHROPIC_API_KEY || !process.env.EXASEARCH_API_KEY) {
          send({ type: "error", message: "AI services not configured" });
          closeStream();
          return;
        }

        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        const exa = new Exa(process.env.EXASEARCH_API_KEY);

        const { products, category, requestedFields } = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
          send({ type: "error", message: "Products array required" });
          closeStream();
          return;
        }

        const fields = requestedFields || [
          "lineage",
          "terpene_profile",
          "effects",
          "nose",
          "description",
        ];

        send({
          type: "start",
          total: products.length,
          message: `Processing ${products.length} products with field verification...`,
        });

        const results: { [key: string]: StrainInfo } = {};
        const batches: string[][] = [];

        // Split into batches
        const names = products.map((p) => p.name);
        for (let i = 0; i < names.length; i += CONFIG.BATCH_SIZE) {
          batches.push(names.slice(i, i + CONFIG.BATCH_SIZE));
        }

        // Process each batch
        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
          const batch = batches[batchIdx];
          const batchNum = batchIdx + 1;

          send({
            type: "batch_start",
            batch: batchNum,
            total_batches: batches.length,
            products: batch,
            message: `\n🔄 Batch ${batchNum}/${batches.length}: Processing ${batch.length} products...`,
          });

          // Process all products in batch
          for (let i = 0; i < batch.length; i++) {
            const name = batch[i];
            const overall = batchIdx * CONFIG.BATCH_SIZE + i + 1;

            send({
              type: "progress",
              current: overall,
              total: names.length,
              message: `[Batch ${batchNum}] Processing ${name}... (${i + 1}/${batch.length})`,
            });

            const data = await processProduct(name, category, fields, exa, anthropic);
            results[name] = data;

            send({
              type: "product_complete",
              product: name,
              current: overall,
              total: names.length,
              data: data,
            });

            await new Promise((r) => setTimeout(r, 500));
          }

          // Validate batch
          const batchResults = batch.map((name) => results[name]);
          const validations = batchResults.map((r) => validateStrainData(r, fields));
          const allValid = validations.every((v) => v.valid);
          const validCount = validations.filter((v) => v.valid).length;

          batch.forEach((name, idx) => {
            const val = validations[idx];
            const status = val.valid ? "✅" : "⚠️";
          });

          send({
            type: "batch_complete",
            batch: batchNum,
            total_batches: batches.length,
            valid: validCount,
            total: batch.length,
            all_valid: allValid,
            results: batch.map((name) => ({
              name,
              data: results[name],
              validation: validateStrainData(results[name], fields),
            })),
            message: `✅ Batch ${batchNum} complete: ${validCount}/${batch.length} products have all requested fields`,
          });
        }

        // Final summary
        const allResults = Object.values(results);
        const allValidations = allResults.map((r) => validateStrainData(r, fields));
        const completeCount = allValidations.filter((v) => v.valid).length;

        names.forEach((name) => {
          const val = validateStrainData(results[name], fields);
        });

        send({
          type: "complete",
          total: names.length,
          successful: allResults.filter((r) => r.lineage || r.terpene_profile.length > 0).length,
          complete: completeCount,
          withLineage: allResults.filter((r) => r.lineage).length,
          results: results,
          message: `Complete: ${completeCount}/${names.length} products have all requested fields`,
        });

        closeStream();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Error:", err);
        }
        send({ type: "error", message: err.message || "Processing failed" });
        closeStream();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
