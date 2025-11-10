/**
 * Email Campaign Prompt Templates
 * AI prompts for generating different types of email campaigns
 */

import type { EmailGenerationParams } from "./types";

/**
 * Build AI prompt based on campaign type
 */
export function buildEmailPrompt(params: EmailGenerationParams): string {
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
${params.productData?.thc_percent ? `THC: ${params.productData?.thc_percent}%` : ""}
${params.productData?.cbd_percent ? `CBD: ${params.productData?.cbd_percent}%` : ""}

Announce this exciting new product.
Highlight unique features and benefits.
Create urgency with limited availability.
Include a shop now call-to-action.`,

    sale: `Create a SALE/PROMOTION email for ${params.vendor.name}.

Offer: ${params.discountData?.value}${params.discountData?.type === "percentage" ? "%" : "$"} off ${params.customerSegment?.name || "all products"}
${params.additionalContext || "Limited time offer"}

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

Customer has earned: ${params.additionalContext || "reward tier upgrade"}
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
Brand Colors: Primary ${params.vendor.brand_colors?.primary || "#22c55e"}, Secondary ${params.vendor.brand_colors?.secondary || "#000000"}

${params.additionalContext ? `Additional Context: ${params.additionalContext}` : ""}

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
