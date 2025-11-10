"use client";

/**
 * CustomFieldModal - Clean modal for creating custom product fields
 * Jobs-worthy simplicity: Field name, type, category. Done.
 */

import { useState, useEffect } from "react";
import { Save, Type } from "lucide-react";
import { showNotification } from "@/components/NotificationToast";
import { Button, Input, Textarea, Modal, ds, cn } from "@/components/ds";
import axios from "axios";

import { logger } from "@/lib/logger";
interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vendorId: string;
  categories: any[];
}

const FIELD_TYPES = [
  { value: "text", label: "Short Text", description: "Single line input" },
  {
    value: "textarea",
    label: "Long Text",
    description: "Multi-line paragraph",
  },
  { value: "number", label: "Number", description: "Numeric values" },
  { value: "select", label: "Dropdown", description: "Select from options" },
  { value: "checkbox", label: "Checkbox", description: "Yes/No toggle" },
  { value: "date", label: "Date", description: "Date picker" },
  { value: "url", label: "URL", description: "Web address" },
  { value: "email", label: "Email", description: "Email address" },
];

export function CustomFieldModal({
  isOpen,
  onClose,
  onSave,
  vendorId,
  categories,
}: CustomFieldModalProps) {
  const [formData, setFormData] = useState({
    label: "",
    field_id: "",
    type: "text",
    description: "",
    category_id: "",
    options: "",
    required: false,
    placeholder: "",
  });
  const [saving, setSaving] = useState(false);
  const [autoGenerateId, setAutoGenerateId] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        label: "",
        field_id: "",
        type: "text",
        description: "",
        category_id: "",
        options: "",
        required: false,
        placeholder: "",
      });
      setAutoGenerateId(true);
    }
  }, [isOpen]);

  // Auto-generate field_id from label
  useEffect(() => {
    if (autoGenerateId && formData.label) {
      const generated = formData.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      setFormData((prev) => ({ ...prev, field_id: generated }));
    }
  }, [formData.label, autoGenerateId]);

  const handleSubmit = async () => {
    if (!formData.label.trim()) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Field label is required",
      });
      return;
    }

    if (!formData.field_id.trim()) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Field ID is required",
      });
      return;
    }

    // Validate field_id format (lowercase, underscores only)
    if (!/^[a-z0-9_]+$/.test(formData.field_id)) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Field ID can only contain lowercase letters, numbers, and underscores",
      });
      return;
    }

    if (formData.type === "select" && !formData.options.trim()) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Please provide dropdown options (one per line)",
      });
      return;
    }

    setSaving(true);
    try {
      const field_definition: any = {
        type: formData.type,
        label: formData.label.trim(),
        required: formData.required,
      };

      if (formData.description) {
        field_definition.description = formData.description.trim();
      }

      if (formData.placeholder) {
        field_definition.placeholder = formData.placeholder.trim();
      }

      // Add options for select type
      if (formData.type === "select" && formData.options) {
        field_definition.options = formData.options
          .split("\n")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0);
      }

      const payload: any = {
        field_id: formData.field_id.trim(),
        field_definition,
      };

      // Only add category_id if one is selected
      if (formData.category_id) {
        payload.category_id = formData.category_id;
      }

      await axios.post("/api/vendor/product-fields", payload, {
        headers: { "x-vendor-id": vendorId },
      });

      showNotification({
        type: "success",
        title: "Field Created",
        message: `${formData.label} has been created successfully`,
      });

      onSave();
      onClose();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating field:", error);
      }
      showNotification({
        type: "error",
        title: "Creation Failed",
        message: error.response?.data?.error || "Failed to create custom field",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Custom Field" size="md">
      <div className="space-y-4 mb-6">
        {/* Field Label */}
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Field Label *
          </label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="e.g., Strain Type, Lab Testing, THC Level"
            autoFocus
          />
          <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1")}>
            This is what users will see
          </p>
        </div>

        {/* Field ID */}
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Field ID *
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={formData.field_id}
              onChange={(e) => {
                setAutoGenerateId(false);
                setFormData({ ...formData, field_id: e.target.value });
              }}
              placeholder="e.g., strain_type, lab_testing"
              className="font-mono text-xs"
            />
            <button
              onClick={() => setAutoGenerateId(true)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs whitespace-nowrap",
                ds.colors.bg.elevated,
                ds.colors.text.tertiary,
                "hover:text-white transition-colors",
              )}
            >
              Auto
            </button>
          </div>
          <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1")}>
            Lowercase, underscores only (used in code)
          </p>
        </div>

        {/* Field Type */}
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Field Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              ds.typography.size.xs,
              ds.colors.bg.primary,
              ds.colors.border.default,
              "border text-white/90",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
            )}
          >
            {FIELD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {/* Category Assignment */}
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Assign to Category (Optional)
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              ds.typography.size.xs,
              ds.colors.bg.primary,
              ds.colors.border.default,
              "border text-white/90",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
            )}
          >
            <option value="">All Categories</option>
            {categories
              .filter((c) => c.vendor_id === vendorId && !c.parent_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1")}>
            Leave empty to show on all products
          </p>
        </div>

        {/* Description */}
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Description (Optional)
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Help text for this field"
            rows={2}
          />
        </div>

        {/* Placeholder */}
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Placeholder (Optional)
          </label>
          <Input
            value={formData.placeholder}
            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
            placeholder="e.g., Enter THC percentage"
          />
        </div>

        {/* Options for Select type */}
        {formData.type === "select" && (
          <div>
            <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
              Dropdown Options * (one per line)
            </label>
            <Textarea
              value={formData.options}
              onChange={(e) => setFormData({ ...formData, options: e.target.value })}
              placeholder={"Indica\nSativa\nHybrid"}
              rows={4}
            />
          </div>
        )}

        {/* Required Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={formData.required}
            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label
            htmlFor="required"
            className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "cursor-pointer")}
          >
            Make this field required
          </label>
        </div>
      </div>

      {/* Info box */}
      <div
        className={cn(
          "p-4 rounded-lg mb-6",
          ds.colors.bg.elevated,
          ds.colors.border.default,
          "border",
        )}
      >
        <div className="flex gap-3">
          <Type className={cn("w-4 h-4 flex-shrink-0 mt-0.5", ds.colors.icon.blue)} />
          <div>
            <p className={cn(ds.typography.size.xs, "text-white/80")}>
              Custom fields help you capture product-specific data
            </p>
            <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-0.5")}>
              Examples: Strain lineage, terpene profiles, lab test results, effects, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-end gap-3 pt-4 border-t"
        style={{ borderColor: ds.colors.border.default }}
      >
        <button
          onClick={onClose}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
            "hover:text-white/80",
            "focus:outline-none focus:ring-2 focus:ring-white/20",
          )}
        >
          Cancel
        </button>

        <Button
          onClick={handleSubmit}
          disabled={saving || !formData.label.trim() || !formData.field_id.trim()}
        >
          <Save className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
          {saving ? "Creating..." : "Create Field"}
        </Button>
      </div>
    </Modal>
  );
}
