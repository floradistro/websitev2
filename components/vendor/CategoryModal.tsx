"use client";

/**
 * CategoryModal - Clean modal for creating/editing categories
 * Jobs-worthy simplicity: Name, description, parent category. Done.
 */

import { useState, useEffect } from "react";
import { Save, Folder } from "lucide-react";
import { showNotification } from "@/components/NotificationToast";
import { Button, Input, Textarea, Modal, ds, cn } from "@/components/ds";
import axios from "axios";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vendorId: string;
  category?: any; // If provided, we're editing; otherwise creating
  categories: any[]; // For parent selection
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  vendorId,
  category,
  categories,
}: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
  });
  const [saving, setSaving] = useState(false);

  const isEditing = !!category;

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || "",
          description: category.description || "",
          parent_id: category.parent_id || "",
        });
      } else {
        setFormData({ name: "", description: "", parent_id: "" });
      }
    }
  }, [isOpen, category]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showNotification({
        type: "error",
        title: "Validation Error",
        message: "Category name is required",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id || null,
      };

      if (isEditing) {
        // Update existing category
        await axios.put(`/api/categories/${category.id}`, payload, {
          headers: { "x-vendor-id": vendorId },
        });
      } else {
        // Create new category
        await axios.post("/api/categories", payload, {
          headers: { "x-vendor-id": vendorId },
        });
      }

      showNotification({
        type: "success",
        title: isEditing ? "Category Updated" : "Category Created",
        message: `${formData.name} has been ${isEditing ? "updated" : "created"} successfully`,
      });

      onSave();
      onClose();
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Save Failed",
        message:
          error.response?.data?.error || `Failed to ${isEditing ? "update" : "create"} category`,
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter out current category and its children when selecting parent
  const availableParents = categories.filter((c) => {
    if (!c.vendor_id) return false; // Only show vendor's own categories as parents
    if (isEditing && c.id === category.id) return false; // Can't be its own parent
    if (isEditing && c.parent_id === category.id) return false; // Can't select its own children
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Create Category"}
      size="md"
    >
      <div className="space-y-4 mb-6">
        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Category Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Edibles, Pre-Rolls, Flower"
            autoFocus
          />
        </div>

        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description for this category"
            rows={3}
          />
        </div>

        <div>
          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
            Parent Category (Optional)
          </label>
          <select
            value={formData.parent_id}
            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              ds.typography.size.xs,
              ds.colors.bg.primary,
              ds.colors.border.default,
              "border text-white/90",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
            )}
          >
            <option value="">No parent (top-level category)</option>
            {availableParents
              .filter((c) => !c.parent_id) // Only show top-level categories as parents
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1.5")}>
            Create nested categories (e.g., Flower → Indica)
          </p>
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
          <Folder
            className={cn("w-4 h-4 flex-shrink-0 mt-0.5", ds.colors.icon.blue)}
            strokeWidth={1.5}
          />
          <div>
            <p className={cn(ds.typography.size.xs, "text-white/80")}>
              Categories help organize your products
            </p>
            <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-0.5")}>
              You can assign custom fields and pricing rules to categories after creation
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

        <Button onClick={handleSubmit} disabled={saving || !formData.name.trim()}>
          <Save className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
          {saving ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </Modal>
  );
}
