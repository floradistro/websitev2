"use client";

/**
 * ProductQuickView - Comprehensive Product Editor Modal
 * Full-featured inline editing without needing separate page
 * Includes: Basic Info, Pricing Tiers, Templates, Images, Custom Fields
 */

import { useState, useEffect } from "react";
import {
  X,
  Save,
  Trash2,
  Plus,
  Sparkles,
  Image as ImageIcon,
  DollarSign,
  Layers,
} from "lucide-react";
import { showNotification, showConfirm } from "@/components/NotificationToast";
import { Button, Input, Textarea, Modal, ds, cn } from "@/components/ds";
import PricingPanel from "@/app/vendor/products/new/components/PricingPanel";
import axios from "axios";
import type { PricingTemplate, PricingTier } from "@/lib/types/product";

import { logger } from "@/lib/logger";
interface ProductQuickViewProps {
  product: any;
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function ProductQuickView({
  product,
  vendorId,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ProductQuickViewProps) {
  const [editedProduct, setEditedProduct] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"basic" | "pricing" | "images" | "fields">(
    "basic",
  );

  // Pricing state
  const [pricingMode, setPricingMode] = useState<"single" | "tiered">("single");
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [newTierWeight, setNewTierWeight] = useState("");
  const [newTierQty, setNewTierQty] = useState("");
  const [newTierPrice, setNewTierPrice] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState<PricingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Image state - CLEAN REWRITE
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen && product?.id) {
      setLoading(true);

      // Fetch product details
      axios
        .get(`/api/vendor/products/${product.id}`, {
          headers: { "x-vendor-id": vendorId },
        })
        .then((response) => {
          if (response.data.success) {
            const p = response.data.product;
            setEditedProduct({
              name: p.name || "",
              sku: p.sku || "",
              regular_price: p.regular_price || p.price || 0,
              cost_price: p.cost_price || 0,
              description: p.description || "",
              status: p.status || "draft",
              category_id: p.category_id || "",
            });

            // Set custom fields
            setCustomFieldValues(p.custom_fields || {});

            // Set pricing mode from API response
            setPricingMode(p.pricing_mode || "single");

            // Set pricing template ID if present
            if (p.pricing_template_id) {
              setSelectedTemplateId(p.pricing_template_id);
            }

            // Load pricing tiers if applicable
            if (p.pricing_tiers && p.pricing_tiers.length > 0) {
              setPricingTiers(
                p.pricing_tiers.map((tier: any) => ({
                  weight: tier.label || `${tier.quantity}${tier.unit}`,
                  qty: tier.quantity || tier.min_quantity || 1,
                  price: tier.price?.toString() || "0",
                })),
              );
            } else {
              setPricingTiers([]);
            }

            // Load current image - CLEAN REWRITE
            if (p.images && p.images.length > 0) {
              setCurrentImageUrl(p.images[0]);
            } else {
              setCurrentImageUrl(null);
            }

            // Fetch dynamic fields for category
            if (p.category_id) {
              axios
                .get(`/api/vendor/product-fields?category_id=${p.category_id}`, {
                  headers: { "x-vendor-id": vendorId },
                })
                .then((fieldsResponse) => {
                  if (fieldsResponse.data.success) {
                    setDynamicFields(fieldsResponse.data.fields || []);
                  }
                })
                .catch((error) => {
                  if (process.env.NODE_ENV === "development") {
                    logger.error("Failed to fetch fields:", error);
                  }
                });
            }
          }
        })
        .catch((error) => {
          showNotification({
            type: "error",
            title: "Load Failed",
            message: "Failed to load product details",
          });
        })
        .finally(() => setLoading(false));

      // Fetch pricing templates
      axios
        .get("/api/vendor/pricing-templates", {
          headers: { "x-vendor-id": vendorId },
        })
        .then((response) => {
          if (response.data.success) {
            const templates = response.data.blueprints || [];

            // Filter templates by product category
            const filteredTemplates = templates.filter((template: PricingTemplate) => {
              const applicableCategories = template.applicable_to_categories || [];

              // If no category restrictions, show it
              if (applicableCategories.length === 0) return true;

              // If product has no category, show all templates
              if (!product.category_id) return true;

              // Show if product's category is in the applicable list
              return applicableCategories.includes(product.category_id);
            });

            setAvailableTemplates(filteredTemplates);
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            logger.error("Failed to fetch templates:", error);
          }
        });
    }
  }, [isOpen, product?.id, vendorId]);

  // CLEAN REWRITE: Simple image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      // Upload to Supabase
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "product");

      const uploadRes = await fetch("/api/supabase/vendor/upload", {
        method: "POST",
        headers: { "x-vendor-id": vendorId },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Extract storage path from full URL
      // Full URL: https://.../storage/v1/object/public/vendor-product-images/vendorId/file.png
      // We want: vendor-product-images/vendorId/file.png
      const fullUrl = uploadData.file.url;
      const storagePath = fullUrl.includes("/storage/v1/object/public/")
        ? fullUrl.split("/storage/v1/object/public/")[1]
        : fullUrl;

      // Immediately update product in database with storage path (not full URL)
      const updateRes = await axios.put(
        `/api/vendor/products/${product.id}`,
        { featured_image_storage: storagePath },
        { headers: { "x-vendor-id": vendorId } },
      );

      if (updateRes.data.success) {
        setCurrentImageUrl(storagePath);
        showNotification({
          type: "success",
          title: "Image Updated",
          message: "Product image uploaded successfully",
        });
        onSave(); // Refresh product list
      }
    } catch (error) {
      logger.error("Image upload error:", error);
      showNotification({
        type: "error",
        title: "Upload Failed",
        message: error instanceof Error ? error.message : "Failed to upload image",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // CLEAN REWRITE: Simple image remove handler
  const handleImageRemove = async () => {
    try {
      const updateRes = await axios.put(
        `/api/vendor/products/${product.id}`,
        { featured_image_storage: "" },
        { headers: { "x-vendor-id": vendorId } },
      );

      if (updateRes.data.success) {
        setCurrentImageUrl(null);
        showNotification({
          type: "success",
          title: "Image Removed",
          message: "Product image removed successfully",
        });
        onSave(); // Refresh product list
      }
    } catch (error) {
      logger.error("Image remove error:", error);
      showNotification({
        type: "error",
        title: "Remove Failed",
        message: "Failed to remove image",
      });
    }
  };

  const handleNewTierChange = (field: "weight" | "qty" | "price", value: string) => {
    if (field === "weight") setNewTierWeight(value);
    else if (field === "qty") setNewTierQty(value);
    else if (field === "price") setNewTierPrice(value);
  };

  const handleAddTier = () => {
    if (!newTierQty || !newTierPrice) return;

    setPricingTiers([
      ...pricingTiers,
      {
        weight: newTierWeight,
        qty: parseInt(newTierQty) || 1,
        price: newTierPrice,
      },
    ]);

    setNewTierWeight("");
    setNewTierQty("");
    setNewTierPrice("");
  };

  const handleUpdateTier = (index: number, field: string, value: string) => {
    setPricingTiers(
      pricingTiers.map((tier, i) => {
        if (i === index) {
          if (field === "qty") return { ...tier, qty: parseInt(value) || 1 };
          return { ...tier, [field]: value };
        }
        return tier;
      }),
    );
  };

  const handleRemoveTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      showNotification({
        type: "warning",
        title: "No Template Selected",
        message: "Please select a pricing template first",
      });
      return;
    }

    const template = availableTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) {
      showNotification({
        type: "error",
        title: "Template Not Found",
        message: "Selected template could not be found",
      });
      return;
    }

    try {
      // Templates now store the configured prices in default_tiers
      // The API transforms default_tiers to price_breaks format with prices included
      const tiers: PricingTier[] = template.price_breaks
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((priceBreak) => ({
          weight: priceBreak.label,
          qty: priceBreak.qty,
          price: priceBreak.price?.toString() || "", // Use template's configured price
        }));

      setPricingTiers(tiers);
      setPricingMode("tiered");

      showNotification({
        type: "success",
        title: "Template Applied",
        message: `${template.name} pricing tiers loaded`,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to apply pricing template:", error);
      }
      showNotification({
        type: "error",
        title: "Failed to Apply Template",
        message: "Could not load pricing configuration",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        ...editedProduct,
        pricing_mode: pricingMode,
        custom_fields: customFieldValues,
      };

      // Add pricing data
      if (pricingMode === "single") {
        updateData.price = parseFloat(editedProduct.regular_price);
        updateData.regular_price = parseFloat(editedProduct.regular_price);
      } else {
        updateData.pricing_tiers = pricingTiers;
      }

      // Add template ID if selected
      if (selectedTemplateId) {
        updateData.pricing_template_id = selectedTemplateId;
      }

      // Image is already updated via handleImageUpload, no need to send here

      const response = await axios.put(`/api/vendor/products/${product.id}`, updateData, {
        headers: { "x-vendor-id": vendorId },
      });

      if (response.data.success) {
        showNotification({
          type: "success",
          title: "Saved",
          message: "Product updated successfully",
        });
        onSave();
        onClose();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Save Failed",
        message: error.response?.data?.error || "Failed to save product",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: "Delete Product",
      message: `Delete "${product.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/vendor/products/${product.id}`, {
          headers: { "x-vendor-id": vendorId },
        });
        showNotification({
          type: "success",
          title: "Deleted",
          message: "Product deleted successfully",
        });
        onDelete();
        onClose();
      } catch (error: any) {
        showNotification({
          type: "error",
          title: "Delete Failed",
          message: error.response?.data?.error || "Failed to delete product",
        });
      }
    }
  };

  const hasChanges = Object.keys(editedProduct).length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product" size="xl">
      {loading ? (
        <div className="py-12 text-center">
          <div
            className={cn(
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
            )}
          >
            Loading...
          </div>
        </div>
      ) : (
        <>
          {/* Header with status badge */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={cn(
                  ds.typography.size.base,
                  ds.typography.weight.medium,
                  "text-white/90",
                )}
              >
                {product.name}
              </h2>
              <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mt-0.5")}>
                SKU: {product.sku}
              </p>
            </div>
            <div
              className={cn(
                "px-3 py-1.5 rounded-full border",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                editedProduct.status === "published"
                  ? "bg-green-500/10 text-green-400/70 border-green-500/20"
                  : editedProduct.status === "pending"
                    ? "bg-orange-500/10 text-orange-400/70 border-orange-500/20"
                    : "bg-white/5 text-white/40 border-white/10",
              )}
            >
              {editedProduct.status}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveSection("basic")}
              className={cn(
                "px-3 sm:px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === "basic"
                  ? "border-white/60 text-white"
                  : "border-transparent text-white/40 hover:text-white/60",
              )}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveSection("pricing")}
              className={cn(
                "px-3 sm:px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === "pricing"
                  ? "border-white/60 text-white"
                  : "border-transparent text-white/40 hover:text-white/60",
              )}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveSection("images")}
              className={cn(
                "px-3 sm:px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === "images"
                  ? "border-white/60 text-white"
                  : "border-transparent text-white/40 hover:text-white/60",
              )}
            >
              Images
            </button>
            <button
              onClick={() => setActiveSection("fields")}
              className={cn(
                "px-3 sm:px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === "fields"
                  ? "border-white/60 text-white"
                  : "border-transparent text-white/40 hover:text-white/60",
              )}
            >
              Custom Fields
            </button>
          </div>

          {/* Section Content */}
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto mb-6">
            {/* Basic Info Section */}
            {activeSection === "basic" && (
              <div className="space-y-4">
                <div>
                  <label
                    className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}
                  >
                    Product Name
                  </label>
                  <Input
                    value={editedProduct.name || ""}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label
                    className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}
                  >
                    Description
                  </label>
                  <Textarea
                    value={editedProduct.description || ""}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Product description"
                    rows={4}
                  />
                </div>

                <div>
                  <label
                    className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}
                  >
                    Status
                  </label>
                  <select
                    value={editedProduct.status || "draft"}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        status: e.target.value,
                      })
                    }
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      ds.typography.size.xs,
                      ds.colors.bg.primary,
                      ds.colors.border.default,
                      "border text-white/90",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    )}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}

            {/* Pricing Section */}
            {activeSection === "pricing" && (
              <div>
                <PricingPanel
                  productType="simple"
                  pricingMode={pricingMode}
                  formData={{
                    price: editedProduct.regular_price?.toString() || "",
                    cost_price: editedProduct.cost_price?.toString() || "",
                  }}
                  pricingTiers={pricingTiers}
                  newTierWeight={newTierWeight}
                  newTierQty={newTierQty}
                  newTierPrice={newTierPrice}
                  selectedTemplateId={selectedTemplateId}
                  availableTemplates={availableTemplates}
                  onPricingModeChange={setPricingMode}
                  onFormDataChange={(data) => setEditedProduct({ ...editedProduct, ...data })}
                  onNewTierChange={handleNewTierChange}
                  onAddTier={handleAddTier}
                  onUpdateTier={handleUpdateTier}
                  onRemoveTier={handleRemoveTier}
                  onTemplateSelect={setSelectedTemplateId}
                  onApplyTemplate={handleApplyTemplate}
                />
              </div>
            )}

            {/* Images Section - CLEAN REWRITE */}
            {activeSection === "images" && (
              <div className="space-y-4">
                <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-3")}>
                  Product Image
                </label>

                {/* Current Image Display */}
                {currentImageUrl ? (
                  <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden border border-white/10 mb-4">
                    <img
                      src={currentImageUrl}
                      alt="Product"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        logger.error("Image failed to load:", currentImageUrl);
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-size='14'%3EError%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="absolute top-2 right-2 p-2 bg-black/80 rounded-full text-white/60 hover:text-red-400 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-md aspect-square rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-white/20" />
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                        No image uploaded
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <label
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isUploadingImage
                      ? "border-white/20 bg-white/5 cursor-not-allowed"
                      : "border-white/10 hover:border-white/30 hover:bg-white/5",
                  )}
                >
                  <div className="flex flex-col items-center justify-center">
                    <ImageIcon className="w-6 h-6 mb-2 text-white/40" />
                    <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                      {isUploadingImage
                        ? "Uploading..."
                        : currentImageUrl
                          ? "Replace Image"
                          : "Click to Upload Image"}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                </label>
              </div>
            )}

            {/* Custom Fields Section */}
            {activeSection === "fields" && (
              <div className="space-y-4">
                {dynamicFields.length > 0 ? (
                  dynamicFields.map((field: any) => {
                    const fieldKey = field.fieldId || field.slug || field.name;
                    return (
                      <div key={fieldKey}>
                        <label
                          className={cn(
                            ds.typography.size.xs,
                            ds.colors.text.tertiary,
                            "block mb-1.5",
                          )}
                        >
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === "textarea" ? (
                          <Textarea
                            value={customFieldValues[fieldKey] || ""}
                            onChange={(e) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [fieldKey]: e.target.value,
                              })
                            }
                            placeholder={field.placeholder}
                            rows={3}
                          />
                        ) : field.type === "select" ? (
                          <select
                            value={customFieldValues[fieldKey] || ""}
                            onChange={(e) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [fieldKey]: e.target.value,
                              })
                            }
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border",
                              ds.typography.size.xs,
                              ds.colors.bg.primary,
                              ds.colors.border.default,
                              "text-white/90 focus:outline-none focus:ring-2 focus:ring-white/10",
                            )}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={field.type}
                            value={customFieldValues[fieldKey] || ""}
                            onChange={(e) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [fieldKey]: e.target.value,
                              })
                            }
                            placeholder={field.placeholder}
                          />
                        )}
                        {field.description && (
                          <p
                            className={cn(
                              ds.typography.size.micro,
                              ds.colors.text.quaternary,
                              "mt-1",
                            )}
                          >
                            {field.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                      No custom fields available for this category
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-between pt-4 border-t"
            style={{ borderColor: ds.colors.border.default }}
          >
            <button
              onClick={handleDelete}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "text-red-400/70 hover:bg-red-500/10",
                "focus:outline-none focus:ring-2 focus:ring-red-500/50",
              )}
            >
              <Trash2 className="w-3 h-3 inline mr-1.5" />
              Delete
            </button>

            <div className="flex items-center gap-3">
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

              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                <Save className="w-3 h-3 mr-1.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
