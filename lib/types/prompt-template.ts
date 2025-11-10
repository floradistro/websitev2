export interface PromptTemplate {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string | null;
  prompt_text: string;
  category: "product" | "marketing" | "social" | "brand" | "menu" | null;
  style:
    | "cartoon"
    | "realistic"
    | "minimalist"
    | "luxury"
    | "retro"
    | "neon"
    | "hand_drawn"
    | "3d_render"
    | "photographic"
    | null;
  parameters: {
    size?: string;
    quality?: string;
    style?: string;
    [key: string]: any;
  };
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string | null;
}

export type TemplateCategory = PromptTemplate["category"];
export type TemplateStyle = PromptTemplate["style"];
