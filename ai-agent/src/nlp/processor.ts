import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { StoreRequirements, StoreRequirementsSchema } from './schemas';

/**
 * NLP Processor - Converts natural language vendor requests into structured storefront specifications
 */

export class NLPProcessor {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private provider: 'anthropic' | 'openai';

  constructor(provider: 'anthropic' | 'openai' = 'anthropic') {
    this.provider = provider;
    
    if (provider === 'anthropic') {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Process natural language input and extract structured storefront requirements
   */
  async processVendorRequest(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{
    requirements: StoreRequirements;
    response: string;
    confidence: number;
  }> {
    const systemPrompt = this.getSystemPrompt();
    
    try {
      if (this.provider === 'anthropic') {
        return await this.processWithClaude(systemPrompt, userMessage, conversationHistory);
      } else {
        return await this.processWithGPT(systemPrompt, userMessage, conversationHistory);
      }
    } catch (error) {
      console.error('❌ NLP processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process vendor request: ${errorMessage}`);
    }
  }

  /**
   * Process with Claude (Anthropic)
   */
  private async processWithClaude(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: string; content: string }>
  ): Promise<{ requirements: StoreRequirements; response: string; confidence: number }> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseAIResponse(content.text);
  }

  /**
   * Process with GPT-4 (OpenAI)
   */
  private async processWithGPT(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: string; content: string }>
  ): Promise<{ requirements: StoreRequirements; response: string; confidence: number }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content!;
    return this.parseAIResponse(content);
  }

  /**
   * Parse AI response and validate against schema
   */
  private parseAIResponse(text: string): {
    requirements: StoreRequirements;
    response: string;
    confidence: number;
  } {
    // Extract JSON from response (AI should return JSON in a code block)
    const jsonMatch = text.match(/```json\n([\s\S]+?)\n```/) || text.match(/\{[\s\S]+\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Validate against schema
    const requirements = StoreRequirementsSchema.parse(parsed.requirements);

    return {
      requirements,
      response: parsed.response || 'I\'ve analyzed your requirements and created a storefront specification.',
      confidence: parsed.confidence || 0.9,
    };
  }

  /**
   * Get system prompt for AI
   */
  private getSystemPrompt(): string {
    return `You are an expert e-commerce storefront designer specializing in cannabis retail. Your job is to convert vendor descriptions into structured storefront specifications.

Given a vendor's description of their ideal storefront, you must:
1. Analyze the aesthetic preferences (minimalist, luxury, modern, etc.)
2. Determine color scheme and typography
3. Define layout preferences (header, navigation, grid)
4. Identify required features (age verification, filters, reviews, etc.)
5. Specify page configurations

RESPONSE FORMAT:
You MUST respond with JSON in this exact format:

\`\`\`json
{
  "requirements": {
    "theme": {
      "style": "minimalist|luxury|modern|classic|bold",
      "colors": {
        "primary": "#000000",
        "secondary": "#FFFFFF",
        "accent": "#4F46E5",
        "background": "#FFFFFF",
        "text": "#1A1A1A"
      },
      "typography": {
        "headingFont": "Inter",
        "bodyFont": "Inter",
        "sizes": {
          "h1": "3rem",
          "h2": "2rem",
          "body": "1rem"
        }
      }
    },
    "layout": {
      "header": "sticky|static|hidden",
      "navigation": "top|side|mega-menu",
      "productGrid": 3,
      "showCategories": true,
      "showSearch": true,
      "showCart": true
    },
    "features": {
      "ageVerification": true,
      "productFilters": ["category", "price", "thc-content"],
      "wishlist": false,
      "productReviews": true,
      "socialSharing": false
    },
    "pages": {
      "home": {
        "enabled": true,
        "title": "Home",
        "layout": "hero-products",
        "components": ["hero", "featured-products", "categories", "testimonials"]
      },
      "shop": {
        "enabled": true,
        "title": "Shop",
        "layout": "grid-sidebar",
        "components": ["filters", "product-grid", "pagination"]
      },
      "about": {
        "enabled": true,
        "title": "About Us",
        "layout": "content-page"
      },
      "contact": {
        "enabled": true,
        "title": "Contact",
        "layout": "form-page"
      }
    }
  },
  "response": "A friendly explanation of the choices you made",
  "confidence": 0.95
}
\`\`\`

RULES:
- All colors must be valid hex codes (e.g., #FF5733)
- productGrid must be between 2-5
- Always include age verification for cannabis stores
- Be opinionated but reasonable in your design choices
- If the vendor's request is vague, make sensible defaults
- The response should explain your design decisions in a conversational tone

EXAMPLES:

Input: "I want a minimalist black and white store with large product images"
Output:
{
  "requirements": {
    "theme": {
      "style": "minimalist",
      "colors": {
        "primary": "#000000",
        "secondary": "#FFFFFF",
        "accent": "#666666",
        "background": "#FFFFFF",
        "text": "#1A1A1A"
      },
      "typography": {
        "headingFont": "Inter",
        "bodyFont": "Inter",
        "sizes": { "h1": "4rem", "body": "1.125rem" }
      }
    },
    "layout": {
      "header": "sticky",
      "navigation": "top",
      "productGrid": 3,
      "showCategories": true,
      "showSearch": true,
      "showCart": true
    },
    "features": {
      "ageVerification": true,
      "productFilters": ["category", "price"],
      "wishlist": false,
      "productReviews": true,
      "socialSharing": false
    },
    "pages": { ... }
  },
  "response": "I've created a clean, minimalist storefront with a monochrome color scheme. The layout emphasizes your products with large images in a 3-column grid. I've kept the navigation simple with a sticky header, and included essential features like age verification and product reviews.",
  "confidence": 0.95
}`;
  }
}

