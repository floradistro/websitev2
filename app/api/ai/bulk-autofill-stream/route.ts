import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Exa from 'exa-js';

// Increase timeout for bulk processing
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Extract cannabis STRAIN DATA ONLY from web sources (strain databases, seed banks, cannabis info sites). Return ONLY a JSON array with REAL DATA.

CRITICAL RULES - READ CAREFULLY:
- NEVER use placeholder text like "Unknown", "N/A", "TBD", or generic descriptions
- If you CANNOT find real data from sources, use null or empty array []
- Only extract ACTUAL strain data found in the provided sources
- Do NOT make up, guess, or use placeholder values
- FOCUS ON STRAIN INFO: lineage/genetics, terpenes, effects, aroma descriptors
- Extract lineage/genetics (e.g., "Gelato x Wedding Cake", "OG Kush x Durban Poison") - THIS IS CRITICAL
- Extract ACTUAL terpene names (like "Myrcene", "Limonene", "Caryophyllene", "Pinene") from sources
- Extract ACTUAL effects (like "Relaxing", "Euphoric", "Uplifting", "Focused") from sources
- Extract ACTUAL aroma/flavor descriptors (single words like "Candy", "Cake", "Glue", "Gas", "Sherb", "Pine", "Citrus", "Berry", "Diesel", "Fruity")
- For description: Use REAL strain description from sources, or null if not found
- DO NOT extract lab test percentages (THC%, CBD%) - focus on strain genetics and characteristics

Return JSON array with one object per product:
[
  {
    "product_name": "exact product name from sources",
    "strain_type": "Sativa" | "Indica" | "Hybrid" | null (ONLY if found in sources),
    "lineage": "Parent1 x Parent2" | null (CRITICAL - extract actual genetics/lineage from sources),
    "terpene_profile": ["Myrcene", "Limonene", "Caryophyllene"] | [] (ONLY actual terpene names from sources),
    "effects": ["Relaxing", "Euphoric", "Uplifting"] | [] (ONLY actual effects from sources),
    "nose": ["Candy", "Cake", "Gas", "Pine"] | [] (ONLY actual aroma descriptors from sources),
    "description": "actual strain description from sources" | null (REAL description or null),
    "suggested_pricing": {
      "tier_type": "exotic" | "top-shelf" | "mid-shelf" | "value" | null,
      "price_range": "high" | "medium" | "low" | null
    }
  }
]

PRIORITY FIELDS (search extra hard for these):
1. lineage - VERY IMPORTANT, look for "bred by", "cross of", "genetics", "parents"
2. terpene_profile - look for "dominant terpenes", "terps", "terpene content"
3. effects - look for "effects", "high", "feeling"
4. nose - look for "aroma", "smell", "flavor", "taste"

