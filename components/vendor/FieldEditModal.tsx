"use client";

/**
 * FieldEditModal - Clean modal for editing field properties
 * Matches FieldVisibilityModal design theme
 */

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Modal, Button, ds, cn } from "@/components/ds";

import { logger } from "@/lib/logger";

interface FieldEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  fieldSlug: string;
  fieldDescription?: string;
  onSave: (data: { name: string; description: string }) => Promise<void>;
}

export function FieldEditModal({
  isOpen,
  onClose,
  fieldName,
  fieldSlug,
  fieldDescription = "",
  onSave,
}: FieldEditModalProps) {
  const [formData, setFormData] = useState({
    name: fieldName,
    description: fieldDescription,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: fieldName,
        description: fieldDescription,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to save:", error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Field: ${fieldSlug}`} size="md">
      <div className="space-y-3 mb-6">
        <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
          Modify the display name and description for this field
        </p>

        {/* Field Name */}
        <div>
          <label
            className={cn(
              "block mb-2",
              ds.typography.size.micro,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.colors.text.quaternary
            )}
          >
            Display Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Field display name"
            className={cn(
              "w-full p-3 rounded-lg border transition-all",
              ds.colors.bg.elevated,
              ds.colors.border.default,
              "hover:bg-white/10",
              "focus:outline-none focus:ring-2 focus:ring-white/20",
              ds.typography.size.xs,
              "text-white/90"
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label
            className={cn(
              "block mb-2",
              ds.typography.size.micro,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.colors.text.quaternary
            )}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
            className={cn(
              "w-full p-3 rounded-lg border transition-all resize-none",
              ds.colors.bg.elevated,
              ds.colors.border.default,
              "hover:bg-white/10",
              "focus:outline-none focus:ring-2 focus:ring-white/20",
              ds.typography.size.xs,
              "text-white/90"
            )}
          />
        </div>

        {/* Info box */}
        <div
          className={cn(
            "p-3 rounded-lg",
            ds.colors.bg.elevated,
            ds.colors.border.default,
            "border"
          )}
        >
          <p className={cn(ds.typography.size.xs, "text-white/70")}>
            💡 Field slug ({fieldSlug}) cannot be changed as it's used for data storage
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
            "hover:text-white/80",
            "focus:outline-none focus:ring-2 focus:ring-white/20"
          )}
        >
          Cancel
        </button>

        <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
          <Save className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Modal>
  );
}
