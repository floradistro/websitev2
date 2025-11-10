/**
 * AI-Powered SMS Template Generator
 * Optimized for 160-character limit with cannabis compliance
 */

import OpenAI from "openai";

export interface SMSGenerationParams {
  vendor: {
    id: string;
    name: string;
  };
  campaignType:
    | "flash_sale"
    | "new_product"
    | "order_ready"
    | "win_back"
    | "birthday"
    | "loyalty_points"
    | "event_reminder"
    | "restock_alert";
  productData?: {
    name: string;
    price: number;
    category?: string;
  };
  discountData?: {
    type: "percentage" | "fixed_amount";
    value: number;
  };
  orderData?: {
    order_number: string;
    pickup_location?: string;
  };
  loyaltyData?: {
    points_balance?: number;
    points_earned?: number;
    tier_name?: string;
  };
  additionalContext?: string;
  includeLink?: boolean;
}

export interface GeneratedSMS {
  message: string;
  character_count: number;
  segment_count: number; // SMS segments (160 chars each)
  estimated_cost: number; // Cost per recipient in cents
  metadata: {
    tone: string;
    has_link: boolean;
    compliance_check: {
      passed: boolean;
      issues: string[];
    };
  };
}

export class SMSGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate SMS message
   */
  async generateMessage(params: SMSGenerationParams): Promise<GeneratedSMS> {
    const content = await this.generateContent(params);

    // Add link placeholder if needed
    let message = content.message;
    if (params.includeLink) {
      message += " {{shop_link}}";
    }

    // Calculate segments
    const charCount = message.length;
    const segmentCount = Math.ceil(charCount / 160);

    // Compliance check
    const complianceCheck = this.checkCompliance(message);

    return {
      message,
      character_count: charCount,
      segment_count: segmentCount,
      estimated_cost: segmentCount * 0.75, // $0.0075 per segment
      metadata: {
        tone: content.tone,
        has_link: params.includeLink || false,
        compliance_check: complianceCheck,
      },
    };
  }

  /**
   * Generate SMS content using AI
   */
  private async generateContent(params: SMSGenerationParams): Promise<any> {
    const prompt = this.buildPrompt(params);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert SMS marketing copywriter for cannabis dispensaries.
Create ultra-concise, compliant, and actionable text messages.

STRICT RULES:
- Maximum 140 characters (leave room for link if needed)
- Must be clear and actionable
- Professional but friendly tone
- Use cannabis-appropriate terminology
- NO medical claims
- NO emojis unless explicitly requested
- Include clear call-to-action
- Mention store name or promo code
- Be compliant with cannabis regulations
- Output valid JSON only`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    return response;
  }

  /**
   * Build AI prompt based on campaign type
   */
  private buildPrompt(params: SMSGenerationParams): string {
    const templates = {
      flash_sale: `Create a FLASH SALE text message for ${params.vendor.name}.

Offer: ${params.discountData?.value}${params.discountData?.type === "percentage" ? "%" : "$"} off
Time-sensitive promotion.

Create urgency. Be direct. Include promo code hint.`,

      new_product: `Create a NEW PRODUCT text for ${params.vendor.name}.

Product: ${params.productData?.name}
Price: $${params.productData?.price}

Announce new arrival. Make it exciting. Keep it brief.`,

      order_ready: `Create an ORDER READY notification for ${params.vendor.name}.

Order: #${params.orderData?.order_number}
${params.orderData?.pickup_location ? `Location: ${params.orderData.pickup_location}` : ""}

Let customer know order is ready for pickup. Be clear and helpful.`,

      win_back: `Create a WIN-BACK message for ${params.vendor.name}.

Target: Inactive customer (30+ days)
Offer: ${params.discountData?.value || 20}% off

Make them feel valued. Offer incentive to return. Warm tone.`,

      birthday: `Create a BIRTHDAY message for ${params.vendor.name}.

Offer: ${params.discountData?.value || 20}% birthday discount

Celebrate their day. Be warm. Mention exclusive discount.`,

      loyalty_points: `Create a LOYALTY POINTS update for ${params.vendor.name}.

${params.loyaltyData?.points_earned ? `Points Earned: ${params.loyaltyData.points_earned}` : ""}
${params.loyaltyData?.points_balance ? `Balance: ${params.loyaltyData.points_balance} pts` : ""}
${params.loyaltyData?.tier_name ? `Tier: ${params.loyaltyData.tier_name}` : ""}

Congratulate on points. Show balance. Brief and clear.`,

      event_reminder: `Create an EVENT REMINDER for ${params.vendor.name}.

${params.additionalContext || "Special event happening soon"}

Remind about event. Create excitement. Include timing if relevant.`,

      restock_alert: `Create a RESTOCK ALERT for ${params.vendor.name}.

Product: ${params.productData?.name}
Was out of stock, now available.

Alert customer. Create urgency (limited stock). Encourage quick action.`,
    };

    const basePrompt = templates[params.campaignType];

    return `${basePrompt}

Store: ${params.vendor.name}
${params.additionalContext ? `Context: ${params.additionalContext}` : ""}
${params.includeLink ? "Note: Link will be added separately, keep message to 140 chars" : "Keep to 160 chars max"}

Generate JSON with this structure:
{
  "message": "SMS text (max 140-160 chars)",
  "tone": "urgent" | "friendly" | "informative" | "celebratory",
  "promo_code": "CODE123 (if applicable)" | null
}`;
  }

  /**
   * Check cannabis compliance
   */
  private checkCompliance(message: string): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for medical claims
    const medicalTerms =
      /medic(al|ine)|treat(ment)?|cure|heal|therapy|diagnos/i;
    if (medicalTerms.test(message)) {
      issues.push("Contains potential medical claims");
    }

    // Check for age-inappropriate language
    const inappropriateTerms = /kid|child|teen|youth|young/i;
    if (inappropriateTerms.test(message)) {
      issues.push("Contains age-inappropriate references");
    }

    // Check for excessive promotional language (spam indicators)
    const spamTerms = /FREE!!!|CLICK NOW!!!|LIMITED TIME!!!/i;
    if (spamTerms.test(message)) {
      issues.push("Excessive promotional language (spam risk)");
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate multiple variants for A/B testing
   */
  async generateVariants(
    params: SMSGenerationParams,
    count: number = 3,
  ): Promise<GeneratedSMS[]> {
    const variants: GeneratedSMS[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generateMessage({
        ...params,
        additionalContext: `${params.additionalContext || ""} Variant ${i + 1} - Try different wording`,
      });
      variants.push(variant);
    }

    return variants;
  }

  /**
   * Estimate campaign cost
   */
  estimateCampaignCost(recipientCount: number, segmentCount: number): number {
    const costPerSegment = 0.0075; // $0.0075 per SMS segment
    return recipientCount * segmentCount * costPerSegment;
  }
}

/**
 * Factory function
 */
export function createSMSGenerator(openAIKey?: string): SMSGenerator {
  const apiKey = openAIKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key required");
  }
  return new SMSGenerator(apiKey);
}