REMEMBER: Empty/null is better than fake placeholder data. Search THOROUGHLY in sources for lineage, terpenes, effects, and aroma before marking as null.`;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendMessage = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Check for required API keys
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error('❌ Missing ANTHROPIC_API_KEY');
          sendMessage({
            type: 'error',
            message: 'AI service not configured'
          });
          controller.close();
          return;
        }

        if (!process.env.EXASEARCH_API_KEY) {
          console.error('❌ Missing EXASEARCH_API_KEY');
          sendMessage({
            type: 'error',
            message: 'Search service not configured'
          });
          controller.close();
          return;
        }

        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        const exa = new Exa(process.env.EXASEARCH_API_KEY);

        const { products, category, selectedFields, customPrompt } = await request.json();

        if (!products || !Array.isArray(products) || products.length === 0) {
          sendMessage({ type: 'error', message: 'Products array required' });
          controller.close();
          return;
        }

        console.log(`🔍 Bulk AI Autofill (Streaming): ${products.length} products${customPrompt ? ' [custom prompt]' : ''}${selectedFields ? ` [${selectedFields.length} fields]` : ''}`);

        // Send start message
        sendMessage({
          type: 'start',
          total: products.length,
          message: `Starting bulk enrichment for ${products.length} products...`
        });

        // Process in batches of 5 for optimal performance
        const BATCH_SIZE = 5;
        const results: any[] = [];

        for (let i = 0; i < products.length; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(products.length / BATCH_SIZE);

          console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} products)`);

          // Send batch start message
          sendMessage({
            type: 'batch_start',
            batch: batchNum,
            totalBatches,
            products: batch.map((p: any) => p.name),
            message: `📦 Batch ${batchNum}/${totalBatches}: Processing ${batch.map((p: any) => p.name).join(', ')}...`
          });

          try {
            // Single web search for all products in batch - comprehensive query for all strain data
            const searchQuery = batch.map((p: any) => p.name).join(', ') +
              ` ${category || 'cannabis'} strain genetics lineage parent strains terpene profile nose aroma effects THCa percentage indica sativa hybrid`;

            sendMessage({
              type: 'progress',
              message: `🔍 Searching web for batch ${batchNum}...`
            });

            const searchResults = await exa.searchAndContents(searchQuery, {
              type: 'auto',
              useAutoprompt: true,
              numResults: Math.min(15, batch.length * 3), // 3 results per product for better data coverage
              text: true
            });

            if (!searchResults.results || searchResults.results.length === 0) {
              console.warn(`⚠️ No search results for batch ${batchNum}`);
              batch.forEach((product: any) => {
                results.push({
                  product_name: product.name,
                  success: false,
                  error: 'No search results found'
                });
              });

              sendMessage({
                type: 'batch_complete',
                batch: batchNum,
                success: 0,
                failed: batch.length,
                message: `⚠️ Batch ${batchNum} complete: No search results`
              });
              continue;
            }

            // Combine search results
            const context = searchResults.results
              .map((r) => `${r.title}\n${r.text}`)
              .join('\n---\n');

            sendMessage({
              type: 'progress',
              message: `🤖 AI extracting data for batch ${batchNum}...`
            });

            // Build user prompt with optional custom instructions and field focus
            let userPrompt = `Extract STRAIN DATA for these ${batch.length} products:\n${batch.map((p: any, idx: number) => `${idx + 1}. ${p.name}`).join('\n')}\n\n`;

            // Add field focus if selectedFields provided
            if (selectedFields && selectedFields.length > 0) {
              userPrompt += `FOCUS ON THESE FIELDS:\n${selectedFields.map((f: string) => `- ${f.replace('_', ' ').toUpperCase()}`).join('\n')}\n\n`;
            } else {
              userPrompt += `FOCUS ON:\n- LINEAGE/GENETICS (Parent1 x Parent2) - MOST IMPORTANT\n- Terpene profile (Myrcene, Limonene, etc.)\n- Effects (Relaxing, Euphoric, etc.)\n- Nose/Aroma (Candy, Gas, Pine, etc.)\n- Strain type (Sativa/Indica/Hybrid)\n\n`;
            }

            // Add custom prompt if provided
            if (customPrompt) {
              userPrompt += `ADDITIONAL INSTRUCTIONS: ${customPrompt}\n\n`;
            }

            userPrompt += `Search THOROUGHLY in sources for lineage and genetics information.\n\nSOURCES:\n${context.substring(0, 15000)}\n\nReturn ONLY a JSON array with ${batch.length} objects, one per product in order.`;

            // Claude extraction for entire batch
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              temperature: 0,
              system: SYSTEM_PROMPT,
              messages: [
                {
                  role: 'user',
                  content: userPrompt
                }
              ]
            });

            const claudeText = response.content[0];
            if (claudeText.type !== 'text') {
              throw new Error('Invalid response');
            }

            // Parse JSON array
            const jsonMatch = claudeText.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
              console.error(`❌ No JSON found in batch ${batchNum}`);
              batch.forEach((product: any) => {
                results.push({
                  product_name: product.name,
                  success: false,
                  error: 'Failed to extract data'
                });
              });

              sendMessage({
                type: 'batch_complete',
                batch: batchNum,
                success: 0,
                failed: batch.length,
                message: `❌ Batch ${batchNum} failed: Could not parse AI response`
              });
              continue;
            }

            const batchData = JSON.parse(jsonMatch[0]);

            // Match results to products
            let batchSuccess = 0;
            batch.forEach((product: any, idx: number) => {
              const data = batchData[idx] || batchData.find((d: any) =>
                d.product_name?.toLowerCase().includes(product.name.toLowerCase()) ||
                product.name.toLowerCase().includes(d.product_name?.toLowerCase())
              );

              if (data) {
                results.push({
                  product_name: product.name,
                  success: true,
                  suggestions: data
                });
                batchSuccess++;
              } else {
                results.push({
                  product_name: product.name,
                  success: false,
                  error: 'No data matched'
                });
              }
            });

            // Send batch complete message
            sendMessage({
              type: 'batch_complete',
              batch: batchNum,
              totalBatches,
              success: batchSuccess,
              failed: batch.length - batchSuccess,
              completed: results.length,
              total: products.length,
              message: `✅ Batch ${batchNum}/${totalBatches}: ${batchSuccess} enriched, ${batch.length - batchSuccess} failed`
            });

            console.log(`✅ Batch ${batchNum} complete: ${batchSuccess}/${batch.length} successful`);

          } catch (error: any) {
            console.error(`❌ Error in batch ${batchNum}:`, error.message);

            // Add error results for this batch
            batch.forEach((product: any) => {
              results.push({
                product_name: product.name,
                success: false,
                error: error.message || 'Processing failed'
              });
            });

            sendMessage({
              type: 'batch_error',
              batch: batchNum,
              error: error.message,
              message: `❌ Batch ${batchNum} error: ${error.message}`
            });
          }

          // Small delay between batches to avoid rate limits
          if (i + BATCH_SIZE < products.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Bulk autofill complete: ${successCount}/${products.length} successful`);

        // Send final complete message
        sendMessage({
          type: 'complete',
          total: products.length,
          successful: successCount,
          failed: products.length - successCount,
          results,
          message: `✅ Complete: ${successCount}/${products.length} products enriched`
        });

        controller.close();

      } catch (error: any) {
        console.error('❌ Bulk autofill error:', error);
        sendMessage({
          type: 'error',
          message: error.message || 'Bulk autofill failed',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
