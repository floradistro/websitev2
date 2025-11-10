"use client";

import { useState } from "react";
import { Plus, Copy, Info, Sparkles, Edit2, Save, X } from "lucide-react";
import { AddFieldFromLibraryModal } from "./AddFieldFromLibraryModal";

// Comprehensive field type library
const FIELD_TYPE_LIBRARY = [
  // Basic Fields
  {
    type: "text",
    name: "Text Input",
    category: "basic",
    description: "Single line text input",
    example: "Product name, headline, label",
    icon: "📝",
    properties: ["placeholder", "max_length", "required", "pattern"],
  },
  {
    type: "textarea",
    name: "Long Text",
    category: "basic",
    description: "Multi-line text area",
    example: "Description, paragraph, story",
    icon: "📄",
    properties: ["placeholder", "rows", "max_length", "required"],
  },
  {
    type: "rich_text",
    name: "Rich Text Editor",
    category: "basic",
    description: "Formatted text with bold, italic, links",
    example: "Blog content, detailed description",
    icon: "✍️",
    properties: ["toolbar_options", "max_length"],
  },
  {
    type: "number",
    name: "Number",
    category: "basic",
    description: "Numeric input with validation",
    example: "Price, quantity, percentage",
    icon: "🔢",
    properties: ["min", "max", "step", "suffix", "prefix"],
  },

  // Visual Fields
  {
    type: "color",
    name: "Color Picker",
    category: "visual",
    description: "Color selection with preview",
    example: "Brand colors, backgrounds, text",
    icon: "🎨",
    properties: ["allow_alpha", "preset_colors"],
  },
  {
    type: "image",
    name: "Image Upload",
    category: "visual",
    description: "Upload and manage images",
    example: "Logo, banner, product photo",
    icon: "🖼️",
    properties: ["max_size", "accepted_formats", "aspect_ratio"],
  },
  {
    type: "video",
    name: "Video",
    category: "visual",
    description: "Video URL or upload",
    example: "Background video, product demo",
    icon: "🎥",
    properties: ["autoplay", "loop", "muted", "max_size"],
  },
  {
    type: "icon_picker",
    name: "Icon Picker",
    category: "visual",
    description: "Select from icon library",
    example: "Feature icons, social icons",
    icon: "⭐",
    properties: ["icon_set", "size", "color"],
  },

  // Selection Fields
  {
    type: "select",
    name: "Dropdown",
    category: "selection",
    description: "Choose one from list",
    example: "Layout style, size, category",
    icon: "📋",
    properties: ["options", "default_value", "allow_custom"],
  },
  {
    type: "multi_select",
    name: "Multi-Select",
    category: "selection",
    description: "Choose multiple from list",
    example: "Tags, categories, features",
    icon: "☑️",
    properties: ["options", "min_selections", "max_selections"],
  },
  {
    type: "boolean",
    name: "Toggle/Checkbox",
    category: "selection",
    description: "True/false switch",
    example: "Show/hide, enable/disable",
    icon: "🔘",
    properties: ["default_value", "label_on", "label_off"],
  },

  // Structured Fields
  {
    type: "array",
    name: "Repeatable Items",
    category: "structured",
    description: "List of similar items",
    example: "Steps, features, testimonials",
    icon: "📚",
    properties: ["min_items", "max_items", "item_schema"],
  },
  {
    type: "object",
    name: "Grouped Fields",
    category: "structured",
    description: "Multiple related fields",
    example: "Address (street, city, zip)",
    icon: "🎁",
    properties: ["field_schema"],
  },

  // Commerce Fields
  {
    type: "product_picker",
    name: "Product Selector",
    category: "commerce",
    description: "Select products from catalog",
    example: "Featured products, bundle items",
    icon: "🛍️",
    properties: ["max_products", "filter_by_category"],
  },
  {
    type: "category_picker",
    name: "Category Selector",
    category: "commerce",
    description: "Select product categories",
    example: "Filter products, navigation",
    icon: "🏷️",
    properties: ["multi_select", "show_product_count"],
  },

  // Advanced Fields
  {
    type: "code",
    name: "Code Editor",
    category: "advanced",
    description: "Custom HTML/CSS/JS",
    example: "Custom widgets, third-party scripts",
    icon: "💻",
    properties: ["language", "syntax_highlight", "sandbox"],
  },
  {
    type: "ai_content",
    name: "AI Generated",
    category: "advanced",
    description: "AI writes content for you",
    example: "Product descriptions, headlines",
    icon: "🤖",
    properties: ["content_type", "tone", "length"],
  },
  {
    type: "dynamic_data",
    name: "Live Data",
    category: "advanced",
    description: "Real-time data from API",
    example: "Stock count, visitor count, sales",
    icon: "📊",
    properties: ["api_endpoint", "refresh_interval", "transform"],
  },
  {
    type: "conditional",
    name: "Conditional Block",
    category: "advanced",
    description: "Show/hide based on rules",
    example: "Location-based content, time-based",
    icon: "🔀",
    properties: ["conditions", "fallback_content"],
  },
];

interface FieldLibraryPanelProps {
  customFields: any[];
  onAddField: (sectionKey: string, fieldConfig: any) => void;
  onEditField: (fieldId: string, updates: any) => void;
  onDeleteField: (fieldId: string) => void;
  onRefresh: () => void;
}

