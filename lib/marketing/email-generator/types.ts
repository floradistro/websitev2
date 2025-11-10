/**
 * Email Generator Type Definitions
 */

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
    | "welcome"
    | "new_product"
    | "sale"
    | "win_back"
    | "birthday"
    | "loyalty_reward"
    | "abandoned_cart"
    | "product_restock";
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
    type: "percentage" | "fixed_amount";
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

export interface EmailContent {
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  cta_text: string;
  cta_url: string;
  footer_text: string;
  tone: "professional" | "friendly" | "excited" | "warm";
}
