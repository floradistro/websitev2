/**
 * Standard Label Templates
 * Industry-standard Avery templates + custom cannabis label formats
 */

import { LabelTemplate } from "./types/labels";

export const LABEL_TEMPLATES: Record<string, LabelTemplate> = {
  avery_5160: {
    template_name: "Avery 5160",
    description: "30-up address labels (2.625\" × 1\")",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.5,
      margin_bottom: 0.5,
      margin_left: 0.21875,
      margin_right: 0.21875,
    },
    grid: {
      rows: 10,
      columns: 3,
      label_width: 2.625,
      label_height: 1.0,
      horizontal_pitch: 2.83333,
      vertical_pitch: 1.0,
      origin: "top-left",
    },
    label_style: {
      safe_padding: { top: 0.08, right: 0.05, bottom: 0.05, left: 0.05 },
      corner_radius: 0.0625,
      background: "none",
      border: { enabled: false },
    },
    text_style: {
      font_family: "Helvetica, sans-serif",
      font_size_pt: 9,
      line_height_em: 1.1,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit",
    },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 48 },
      { name: "line2", type: "text", required: false, max_length: 48 },
      { name: "line3", type: "text", required: false, max_length: 48 },
    ],
    layout: [
      {
        type: "text_block",
        binding: ["line1", "line2", "line3"],
        join_with: "\n",
        box: { x: 0.0625, y: 0.0625, width: 2.5, height: 0.875 },
        style_overrides: { line_break: "auto", max_lines: 3 },
      },
    ],
    data_mapping: {
      records_per_page: 30,
      fill_order: "row-major",
    },
  },

  avery_5161: {
    template_name: "Avery 5161",
    description: "20-up address labels (4\" × 1\")",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.5,
      margin_bottom: 0.5,
      margin_left: 0.15625,
      margin_right: 0.15625,
    },
    grid: {
      rows: 10,
      columns: 2,
      label_width: 4.0,
      label_height: 1.0,
      horizontal_pitch: 4.1875,
      vertical_pitch: 1.0,
      origin: "top-left",
    },
    label_style: {
      safe_padding: { top: 0.0625, right: 0.0625, bottom: 0.0625, left: 0.0625 },
      corner_radius: 0.0625,
      background: "none",
      border: { enabled: false },
    },
    text_style: {
      font_family: "Helvetica, sans-serif",
      font_size_pt: 9,
      line_height_em: 1.1,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit",
    },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 60 },
      { name: "line2", type: "text", required: false, max_length: 60 },
      { name: "line3", type: "text", required: false, max_length: 60 },
    ],
    layout: [
      {
        type: "text_block",
        binding: ["line1", "line2", "line3"],
        join_with: "\n",
        box: { x: 0.0625, y: 0.0625, width: 3.875, height: 0.875 },
        style_overrides: { line_break: "auto", max_lines: 3 },
      },
    ],
    data_mapping: {
      records_per_page: 20,
      fill_order: "row-major",
    },
  },

  avery_5162: {
    template_name: "Avery 5162",
    description: "14-up address labels (4\" × 1.33\")",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.84,
      margin_bottom: 0.84,
      margin_left: 0.15625,
      margin_right: 0.15625,
    },
    grid: {
      rows: 7,
      columns: 2,
      label_width: 4.0,
      label_height: 1.33,
      horizontal_pitch: 4.1875,
      vertical_pitch: 1.33,
      origin: "top-left",
    },
    label_style: {
      safe_padding: { top: 0.08, right: 0.08, bottom: 0.08, left: 0.08 },
      corner_radius: 0.0625,
      background: "none",
      border: { enabled: false },
    },
    text_style: {
      font_family: "Helvetica, sans-serif",
      font_size_pt: 10,
      line_height_em: 1.2,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit",
    },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 60 },
      { name: "line2", type: "text", required: false, max_length: 60 },
      { name: "line3", type: "text", required: false, max_length: 60 },
    ],
    layout: [
      {
        type: "text_block",
        binding: ["line1", "line2", "line3"],
        join_with: "\n",
        box: { x: 0.08, y: 0.08, width: 3.84, height: 1.17 },
        style_overrides: { line_break: "auto", max_lines: 4 },
      },
    ],
    data_mapping: {
      records_per_page: 14,
      fill_order: "row-major",
    },
  },

  cannabis_shelf_tag: {
    template_name: "Cannabis Shelf Tag",
    description: "Premium cannabis shelf label (2.5\" × 1.5\")",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.5,
      margin_bottom: 0.5,
      margin_left: 0.25,
      margin_right: 0.25,
    },
    grid: {
      rows: 6,
      columns: 3,
      label_width: 2.5,
      label_height: 1.5,
      horizontal_pitch: 2.67,
      vertical_pitch: 1.67,
      origin: "top-left",
    },
    label_style: {
      safe_padding: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
      corner_radius: 0.125,
      background: "#ffffff",
      border: { enabled: true, width: 1, color: "#000000" },
    },
    text_style: {
      font_family: "Helvetica, sans-serif",
      font_size_pt: 8,
      line_height_em: 1.2,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit",
    },
    fields: [
      { name: "productName", type: "text", required: true },
      { name: "strainType", type: "text", required: false },
      { name: "thc", type: "text", required: false },
      { name: "price", type: "text", required: false },
      { name: "effect", type: "text", required: false },
    ],
    layout: [
      {
        type: "text_block",
        binding: ["productName"],
        box: { x: 0.1, y: 0.1, width: 2.3, height: 0.4 },
        style_overrides: { font_size_pt: 11, font_weight: "bold", max_lines: 2, color: "#000000" },
      },
      {
        type: "text_block",
        binding: ["strainType", "thc"],
        join_with: " • ",
        box: { x: 0.1, y: 0.55, width: 2.3, height: 0.25 },
        style_overrides: { font_size_pt: 7, color: "#000000" },
      },
      {
        type: "text_block",
        binding: ["price"],
        box: { x: 0.1, y: 0.85, width: 2.3, height: 0.35 },
        style_overrides: { font_size_pt: 14, font_weight: "bold", color: "#000000" },
      },
      {
        type: "text_block",
        binding: ["effect"],
        box: { x: 0.1, y: 1.25, width: 2.3, height: 0.15 },
        style_overrides: { font_size_pt: 6, color: "#666666" },
      },
    ],
    data_mapping: {
      records_per_page: 18,
      fill_order: "row-major",
    },
  },
};

export const getTemplateList = () => {
  return Object.entries(LABEL_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.template_name,
    description: template.description,
  }));
};

export const getTemplate = (id: string): LabelTemplate | null => {
  return LABEL_TEMPLATES[id] || null;
};
