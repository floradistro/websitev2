import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Exa from 'exa-js';

const SYSTEM_PROMPT = `Extract cannabis product data from web sources. Return ONLY JSON.

RULES:
- Be fast and accurate
- Use null for missing data
- IMPORTANT: Always extract lineage/genetics if mentioned (e.g., "Parent1 x Parent2")
- Extract key cannabinoids and terpenes
- Extract aroma/flavor descriptors (single words like "Candy", "Cake", "Glue", "Gas", "Sherb", "Pine", "Citrus")

JSON format:
{
  "strain_type": "Sativa" | "Indica" | "Hybrid" | null,
  "thc_percentage": number | null,
  "cbd_percentage": number | null,
  "terpenes": ["Myrcene", "Limonene"] | [],
  "effects": ["Relaxing", "Euphoric"] | [],
  "lineage": "Parent1 x Parent2" | null,
  "nose": ["Candy", "Cake", "Glue"] | [],
  "description": "brief description" | null,
  "suggested_pricing": {
    "tier_type": "exotic" | "top-shelf" | "mid-shelf" | "value" | null,
    "price_range": "high" | "medium" | "low" | null
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });
    const exa = new Exa(process.env.EXASEARCH_API_KEY!);

    const { productName, category } = await request.json();

    if (!productName) {
      return NextResponse.json({ error: 'Product name required' }, { status: 400 });
    }

    // Quick web search
    const searchResults = await exa.searchAndContents(
      `${productName} ${category || 'cannabis'} strain genetics lineage terpenes effects`,
      {
        type: 'auto',
        useAutoprompt: true,
        numResults: 3, // Fewer for speed
        text: true
      }
    );

    if (!searchResults.results || searchResults.results.length === 0) {
      return NextResponse.json({
        error: 'No data found',
        suggestions: null
      });
    }

    // Combine top results
    const context = searchResults.results
      .slice(0, 2) // Only top 2 for speed
      .map((r) => r.text)
      .join('\n---\n');

    // Fast Claude extraction
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0, // Deterministic for speed
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract data for "${productName}". Pay special attention to genetics/lineage.\n\nSOURCES:\n${context.substring(0, 4500)}\n\nReturn ONLY JSON.`
        }
      ]
    });

    const claudeText = response.content[0];
    if (claudeText.type !== 'text') {
      throw new Error('Invalid response');
    }

    // Parse JSON
    const jsonMatch = claudeText.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'No data extracted',
        suggestions: null
      });
    }

    const data = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      suggestions: data,
      sources: searchResults.results.slice(0, 2).map(r => ({
        title: r.title,
        url: r.url
      }))
    });

  } catch (error: any) {
    console.error('Quick autofill error:', error);
    return NextResponse.json({
      error: error.message,
      suggestions: null
    }, { status: 500 });
  }
}
