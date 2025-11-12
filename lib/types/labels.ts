/**
 * Label Printing System - Type Definitions
 * Ported and modernized from legacy POS system
 */

export interface LabelTemplate {
  template_name: string;
  description: string;
  units: "in" | "mm";
  page: {
    size: "letter" | "a4" | "custom";
    width: number;
    height: number;
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
  };
  grid: {
    rows: number;
    columns: number;
    label_width: number;
    label_height: number;
    horizontal_pitch: number;
    vertical_pitch: number;
    origin: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };
  label_style: {
    safe_padding: { top: number; right: number; bottom: number; left: number };
    corner_radius: number;
    background: string;
    border: { enabled: boolean; width?: number; color?: string };
  };
  text_style: {
    font_family: string;
    font_size_pt: number;
    line_height_em: number;
    color: string;
    align: "left" | "center" | "right";
    vertical_align: "top" | "middle" | "bottom";
    overflow: "shrink-to-fit" | "truncate" | "wrap";
  };
  fields: Array<{
    name: string;
    type: "text" | "number" | "date" | "barcode" | "qrcode";
    required: boolean;
    max_length?: number;
  }>;
  layout: Array<{
    type: "text_block" | "image" | "barcode" | "qrcode";
    binding: string[];
    join_with?: string;
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    style_overrides?: {
      line_break?: "auto" | "none";
      max_lines?: number;
      font_size_pt?: number;
      font_weight?: "normal" | "bold";
      color?: string;
    };
  }>;
  data_mapping: {
    records_per_page: number;
    fill_order: "row-major" | "column-major";
  };
}

export interface SavedTemplate {
  id: string;
  user_id: string;
  location_id?: string;
  name: string;
  description: string | null;
  template_type: string;
  config_data: LabelCustomization;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabelCustomization {
  // Template selection
  template_id: string;

  // Visual toggles
  showBorders: boolean;
  showLogo: boolean;
  showDate: boolean;
  showPrice: boolean;
  showSKU: boolean;
  showCategory: boolean;
  showMargin: boolean;

  // Cannabis-specific fields
  showEffect: boolean;
  showLineage: boolean;
  showNose: boolean;
  showTerpenes: boolean;
  showPotency: boolean;

  // Typography customization
  productName: {
    font: string;
    size: number;
    color: string;
    weight: "normal" | "bold";
  };
  details: {
    font: string;
    size: number;
    color: string;
  };

  // Layout
  lineHeight: number;
  logoSize: number;
}

export interface LabelData {
  // Core product info
  productName: string;
  sku?: string;
  price?: string;
  category?: string;

  // Cannabis fields
  strainType?: "indica" | "sativa" | "hybrid";
  thc?: string;
  cbd?: string;
  effect?: string;
  lineage?: string;
  nose?: string;
  terpenes?: string[];

  // Vendor info
  vendorName?: string;
  vendorLogo?: string;

  // Additional
  datePackaged?: string;
  batchNumber?: string;
  expiryDate?: string;
  barcode?: string;
  qrCode?: string;
}

export interface PrintJob {
  id: string;
  vendor_id: string;
  location_id?: string;
  template_id: string;
  product_ids: string[];
  label_count: number;
  customization: LabelCustomization;
  status: "queued" | "printing" | "completed" | "failed";
  created_at: string;
}
