'use client';

/**
 * NewProductClient - Steve Jobs-worthy product creation
 * Polished, intuitive, beautiful
 * Single & Bulk modes with AI enrichment
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Sparkles, Package, Upload, X, ChevronLeft, ChevronRight, Layers, Image as ImageIcon, DollarSign, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useAppAuth } from '@/context/AppAuthContext';
import { Button, Input, Textarea, ds, cn } from '@/components/ds';
import { useSingleProductForm } from './hooks/useSingleProductForm';
import { useBulkImportForm } from './hooks/useBulkImportForm';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DynamicField {
  name: string;
  slug?: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  groupName?: string;
}

export default function NewProductClient() {
  const { vendor } = useAppAuth();

  // ===========================
  // STATE - MODE & DATA LOADING
  // ===========================

  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // ===========================
  // HOOKS - FORM LOGIC
  // ===========================

  const singleForm = useSingleProductForm({
    vendorId: vendor?.id,
    categories,
  });

  const bulkForm = useBulkImportForm({
    vendorId: vendor?.id,
    categories,
  });

  // ===========================
  // EFFECTS - DATA LOADING
  // ===========================

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/supabase/categories?parent=null&active=true');
        if (response.data.success) {
          setCategories(response.data.categories || []);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load dynamic fields when category changes
  useEffect(() => {
    const loadFields = async () => {
      const categoryId = inputMode === 'single' ? singleForm.formData.category_id : bulkForm.bulkCategory;
      if (!categoryId || !vendor?.id) {
        setDynamicFields([]);
        return;
      }

      try {
        setLoadingFields(true);
        const response = await axios.get(`/api/vendor/product-fields?category_id=${categoryId}`, {
          headers: { 'x-vendor-id': vendor.id }
        });

        if (response.data.success) {
          const fields = (response.data.merged || []).map((field: any) => ({
            ...field,
            label: field.label || field.name,
            name: field.slug || field.name
          }));
          setDynamicFields(fields);
        }
      } catch (error) {
        console.error('Failed to load product fields:', error);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [singleForm.formData.category_id, bulkForm.bulkCategory, vendor?.id, inputMode]);

  // ===========================
  // DYNAMIC FIELD RENDERING
  // ===========================

  const renderField = (field: DynamicField) => {
    const value = singleForm.customFieldValues[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => singleForm.setCustomFieldValues({ ...singleForm.customFieldValues, [field.name]: e.target.value })}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => singleForm.setCustomFieldValues({ ...singleForm.customFieldValues, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => singleForm.setCustomFieldValues({ ...singleForm.customFieldValues, [field.name]: e.target.value })}
            className={cn(
              "w-full px-3 py-2 rounded-lg border transition-colors",
              ds.typography.size.xs,
              ds.colors.bg.primary,
              ds.colors.border.default,
              ds.colors.text.primary,
              "focus:outline-none focus:ring-2 focus:ring-white/10"
            )}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const newValues = selectedValues.includes(opt)
                    ? selectedValues.filter(v => v !== opt)
                    : [...selectedValues, opt];
                  singleForm.setCustomFieldValues({ ...singleForm.customFieldValues, [field.name]: newValues });
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg border transition-all",
                  ds.typography.size.micro,
                  selectedValues.includes(opt)
                    ? 'bg-white/10 border-white/30 text-white'
                    : cn(ds.colors.bg.elevated, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Group fields by category
  const groupedFields = dynamicFields.reduce((acc, field) => {
    const group = field.groupName || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, DynamicField[]>);

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className={cn("min-h-screen p-6", ds.colors.bg.base)}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={cn("mb-6", ds.spacing.section.sm)}>
          <Link
            href="/vendor/products"
            className={cn(
              "inline-flex items-center gap-2 mb-4 transition-colors",
              ds.typography.size.xs,
              ds.colors.text.tertiary,
              "hover:text-white/80"
            )}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Products
          </Link>
          <h1 className={cn(ds.typography.size.xl, ds.typography.weight.medium, ds.colors.text.primary)}>
            Add New Product
          </h1>
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mt-1")}>
            Create products individually or in bulk
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setInputMode('single')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
              ds.typography.size.xs,
              inputMode === 'single'
                ? 'bg-white/10 border-white/30 text-white'
                : cn(ds.colors.bg.elevated, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
            )}
          >
            <Package className="w-4 h-4" strokeWidth={1.5} />
            Single Product
          </button>
          <button
            onClick={() => setInputMode('bulk')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
              ds.typography.size.xs,
              inputMode === 'bulk'
                ? 'bg-white/10 border-white/30 text-white'
                : cn(ds.colors.bg.elevated, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
            )}
          >
            <Layers className="w-4 h-4" strokeWidth={1.5} />
            Bulk Import
          </button>
        </div>

        {/* Single Product Mode */}
        {inputMode === 'single' && (
          <form onSubmit={singleForm.handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
              <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-4")}>
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Product Name *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={singleForm.formData.name}
                      onChange={(e) => singleForm.setFormData({ ...singleForm.formData, name: e.target.value })}
                      placeholder="e.g., Blue Dream, Wedding Cake"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={singleForm.handleAIAutofill}
                      disabled={singleForm.loadingAI || !singleForm.formData.name}
                      variant="secondary"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                      {singleForm.loadingAI ? 'Loading...' : 'AI Fill'}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Category *
                  </label>
                  <select
                    value={singleForm.formData.category_id}
                    onChange={(e) => singleForm.setFormData({ ...singleForm.formData, category_id: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-colors",
                      ds.typography.size.xs,
                      ds.colors.bg.primary,
                      ds.colors.border.default,
                      ds.colors.text.primary,
                      "focus:outline-none focus:ring-2 focus:ring-white/10"
                    )}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Description
                  </label>
                  <Textarea
                    value={singleForm.formData.description}
                    onChange={(e) => singleForm.setFormData({ ...singleForm.formData, description: e.target.value })}
                    placeholder="Describe this product..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary)}>
                  Pricing
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => singleForm.setPricingMode('single')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border transition-all",
                      ds.typography.size.micro,
                      singleForm.pricingMode === 'single'
                        ? 'bg-white/10 border-white/30 text-white'
                        : cn(ds.colors.bg.primary, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
                    )}
                  >
                    <DollarSign className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => singleForm.setPricingMode('tiered')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border transition-all",
                      ds.typography.size.micro,
                      singleForm.pricingMode === 'tiered'
                        ? 'bg-white/10 border-white/30 text-white'
                        : cn(ds.colors.bg.primary, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
                    )}
                  >
                    <Layers className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                    Tiered Pricing
                  </button>
                </div>
              </div>

              {singleForm.pricingMode === 'single' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                      Price *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={singleForm.formData.price}
                      onChange={(e) => singleForm.setFormData({ ...singleForm.formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                      Cost Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={singleForm.formData.cost_price}
                      onChange={(e) => singleForm.setFormData({ ...singleForm.formData, cost_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {singleForm.pricingTiers.map((tier, index) => (
                    <div key={index} className={cn("flex gap-2 p-3 rounded-lg", ds.colors.bg.primary)}>
                      <Input
                        placeholder="Weight (e.g., 1g)"
                        value={tier.weight}
                        onChange={(e) => singleForm.updatePricingTier(index, 'weight', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(e) => singleForm.updatePricingTier(index, 'price', e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => singleForm.removePricingTier(index)}
                        className="p-2 rounded-lg text-red-400/70 hover:bg-red-500/10 transition-colors"
                      >
                        <Minus className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <Button type="button" onClick={singleForm.addPricingTier} variant="secondary" size="sm">
                    <Plus className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    Add Tier
                  </Button>
                </div>
              )}
            </div>

            {/* Images */}
            <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
              <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-4")}>
                Product Images
              </h2>

              <div className="space-y-3">
                {singleForm.imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {singleForm.imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => singleForm.removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className={cn(
                  "block w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center",
                  ds.colors.border.default,
                  "hover:border-white/20"
                )}>
                  <ImageIcon className={cn("w-8 h-8 mx-auto mb-2", ds.colors.text.quaternary)} strokeWidth={1.5} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={singleForm.handleImageUpload}
                    className="hidden"
                    disabled={singleForm.uploadingImages}
                  />
                  <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                    {singleForm.uploadingImages ? 'Uploading...' : 'Click to upload images'}
                  </p>
                </label>
              </div>
            </div>

            {/* Dynamic Fields */}
            {loadingFields ? (
              <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>Loading fields...</p>
              </div>
            ) : Object.keys(groupedFields).length > 0 && (
              <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-4")}>
                  Product Details
                </h2>

                {Object.entries(groupedFields).map(([groupName, fields]) => (
                  <div key={groupName} className="mb-6 last:mb-0">
                    {groupName !== 'Other' && (
                      <h3 className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mb-3")}>{groupName}</h3>
                    )}
                    <div className="space-y-4">
                      {fields.map(field => (
                        <div key={field.name}>
                          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                            {field.label}
                            {field.required && <span className="text-red-400/70 ml-1">*</span>}
                          </label>
                          {renderField(field)}
                          {field.description && (
                            <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1")}>
                              {field.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inventory */}
            {singleForm.formData.category_id && (
              <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-4")}>
                  Inventory
                </h2>
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Initial Quantity (grams)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={singleForm.formData.initial_quantity}
                    onChange={(e) => singleForm.setFormData({ ...singleForm.formData, initial_quantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={cn("flex items-center justify-end gap-3 pt-4 border-t", ds.colors.border.default)}>
              <Link href="/vendor/products">
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors",
                    ds.typography.size.xs,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    ds.colors.text.tertiary,
                    "hover:text-white/80"
                  )}
                >
                  Cancel
                </button>
              </Link>

              <Button type="submit" disabled={singleForm.loading}>
                <Save className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                {singleForm.loading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        )}

        {/* Bulk Import Mode */}
        {inputMode === 'bulk' && (
          <div className="space-y-6">
            {/* Bulk Input */}
            {bulkForm.bulkProducts.length === 0 && (
              <>
                <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                  <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-4")}>
                    Category Selection
                  </h2>
                  <select
                    value={bulkForm.bulkCategory}
                    onChange={(e) => bulkForm.setBulkCategory(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border transition-colors",
                      ds.typography.size.xs,
                      ds.colors.bg.primary,
                      ds.colors.border.default,
                      ds.colors.text.primary,
                      "focus:outline-none focus:ring-2 focus:ring-white/10"
                    )}
                  >
                    <option value="">Select category for all products</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                  <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-2")}>
                    Product List
                  </h2>
                  <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-4")}>
                    Enter one product per line: Name, Price, Cost (optional)
                  </p>
                  <Textarea
                    value={bulkForm.bulkInput}
                    onChange={(e) => bulkForm.setBulkInput(e.target.value)}
                    placeholder="Blue Dream, 45, 20&#10;Wedding Cake, 50, 25&#10;Gelato, 55, 30"
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={bulkForm.handleBulkAIEnrich}
                    disabled={bulkForm.loadingAI || !bulkForm.bulkInput.trim() || !bulkForm.bulkCategory}
                    className="flex-1"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    {bulkForm.loadingAI ? 'Enriching with AI...' : 'Enrich with AI'}
                  </Button>
                </div>
              </>
            )}

            {/* Bulk Review */}
            {bulkForm.bulkProducts.length > 0 && (
              <>
                <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary)}>
                      Review Products ({bulkForm.currentReviewIndex + 1} / {bulkForm.bulkProducts.length})
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={bulkForm.goToPreviousProduct}
                        disabled={bulkForm.currentReviewIndex === 0}
                        className={cn(
                          "p-2 rounded-lg border transition-colors",
                          ds.colors.bg.elevated,
                          ds.colors.border.default,
                          ds.colors.text.secondary,
                          "disabled:opacity-30 hover:border-white/20"
                        )}
                      >
                        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={bulkForm.goToNextProduct}
                        disabled={bulkForm.currentReviewIndex === bulkForm.bulkProducts.length - 1}
                        className={cn(
                          "p-2 rounded-lg border transition-colors",
                          ds.colors.bg.elevated,
                          ds.colors.border.default,
                          ds.colors.text.secondary,
                          "disabled:opacity-30 hover:border-white/20"
                        )}
                      >
                        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                        Product Name
                      </label>
                      <Input
                        value={bulkForm.currentProduct?.name || ''}
                        onChange={(e) => {
                          const updated = [...bulkForm.bulkProducts];
                          updated[bulkForm.currentReviewIndex].name = e.target.value;
                          bulkForm.setBulkProducts(updated);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                          Price
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bulkForm.currentProduct?.price || ''}
                          onChange={(e) => {
                            const updated = [...bulkForm.bulkProducts];
                            updated[bulkForm.currentReviewIndex].price = e.target.value;
                            bulkForm.setBulkProducts(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                          Cost Price
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bulkForm.currentProduct?.cost_price || ''}
                          onChange={(e) => {
                            const updated = [...bulkForm.bulkProducts];
                            updated[bulkForm.currentReviewIndex].cost_price = e.target.value;
                            bulkForm.setBulkProducts(updated);
                          }}
                        />
                      </div>
                    </div>

                    {/* Show AI-enriched fields */}
                    {bulkForm.currentProduct && bulkForm.bulkEnrichedData[bulkForm.currentProduct.name] && (
                      <div className={cn("p-4 rounded-lg border border-white/10", ds.colors.bg.primary)}>
                        <p className={cn(ds.typography.size.micro, "text-white/60 mb-2")}>
                          AI-enriched data
                        </p>
                        <div className={cn("space-y-2", ds.typography.size.xs, ds.colors.text.tertiary)}>
                          {Object.entries(bulkForm.currentProduct.custom_fields).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-white/40">{key}:</span> {Array.isArray(value) ? value.join(', ') : value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={bulkForm.resetBulkForm}
                    className={cn(
                      "px-4 py-2 rounded-lg transition-colors",
                      ds.typography.size.xs,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide,
                      ds.colors.text.tertiary,
                      "hover:text-white/80"
                    )}
                  >
                    Cancel
                  </button>

                  <Button
                    onClick={bulkForm.handleBulkSubmit}
                    disabled={bulkForm.bulkProcessing}
                    className="flex-1"
                  >
                    <Upload className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    {bulkForm.bulkProcessing ? 'Creating Products...' : `Create ${bulkForm.bulkProducts.length} Products`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
