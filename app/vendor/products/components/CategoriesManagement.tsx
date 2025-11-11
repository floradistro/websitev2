"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Layers, DollarSign } from "lucide-react";
import { Card, Button, ds, cn } from "@/components/ds";
import { showNotification, showConfirm } from "@/components/NotificationToast";
import { FieldVisibilityModal } from "@/components/vendor/FieldVisibilityModal";
import { FieldEditModal } from "@/components/vendor/FieldEditModal";
import { CategoryModal } from "@/components/vendor/CategoryModal";
import { CustomFieldModal } from "@/components/vendor/CustomFieldModal";
import { PricingBlueprintModal } from "@/components/vendor/PricingTemplateModal";
import type {
  Category,
  FieldGroup,
  FieldVisibilityConfig,
  DynamicField,
} from "@/lib/types/product";
import axios from "axios";

import { logger } from "@/lib/logger";
interface CategoriesManagementProps {
  vendorId: string;
}

export function CategoriesManagement({ vendorId }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [categoryPricingTiers, setCategoryPricingTiers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<{
    [key: string]: "fields" | "pricing" | null;
  }>({});

  // Field visibility modal state
  const [showFieldVisibilityModal, setShowFieldVisibilityModal] = useState(false);
  const [visibilityModalData, setVisibilityModalData] = useState<{
    fieldName: string;
    fieldSlug: string;
    categoryId: string;
    currentConfig: FieldVisibilityConfig;
  } | null>(null);

  // Field edit modal state
  const [showFieldEditModal, setShowFieldEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<{
    fieldId: string;
    fieldName: string;
    fieldSlug: string;
    fieldDescription?: string;
  } | null>(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Custom field modal state
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);

  // Pricing template modal state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [pricingTemplates, setPricingTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (vendorId) {
      loadCategories();
      loadFieldGroups();
      loadCategoryPricingTiers();
      loadPricingTemplates();
    }
  }, [vendorId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/categories?vendor_id=${vendorId}`);
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading categories:", error);
      }
      showNotification({
        type: "error",
        title: "Load Failed",
        message: "Failed to load categories",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFieldGroups = async () => {
    try {
      const response = await axios.get(`/api/vendor/product-fields`, {
        headers: { "x-vendor-id": vendorId },
      });
      if (response.data.success) {
        const fieldGroups = (response.data.fields || []).map((field: unknown) => {
          const f = field as Record<string, unknown>;
          return {
            id: String(f.id || ""),
            vendor_id: vendorId,
            name: String(f.label || (f.definition as Record<string, unknown>)?.label || "Unnamed"),
            slug: String(f.fieldId || f.slug || ""),
            description: String(
              f.description || (f.definition as Record<string, unknown>)?.description || "",
            ),
            fields: [field] as unknown as DynamicField[],
            is_active: true,
            category_id: f.categoryId as string | undefined,
          } as FieldGroup;
        });
        setFieldGroups(fieldGroups);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading field groups:", error);
      }
    }
  };

  const loadCategoryPricingTiers = async () => {
    try {
      const response = await axios.get(
        `/api/vendor/category-pricing-tiers?vendor_id=${vendorId}`
      );
      if (response.data.success) {
        if (process.env.NODE_ENV === "development") {
          logger.info("[CategoriesManagement] Loaded pricing tiers:", response.data.tiers);
          logger.info("[CategoriesManagement] Beverages tiers:", response.data.tiers?.Beverages);
        }
        setCategoryPricingTiers(response.data.tiers || {});
        if (process.env.NODE_ENV === "development") {
          // Log after state update (will show in next render)
          logger.info("[CategoriesManagement] State set with keys:", Object.keys(response.data.tiers || {}));
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading category pricing tiers:", error);
      }
    }
  };

  const loadPricingTemplates = async () => {
    try {
      const response = await axios.get(`/api/vendor/pricing-templates`);
      if (response.data.success) {
        setPricingTemplates(response.data.blueprints || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading pricing templates:", error);
      }
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: "Delete Category",
      message: `Delete "${name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      try {
        const response = await axios.delete(`/api/categories/${id}`);
        if (response.data.success) {
          showNotification({
            type: "success",
            title: "Category Deleted",
            message: "Category deleted successfully",
          });
          loadCategories();
        }
      } catch (error) {
        const err = error as { response?: { data?: { error?: string } } };
        showNotification({
          type: "error",
          title: "Delete Failed",
          message: err.response?.data?.error || "Failed to delete category",
        });
      }
    }
  };

  const openFieldVisibilityModal = (categoryId: string, fieldSlug: string, fieldName: string) => {
    const category = categories.find((c) => c.id === categoryId);
    const defaultConfig: FieldVisibilityConfig = {
      shop: true,
      product_page: true,
      pos: true,
      tv_menu: true,
    };
    setVisibilityModalData({
      categoryId,
      fieldSlug,
      fieldName,
      currentConfig: category?.field_visibility?.[fieldSlug] || defaultConfig,
    });
    setShowFieldVisibilityModal(true);
  };

  const handleFieldVisibilitySave = async (config: FieldVisibilityConfig) => {
    if (!visibilityModalData) return;

    try {
      const response = await axios.put(
        `/api/categories/${visibilityModalData.categoryId}/field-visibility`,
        {
          fieldSlug: visibilityModalData.fieldSlug,
          config,
        },
      );

      if (response.data.success) {
        showNotification({
          type: "success",
          title: "Visibility Updated",
          message: "Field visibility configuration saved",
        });
        loadCategories();
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showNotification({
        type: "error",
        title: "Save Failed",
        message: err.response?.data?.error || "Failed to save configuration",
      });
    }
  };

  const openFieldEditModal = (fieldGroup: FieldGroup) => {
    setEditModalData({
      fieldId: fieldGroup.id,
      fieldName: fieldGroup.name,
      fieldSlug: fieldGroup.slug,
      fieldDescription: fieldGroup.description,
    });
    setShowFieldEditModal(true);
  };

  const handleFieldEditSave = async (data: { name: string; description: string }) => {
    if (!editModalData) return;

    try {
      const response = await axios.put(`/api/vendor/product-fields/${editModalData.fieldId}`, data, {
        headers: { "x-vendor-id": vendorId },
      });

      if (response.data.success) {
        showNotification({
          type: "success",
          title: "Field Updated",
          message: "Field details have been saved",
        });
        loadFieldGroups();
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showNotification({
        type: "error",
        title: "Save Failed",
        message: err.response?.data?.error || "Failed to save field",
      });
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleSection = (categoryId: string, section: "fields" | "pricing") => {
    setExpandedSection((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === section ? null : section,
    }));
  };

  const vendorCategories = categories.filter((c) => c.vendor_id === vendorId);
  const parentCategories = vendorCategories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    vendorCategories.filter((c) => c.parent_id === parentId);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div
          className={cn(
            "text-white/40",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
          )}
        >
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className={cn(
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              "text-white mb-1",
              ds.typography.weight.light,
            )}
          >
            Your Categories
          </h3>
          <p
            className={cn(
              ds.colors.text.quaternary,
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
            )}
          >
            Manage product categories and custom fields
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Add Category
        </Button>
      </div>

      {parentCategories.length === 0 ? (
        <Card className="text-center py-16">
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6",
              ds.colors.bg.elevated,
            )}
          >
            <svg
              className={cn("w-10 h-10", ds.colors.text.quaternary)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h4
            className={cn(
              "text-white mb-2",
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
            )}
          >
            No Categories Yet
          </h4>
          <p
            className={cn(
              ds.colors.text.quaternary,
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              "mb-6 max-w-md mx-auto",
            )}
          >
            Create your first category to organize products
          </p>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Create First Category
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const categoryFields = fieldGroups.filter((fg) => fg.category_id === category.id);
            const isExpanded = expandedCategory === category.id;
            const currentSection = expandedSection[category.id];

            return (
              <Card key={category.id} className="overflow-hidden">
                {/* Category Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown
                          className={cn("w-4 h-4", ds.colors.text.tertiary)}
                          strokeWidth={1.5}
                        />
                      ) : (
                        <ChevronRight
                          className={cn("w-4 h-4", ds.colors.text.tertiary)}
                          strokeWidth={1.5}
                        />
                      )}
                      <div>
                        <h3
                          className={cn(
                            ds.typography.size.sm,
                            ds.typography.weight.medium,
                            "text-white/90",
                          )}
                        >
                          {category.name}
                        </h3>
                        {category.description && (
                          <p
                            className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mt-0.5")}
                          >
                            {category.description}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors text-white/60 hover:text-white/90 hover:bg-white/10",
                        )}
                        title="Edit"
                        aria-label="Edit category"
                      >
                        <Edit2 size={14} strokeWidth={1} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className={cn(
                          "p-2 rounded-lg transition-colors text-white/50 hover:text-white/80 hover:bg-white/10",
                        )}
                        title="Delete"
                        aria-label="Delete category"
                      >
                        <Trash2 size={14} strokeWidth={1} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories count */}
                  {subcategories.length > 0 && (
                    <div
                      className={cn("mt-2 ml-7", ds.typography.size.xs, ds.colors.text.quaternary)}
                    >
                      {subcategories.length} subcategor
                      {subcategories.length === 1 ? "y" : "ies"}
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    {/* Section Buttons */}
                    <div className={cn("flex gap-2 px-4 py-3 border-t", ds.colors.border.default)}>
                      <button
                        onClick={() => toggleSection(category.id, "fields")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-colors",
                          ds.typography.size.xs,
                          ds.typography.transform.uppercase,
                          ds.typography.tracking.wide,
                          ds.typography.weight.light,
                          currentSection === "fields"
                            ? cn(ds.colors.bg.active, "text-white/80")
                            : cn(
                                ds.colors.bg.elevated,
                                ds.colors.text.tertiary,
                                `hover:${ds.colors.bg.hover}`,
                                "hover:text-white/80",
                              ),
                        )}
                      >
                        <Layers size={12} className="inline mr-1.5" strokeWidth={1.5} />
                        Fields ({categoryFields.length})
                      </button>
                      <button
                        onClick={() => toggleSection(category.id, "pricing")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-colors",
                          ds.typography.size.xs,
                          ds.typography.transform.uppercase,
                          ds.typography.tracking.wide,
                          ds.typography.weight.light,
                          currentSection === "pricing"
                            ? cn(ds.colors.bg.active, "text-white/80")
                            : cn(
                                ds.colors.bg.elevated,
                                ds.colors.text.tertiary,
                                `hover:${ds.colors.bg.hover}`,
                                "hover:text-white/80",
                              ),
                        )}
                      >
                        <DollarSign size={12} className="inline mr-1.5" strokeWidth={1.5} />
                        Pricing Tiers ({pricingTemplates.filter(t =>
                          t.applicable_to_categories?.includes(category.id) ||
                          t.category_id === category.id
                        ).length})
                      </button>
                    </div>

                    {/* Fields Section */}
                    {currentSection === "fields" && (
                      <div className="px-4 py-3 bg-black/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4
                            className={cn(
                              "text-white/60",
                              ds.typography.size.xs,
                              ds.typography.transform.uppercase,
                              ds.typography.tracking.wide,
                              ds.typography.weight.light,
                            )}
                          >
                            Custom Fields for {category.name}
                          </h4>
                          <button
                            onClick={() => setShowCustomFieldModal(true)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg transition-colors",
                              ds.colors.bg.elevated,
                              "hover:bg-white/10",
                              "border",
                              ds.colors.border.default,
                              "text-white",
                              ds.typography.size.xs,
                              ds.typography.transform.uppercase,
                              ds.typography.tracking.wide,
                              ds.typography.weight.light,
                              "flex items-center gap-1.5",
                            )}
                          >
                            <Plus size={12} strokeWidth={1.5} />
                            Create Field
                          </button>
                        </div>
                        {categoryFields.length === 0 ? (
                          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                            No custom fields assigned to this category
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {categoryFields.map((fieldGroup) => (
                              <div
                                key={fieldGroup.id}
                                className={cn(
                                  "p-3 rounded-lg",
                                  ds.colors.bg.elevated,
                                  "flex items-center justify-between",
                                )}
                              >
                                <div>
                                  <div className={cn(ds.typography.size.xs, "text-white/80")}>
                                    {fieldGroup.name}
                                  </div>
                                  {fieldGroup.description && (
                                    <div
                                      className={cn(
                                        ds.typography.size.micro,
                                        ds.colors.text.quaternary,
                                        "mt-0.5",
                                      )}
                                    >
                                      {fieldGroup.description}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openFieldEditModal(fieldGroup)}
                                    className={cn(
                                      "px-2 py-1 rounded text-[9px]",
                                      ds.typography.transform.uppercase,
                                      ds.typography.tracking.wide,
                                      ds.colors.bg.hover,
                                      "text-white/70 hover:text-white/90",
                                    )}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      openFieldVisibilityModal(
                                        category.id,
                                        fieldGroup.slug,
                                        fieldGroup.name,
                                      )
                                    }
                                    className={cn(
                                      "px-2 py-1 rounded text-[9px]",
                                      ds.typography.transform.uppercase,
                                      ds.typography.tracking.wide,
                                      ds.colors.bg.hover,
                                      "text-white/70 hover:text-white/90",
                                    )}
                                  >
                                    Configure
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Templates Section */}
                    {currentSection === "pricing" && (
                      <div className="px-4 py-3 bg-black/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4
                            className={cn(
                              "text-white/60",
                              ds.typography.size.xs,
                              ds.typography.transform.uppercase,
                              ds.typography.tracking.wide,
                              ds.typography.weight.light,
                            )}
                          >
                            Pricing Templates for {category.name}
                          </h4>
                          <button
                            onClick={() => {
                              setEditingTemplate(null);
                              setShowPricingModal(true);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg transition-colors",
                              ds.colors.bg.elevated,
                              "hover:bg-white/10",
                              "border",
                              ds.colors.border.default,
                              "text-white",
                              ds.typography.size.xs,
                              ds.typography.transform.uppercase,
                              ds.typography.tracking.wide,
                              ds.typography.weight.light,
                              "flex items-center gap-1.5",
                            )}
                          >
                            <Plus size={12} strokeWidth={1.5} />
                            Create Template
                          </button>
                        </div>
                        {pricingTemplates.filter(t =>
                          t.applicable_to_categories?.includes(category.id) ||
                          t.category_id === category.id
                        ).length === 0 ? (
                          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                            No pricing templates configured for this category
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {pricingTemplates
                              .filter(t =>
                                t.applicable_to_categories?.includes(category.id) ||
                                t.category_id === category.id
                              )
                              .map((template) => (
                                <div
                                  key={typeof template.id === 'object' ? JSON.stringify(template.id) : template.id}
                                  className={cn(
                                    "p-3 rounded-lg",
                                    ds.colors.bg.elevated,
                                    "flex flex-col gap-3",
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className={cn(ds.typography.size.xs, "text-white/80")}>
                                        {template.name}
                                      </div>
                                      {template.description && (
                                        <div
                                          className={cn(
                                            ds.typography.size.micro,
                                            ds.colors.text.quaternary,
                                            "mt-0.5",
                                          )}
                                        >
                                          {template.description}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingTemplate(template);
                                        setShowPricingModal(true);
                                      }}
                                      className={cn(
                                        "px-2 py-1 rounded text-[9px]",
                                        ds.typography.transform.uppercase,
                                        ds.typography.tracking.wide,
                                        ds.colors.bg.hover,
                                        "text-white/70 hover:text-white/90",
                                      )}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {template.price_breaks?.map((tier: any, idx: number) => (
                                      <div
                                        key={tier.break_id || `tier-${idx}`}
                                        className={cn(
                                          "px-2 py-1 rounded text-[10px]",
                                          ds.colors.bg.hover,
                                          "text-white/70",
                                        )}
                                      >
                                        <span className="font-medium">{tier.label}:</span>{" "}
                                        ${tier.price?.toFixed(2) || "—"}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Field Visibility Modal */}
      <FieldVisibilityModal
        isOpen={showFieldVisibilityModal}
        onClose={() => {
          setShowFieldVisibilityModal(false);
          setVisibilityModalData(null);
        }}
        fieldName={visibilityModalData?.fieldName || ""}
        fieldSlug={visibilityModalData?.fieldSlug || ""}
        categoryId={visibilityModalData?.categoryId || ""}
        currentConfig={visibilityModalData?.currentConfig}
        onSave={handleFieldVisibilitySave}
      />

      {/* Field Edit Modal */}
      <FieldEditModal
        isOpen={showFieldEditModal}
        onClose={() => {
          setShowFieldEditModal(false);
          setEditModalData(null);
        }}
        fieldName={editModalData?.fieldName || ""}
        fieldSlug={editModalData?.fieldSlug || ""}
        fieldDescription={editModalData?.fieldDescription}
        onSave={handleFieldEditSave}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={() => {
          loadCategories();
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        vendorId={vendorId}
        category={editingCategory}
        categories={categories}
      />

      {/* Custom Field Modal */}
      <CustomFieldModal
        isOpen={showCustomFieldModal}
        onClose={() => setShowCustomFieldModal(false)}
        onSave={() => {
          loadFieldGroups();
          setShowCustomFieldModal(false);
        }}
        vendorId={vendorId}
        categories={categories}
      />

      {/* Pricing Template Modal */}
      {showPricingModal && (
        <PricingBlueprintModal
          isOpen={showPricingModal}
          onClose={() => {
            setShowPricingModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            loadPricingTemplates();
            loadCategoryPricingTiers();
          }}
          vendorId={vendorId}
          blueprint={editingTemplate}
          categories={categories}
        />
      )}
    </div>
  );
}
