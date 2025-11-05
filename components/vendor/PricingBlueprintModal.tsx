"use client";

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, DollarSign } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import SectionHeader from '@/components/ui/SectionHeader';
import { ds, cn } from '@/components/ds';
import axios from 'axios';

interface PriceBreak {
  break_id: string;
  label: string;
  qty: number;
  unit: string;
  price?: number;
  sort_order: number;
}

interface PricingBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vendorId: string;
  blueprint?: any;
  categories: any[];
}

export function PricingBlueprintModal({
  isOpen,
  onClose,
  onSave,
  vendorId,
  blueprint,
  categories
}: PricingBlueprintModalProps) {
  const isEditMode = !!blueprint;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quality_tier: '' as '' | 'exotic' | 'top-shelf' | 'mid-shelf' | 'value',
    applicable_to_categories: [] as string[]
  });

  const [priceBreaks, setPriceBreaks] = useState<PriceBreak[]>([
    { break_id: '1g', label: '1 gram', qty: 1, unit: 'g', sort_order: 1 },
    { break_id: '3_5g', label: '3.5g (⅛oz)', qty: 3.5, unit: 'g', sort_order: 2 },
    { break_id: '7g', label: '7g (¼oz)', qty: 7, unit: 'g', sort_order: 3 },
    { break_id: '14g', label: '14g (½oz)', qty: 14, unit: 'g', sort_order: 4 },
    { break_id: '28g', label: '28g (1oz)', qty: 28, unit: 'g', sort_order: 5 }
  ]);

  const [saving, setSaving] = useState(false);

  // Load pricing template when editing
  useEffect(() => {
    if (isOpen && blueprint) {
      setFormData({
        name: blueprint.name || '',
        description: blueprint.description || '',
        quality_tier: blueprint.quality_tier || '',
        applicable_to_categories: blueprint.applicable_to_categories || []
      });

      // Load price_breaks with prices from template
      const priceBreaksWithPrices = (blueprint.price_breaks || []).map((pb: any) => ({
        break_id: pb.break_id,
        label: pb.label,
        qty: pb.qty,
        unit: pb.unit,
        sort_order: pb.sort_order,
        price: pb.default_price || pb.price
      }));
      setPriceBreaks(priceBreaksWithPrices);
    } else if (isOpen && !blueprint) {
      // Reset for create mode
      setFormData({
        name: '',
        description: '',
        quality_tier: '',
        applicable_to_categories: []
      });
      setPriceBreaks([
        { break_id: '1g', label: '1 gram', qty: 1, unit: 'g', sort_order: 1 },
        { break_id: '3_5g', label: '3.5g (⅛oz)', qty: 3.5, unit: 'g', sort_order: 2 },
        { break_id: '7g', label: '7g (¼oz)', qty: 7, unit: 'g', sort_order: 3 },
        { break_id: '14g', label: '14g (½oz)', qty: 14, unit: 'g', sort_order: 4 },
        { break_id: '28g', label: '28g (1oz)', qty: 28, unit: 'g', sort_order: 5 }
      ]);
    }
  }, [isOpen, blueprint]);

  const addPriceBreak = () => {
    const nextOrder = priceBreaks.length + 1;
    setPriceBreaks([
      ...priceBreaks,
      {
        break_id: `tier-${nextOrder}`,
        label: `Tier ${nextOrder}`,
        qty: 1,
        unit: 'g',
        sort_order: nextOrder
      }
    ]);
  };

  const removePriceBreak = (index: number) => {
    setPriceBreaks(priceBreaks.filter((_, i) => i !== index));
  };

  const updatePriceBreak = (index: number, field: keyof PriceBreak, value: any) => {
    const updated = [...priceBreaks];
    updated[index] = { ...updated[index], [field]: value };
    setPriceBreaks(updated);
  };

  const handleSave = async () => {
    if (!formData.name || priceBreaks.length === 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a name and at least one price tier'
      });
      return;
    }

    if (!vendorId) {
      showNotification({
        type: 'error',
        title: 'Authentication Error',
        message: 'Vendor ID not found. Please refresh the page and try again.'
      });
      return;
    }

    // Include prices directly in price_breaks
    const blueprintData = {
      id: blueprint?.id,
      ...formData,
      quality_tier: formData.quality_tier || null,
      price_breaks: priceBreaks.map((pb: any) => ({
        break_id: pb.break_id,
        label: pb.label,
        qty: pb.qty,
        unit: pb.unit,
        sort_order: pb.sort_order,
        default_price: pb.price || null
      })),
      context: 'retail',
      tier_type: 'weight'
    };

    setSaving(true);
    try {
      if (isEditMode) {
        const response = await axios.put('/api/vendor/pricing-blueprints', blueprintData, {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.data.success) {
          showNotification({
            type: 'success',
            title: 'Updated',
            message: 'Pricing template updated successfully'
          });
          onSave();
          onClose();
        }
      } else {
        const response = await axios.post('/api/vendor/pricing-blueprints', blueprintData, {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.data.success) {
          showNotification({
            type: 'success',
            title: 'Created',
            message: 'Pricing template created successfully'
          });
          onSave();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Error saving pricing template:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save pricing template';
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className={cn(ds.components.card, "w-full max-w-3xl my-8 rounded-2xl")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-inherit z-10 pb-4 border-b border-white/10">
          <h2 className={cn(ds.typography.size.h3, ds.typography.weight.semibold, ds.colors.text.primary)}>
            {isEditMode ? 'Edit Pricing Template' : 'New Pricing Template'}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              ds.colors.bg.secondary,
              "hover:bg-white/20"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <SectionHeader>Template Details</SectionHeader>
            <div className="space-y-4">
              <div>
                <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                  Template Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Top-Shelf Flower"
                  className={cn(
                    ds.components.input,
                    "w-full px-3 py-2.5 rounded-xl border transition-colors",
                    ds.colors.bg.secondary,
                    "border-white/10 focus:border-white/30"
                  )}
                />
              </div>

              <div>
                <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className={cn(
                    ds.components.input,
                    "w-full px-3 py-2.5 rounded-xl border transition-colors resize-none",
                    ds.colors.bg.secondary,
                    "border-white/10 focus:border-white/30"
                  )}
                />
              </div>

              <div>
                <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                  Quality Tier
                </label>
                <select
                  value={formData.quality_tier}
                  onChange={(e) => setFormData({ ...formData, quality_tier: e.target.value as any })}
                  className={cn(
                    ds.components.input,
                    "w-full px-3 py-2.5 rounded-xl border transition-colors",
                    ds.colors.bg.secondary,
                    "border-white/10 focus:border-white/30"
                  )}
                >
                  <option value="">None</option>
                  <option value="exotic">Exotic</option>
                  <option value="top-shelf">Top-Shelf</option>
                  <option value="mid-shelf">Mid-Shelf</option>
                  <option value="value">Value</option>
                </select>
              </div>

              <div>
                <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                  Applicable Categories
                </label>
                <select
                  multiple
                  value={formData.applicable_to_categories}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, applicable_to_categories: selected });
                  }}
                  className={cn(
                    ds.components.input,
                    "w-full px-3 py-2.5 rounded-xl border transition-colors",
                    ds.colors.bg.secondary,
                    "border-white/10 focus:border-white/30 h-32"
                  )}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className={cn("mt-1", ds.typography.size.micro, ds.colors.text.quaternary)}>
                  Hold Cmd/Ctrl to select multiple
                </p>
              </div>
            </div>
          </div>

          {/* Price Tiers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader>Price Tiers</SectionHeader>
              <button
                type="button"
                onClick={addPriceBreak}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                  ds.typography.size.micro,
                  ds.colors.bg.secondary,
                  "hover:bg-white/20"
                )}
              >
                <Plus className="w-4 h-4" />
                Add Tier
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {priceBreaks.map((tier, index) => (
                <div key={tier.break_id} className={cn(ds.colors.bg.secondary, "p-4 rounded-xl border border-white/10")}>
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <label className={cn("block mb-1.5", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                        Label
                      </label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updatePriceBreak(index, 'label', e.target.value)}
                        className={cn(
                          ds.components.input,
                          "w-full px-2.5 py-2 rounded-lg border text-sm",
                          ds.colors.bg.primary,
                          "border-white/10 focus:border-white/30"
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={cn("block mb-1.5", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                        Qty
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tier.qty}
                        onChange={(e) => updatePriceBreak(index, 'qty', parseFloat(e.target.value))}
                        className={cn(
                          ds.components.input,
                          "w-full px-2.5 py-2 rounded-lg border text-sm",
                          ds.colors.bg.primary,
                          "border-white/10 focus:border-white/30"
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={cn("block mb-1.5", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                        Unit
                      </label>
                      <input
                        type="text"
                        value={tier.unit}
                        onChange={(e) => updatePriceBreak(index, 'unit', e.target.value)}
                        className={cn(
                          ds.components.input,
                          "w-full px-2.5 py-2 rounded-lg border text-sm",
                          ds.colors.bg.primary,
                          "border-white/10 focus:border-white/30"
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className={cn("block mb-1.5", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                        Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="number"
                          step="0.01"
                          value={tier.price || ''}
                          onChange={(e) => updatePriceBreak(index, 'price', parseFloat(e.target.value))}
                          placeholder="0.00"
                          className={cn(
                            ds.components.input,
                            "w-full pl-8 pr-2.5 py-2 rounded-lg border text-sm",
                            ds.colors.bg.primary,
                            "border-white/10 focus:border-white/30"
                          )}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removePriceBreak(index)}
                        disabled={priceBreaks.length === 1}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          priceBreaks.length === 1
                            ? "text-white/20 cursor-not-allowed"
                            : "text-red-400 hover:bg-red-500/10"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-colors",
                ds.typography.size.sm,
                ds.typography.weight.medium,
                ds.colors.bg.secondary,
                "hover:bg-white/20",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors",
                ds.typography.size.sm,
                ds.typography.weight.medium,
                "bg-white text-black hover:bg-white/90",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Update Template' : 'Create Template'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
