"use client";

/**
 * FieldVisibilityModal - Clean modal for configuring field visibility
 * Modernized to match the standard Modal component design
 */

import { useState, useEffect } from "react";
import { Monitor, FileText, Tablet, Tv, Save } from "lucide-react";
import { Modal, Button, ds, cn } from "@/components/ds";

import { logger } from "@/lib/logger";
interface FieldVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  fieldSlug: string;
  categoryId: string;
  currentConfig?: {
    shop?: boolean;
    product_page?: boolean;
    pos?: boolean;
    tv_menu?: boolean;
  };
  onSave: (config: any) => Promise<void>;
}

export function FieldVisibilityModal({
  isOpen,
  onClose,
  fieldName,
  fieldSlug,
  categoryId,
  currentConfig = {},
  onSave,
}: FieldVisibilityModalProps) {
  const [config, setConfig] = useState({
    shop: currentConfig?.shop ?? true,
    product_page: currentConfig?.product_page ?? true,
    pos: currentConfig?.pos ?? true,
    tv_menu: currentConfig?.tv_menu ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig({
        shop: currentConfig?.shop ?? true,
        product_page: currentConfig?.product_page ?? true,
        pos: currentConfig?.pos ?? true,
        tv_menu: currentConfig?.tv_menu ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to save:", error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOption = (key: "shop" | "product_page" | "pos" | "tv_menu") => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const options = [
    {
      key: "shop" as const,
      label: "Shop Page",
      icon: Monitor,
      description: "Product cards in grid view",
    },
    {
      key: "product_page" as const,
      label: "Product Page",
      icon: FileText,
      description: "Individual product pages",
    },
    {
      key: "pos" as const,
      label: "POS System",
      icon: Tablet,
      description: "Point of sale interface",
    },
    {
      key: "tv_menu" as const,
      label: "TV Menu",
      icon: Tv,
      description: "Digital signage displays",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Field Visibility: ${fieldName}`} size="md">
      <div className="space-y-3 mb-6">
        <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
          Configure where this field appears in your store
        </p>

        {options.map((option) => {
          const Icon = option.icon;
          const isEnabled = config[option.key];

          return (
            <button
              key={option.key}
              onClick={() => toggleOption(option.key)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                ds.colors.bg.elevated,
                ds.colors.border.default,
                "hover:bg-white/10",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className={isEnabled ? "text-green-400" : cn(ds.colors.text.whisper)}
                />
                <div className="text-left">
                  <div className={cn(ds.typography.size.xs, "text-white/90")}>{option.label}</div>
                  <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary)}>
                    {option.description}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative flex items-center",
                  isEnabled ? "bg-green-500" : "bg-white/20",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-all absolute",
                    isEnabled ? "left-5" : "left-0.5",
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Info box */}
      <div
        className={cn(
          "p-3 rounded-lg mb-6",
          ds.colors.bg.elevated,
          ds.colors.border.default,
          "border",
        )}
      >
        <p className={cn(ds.typography.size.xs, "text-white/70")}>
          💡 Fields hidden from certain views won't appear, but their data is preserved
        </p>
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
            "focus:outline-none focus:ring-2 focus:ring-white/20",
          )}
        >
          Cancel
        </button>

        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
          {isSaving ? "Saving..." : "Save Visibility"}
        </Button>
      </div>
    </Modal>
  );
}
