"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, Save, Edit2, Trash2, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { showSuccess, showError } from '@/components/NotificationToast';

interface PriceBreak {
  break_id: string;
  label: string;
  qty?: number;
  unit?: string;
  min_qty?: number;
  max_qty?: number;
  discount_percent?: number;
  discount_expected?: number;
  sort_order: number;
}

interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier_type: string;
  price_breaks: PriceBreak[];
  is_active: boolean;
  display_order: number;
}

interface PricingConfig {
  id: string;
  vendor_id: string;
  blueprint_id: string;
  pricing_values: { [breakId: string]: { price?: string; discount_percent?: string; enabled: boolean } };
  notes: string | null;
  is_active: boolean;
  blueprint?: Blueprint;
  created_at: string;
  updated_at: string;
}

export default function VendorPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [availableBlueprints, setAvailableBlueprints] = useState<Blueprint[]>([]);
  const [editingConfig, setEditingConfig] = useState<Partial<PricingConfig> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);

  useEffect(() => {
    loadVendorInfo();
  }, []);

  async function loadVendorInfo() {
    try {
      const res = await fetch('/api/auth/vendor-check');
      const data = await res.json();

      if (!data.isVendor || !data.vendorId) {
        router.push('/vendor/login');
        return;
      }

      setVendorId(data.vendorId);
      loadPricingData(data.vendorId);
    } catch (error) {
      console.error('Error loading vendor info:', error);
      showError('Failed to load vendor information');
    }
  }

  async function loadPricingData(vId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/pricing-config?vendor_id=${vId}`);
      const data = await res.json();

      if (data.success) {
        setConfigs(data.configs);
        setAvailableBlueprints(data.available_blueprints);
      } else {
        showError(data.error || 'Failed to load pricing data');
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      showError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }

  function handleNewConfig(blueprint: Blueprint) {
    // Initialize pricing values with all breaks disabled
    const initialValues: any = {};
    blueprint.price_breaks.forEach((priceBreak) => {
      initialValues[priceBreak.break_id] = {
        price: '',
        discount_percent: '',
        enabled: false
      };
    });

    setEditingConfig({
      vendor_id: vendorId!,
      blueprint_id: blueprint.id,
      pricing_values: initialValues,
      notes: '',
      is_active: true
    });
    setSelectedBlueprint(blueprint);
    setShowEditor(true);
  }

  function handleEditConfig(config: PricingConfig) {
    setEditingConfig({ ...config });
    setSelectedBlueprint(config.blueprint || null);
    setShowEditor(true);
  }

  async function handleSaveConfig() {
    if (!editingConfig || !editingConfig.vendor_id || !editingConfig.blueprint_id) {
      showError('Missing required fields');
      return;
    }

    // Validate at least one price break is enabled
    const hasEnabledBreak = Object.values(editingConfig.pricing_values || {}).some(
      (v: any) => v.enabled && (v.price || v.discount_percent)
    );

    if (!hasEnabledBreak) {
      showError('Please enable and configure at least one price break');
      return;
    }

    try {
      const method = editingConfig.id ? 'PUT' : 'POST';
      const res = await fetch('/api/vendor/pricing-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfig)
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(`Pricing configuration ${editingConfig.id ? 'updated' : 'created'} successfully`);
        setShowEditor(false);
        setEditingConfig(null);
        setSelectedBlueprint(null);
        if (vendorId) loadPricingData(vendorId);
      } else {
        showError(data.error || 'Failed to save pricing configuration');
      }
    } catch (error) {
      console.error('Error saving pricing config:', error);
      showError('Failed to save pricing configuration');
    }
  }

  async function handleDeleteConfig(id: string) {
    if (!confirm('Are you sure you want to delete this pricing configuration?')) return;

    try {
      const res = await fetch(`/api/vendor/pricing-config?id=${id}&vendor_id=${vendorId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Pricing configuration deleted successfully');
        if (vendorId) loadPricingData(vendorId);
      } else {
        showError(data.error || 'Failed to delete pricing configuration');
      }
    } catch (error) {
      console.error('Error deleting pricing config:', error);
      showError('Failed to delete pricing configuration');
    }
  }

  function updatePricingValue(breakId: string, field: 'price' | 'discount_percent' | 'enabled', value: any) {
    if (!editingConfig) return;

    const currentValues = editingConfig.pricing_values || {};
    const currentBreak = currentValues[breakId] || { price: '', discount_percent: '', enabled: false };

    setEditingConfig({
      ...editingConfig,
      pricing_values: {
        ...currentValues,
        [breakId]: {
          ...currentBreak,
          [field]: value
        }
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Pricing Configuration</h1>
          </div>
          <p className="text-white/60">
            Configure your pricing for different tier blueprints. Set your prices to match your business strategy.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111111] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-white/60 text-sm">Configured Tiers</span>
            </div>
            <div className="text-3xl font-bold">{configs.length}</div>
          </div>

          <div className="bg-[#111111] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-white/60 text-sm">Active Configs</span>
            </div>
            <div className="text-3xl font-bold">{configs.filter(c => c.is_active).length}</div>
          </div>

          <div className="bg-[#111111] border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="text-white/60 text-sm">Available Blueprints</span>
            </div>
            <div className="text-3xl font-bold">{availableBlueprints.length}</div>
          </div>
        </div>

        {/* Available Blueprints */}
        {availableBlueprints.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Available Pricing Blueprints</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBlueprints.map((blueprint) => (
                <div key={blueprint.id} className="bg-[#111111] border border-white/10 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{blueprint.name}</h3>
                      <p className="text-sm text-white/60 mb-2">{blueprint.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-white/10 text-white/60">
                          {blueprint.tier_type}
                        </span>
                        <span className="text-xs text-white/40">
                          {blueprint.price_breaks.length} price breaks
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNewConfig(blueprint)}
                      className="bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configured Pricing */}
        <div>
          <h2 className="text-xl font-bold mb-4">Your Pricing Configurations</h2>
          
          {configs.length === 0 ? (
            <div className="bg-[#111111] border border-white/10 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 mb-4">No pricing configurations yet</p>
              <p className="text-sm text-white/60">
                Configure pricing blueprints above to set your product prices
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="bg-[#111111] border border-white/10">
                  <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium">{config.blueprint?.name}</h3>
                        {!config.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-white/10 text-white/60">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60">{config.blueprint?.description}</p>
                      {config.notes && (
                        <p className="text-xs text-white/40 mt-1">{config.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditConfig(config)}
                        className="p-2 hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {config.blueprint?.price_breaks
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((priceBreak) => {
                          const value = config.pricing_values[priceBreak.break_id];
                          if (!value || !value.enabled) return null;

                          return (
                            <div key={priceBreak.break_id} className="bg-black/40 border border-white/10 p-3">
                              <div className="text-xs text-white/60 mb-1">{priceBreak.label}</div>
                              <div className="text-lg font-medium">
                                {value.price && `$${parseFloat(value.price).toFixed(2)}`}
                                {value.discount_percent && `-${value.discount_percent}%`}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && editingConfig && selectedBlueprint && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-white/10 w-full max-w-4xl my-8">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold mb-2">
                {editingConfig.id ? 'Edit' : 'Configure'} Pricing: {selectedBlueprint.name}
              </h2>
              <p className="text-sm text-white/60">{selectedBlueprint.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-white/10 text-white/60">
                  {selectedBlueprint.tier_type}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Price Breaks */}
              <div>
                <h3 className="font-medium mb-4">Configure Your Prices</h3>
                <div className="space-y-3">
                  {selectedBlueprint.price_breaks
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((priceBreak) => {
                      const value = editingConfig.pricing_values?.[priceBreak.break_id] || {
                        price: '',
                        discount_percent: '',
                        enabled: false
                      };

                      return (
                        <div key={priceBreak.break_id} className="bg-black/40 border border-white/10 p-4">
                          <div className="flex items-start gap-4">
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={value.enabled}
                                onChange={(e) => updatePricingValue(priceBreak.break_id, 'enabled', e.target.checked)}
                                className="w-5 h-5"
                              />
                            </label>

                            <div className="flex-1">
                              <div className="font-medium mb-1">{priceBreak.label}</div>
                              <div className="text-xs text-white/60 mb-3">
                                {priceBreak.qty && `${priceBreak.qty}${priceBreak.unit || ''}`}
                                {priceBreak.min_qty && `${priceBreak.min_qty}-${priceBreak.max_qty || '∞'} units`}
                                {priceBreak.discount_expected && ` • Expected ~${priceBreak.discount_expected}% discount`}
                              </div>

                              {value.enabled && (
                                <div className="grid grid-cols-2 gap-3">
                                  {selectedBlueprint.tier_type !== 'percentage' && (
                                    <div>
                                      <label className="block text-xs text-white/60 mb-1">Price ($)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value.price || ''}
                                        onChange={(e) => updatePricingValue(priceBreak.break_id, 'price', e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  )}
                                  
                                  {(selectedBlueprint.tier_type === 'percentage' || selectedBlueprint.tier_type === 'quantity') && (
                                    <div>
                                      <label className="block text-xs text-white/60 mb-1">Discount (%)</label>
                                      <input
                                        type="number"
                                        step="1"
                                        value={value.discount_percent || ''}
                                        onChange={(e) => updatePricingValue(priceBreak.break_id, 'discount_percent', e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                                        placeholder="0"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm mb-2">Notes (Optional)</label>
                <textarea
                  value={editingConfig.notes || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, notes: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white h-20"
                  placeholder="Add any notes about your pricing strategy..."
                />
              </div>

              {/* Active Toggle */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingConfig.is_active}
                    onChange={(e) => setEditingConfig({ ...editingConfig, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active (pricing will be used for products)</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingConfig(null);
                  setSelectedBlueprint(null);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

