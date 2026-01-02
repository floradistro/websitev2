"use client";

import { useState } from "react";
import { X, Eye } from "lucide-react";
import { SimpleScopeSelector } from "./SimpleScopeSelector";
import { ProductPickerField } from "@/components/fields/ProductPickerField";
import { CategoryPickerField } from "@/components/fields/CategoryPickerField";
import { PricingDisplayField } from "@/components/fields/PricingDisplayField";
import { LocationPickerField } from "@/components/fields/LocationPickerField";
import { CodeEditorField } from "@/components/fields/CodeEditorField";

import { logger } from "@/lib/logger";
interface AddFieldFromLibraryModalProps {
  fieldType: any;
  onClose: () => void;
  onAdd: (sectionKey: string, fieldConfig: any) => void;
}

export function AddFieldFromLibraryModal({
  fieldType,
  onClose,
  onAdd,
}: AddFieldFromLibraryModalProps) {
  const [step, setStep] = useState<"preview" | "configure">("preview");
  const [config, setConfig] = useState({
    scope: {
      type: "section_type" as "section_type" | "page" | "global",
      value: "hero",
    },
    field_id: "",
    label: "",
    helper_text: "",
  });
  const [previewValue, setPreviewValue] = useState<any>(null);
  const vendorId = typeof window !== "undefined" ? localStorage.getItem("vendor_id") || "" : "";

  const handleAdd = async () => {
    if (!config.field_id || !config.label) {
      alert("Field ID and Label are required");
      return;
    }

    const fieldDefinition: any = {
      type: fieldType.type,
      label: config.label,
      ...getDefaultPropertiesForType(fieldType.type),
    };

    if (config.helper_text) {
      fieldDefinition.helper_text = config.helper_text;
    }

    // Add via API
    try {
      const response = await fetch("/api/vendor/custom-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          section_key: config.scope.value, // For backward compatibility
          scope_type: config.scope.type,
          scope_value: config.scope.value,
          field_id: config.field_id,
          field_definition: fieldDefinition,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onAdd("", fieldDefinition); // section_key not needed for global fields
        alert("✅ Custom field added successfully!");
      } else {
        alert(data.error || "Failed to add field");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error:", error);
      }
      alert("Failed to add field");
    }
  };

  function getDefaultPropertiesForType(type: string) {
    switch (type) {
      case "product_picker":
        return { max_items: 10, filter: {} };
      case "category_picker":
        return { multi_select: true, show_product_count: true };
      case "location_picker":
        return { multi_select: true, filter_type: "all" };
      case "pricing_display":
        return { show_retail: true, format: "table" };
      case "code":
        return { language: "html", max_length: 5000 };
      case "array":
        return { min_items: 1, max_items: 10 };
      case "number":
        return { min: 0, max: 1000 };
      default:
        return {};
    }
  }

  // Render preview of the field
  function renderFieldPreview() {
    const demoVendorId = vendorId || "demo";

    switch (fieldType.type) {
      case "product_picker":
        return (
          <ProductPickerField
            value={previewValue || []}
            onChange={setPreviewValue}
            vendorId={demoVendorId}
            maxSelections={10}
            label="Preview: Select Products"
          />
        );

      case "category_picker":
        return (
          <CategoryPickerField
            value={previewValue || []}
            onChange={setPreviewValue}
            multiSelect={true}
            showProductCount={true}
            label="Preview: Select Categories"
          />
        );

      case "location_picker":
        return (
          <LocationPickerField
            value={previewValue || []}
            onChange={setPreviewValue}
            vendorId={demoVendorId}
            filterType="all"
            label="Preview: Select Locations"
          />
        );

      case "pricing_display":
        return (
          <PricingDisplayField
            value={previewValue || {}}
            onChange={setPreviewValue}
            vendorId={demoVendorId}
            label="Preview: Pricing Options"
          />
        );

      case "code":
        return (
          <CodeEditorField
            value={previewValue || ""}
            onChange={setPreviewValue}
            language="html"
            label="Preview: Code Editor"
          />
        );

      case "text":
        return (
          <div className="mb-4">
            <label className="block text-white/80 text-sm mb-2">Preview: Text Input</label>
            <input
              type="text"
              value={previewValue || ""}
              onChange={(e) => setPreviewValue(e.target.value)}
              placeholder="Type here to test..."
              className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
            />
          </div>
        );

      case "color":
        return (
          <div className="mb-4">
            <label className="block text-white/80 text-sm mb-2">Preview: Color Picker</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={previewValue || "#000000"}
                onChange={(e) => setPreviewValue(e.target.value)}
                className="w-16 h-10 bg-black border border-white/20 rounded cursor-pointer"
              />
              <input
                type="text"
                value={previewValue || "#000000"}
                onChange={(e) => setPreviewValue(e.target.value)}
                className="flex-1 bg-black/50 border border-white/20 rounded px-4 py-2 text-white font-mono"
              />
            </div>
          </div>
        );

      case "boolean":
        return (
          <div className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={previewValue || false}
              onChange={(e) => setPreviewValue(e.target.checked)}
              className="w-5 h-5"
            />
            <label className="text-white/80 text-sm">Preview: Toggle Option</label>
          </div>
        );

      default:
        return (
          <div className="bg-white/5 border border-white/10 rounded p-4 text-center">
            <p className="text-white/40 text-sm">Preview not available for this field type</p>
            <p className="text-white/30 text-xs mt-2">{fieldType.example}</p>
          </div>
        );
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-[#3e3e3e] rounded max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#3e3e3e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{fieldType.icon}</span>
            <div>
              <h3 className="text-[#cccccc] font-medium text-sm">{fieldType.name}</h3>
              <p className="text-[#858585] text-xs">{fieldType.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#858585] hover:text-[#cccccc] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "preview" ? (
            <>
              {/* Live Preview */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={16} className="text-purple-400" />
                  <h4 className="text-white font-medium text-sm">Live Preview</h4>
                </div>
                <div className="bg-black border border-white/10 rounded-lg p-4">
                  {renderFieldPreview()}
                </div>
                <p className="text-white/40 text-xs mt-2">
                  ↑ Try interacting with the field to see how it works
                </p>
              </div>

              {/* Properties */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 mb-4">
                <p className="text-purple-400 text-xs font-medium mb-2">Properties Available:</p>
                <div className="flex flex-wrap gap-1.5">
                  {fieldType.properties.map((prop: string) => (
                    <span
                      key={prop}
                      className="text-white/60 text-[10px] bg-white/10 px-2 py-1 rounded"
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div className="bg-white/5 border border-white/10 rounded p-3">
                <p className="text-white/80 text-xs font-medium mb-2">Example Use Cases:</p>
                <p className="text-white/60 text-[11px] leading-relaxed">{fieldType.example}</p>
              </div>
            </>
          ) : (
            <>
              {/* Configuration */}
              <div className="space-y-3">
                <SimpleScopeSelector
                  value={config.scope}
                  onChange={(scope) => setConfig({ ...config, scope })}
                />

                <div>
                  <label className="block text-white/80 text-sm mb-1">
                    Field ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.field_id}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        field_id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                      })
                    }
                    placeholder="my_custom_field"
                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white font-mono text-sm"
                  />
                  <p className="text-white/40 text-[10px] mt-1">
                    Unique identifier (lowercase, underscores)
                  </p>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">
                    Field Label <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => setConfig({ ...config, label: e.target.value })}
                    placeholder={`My ${fieldType.name}`}
                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white"
                  />
                  <p className="text-white/40 text-[10px] mt-1">What users see in the editor</p>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Helper Text (Optional)</label>
                  <textarea
                    value={config.helper_text}
                    onChange={(e) => setConfig({ ...config, helper_text: e.target.value })}
                    placeholder="Explain what this field does..."
                    rows={2}
                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-sm"
          >
            Cancel
          </button>

          {step === "preview" ? (
            <button
              onClick={() => setStep("configure")}
              className="flex-1 bg-white text-black px-4 py-2 rounded text-sm hover:bg-white/90"
            >
              Configure & Add Field →
            </button>
          ) : (
            <>
              <button
                onClick={() => setStep("preview")}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-sm"
              >
                ← Back to Preview
              </button>
              <button
                onClick={handleAdd}
                disabled={!config.field_id || !config.label}
                className="flex-1 bg-white text-black px-4 py-2 rounded text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Field
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
