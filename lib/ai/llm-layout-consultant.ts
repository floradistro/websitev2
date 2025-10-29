/**
 * LLM Layout Consultant - Uses Claude/GPT to provide intelligent layout recommendations
 * This provides more nuanced, context-aware suggestions than rule-based systems
 */

import Anthropic from '@anthropic-ai/sdk';

export interface StoreContext {
  storeName: string;
  storeType: 'dispensary' | 'retail' | 'restaurant';
  brandVibe: 'premium' | 'casual' | 'medical' | 'recreational';
  targetAudience: string;
}

export interface DisplayContext {
  profile: any; // DisplayProfile from layout-optimizer
  location: string; // Where in the store
  adjacentTo?: string; // What's nearby
  customerBehavior: string; // How customers interact with this display
}

export interface ProductContext {
  data: any; // ProductData from layout-optimizer
  businessGoals: string[]; // e.g., "increase high-margin sales", "clear old inventory"
  currentPerformance?: {
    topSellers: string[];
    slowMovers: string[];
  };
}

export interface LLMRecommendation {
  layout: any; // Matches OptimalLayout structure
  reasoning: string;
  alternatives: Array<{
    name: string;
    description: string;
    layout: any;
  }>;
  customizationTips: string[];
  confidence: number;
}

export class LLMLayoutConsultant {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Get AI-powered layout recommendations with business context
   */
  async getRecommendation(
    store: StoreContext,
    display: DisplayContext,
    products: ProductContext,
    ruleBased: any // OptimalLayout from rule-based system
  ): Promise<LLMRecommendation> {
    const prompt = this.buildPrompt(store, display, products, ruleBased);

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse Claude's response
    const response = message.content[0].type === 'text' ? message.content[0].text : '';
    return this.parseResponse(response, ruleBased);
  }

  /**
   * Build a detailed prompt for Claude
   */
  private buildPrompt(
    store: StoreContext,
    display: DisplayContext,
    products: ProductContext,
    ruleBased: any
  ): string {
    return `You are a world-class digital signage designer specializing in retail displays. You're helping optimize a menu display for a ${store.storeType}.

STORE CONTEXT:
- Name: ${store.storeName}
- Brand Vibe: ${store.brandVibe}
- Target Audience: ${store.targetAudience}

DISPLAY SPECIFICATIONS:
- Screen: ${display.profile.screenWidthInches}" (${display.profile.resolutionWidth}x${display.profile.resolutionHeight})
- Location: ${display.location}
- Viewing Distance: ${display.profile.viewingDistanceFeet} feet
- Customer Behavior: ${display.customerBehavior}
- Lighting: ${display.profile.ambientLighting}
${display.adjacentTo ? `- Adjacent to: ${display.adjacentTo}` : ''}

PRODUCT DATA:
- Total Products: ${products.data.totalProducts}
- Categories: ${products.data.categories.join(', ')}
- Has Images: ${products.data.hasImages ? 'Yes' : 'No'}
- Tiered Pricing: ${products.data.hasTieredPricing ? 'Yes' : 'No'}
- Active Promotions: ${products.data.activePromotions}
${products.currentPerformance ? `
- Top Sellers: ${products.currentPerformance.topSellers.join(', ')}
- Slow Movers: ${products.currentPerformance.slowMovers.join(', ')}` : ''}

BUSINESS GOALS:
${products.businessGoals.map(goal => `- ${goal}`).join('\n')}

RULE-BASED AI SUGGESTION:
The rule-based system suggests:
- Display Mode: ${ruleBased.displayMode}
- Grid: ${ruleBased.gridColumns}x${ruleBased.gridRows}
- Products per Page: ${ruleBased.productsPerPage}
- Product Name Font: ${ruleBased.typography.productNameSize}px
- Price Font: ${ruleBased.typography.priceSize}px
- Confidence: ${ruleBased.confidenceScore}%

Reasoning: ${ruleBased.reasoning.join(' ')}

YOUR TASK:
Analyze this context and provide:

1. Your recommended layout (can agree with or modify the rule-based suggestion)
2. Detailed reasoning for your recommendation
3. 2-3 alternative layouts for different use cases
4. Customization tips specific to this business

Consider:
- Psychology of the target audience
- The store's brand positioning
- How customers will actually use this display
- Business goals (not just aesthetics)
- The specific products being sold

Respond in JSON format:
{
  "recommendation": {
    "displayMode": "dense" | "carousel",
    "gridColumns": number,
    "gridRows": number,
    "typography": {
      "productNameSize": number,
      "priceSize": number,
      "detailsSize": number
    },
    "contentStrategy": {
      "showImages": boolean,
      "emphasizePromotions": boolean,
      "maxTiersToShow": number
    }
  },
  "reasoning": "Detailed explanation...",
  "alternatives": [
    {
      "name": "Alternative name",
      "description": "When to use this...",
      "layout": { ...similar structure... }
    }
  ],
  "customizationTips": [
    "Tip 1...",
    "Tip 2..."
  ],
  "confidence": number (0-100)
}`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseResponse(response: string, fallback: any): LLMRecommendation {
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        layout: parsed.recommendation,
        reasoning: parsed.reasoning,
        alternatives: parsed.alternatives || [],
        customizationTips: parsed.customizationTips || [],
        confidence: parsed.confidence || 75,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      // Fallback to rule-based
      return {
        layout: fallback,
        reasoning: 'Using rule-based recommendation due to parsing error',
        alternatives: [],
        customizationTips: [],
        confidence: fallback.confidenceScore,
      };
    }
  }

  /**
   * Get quick optimization tips without full recommendation
   */
  async getQuickTips(
    currentLayout: any,
    performanceData?: {
      avgViewTime: number;
      interactionRate: number;
      conversionRate: number;
    }
  ): Promise<string[]> {
    const prompt = `You're a digital signage consultant. Analyze this current layout and provide 3-5 quick improvement tips.

Current Layout:
${JSON.stringify(currentLayout, null, 2)}

${performanceData ? `
Performance Data:
- Avg View Time: ${performanceData.avgViewTime}s
- Interaction Rate: ${performanceData.interactionRate}%
- Conversion Rate: ${performanceData.conversionRate}%
` : ''}

Provide actionable, specific tips as a JSON array of strings.`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      return ['Unable to generate tips at this time'];
    }
  }
}