export function FieldLibraryPanel({
  customFields,
  onAddField,
  onEditField,
  onDeleteField,
  onRefresh,
}: FieldLibraryPanelProps) {
  const [view, setView] = useState<"my_fields" | "library">("my_fields");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingField, setEditingField] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<any>(null);

  // Group custom fields by section
  const fieldsBySection = customFields.reduce(
    (acc, field) => {
      if (!acc[field.section_key]) acc[field.section_key] = [];
      acc[field.section_key].push(field);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const categories = [
    "all",
    ...Array.from(new Set(FIELD_TYPE_LIBRARY.map((f) => f.category))),
  ];
  const filteredLibrary =
    selectedCategory === "all"
      ? FIELD_TYPE_LIBRARY
      : FIELD_TYPE_LIBRARY.filter((f) => f.category === selectedCategory);

  return (
    <div className="h-full flex flex-col">
      {/* View Tabs */}
      <div className="flex gap-1 p-2 border-b border-white/10">
        <button
          onClick={() => setView("my_fields")}
          className={`flex-1 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
            view === "my_fields"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          My Fields ({customFields.length})
        </button>
        <button
          onClick={() => setView("library")}
          className={`flex-1 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
            view === "library"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          Field Library
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* MY FIELDS VIEW */}
        {view === "my_fields" && (
          <div className="p-3">
            {customFields.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="mx-auto mb-3 text-white/20" size={32} />
                <p className="text-white/40 text-xs mb-2">
                  No custom fields yet
                </p>
                <p className="text-white/30 text-[10px] leading-relaxed mb-4">
                  Browse the Field Library to add custom fields
                </p>
                <button
                  onClick={() => setView("library")}
                  className="text-[#007acc] hover:text-[#4fc1ff] text-xs transition-colors"
                >
                  Browse Library →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(fieldsBySection).map(
                  ([sectionKey, fields]: [string, any]) => (
                    <div key={sectionKey}>
                      <div className="text-[#858585] text-[10px] uppercase tracking-wider mb-2 font-medium">
                        {sectionKey}
                      </div>
                      <div className="space-y-1.5">
                        {fields.map((field: any) => (
                          <div
                            key={field.id}
                            className="bg-[#252526] border border-[#3e3e3e] rounded p-2.5"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="text-[#cccccc] text-xs font-medium">
                                  {field.field_definition.label}
                                </div>
                                <div className="text-[#858585] text-[10px] font-mono">
                                  {field.field_id}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingField(field)}
                                  className="text-white/40 hover:text-white p-1"
                                  title="Edit field"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button
                                  onClick={() => onDeleteField(field.id)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                  title="Delete field"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[#858585] text-[9px] bg-[#252526] px-1.5 py-0.5 rounded border border-[#3e3e3e]">
                                {field.field_definition.type}
                              </span>
                              {field.field_definition.required && (
                                <span className="text-red-400 text-[9px]">
                                  Required
                                </span>
                              )}
                            </div>

                            {field.field_definition.helper_text && (
                              <p className="text-white/40 text-[10px] mt-2 leading-relaxed">
                                {field.field_definition.helper_text}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* FIELD LIBRARY VIEW */}
        {view === "library" && (
          <div className="p-3">
            {/* Category Filter */}
            <div className="mb-3 flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredLibrary.map((fieldType) => (
                <div
                  key={fieldType.type}
                  className="bg-white/5 rounded p-2.5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">
                      {fieldType.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white text-xs font-medium">
                          {fieldType.name}
                        </h4>
                        <button
                          onClick={() => {
                            setSelectedFieldType(fieldType);
                            setShowAddModal(true);
                          }}
                          className="text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e] p-1 rounded transition-colors"
                          title="Use this field type"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-[#858585] text-[10px] leading-relaxed mb-1.5">
                        {fieldType.description}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#858585] text-[9px] bg-[#252526] px-1.5 py-0.5 rounded font-mono border border-[#3e3e3e]">
                          {fieldType.type}
                        </span>
                        <span className="text-[#858585] text-[9px]">
                          {fieldType.example}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Field Modal */}
      {editingField && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-md w-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Edit Field</h3>
              <button
                onClick={() => setEditingField(null)}
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/80 text-xs mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={editingField.field_definition.label}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      field_definition: {
                        ...editingField.field_definition,
                        label: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-white/80 text-xs mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={editingField.field_definition.placeholder || ""}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      field_definition: {
                        ...editingField.field_definition,
                        placeholder: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-white/80 text-xs mb-1">
                  Helper Text
                </label>
                <textarea
                  value={editingField.field_definition.helper_text || ""}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      field_definition: {
                        ...editingField.field_definition,
                        helper_text: e.target.value,
                      },
                    })
                  }
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingField.field_definition.required || false}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      field_definition: {
                        ...editingField.field_definition,
                        required: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-white/80 text-xs">Required field</label>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingField(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEditField(editingField.id, editingField.field_definition);
                  setEditingField(null);
                }}
                className="flex-1 bg-white text-black px-3 py-2 rounded text-xs hover:bg-white/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Field from Library Modal - With Preview */}
      {showAddModal && selectedFieldType && (
        <AddFieldFromLibraryModal
          fieldType={selectedFieldType}
          onClose={() => {
            setShowAddModal(false);
            setSelectedFieldType(null);
          }}
          onAdd={(sectionKey, fieldConfig) => {
            onAddField(sectionKey, fieldConfig);
            setShowAddModal(false);
            setSelectedFieldType(null);
          }}
        />
      )}
    </div>
  );
}
