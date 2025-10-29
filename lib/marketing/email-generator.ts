/**
 * AI-Powered Email Template Generator
 * Uses OpenAI to generate marketing email content
 * Automatically brands emails with vendor's colors, logo, etc.
 */

import OpenAI from 'openai';

export interface EmailGenerationParams {
  vendor: {
    id: string;
    name: string;
    logo_url?: string;
    brand_colors?: {
      primary: string;
      secondary: string;
    };
  };
  campaignType:
    | 'welcome'
    | 'new_product'
    | 'sale'
    | 'win_back'
    | 'birthday'
    | 'loyalty_reward'
    | 'abandoned_cart'
    | 'product_restock';
  productData?: {
    name: string;
    description: string;
    price: number;
    image_url?: string;
    category?: string;
    thc_percent?: number;
    cbd_percent?: number;
  };
  discountData?: {
    type: 'percentage' | 'fixed_amount';
    value: number;
  };
  customerSegment?: {
    name: string;
    description: string;
  };
  additionalContext?: string;
}

export interface GeneratedEmail {
  subject: string;
  preheader: string;
  html: string;
  plain_text: string;
  metadata: {
    tone: string;
    word_count: number;
    estimated_read_time: string;
  };
}

export class EmailGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate complete email campaign
   */
  async generateCampaign(params: EmailGenerationParams): Promise<GeneratedEmail> {
    // Generate content with AI
    const content = await this.generateContent(params);

    // Build branded HTML
    const html = this.buildHTML(params, content);

    // Extract plain text
    const plainText = this.stripHTML(content.body);

    return {
      subject: content.subject,
      preheader: content.preheader,
      html,
      plain_text: plainText,
      metadata: {
        tone: content.tone,
        word_count: plainText.split(' ').length,
        estimated_read_time: `${Math.ceil(plainText.split(' ').length / 200)} min`,
      },
    };
  }

  /**
   * Generate email content using AI
   */
  private async generateContent(params: EmailGenerationParams): Promise<any> {
    const prompt = this.buildPrompt(params);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert cannabis dispensary marketing copywriter.
Create compelling, professional, and compliant email marketing content.

RULES:
- Be professional and friendly
- Keep subject lines under 50 characters
- Make preheader text compelling (under 100 chars)
- Use proper cannabis terminology
- Emphasize quality, safety, and customer experience
- Include a clear call-to-action
- Be compliant with cannabis marketing regulations
- No medical claims
- Always include 21+ age requirement reminder
- Output valid JSON only`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response;
  }

  /**
   * Build AI prompt based on campaign type
   */
  private buildPrompt(params: EmailGenerationParams): string {
    const templates = {
      welcome: `Create a WELCOME email for new customers at ${params.vendor.name}.

Welcome new customers to the dispensary.
Introduce the brand.
Offer a first-time discount of ${params.discountData?.value || 15}% off.
Mention product categories available.
Invite them to visit the store or shop online.`,

      new_product: `Create a NEW PRODUCT LAUNCH email for ${params.vendor.name}.

Product: ${params.productData?.name}
Description: ${params.productData?.description}
Price: $${params.productData?.price}
${params.productData?.thc_percent ? `THC: ${params.productData?.thc_percent}%` : ''}
${params.productData?.cbd_percent ? `CBD: ${params.productData?.cbd_percent}%` : ''}

Announce this exciting new product.
Highlight unique features and benefits.
Create urgency with limited availability.
Include a shop now call-to-action.`,

      sale: `Create a SALE/PROMOTION email for ${params.vendor.name}.

Offer: ${params.discountData?.value}${params.discountData?.type === 'percentage' ? '%' : '$'} off ${params.customerSegment?.name || 'all products'}
${params.additionalContext || 'Limited time offer'}

Create excitement about the sale.
Emphasize value and savings.
Create urgency with deadline.
Clear call-to-action to shop now.`,

      win_back: `Create a WIN-BACK email for lapsed customers at ${params.vendor.name}.

Target: Customers who haven't visited in 30+ days
Offer: ${params.discountData?.value || 20}% off their next order

Make them feel missed and valued.
Remind them what they're missing.
Offer a special "come back" discount.
Personalized and warm tone.`,

      birthday: `Create a BIRTHDAY email for ${params.vendor.name}.

Offer: ${params.discountData?.value || 20}% off as a birthday gift
Valid for: This month

Celebrate their special day.
Make them feel valued as a customer.
Offer a birthday discount or gift.
Warm, celebratory tone.`,

      loyalty_reward: `Create a LOYALTY REWARD email for ${params.vendor.name}.

Customer has earned: ${params.additionalContext || 'reward tier upgrade'}
Benefit: ${params.discountData?.value}% discount

Congratulate them on their loyalty.
Show appreciation for their business.
Explain their new benefits.
Encourage continued engagement.`,

      abandoned_cart: `Create an ABANDONED CART email for ${params.vendor.name}.

Cart value: $${params.productData?.price || 0}
Time since abandoned: 30 minutes

Remind them about items left in cart.
Remove any obstacles to completing purchase.
Offer assistance or support.
Optional: Small incentive (free delivery, etc)`,

      product_restock: `Create a BACK IN STOCK email for ${params.vendor.name}.

Product: ${params.productData?.name}
Previously Out of Stock

Alert them that their desired product is available again.
Create urgency (limited quantity).
Make it easy to purchase immediately.
Thank them for waiting.`,
    };

    const basePrompt = templates[params.campaignType];

    return `${basePrompt}

Store Name: ${params.vendor.name}
Brand Colors: Primary ${params.vendor.brand_colors?.primary || '#22c55e'}, Secondary ${params.vendor.brand_colors?.secondary || '#000000'}

${params.additionalContext ? `Additional Context: ${params.additionalContext}` : ''}

Generate a JSON response with this exact structure:
{
  "subject": "Email subject line (under 50 chars)",
  "preheader": "Preview text (under 100 chars)",
  "headline": "Main email headline",
  "body": "HTML email body (use <p>, <h2>, <h3>, <strong>, <a> tags)",
  "cta_text": "Call to action button text",
  "cta_url": "{{shop_url}}",
  "footer_text": "Brief footer message",
  "tone": "professional" | "friendly" | "excited" | "warm"
}`;
  }

  /**
   * Build branded HTML email
   */
  private buildHTML(params: EmailGenerationParams, content: any): string {
    const primaryColor = params.vendor.brand_colors?.primary || '#22c55e';
    const secondaryColor = params.vendor.brand_colors?.secondary || '#000000';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #191919;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .headline {
      font-size: 28px;
      font-weight: bold;
      color: #191919;
      margin: 0 0 20px 0;
      line-height: 1.2;
    }
    .body-text {
      font-size: 16px;
      color: #191919;
      margin: 0 0 20px 0;
    }
    .body-text p {
      margin: 0 0 16px 0;
    }
    .cta {
      display: inline-block;
      padding: 16px 40px;
      background: ${primaryColor};
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
    }
    .cta:hover {
      opacity: 0.9;
    }
    .product-card {
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .product-image {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
    }
    .product-info h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #191919;
    }
    .product-price {
      font-size: 24px;
      font-weight: bold;
      color: ${primaryColor};
      margin: 8px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 30px 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: #e5e5e5;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .headline {
        font-size: 24px;
      }
      .product-card {
        flex-direction: column;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${content.preheader}
  </div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      ${params.vendor.logo_url ? `<img src="${params.vendor.logo_url}" alt="${params.vendor.name}" class="logo">` : `<h1 style="color: #ffffff; margin: 0;">${params.vendor.name}</h1>`}
    </div>

    <!-- Content -->
    <div class="content">
      <h1 class="headline">${content.headline}</h1>

      <div class="body-text">
        ${content.body}
      </div>

      ${
        params.productData
          ? `
      <div class="product-card">
        ${params.productData.image_url ? `<img src="${params.productData.image_url}" alt="${params.productData.name}" class="product-image">` : ''}
        <div class="product-info">
          <h3>${params.productData.name}</h3>
          <p style="margin: 0; color: #666;">${params.productData.description || ''}</p>
          ${params.productData.thc_percent ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">THC: ${params.productData.thc_percent}% ${params.productData.cbd_percent ? `| CBD: ${params.productData.cbd_percent}%` : ''}</p>` : ''}
          <div class="product-price">$${params.productData.price?.toFixed(2)}</div>
        </div>
      </div>
      `
          : ''
      }

      <center>
        <a href="${content.cta_url}?utm_source=email&utm_medium=email&utm_campaign={{campaign_id}}" class="cta">
          ${content.cta_text}
        </a>
      </center>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        ${content.footer_text}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">${params.vendor.name}</p>
      <p style="margin: 0 0 10px 0;">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> |
        <a href="{{preferences_url}}">Email Preferences</a>
      </p>
      <p style="margin: 0;">
        You're receiving this email because you signed up for updates from ${params.vendor.name}.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px;">
        21+ only. Please consume cannabis responsibly.
        ${params.additionalContext?.includes('medical') ? 'Valid medical card required.' : ''}
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate multiple variants for A/B testing
   */
  async generateVariants(
    params: EmailGenerationParams,
    count: number = 3
  ): Promise<GeneratedEmail[]> {
    const variants: GeneratedEmail[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generateCampaign({
        ...params,
        additionalContext: `${params.additionalContext || ''} Variant ${i + 1} - Try different approach/tone`,
      });
      variants.push(variant);
    }

    return variants;
  }
}

/**
 * Factory function
 */
export function createEmailGenerator(openAIKey?: string): EmailGenerator {
  const apiKey = openAIKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key required');
  }
  return new EmailGenerator(apiKey);
}
