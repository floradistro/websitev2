'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Layers, DollarSign } from 'lucide-react';
import { Card, Button, ds, cn } from '@/components/ds';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { PricingBlueprintModal } from '@/components/vendor/PricingBlueprintModal';
import { FieldVisibilityModal } from '@/components/vendor/FieldVisibilityModal';
import { CategoryModal } from '@/components/vendor/CategoryModal';
import { CustomFieldModal } from '@/components/vendor/CustomFieldModal';
import type { Category, FieldGroup, PricingBlueprint, FieldVisibilityConfig, DynamicField } from '@/lib/types/product';
import axios from 'axios';

interface CategoriesManagementProps {
  vendorId: string;
}

export function CategoriesManagement({ vendorId }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [pricingBlueprints, setPricingBlueprints] = useState<PricingBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<{[key: string]: 'fields' | 'pricing' | null}>({});

  // Pricing modal state
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPricingBlueprint, setSelectedPricingBlueprint] = useState<PricingBlueprint | null>(null);

  // Field visibility modal state
  const [showFieldVisibilityModal, setShowFieldVisibilityModal] = useState(false);
  const [visibilityModalData, setVisibilityModalData] = useState<{
    fieldName: string;
    fieldSlug: string;
    categoryId: string;
    currentConfig: FieldVisibilityConfig;
  } | null>(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Custom field modal state
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);

  useEffect(() => {
    if (vendorId) {
      loadCategories();
      loadFieldGroups();
      loadPricingBlueprints();
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
      console.error('Error loading categories:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load categories'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFieldGroups = async () => {
    try {
      const response = await axios.get(`/api/vendor/product-fields`, {
        headers: { 'x-vendor-id': vendorId }
      });
      if (response.data.success) {
        const fieldGroups = (response.data.fields || []).map((field: unknown) => {
          const f = field as Record<string, unknown>;
          return {
            id: String(f.id || ''),
            vendor_id: vendorId,
            name: String(f.label || (f.definition as Record<string, unknown>)?.label || 'Unnamed'),
            slug: String(f.fieldId || f.slug || ''),
            description: String(f.description || (f.definition as Record<string, unknown>)?.description || ''),
            fields: [field] as unknown as DynamicField[],
            is_active: true,
            category_id: f.categoryId as string | undefined
          } as FieldGroup;
        });
        setFieldGroups(fieldGroups);
      }
    } catch (error) {
      console.error('Error loading field groups:', error);
    }
  };

  const loadPricingBlueprints = async () => {
    try {
      const response = await axios.get('/api/vendor/pricing-blueprints', {
        headers: { 'x-vendor-id': vendorId }
      });
      if (response.data.success) {
        setPricingBlueprints(response.data.blueprints || []);
      }
    } catch (error) {
      console.error('Error loading pricing blueprints:', error);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Category',
      message: `Delete "${name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        const response = await axios.delete(`/api/categories/${id}`);
        if (response.data.success) {
          showNotification({
            type: 'success',
            title: 'Category Deleted',
            message: 'Category deleted successfully'
          });
          loadCategories();
        }
      } catch (error) {
        const err = error as { response?: { data?: { error?: string } } };
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: err.response?.data?.error || 'Failed to delete category'
        });
      }
    }
  };

  const openFieldVisibilityModal = (categoryId: string, fieldSlug: string, fieldName: string) => {
    const category = categories.find(c => c.id === categoryId);
    const defaultConfig: FieldVisibilityConfig = {
      shop: true,
      product_page: true,
      pos: true,
      tv_menu: true
    };
    setVisibilityModalData({
      categoryId,
      fieldSlug,
      fieldName,
      currentConfig: category?.field_visibility?.[fieldSlug] || defaultConfig
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
          config
        }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Visibility Updated',
          message: 'Field visibility configuration saved'
        });
        loadCategories();
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.error || 'Failed to save configuration'
      });
    }
  };

  const openCreatePricingModal = () => {
    setSelectedPricingBlueprint(null);
    setIsPricingModalOpen(true);
  };

  const openEditPricingModal = (blueprint: PricingBlueprint) => {
    setSelectedPricingBlueprint(blueprint);
    setIsPricingModalOpen(true);
  };

  const handlePricingSave = () => {
    loadPricingBlueprints();
    setIsPricingModalOpen(false);
  };

  const handlePricingDelete = async (blueprint: PricingBlueprint) => {
    const confirmed = await showConfirm({
      title: 'Delete Pricing Rule',
      message: `Delete "${blueprint.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/vendor/pricing-blueprints/${blueprint.id}`, {
          method: 'DELETE',
          headers: { 'x-vendor-id': vendorId }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          showNotification({
            type: 'success',
            title: 'Rule Deleted',
            message: 'Pricing rule deleted successfully'
          });
          loadPricingBlueprints();
        } else {
          throw new Error(data.error || 'Failed to delete');
        }
      } catch (error) {
        const err = error as { message?: string };
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: err.message || 'Failed to delete pricing rule'
        });
      }
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleSection = (categoryId: string, section: 'fields' | 'pricing') => {
    setExpandedSection(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] === section ? null : section
    }));
  };

  const vendorCategories = categories.filter(c => c.vendor_id === vendorId);
  const parentCategories = vendorCategories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => vendorCategories.filter(c => c.parent_id === parentId);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className={cn("text-white/40", ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, "text-white mb-1", ds.typography.weight.light)}>
            Your Categories
          </h3>
          <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
            Manage product categories, custom fields, and pricing rules
          </p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Add Category
        </Button>
      </div>

      {parentCategories.length === 0 ? (
        <Card className="text-center py-16">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6", ds.colors.bg.elevated)}>
            <svg className={cn("w-10 h-10", ds.colors.text.quaternary)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h4 className={cn("text-white mb-2", ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>
            No Categories Yet
          </h4>
          <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-6 max-w-md mx-auto")}>
            Create your first category to organize products
          </p>
          <Button onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Create First Category
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const categoryFields = fieldGroups.filter(fg => fg.category_id === category.id);
            const categoryPricing = pricingBlueprints.filter(b =>
              b.vendor_id === vendorId &&
              b.applicable_to_categories &&
              b.applicable_to_categories.includes(category.id)
            );
            const isExpanded = expandedCategory === category.id;
            const currentSection = expandedSection[category.id];

            return (
              <Card key={category.id} className="overflow-hidden">
                {/* Category Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className={cn("w-4 h-4", ds.colors.text.tertiary)} strokeWidth={1.5} />
                      ) : (
                        <ChevronRight className={cn("w-4 h-4", ds.colors.text.tertiary)} strokeWidth={1.5} />
                      )}
                      <div>
                        <h3 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90")}>
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mt-0.5")}>
                            {category.description}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }}
                        className={cn("p-2 rounded-lg transition-colors", ds.colors.icon.blue, "hover:bg-blue-500/10")}
                        title="Edit"
                      >
                        <Edit2 size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className={cn("p-2 rounded-lg transition-colors", ds.colors.icon.red, "hover:bg-red-500/10")}
                        title="Delete"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories count */}
                  {subcategories.length > 0 && (
                    <div className={cn("mt-2 ml-7", ds.typography.size.xs, ds.colors.text.quaternary)}>
                      {subcategories.length} subcategor{subcategories.length === 1 ? 'y' : 'ies'}
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    {/* Section Buttons */}
                    <div className={cn("flex gap-2 px-6 pb-4 border-t", ds.colors.border.default)}>
                      <button
                        onClick={() => toggleSection(category.id, 'fields')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-colors",
                          ds.typography.size.xs,
                          ds.typography.transform.uppercase,
                          ds.typography.tracking.wide,
                          ds.typography.weight.light,
                          currentSection === 'fields'
                            ? cn(ds.colors.bg.active, "text-white/80")
                            : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
                        )}
                      >
                        <Layers size={12} className="inline mr-1.5" strokeWidth={1.5} />
                        Fields ({categoryFields.length})
                      </button>
                      <button
                        onClick={() => toggleSection(category.id, 'pricing')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-colors",
                          ds.typography.size.xs,
                          ds.typography.transform.uppercase,
                          ds.typography.tracking.wide,
                          ds.typography.weight.light,
                          currentSection === 'pricing'
                            ? cn(ds.colors.bg.active, "text-white/80")
                            : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
                        )}
                      >
                        <DollarSign size={12} className="inline mr-1.5" strokeWidth={1.5} />
                        Pricing ({categoryPricing.length})
                      </button>
                    </div>

                    {/* Fields Section */}
                    {currentSection === 'fields' && (
                      <div className="px-6 py-4 bg-black/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={cn("text-white/60", ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>
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
                              "flex items-center gap-1.5"
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
                                className={cn("p-3 rounded-lg", ds.colors.bg.elevated, "flex items-center justify-between")}
                              >
                                <div>
                                  <div className={cn(ds.typography.size.xs, "text-white/80")}>{fieldGroup.name}</div>
                                  {fieldGroup.description && (
                                    <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-0.5")}>
                                      {fieldGroup.description}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => openFieldVisibilityModal(category.id, fieldGroup.slug, fieldGroup.name)}
                                  className={cn(
                                    "px-2 py-1 rounded text-[9px]",
                                    ds.typography.transform.uppercase,
                                    ds.typography.tracking.wide,
                                    ds.colors.bg.hover,
                                    "text-white/70 hover:text-white/90"
                                  )}
                                >
                                  Configure
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Section */}
                    {currentSection === 'pricing' && (
                      <div className="px-6 py-4 bg-black/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={cn("text-white/60", ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>
                            Pricing Rules for {category.name}
                          </h4>
                          <button
                            onClick={openCreatePricingModal}
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
                              "flex items-center gap-1.5"
                            )}
                          >
                            <Plus size={12} strokeWidth={1.5} />
                            Create Rule
                          </button>
                        </div>
                        {categoryPricing.length === 0 ? (
                          <div className={cn("text-center py-8 rounded-xl border", ds.colors.bg.elevated, ds.colors.border.subtle)}>
                            <DollarSign size={28} className={cn("mx-auto mb-2", ds.colors.text.whisper)} strokeWidth={1.5} />
                            <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-3")}>
                              No pricing rules for this category
                            </p>
                            <button
                              onClick={openCreatePricingModal}
                              className={cn(ds.typography.size.xs, "text-white/60 hover:text-white", ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}
                            >
                              Create First Rule
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {categoryPricing.map((blueprint) => (
                              <div
                                key={blueprint.id}
                                className={cn("p-3 rounded-lg", ds.colors.bg.elevated, "flex items-center justify-between")}
                              >
                                <div>
                                  <div className={cn(ds.typography.size.xs, "text-white/80")}>{blueprint.name}</div>
                                  {blueprint.quality_tier && (
                                    <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-0.5")}>
                                      Tier: {blueprint.quality_tier}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditPricingModal(blueprint)}
                                    className={cn("p-1.5 rounded-lg transition-colors", "hover:bg-white/10")}
                                    title="Edit"
                                  >
                                    <Edit2 size={12} className="text-white/60" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => handlePricingDelete(blueprint)}
                                    className={cn("p-1.5 rounded-lg transition-colors", "hover:bg-red-500/20")}
                                    title="Delete"
                                  >
                                    <Trash2 size={12} className="text-red-400/70" strokeWidth={1.5} />
                                  </button>
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

      {/* Pricing Blueprint Modal */}
      <PricingBlueprintModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSave={handlePricingSave}
        vendorId={vendorId}
        blueprint={selectedPricingBlueprint || undefined}
        categories={categories}
      />

      {/* Field Visibility Modal */}
      <FieldVisibilityModal
        isOpen={showFieldVisibilityModal}
        onClose={() => {
          setShowFieldVisibilityModal(false);
          setVisibilityModalData(null);
        }}
        fieldName={visibilityModalData?.fieldName || ''}
        fieldSlug={visibilityModalData?.fieldSlug || ''}
        categoryId={visibilityModalData?.categoryId || ''}
        currentConfig={visibilityModalData?.currentConfig}
        onSave={handleFieldVisibilitySave}
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
    </div>
  );
}
