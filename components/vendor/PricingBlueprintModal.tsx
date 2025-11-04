"use client";

import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Plus, Trash2 } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import { Button, Input, Textarea, Select, ds, cn } from '@/components/ds';
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
  blueprint?: any; // If provided, edit mode; otherwise, create mode
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
    context: 'retail' as 'retail' | 'wholesale' | 'distributor' | 'delivery',
    tier_type: 'weight' as 'weight' | 'quantity' | 'percentage' | 'flat' | 'custom',
    quality_tier: '' as '' | 'exotic' | 'top-shelf' | 'mid-shelf' | 'value', // Empty string will be converted to null before saving
    applicable_to_categories: [] as string[]
  });

  const [priceBreaks, setPriceBreaks] = useState<PriceBreak[]>([
    { break_id: '1g', label: '1g', qty: 1, unit: 'g', sort_order: 1 },
    { break_id: '3.5g', label: '3.5g (⅛oz)', qty: 3.5, unit: 'g', sort_order: 2 },
    { break_id: '7g', label: '7g (¼oz)', qty: 7, unit: 'g', sort_order: 3 },
    { break_id: '14g', label: '14g (½oz)', qty: 14, unit: 'g', sort_order: 4 },
    { break_id: '28g', label: '28g (1oz)', qty: 28, unit: 'g', sort_order: 5 }
  ]);

  const [saving, setSaving] = useState(false);

  // Load vendor pricing config when editing
  useEffect(() => {
    if (isOpen && blueprint) {
      // Load the blueprint data
      setFormData({
        name: blueprint.name || '',
        description: blueprint.description || '',
        context: blueprint.context || 'retail',
        tier_type: blueprint.tier_type || 'weight',
        quality_tier: blueprint.quality_tier || '',
        applicable_to_categories: blueprint.applicable_to_categories || []
      });

      // Fetch vendor pricing config to get actual prices
      const loadPricingConfig = async () => {
        try {
          const response = await axios.get('/api/vendor/pricing-config', {
            headers: { 'x-vendor-id': vendorId },
            params: { blueprint_id: blueprint.id }
          });

          if (response.data.success && response.data.config) {
            // Merge pricing_values into price_breaks
            const priceBreaksWithValues = (blueprint.price_breaks || []).map((pb: any) => {
              const priceData = response.data.config.pricing_values[pb.break_id];
              return {
                ...pb,
                price: priceData?.price ? parseFloat(priceData.price) : undefined
              };
            });
            setPriceBreaks(priceBreaksWithValues);
          } else {
            // No pricing config yet - just use blueprint structure
            setPriceBreaks(blueprint.price_breaks || []);
          }
        } catch (error) {
          console.error('Error loading pricing config:', error);
          // Fallback to blueprint structure
          setPriceBreaks(blueprint.price_breaks || []);
        }
      };

      loadPricingConfig();
    } else if (isOpen && !blueprint) {
      // Reset for create mode
      setFormData({
        name: '',
        description: '',
        context: 'retail',
        tier_type: 'weight',
        quality_tier: '',
        applicable_to_categories: []
      });
      setPriceBreaks([
        { break_id: '1g', label: '1g', qty: 1, unit: 'g', sort_order: 1 },
        { break_id: '3.5g', label: '3.5g (⅛oz)', qty: 3.5, unit: 'g', sort_order: 2 },
        { break_id: '7g', label: '7g (¼oz)', qty: 7, unit: 'g', sort_order: 3 },
        { break_id: '14g', label: '14g (½oz)', qty: 14, unit: 'g', sort_order: 4 },
        { break_id: '28g', label: '28g (1oz)', qty: 28, unit: 'g', sort_order: 5 }
      ]);
    }
  }, [isOpen, blueprint, vendorId]);

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
        message: 'Please provide a name and at least one price break'
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

    const blueprintData = {
      id: blueprint?.id,
      ...formData,
      // Convert empty string to null for quality_tier (database constraint requires null, not '')
      quality_tier: formData.quality_tier || null,
      price_breaks: priceBreaks.map((pb: any) => ({
        break_id: pb.break_id,
        label: pb.label,
        qty: pb.qty,
        unit: pb.unit,
        sort_order: pb.sort_order
      }))
    };

    console.log('💾 Saving pricing blueprint...', {
      isEditMode,
      vendorId,
      blueprintId: blueprint?.id,
      formData,
      priceBreaks,
      blueprintData
    });

    setSaving(true);
    try {
      if (isEditMode) {
        // Update existing blueprint structure
        const response = await axios.put('/api/vendor/pricing-blueprints', blueprintData, {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.data.success) {
          // Also update/create vendor pricing config with actual prices
          const pricingValues: any = {};
          priceBreaks.forEach((pb: any) => {
            if (pb.price !== undefined && pb.price !== null) {
              pricingValues[pb.break_id] = {
                price: pb.price.toString(),
                enabled: true
              };
            }
          });

          // Save pricing config if there are any prices
          if (Object.keys(pricingValues).length > 0) {
            await axios.post('/api/vendor/pricing-config', {
              blueprint_id: blueprint.id,
              pricing_values: pricingValues
            }, {
              headers: { 'x-vendor-id': vendorId }
            });
          }

          showNotification({
            type: 'success',
            title: 'Updated',
            message: 'Pricing blueprint and prices updated successfully'
          });
          onSave();
          onClose();
        }
      } else {
        // Create new blueprint
        const createData = {
          ...formData,
          // Convert empty string to null for quality_tier (database constraint requires null, not '')
          quality_tier: formData.quality_tier || null,
          price_breaks: priceBreaks.map((pb: any) => ({
            break_id: pb.break_id,
            label: pb.label,
            qty: pb.qty,
            unit: pb.unit,
            sort_order: pb.sort_order
            // Don't include price here - it goes to vendor_pricing_configs
          }))
        };

        const response = await axios.post('/api/vendor/pricing-blueprints', createData, {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.data.success) {
          // Also create vendor pricing config with actual prices
          const pricingValues: any = {};
          priceBreaks.forEach((pb: any) => {
            if (pb.price !== undefined && pb.price !== null) {
              pricingValues[pb.break_id] = {
                price: pb.price.toString(),
                enabled: true
              };
            }
          });

          // Save pricing config if there are any prices
          if (Object.keys(pricingValues).length > 0) {
            await axios.post('/api/vendor/pricing-config', {
              blueprint_id: response.data.blueprint.id,
              pricing_values: pricingValues
            }, {
              headers: { 'x-vendor-id': vendorId }
            });
          }

          showNotification({
            type: 'success',
            title: 'Created',
            message: 'Pricing blueprint created successfully'
          });
          onSave();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving pricing blueprint:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);

      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to save pricing blueprint';

      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (formData.applicable_to_categories.includes(categoryId)) {
      setFormData({
        ...formData,
        applicable_to_categories: formData.applicable_to_categories.filter(id => id !== categoryId)
      });
    } else {
      setFormData({
        ...formData,
        applicable_to_categories: [...formData.applicable_to_categories, categoryId]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 backdrop-blur-sm z-50",
          "bg-black/80"
        )}
        onClick={onClose}
        style={{ animation: 'fade-in 0.2s ease-out' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "w-full max-w-4xl backdrop-blur-xl pointer-events-auto overflow-hidden",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            "border",
            ds.effects.radius.xl,
            ds.effects.shadow.xl
          )}
          style={{
            animation: 'fade-in 0.3s ease-out',
            boxShadow: '0 0 60px rgba(255,255,255,0.05)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "p-6",
            ds.colors.bg.secondary,
            ds.colors.border.subtle,
            "border-b"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className={cn(
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.colors.text.primary,
                  ds.typography.weight.light,
                  'mb-2'
                )}>
                  {isEditMode ? 'Edit Pricing Blueprint' : 'Create Pricing Blueprint'}
                </h2>
                <p className={cn(
                  ds.colors.text.quaternary,
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light
                )}>
                  {isEditMode ? 'Update pricing structure' : 'Configure a new pricing structure'}
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  ds.colors.text.quaternary,
                  "hover:text-white",
                  ds.effects.transition.normal,
                  "p-2"
                )}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className={cn(
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.colors.text.tertiary,
                  ds.typography.weight.medium,
                  "mb-4"
                )}>
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn(
                      "block mb-2",
                      ds.typography.size.xs,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide,
                      ds.colors.text.quaternary
                    )}>
                      Blueprint Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3",
                        ds.colors.bg.input,
                        ds.colors.border.default,
                        ds.colors.text.primary,
                        "border",
                        ds.effects.radius.lg,
                        "focus:outline-none",
                        "focus:border-white/[0.12]",
                        ds.effects.transition.normal
                      )}
                      placeholder="e.g., Top Shelf Flower"
                    />
                  </div>
                  <div>
                    <label className={cn(
                      "block mb-2",
                      ds.typography.size.xs,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide,
                      ds.colors.text.quaternary
                    )}>
                      Context
                    </label>
                    <select
                      value={formData.context}
                      onChange={(e) => setFormData({ ...formData, context: e.target.value as any })}
                      className={cn(
                        "w-full px-4 py-3",
                        ds.colors.bg.input,
                        ds.colors.border.default,
                        ds.colors.text.primary,
                        "border",
                        ds.effects.radius.lg,
                        "focus:outline-none",
                        "focus:border-white/[0.12]",
                        ds.effects.transition.normal
                      )}
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="distributor">Distributor</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className={cn(
                    "block mb-2",
                    ds.typography.size.xs,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    ds.colors.text.quaternary
                  )}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className={cn(
                      "w-full px-4 py-3 resize-none",
                      ds.colors.bg.input,
                      ds.colors.border.default,
                      ds.colors.text.primary,
                      "border",
                      ds.effects.radius.lg,
                      "focus:outline-none",
                      "focus:border-white/[0.12]",
                      ds.effects.transition.normal
                    )}
                    placeholder="Describe this pricing structure..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={cn(
                      "block mb-2",
                      ds.typography.size.xs,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide,
                      ds.colors.text.quaternary
                    )}>
                      Pricing Type
                    </label>
                    <select
                      value={formData.tier_type}
                      onChange={(e) => setFormData({ ...formData, tier_type: e.target.value as any })}
                      className={cn(
                        "w-full px-4 py-3",
                        ds.colors.bg.input,
                        ds.colors.border.default,
                        ds.colors.text.primary,
                        "border",
                        ds.effects.radius.lg,
                        "focus:outline-none",
                        "focus:border-white/[0.12]",
                        ds.effects.transition.normal
                      )}
                    >
                      <option value="weight">Weight-Based</option>
                      <option value="quantity">Quantity-Based</option>
                      <option value="percentage">Percentage Discount</option>
                      <option value="flat">Flat Price</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn(
                      "block mb-2",
                      ds.typography.size.xs,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide,
                      ds.colors.text.quaternary
                    )}>
                      Quality Tier (Optional)
                    </label>
                    <select
                      value={formData.quality_tier}
                      onChange={(e) => setFormData({ ...formData, quality_tier: e.target.value as any })}
                      className={cn(
                        "w-full px-4 py-3",
                        ds.colors.bg.input,
                        ds.colors.border.default,
                        ds.colors.text.primary,
                        "border",
                        ds.effects.radius.lg,
                        "focus:outline-none",
                        "focus:border-white/[0.12]",
                        ds.effects.transition.normal
                      )}
                    >
                      <option value="">None</option>
                      <option value="exotic">Exotic</option>
                      <option value="top-shelf">Top Shelf</option>
                      <option value="mid-shelf">Mid Shelf</option>
                      <option value="value">Value</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Price Breaks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={cn(
                    ds.typography.size.xs,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    ds.colors.text.tertiary,
                    ds.typography.weight.medium
                  )}>
                    Price Breaks
                  </h3>
                  <Button
                    onClick={addPriceBreak}
                    variant="ghost"
                    icon={Plus}
                    size="xs"
                  >
                    Add Tier
                  </Button>
                </div>
                <div className={cn(
                  "p-3 mb-4",
                  "bg-blue-500/10",
                  "border border-blue-500/20",
                  ds.effects.radius.lg
                )}>
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      ds.typography.size.xs,
                      ds.colors.icon.blue
                    )}>
                      ℹ️
                    </div>
                    <div>
                      <div className={cn(
                        ds.typography.size.micro,
                        ds.typography.weight.semibold,
                        ds.typography.transform.uppercase,
                        ds.typography.tracking.wide,
                        ds.colors.icon.blue,
                        "mb-1"
                      )}>
                        Pricing Mode
                      </div>
                      <div className={cn(
                        ds.typography.size.micro,
                        ds.colors.text.tertiary,
                        "leading-relaxed"
                      )}>
                        <strong>With Price:</strong> Use your custom price (e.g., 1g = $12)<br/>
                        <strong>Without Price (Optional):</strong> Auto-calculate from product base price × quantity
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {priceBreaks.map((priceBreak, idx) => (
                    <div key={idx} className={cn(
                      "p-4",
                      ds.colors.bg.primary,
                      ds.colors.border.subtle,
                      "border",
                      ds.effects.radius.lg
                    )}>
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3">
                          <label className={cn(
                            "block mb-2",
                            ds.typography.size.micro,
                            ds.typography.transform.uppercase,
                            ds.typography.tracking.wide,
                            ds.colors.text.quaternary
                          )}>
                            Label
                          </label>
                          <input
                            type="text"
                            value={priceBreak.label}
                            onChange={(e) => updatePriceBreak(idx, 'label', e.target.value)}
                            className={cn(
                              "w-full px-3 py-2 text-sm",
                              ds.colors.bg.input,
                              ds.colors.border.default,
                              ds.colors.text.primary,
                              "border",
                              ds.effects.radius.md,
                              "focus:outline-none",
                              "focus:border-white/[0.12]",
                              ds.effects.transition.normal
                            )}
                            placeholder="e.g., 1g"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={cn(
                            "block mb-2",
                            ds.typography.size.micro,
                            ds.typography.transform.uppercase,
                            ds.typography.tracking.wide,
                            ds.colors.text.quaternary
                          )}>
                            Quantity
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={priceBreak.qty}
                            onChange={(e) => updatePriceBreak(idx, 'qty', parseFloat(e.target.value) || 0)}
                            className={cn(
                              "w-full px-3 py-2 text-sm",
                              ds.colors.bg.input,
                              ds.colors.border.default,
                              ds.colors.text.primary,
                              "border",
                              ds.effects.radius.md,
                              "focus:outline-none",
                              "focus:border-white/[0.12]",
                              ds.effects.transition.normal
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={cn(
                            "block mb-2",
                            ds.typography.size.micro,
                            ds.typography.transform.uppercase,
                            ds.typography.tracking.wide,
                            ds.colors.text.quaternary
                          )}>
                            Price ($)
                            {!priceBreak.price && (
                              <span className={cn("ml-1", ds.colors.text.ghost)}>• Auto-calc</span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={priceBreak.price ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === null) {
                                updatePriceBreak(idx, 'price', undefined);
                              } else {
                                const numValue = parseFloat(value);
                                updatePriceBreak(idx, 'price', isNaN(numValue) ? undefined : numValue);
                              }
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-sm",
                              ds.colors.bg.input,
                              ds.colors.border.default,
                              ds.colors.text.primary,
                              "border",
                              ds.effects.radius.md,
                              "focus:outline-none",
                              "focus:border-white/[0.12]",
                              ds.effects.transition.normal
                            )}
                            placeholder="Auto (base price × qty)"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={cn(
                            "block mb-2",
                            ds.typography.size.micro,
                            ds.typography.transform.uppercase,
                            ds.typography.tracking.wide,
                            ds.colors.text.quaternary
                          )}>
                            Unit
                          </label>
                          <select
                            value={priceBreak.unit}
                            onChange={(e) => updatePriceBreak(idx, 'unit', e.target.value)}
                            className={cn(
                              "w-full px-3 py-2 text-sm",
                              ds.colors.bg.input,
                              ds.colors.border.default,
                              ds.colors.text.primary,
                              "border",
                              ds.effects.radius.md,
                              "focus:outline-none",
                              "focus:border-white/[0.12]",
                              ds.effects.transition.normal
                            )}
                          >
                            <option value="g">g</option>
                            <option value="oz">oz</option>
                            <option value="lb">lb</option>
                            <option value="unit">unit</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={cn(
                            "block mb-2",
                            ds.typography.size.micro,
                            ds.typography.transform.uppercase,
                            ds.typography.tracking.wide,
                            ds.colors.text.quaternary
                          )}>
                            Order
                          </label>
                          <input
                            type="number"
                            value={priceBreak.sort_order}
                            onChange={(e) => updatePriceBreak(idx, 'sort_order', parseInt(e.target.value) || 0)}
                            className={cn(
                              "w-full px-3 py-2 text-sm",
                              ds.colors.bg.input,
                              ds.colors.border.default,
                              ds.colors.text.primary,
                              "border",
                              ds.effects.radius.md,
                              "focus:outline-none",
                              "focus:border-white/[0.12]",
                              ds.effects.transition.normal
                            )}
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removePriceBreak(idx)}
                            className={cn(
                              "p-2",
                              "bg-red-500/10",
                              "border border-red-500/20",
                              ds.effects.radius.md,
                              ds.colors.status.error,
                              "hover:bg-red-500/20 hover:text-red-300",
                              ds.effects.transition.normal
                            )}
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Restrictions */}
              {categories.length > 0 && (
                <div>
                  <h3 className={cn(
                    ds.typography.size.xs,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    ds.colors.text.tertiary,
                    ds.typography.weight.medium,
                    "mb-4"
                  )}>
                    Apply to Categories (Optional)
                  </h3>
                  <p className={cn(
                    ds.typography.size.micro,
                    ds.colors.text.quaternary,
                    "mb-3"
                  )}>
                    Leave empty to apply to all categories, or select specific ones
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className={cn(
                          "flex items-center gap-2 p-3 border cursor-pointer",
                          ds.effects.radius.md,
                          ds.effects.transition.normal,
                          formData.applicable_to_categories.includes(category.id)
                            ? cn(ds.colors.bg.active, "border-white/[0.12]")
                            : cn(ds.colors.bg.elevated, ds.colors.border.default, "hover:bg-white/[0.06]")
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.applicable_to_categories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className={cn(
                          ds.typography.size.xs,
                          ds.colors.text.primary
                        )}>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            "p-6 flex items-center justify-between",
            ds.colors.bg.secondary,
            ds.colors.border.subtle,
            "border-t"
          )}>
            <div className={cn(
              ds.typography.size.micro,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.colors.text.quaternary
            )}>
              {priceBreaks.length} price break{priceBreaks.length !== 1 ? 's' : ''} configured
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.colors.text.tertiary,
                  "hover:text-white/80",
                  ds.effects.transition.normal,
                  "focus:outline-none focus:ring-2 focus:ring-white/20"
                )}
              >
                Cancel
              </button>
              <Button
                onClick={handleSave}
                disabled={saving}
                loading={saving}
                icon={Save}
              >
                {saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Blueprint')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
