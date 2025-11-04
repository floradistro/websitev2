"use client";

import { useState } from 'react';
import { Upload, Loader, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { POSInput, POSLabel, POSSelect, POSTextarea } from '@/components/ui';
import { PricingBlueprint } from '@/lib/types/product';
import { ds, cn } from '@/components/ds';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BulkProduct {
  name: string;
  price: string;
  cost_price: string;
  pricing_mode: 'single' | 'tiered';
  pricing_tiers: Array<{weight: string, qty: number, price: string}>;
  custom_fields: Record<string, unknown>;
  matched_image_url?: string | null;
}

interface BulkImage {
  file: File;
  url: string;
  matchedTo: string | null;
}

interface PricingConfig {
  id: string;
  blueprint: PricingBlueprint;
}

interface BulkImportPanelProps {
  // Category selection
  bulkCategory: string;
  onBulkCategoryChange: (categoryId: string) => void;
  categories: Category[];

  // Product input
  bulkInput: string;
  onBulkInputChange: (input: string) => void;

  // AI enrichment
  onBulkAIEnrich: (selectedFields: string[], customPrompt: string) => void;
  bulkAIProgress: { current: number; total: number };

  // Products review
  bulkProducts: BulkProduct[];
  onBulkProductsChange: (products: BulkProduct[]) => void;
  currentReviewIndex: number;
  onCurrentReviewIndexChange: (index: number) => void;

  // Image upload
  bulkImages: BulkImage[];
  onBulkImageUpload: (files: FileList | File[]) => void;
  uploadingImages: boolean;

  // Pricing templates
  pricingConfigs: PricingConfig[];
  onApplyPricingTemplate: (config: PricingConfig) => void;

  // Submission
  bulkProcessing: boolean;
  bulkProgress: {
    current: number;
    total: number;
    currentProduct: string;
    successCount: number;
    failCount: number;
  };
  onBulkSubmit: () => void;
  onCancel: () => void;
}

export default function BulkImportPanel({
  bulkCategory,
  onBulkCategoryChange,
  categories,
  bulkInput,
  onBulkInputChange,
  onBulkAIEnrich,
  bulkAIProgress,
  bulkProducts,
  onBulkProductsChange,
  currentReviewIndex,
  onCurrentReviewIndexChange,
  bulkImages,
  onBulkImageUpload,
  uploadingImages,
  pricingConfigs,
  onApplyPricingTemplate,
  bulkProcessing,
  bulkProgress,
  onBulkSubmit,
  onCancel
}: BulkImportPanelProps) {
  // Field selection and custom prompt for AI enrichment
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set([
    'description',
    'strain_type',
    'lineage',
    'nose',
    'effects',
    'terpene_profile'
  ]));
  const [customPrompt, setCustomPrompt] = useState('');

  // Available fields for bulk AI autofill
  const availableFields = [
    { id: 'description', label: 'Description', icon: '📝' },
    { id: 'strain_type', label: 'Strain Type', icon: '🌿' },
    { id: 'lineage', label: 'Lineage', icon: '🧬' },
    { id: 'nose', label: 'Nose/Aroma', icon: '👃' },
    { id: 'effects', label: 'Effects', icon: '✨' },
    { id: 'terpene_profile', label: 'Terpenes', icon: '🧪' }
  ];

  const toggleField = (fieldId: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId);
    } else {
      newSelected.add(fieldId);
    }
    setSelectedFields(newSelected);
  };

  const handleProductFieldChange = (index: number, field: string, value: string | number) => {
    const updated = [...bulkProducts];
    if (field.startsWith('custom_fields.')) {
      const blueprintField = field.replace('custom_fields.', '');
      updated[index].custom_fields[blueprintField] = value;
    } else {
      (updated[index] as unknown as Record<string, unknown>)[field] = value;
    }
    onBulkProductsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className={cn(ds.components.card, "rounded-2xl")}>
        <SectionHeader>Bulk Product Import</SectionHeader>

        {/* Category Selector */}
        <POSSelect
          label="Category for All Products"
          required
          value={bulkCategory}
          onChange={(e) => onBulkCategoryChange(e.target.value)}
          containerClassName="mb-4"
        >
          <option value="">Select category...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </POSSelect>
        <p className="text-white/30 text-[9px] mt-1 -mt-3">All products in this batch will use this category</p>

        {/* Product List Input */}
        <POSLabel>Product List</POSLabel>
        <p className="text-white/40 text-[9px] mb-3">
          Format: Name, Price (optional), Cost (optional) - One per line
        </p>
        <POSTextarea
          value={bulkInput}
          onChange={(e) => onBulkInputChange(e.target.value)}
          placeholder="Blue Dream, 45&#10;OG Kush, 50, 35&#10;Wedding Cake, 55, 40&#10;White Widow&#10;Gelato, 60"
          rows={10}
          disabled={!bulkCategory}
          className="font-mono disabled:opacity-30"
        />

        {/* Image Upload Zone */}
        <div className="mt-4">
          <label className="block text-white/40 text-[10px] mb-2 font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
            Product Images (Optional)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-white/30', 'bg-white/5');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-white/30', 'bg-white/5');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-white/30', 'bg-white/5');
              if (e.dataTransfer.files.length > 0) {
                onBulkImageUpload(e.dataTransfer.files);
              }
            }}
            className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center transition-all"
          >
            <input
              type="file"
              id="bulk-image-upload"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onBulkImageUpload(e.target.files);
                }
              }}
              className="hidden"
            />
            <label htmlFor="bulk-image-upload" className="cursor-pointer">
              {uploadingImages ? (
                <div className="text-white/60 text-[10px]">
                  <Loader size={16} className="animate-spin mx-auto mb-2" />
                  Uploading...
                </div>
              ) : (
                <>
                  <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">
                    Drag & drop images or click to browse
                  </div>
                  <div className="text-white/30 text-[9px]">
                    Images auto-match to products by filename
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Uploaded Images Preview */}
          {bulkImages.length > 0 && (
            <div className={cn(ds.colors.bg.primary, "mt-3 border border-white/5 rounded-xl p-3")}>
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Uploaded Images ({bulkImages.length})
              </div>
              <div className="grid grid-cols-4 gap-2">
                {bulkImages.map((img, idx) => (
                  <div key={idx} className={cn(ds.components.card, "relative aspect-square rounded-lg overflow-hidden group")}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.matchedTo && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500/20 border-t border-green-500/40 p-1">
                        <div className="text-green-400 text-[8px] font-black uppercase tracking-wider truncate" style={{ fontWeight: 900 }}>
                          {img.matchedTo}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Enrichment Options */}
        {bulkCategory && bulkInput.trim() && (
          <div className={cn(ds.components.card, "mt-4 rounded-2xl")}>
            <SectionHeader withMargin={false} className="mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={12} strokeWidth={1.5} className="text-white/60" />
                AI Enrichment Options
              </div>
            </SectionHeader>

            {/* Custom Prompt */}
            <div className="mb-4">
              <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Custom Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., 'Focus on fruity flavors' or 'Emphasize relaxing effects'"
                rows={2}
                className={cn(ds.colors.bg.primary, "w-full border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all resize-none text-[10px]")}
              />
              <p className="text-white/30 text-[8px] mt-1.5">
                Add context to improve AI accuracy for all products
              </p>
            </div>

            {/* Field Selection */}
            <div className="mb-4">
              <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-3 font-black" style={{ fontWeight: 900 }}>
                Fields to Autofill
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => {
                  const isSelected = selectedFields.has(field.id);

                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleField(field.id)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border transition-all text-[9px] uppercase tracking-[0.15em] font-black text-left flex items-center gap-2 cursor-pointer",
                        isSelected
                          ? 'bg-white/10 border-white/20 text-white'
                          : cn(ds.colors.bg.primary, 'border-white/10 text-white/40 hover:border-white/20')
                      )}
                      style={{ fontWeight: 900 }}
                    >
                      <span className="text-[14px]">{field.icon}</span>
                      <span className="flex-1">{field.label}</span>
                      {isSelected && <CheckCircle size={10} strokeWidth={1.5} />}
                    </button>
                  );
                })}
              </div>
              <p className="text-white/30 text-[8px] mt-2">
                {selectedFields.size === 0 ? 'Select at least one field' : `${selectedFields.size} fields selected for ${bulkInput.split('\n').filter(l => l.trim()).length} products`}
              </p>
            </div>

            {/* AI Enrichment Button */}
            <button
              type="button"
              onClick={() => onBulkAIEnrich(Array.from(selectedFields), customPrompt)}
              disabled={!bulkInput.trim() || !bulkCategory || bulkAIProgress.total > 0 || selectedFields.size === 0}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] font-black disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontWeight: 900 }}
            >
              {bulkAIProgress.total > 0 ? (
                <>
                  <Loader size={12} className="animate-spin" />
                  Enriching {bulkAIProgress.current}/{bulkAIProgress.total}...
                </>
              ) : (
                <>
                  <Sparkles size={12} strokeWidth={1.5} />
                  Generate AI Data for All Products
                </>
              )}
            </button>
          </div>
        )}

        {/* Review Products (after AI enrichment) */}
        {bulkProducts.length > 0 && (
          <div className={cn(ds.colors.bg.primary, "mt-4 border border-white/10 rounded-xl p-4")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                Review & Edit Products ({currentReviewIndex + 1}/{bulkProducts.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCurrentReviewIndexChange(Math.max(0, currentReviewIndex - 1))}
                  disabled={currentReviewIndex === 0}
                  className="p-1.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={12} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onCurrentReviewIndexChange(Math.min(bulkProducts.length - 1, currentReviewIndex + 1))}
                  disabled={currentReviewIndex === bulkProducts.length - 1}
                  className="p-1.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Current Product Review */}
            {bulkProducts[currentReviewIndex] && (
              <div className="space-y-3">
                {/* Product Name */}
                <POSInput
                  label="Product Name"
                  type="text"
                  value={bulkProducts[currentReviewIndex].name}
                  onChange={(e) => handleProductFieldChange(currentReviewIndex, 'name', e.target.value)}
                  className={ds.components.card}
                />

                {/* Matched Image */}
                {bulkProducts[currentReviewIndex].matched_image_url && (
                  <div className={cn(ds.components.card, "rounded-xl p-2")}>
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                      Matched Image
                    </div>
                    <img
                      src={bulkProducts[currentReviewIndex].matched_image_url!}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Pricing - Always show simple fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[9px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bulkProducts[currentReviewIndex].price}
                        onChange={(e) => handleProductFieldChange(currentReviewIndex, 'price', e.target.value)}
                        className={cn(ds.components.card, "w-full rounded-xl text-white pl-6 pr-3 py-2 text-[10px]")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[9px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bulkProducts[currentReviewIndex].cost_price || ''}
                        onChange={(e) => handleProductFieldChange(currentReviewIndex, 'cost_price', e.target.value)}
                        className={cn(ds.components.card, "w-full rounded-xl text-white pl-6 pr-3 py-2 text-[10px]")}
                      />
                    </div>
                  </div>
                </div>

                {/* Blueprint Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(bulkProducts[currentReviewIndex].custom_fields || {}).map((fieldKey) => (
                    <div key={fieldKey}>
                      <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">
                        {fieldKey.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={String(bulkProducts[currentReviewIndex].custom_fields[fieldKey] || '')}
                        onChange={(e) => handleProductFieldChange(currentReviewIndex, `custom_fields.${fieldKey}`, e.target.value)}
                        className={cn(ds.components.card, "w-full rounded-xl text-white px-3 py-2 text-[10px]")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Templates */}
            {pricingConfigs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                  Quick Apply Template
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const currentCategory = categories.find(c => c.id === bulkCategory);

                    return pricingConfigs.filter((config: PricingConfig) => {
                      const blueprint = config.blueprint;
                      if (!blueprint) return false;

                      const applicableCategories = blueprint.applicable_to_categories || [];

                      // Show if no category restrictions
                      if (applicableCategories.length === 0) return true;

                      // Show if no category selected yet
                      if (!currentCategory) return true;

                      // Check if current category is in applicable list
                      return applicableCategories.includes(currentCategory.id);
                    });
                  })().map((config: PricingConfig) => (
                    <button
                      key={config.id}
                      type="button"
                      onClick={() => onApplyPricingTemplate(config)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      {config.blueprint.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={bulkProcessing}
                className={cn(ds.components.card, "flex-1 px-4 py-2 text-white/60 rounded-xl text-[9px] uppercase tracking-[0.15em] font-black hover:text-white hover:border-white/20 transition-all disabled:opacity-30")}
                style={{ fontWeight: 900 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onBulkSubmit}
                disabled={bulkProcessing}
                className="flex-1 px-4 py-2 bg-white/10 border-2 border-white/20 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] font-black hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-30"
                style={{ fontWeight: 900 }}
              >
                {bulkProcessing ? 'Submitting...' : `Submit All (${bulkProducts.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
