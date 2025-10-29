"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Calculator, Plus, Trash2 } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import PageHeader, { SectionHeader, FieldRow, Input, Select, Button } from '@/components/dashboard/PageHeader';

// Unit conversion utilities
const CONVERSIONS: any = {
  gram: 1,
  ounce: 28.3495,
  pound: 453.592,
  kilogram: 1000,
  milliliter: 1,
  liter: 1000,
  fluid_ounce: 29.5735,
  gallon: 3785.41
};

function convertUnits(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;
  const baseValue = value * (CONVERSIONS[fromUnit] || 1);
  return baseValue / (CONVERSIONS[toUnit] || 1);
}

function formatUnit(unit: string): string {
  const labels: any = {
    'milligram': 'mg', 'gram': 'g', 'ounce': 'oz', 'pound': 'lb', 'kilogram': 'kg',
    'milliliter': 'ml', 'liter': 'L', 'fluid_ounce': 'fl oz', 'gallon': 'gal'
  };
  return labels[unit] || unit;
}

interface PriceBreak {
  break_id: string;
  label: string;
  qty?: number;
  unit?: string;
  min_qty?: number;
  max_qty?: number | null;
  sort_order: number;
}

interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier_type: string;
  context: string;
  price_breaks: PriceBreak[];
  applicable_to_categories?: string[];
}

interface PricingConfig {
  id: string;
  vendor_id: string;
  blueprint_id: string;
  pricing_values: { [breakId: string]: { price?: string; enabled: boolean } };
  is_active: boolean;
  blueprint?: Blueprint;
  display_unit?: string;
}

export default function VendorPricingPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [availableBlueprints, setAvailableBlueprints] = useState<Blueprint[]>([]);
  const [editingPrices, setEditingPrices] = useState<{ [configId: string]: any }>({});
  const [customTiers, setCustomTiers] = useState<{ [configId: string]: PriceBreak[] }>({});
  const [displayUnits, setDisplayUnits] = useState<{ [configId: string]: string }>({});
  const [pricingMode, setPricingMode] = useState<{ [configId: string]: 'fixed' | 'cost_plus' }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const vendorId = vendor?.id;
      if (vendorId) {
        loadPricingData(vendorId);
      }
    }
  }, [authLoading, isAuthenticated]);

  async function loadPricingData(vendorId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/pricing-config?vendor_id=${vendorId}`);
      const data = await res.json();

      if (data.success) {
        setConfigs(data.configs || []);
        setAvailableBlueprints(data.available_blueprints || []);

        const initialEditing: any = {};
        const initialTiers: any = {};
        const initialUnits: any = {};
        const initialModes: any = {};

        data.configs?.forEach((config: PricingConfig) => {
          const pricingVals = config.pricing_values || {};
          const initializedVals: any = {};

          config.blueprint?.price_breaks.forEach(pb => {
            const existingVal = pricingVals[pb.break_id];
            initializedVals[pb.break_id] = {
              price: existingVal?.price || '',
              enabled: existingVal?.enabled !== undefined ? existingVal.enabled : true
            };
          });

          initialEditing[config.id] = initializedVals;
          initialTiers[config.id] = config.blueprint?.price_breaks || [];

          const isWholesale = config.blueprint?.slug.includes('wholesale');
          initialUnits[config.id] = config.display_unit || (isWholesale ? 'pound' : 'gram');
          initialModes[config.id] = isWholesale ? 'cost_plus' : 'fixed';
        });

        setEditingPrices(initialEditing);
        setCustomTiers(initialTiers);
        setDisplayUnits(initialUnits);
        setPricingMode(initialModes);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  }

  function addTier(configId: string) {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    const currentTiers = customTiers[configId] || [];
    const nextOrder = currentTiers.length + 1;
    const isWholesale = config.blueprint?.slug.includes('wholesale');

    const newTier: PriceBreak = {
      break_id: `custom_tier_${nextOrder}_${Date.now()}`,
      label: isWholesale ? `Tier ${nextOrder}` : `Custom ${nextOrder}`,
      min_qty: isWholesale ? nextOrder * 10 : undefined,
      max_qty: isWholesale ? null : undefined,
      qty: isWholesale ? undefined : 1,
      unit: isWholesale ? 'lb' : 'g',
      sort_order: nextOrder
    };

    setCustomTiers(prev => ({
      ...prev,
      [configId]: [...currentTiers, newTier]
    }));
  }

  function removeTier(configId: string, breakId: string) {
    setCustomTiers(prev => ({
      ...prev,
      [configId]: prev[configId].filter(t => t.break_id !== breakId)
    }));

    setEditingPrices(prev => {
      const updated = { ...prev };
      if (updated[configId]) {
        delete updated[configId][breakId];
      }
      return updated;
    });
  }

  function updateTier(configId: string, breakId: string, updates: Partial<PriceBreak>) {
    setCustomTiers(prev => ({
      ...prev,
      [configId]: prev[configId].map(tier =>
        tier.break_id === breakId ? { ...tier, ...updates } : tier
      )
    }));
  }

  async function enableBlueprint(blueprintId: string) {
    const vendorId = vendor?.id;
    if (!vendorId) return;

    const blueprint = availableBlueprints.find(b => b.id === blueprintId);
    if (!blueprint) return;

    const initialPricingValues: any = {};
    blueprint.price_breaks.forEach(pb => {
      initialPricingValues[pb.break_id] = {
        price: '',
        enabled: true
      };
    });

    const isWholesale = blueprint.slug.includes('wholesale');

    try {
      setSaving(true);
      const response = await fetch('/api/vendor/pricing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          blueprint_id: blueprintId,
          pricing_values: initialPricingValues,
          display_unit: isWholesale ? 'pound' : 'gram',
          pricing_mode: isWholesale ? 'cost_plus' : 'fixed',
          is_active: true
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Pricing Enabled',
          message: 'Configure your prices below'
        });
        loadPricingData(vendorId);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to enable pricing'
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveConfig(config: PricingConfig) {
    const vendorId = vendor?.id;
    if (!vendorId) return;

    const prices = editingPrices[config.id] || {};
    const hasAtLeastOnePrice = Object.values(prices).some((p: any) =>
      p.enabled !== false && p.price && parseFloat(p.price) > 0
    );

    if (!hasAtLeastOnePrice) {
      showNotification({
        type: 'warning',
        title: 'No Active Prices',
        message: 'Please enable and set at least one tier price'
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/vendor/pricing-config/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing_values: editingPrices[config.id],
          custom_price_breaks: customTiers[config.id],
          display_unit: displayUnits[config.id],
          pricing_mode: pricingMode[config.id],
          is_active: true
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Saved',
          message: 'Your pricing has been updated'
        });
        loadPricingData(vendorId);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save pricing'
      });
    } finally {
      setSaving(false);
    }
  }

  function updatePrice(configId: string, breakId: string, price: string) {
    setEditingPrices(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        [breakId]: {
          ...prev[configId]?.[breakId],
          price,
          enabled: prev[configId]?.[breakId]?.enabled !== false
        }
      }
    }));
  }

  function toggleTierEnabled(configId: string, breakId: string) {
    setEditingPrices(prev => {
      const current = prev[configId]?.[breakId] || {};
      const currentEnabled = current.enabled === true || current.enabled === undefined;

      return {
        ...prev,
        [configId]: {
          ...prev[configId],
          [breakId]: {
            price: current.price || '',
            enabled: !currentEnabled
          }
        }
      };
    });
  }

  async function disableConfig(configId: string) {
    const vendorId = vendor?.id;
    if (!vendorId) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/vendor/pricing-config/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });

      const data = await response.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Disabled',
          message: 'Pricing has been disabled'
        });
        loadPricingData(vendorId);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to disable pricing'
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full px-4 lg:px-0">
      <PageHeader
        title="Pricing"
        subtitle="Configure your pricing tiers"
        icon={DollarSign}
        actions={
          <Link
            href="/vendor/cost-plus-pricing"
            className="text-white/40 hover:text-white transition-all text-[10px] uppercase tracking-[0.15em]"
          >
            Cost Plus
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <div className="flex gap-1 mr-3">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em]">Loading pricing</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Group configs by master context */}
          {(() => {
            // Group configs by context
            const groupedConfigs: Record<string, PricingConfig[]> = {};
            configs.forEach(config => {
              if (!config.blueprint) return;
              const context = config.blueprint.context || 'retail';
              if (!groupedConfigs[context]) {
                groupedConfigs[context] = [];
              }
              groupedConfigs[context].push(config);
            });

            // Define master group order and labels
            const masterGroups = [
              { key: 'retail', label: 'Retail Pricing', description: 'Direct-to-consumer pricing tiers', icon: '🛍️' },
              { key: 'wholesale', label: 'Wholesale Pricing', description: 'Business-to-business bulk pricing', icon: '📦' },
              { key: 'distributor', label: 'Distributor Pricing', description: 'Large volume distribution pricing', icon: '🚚' }
            ];

            return masterGroups.map(masterGroup => {
              const groupConfigs = groupedConfigs[masterGroup.key] || [];
              if (groupConfigs.length === 0) return null;

              return (
                <div key={masterGroup.key} className="space-y-6">
                  {/* Master Group Header */}
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{masterGroup.icon}</span>
                      <div>
                        <h2 className="text-white text-xl font-thin tracking-tight">
                          {masterGroup.label}
                        </h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                          {masterGroup.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Tiers within this Master Group */}
                  {groupConfigs.map((config) => {
                    if (!config.blueprint) return null;

                    const isWholesale = config.blueprint.slug.includes('wholesale');

                    return (
                      <div key={config.id} className="space-y-6 mb-8 pl-6 border-l-2 border-white/10">
                <SectionHeader
                  title={config.blueprint.name}
                  subtitle={config.blueprint.description || undefined}
                  actions={
                    <button
                      onClick={() => disableConfig(config.id)}
                      disabled={saving}
                      className="text-white/40 hover:text-red-400 transition-all text-[10px] uppercase tracking-[0.15em]"
                    >
                      Remove
                    </button>
                  }
                />

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow
                    label="Pricing mode"
                    description={pricingMode[config.id] === 'cost_plus' ? 'Markup added to product cost' : undefined}
                  >
                    <Select
                      value={pricingMode[config.id] || 'fixed'}
                      onChange={(e) => setPricingMode(prev => ({ ...prev, [config.id]: e.target.value as 'fixed' | 'cost_plus' }))}
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="cost_plus">Cost Plus</option>
                    </Select>
                  </FieldRow>

                  <FieldRow label="Unit of measure">
                    <Select
                      value={displayUnits[config.id] || 'gram'}
                      onChange={(e) => setDisplayUnits(prev => ({ ...prev, [config.id]: e.target.value }))}
                    >
                      <optgroup label="Weight">
                        <option value="gram">Grams</option>
                        <option value="ounce">Ounces</option>
                        <option value="pound">Pounds</option>
                        <option value="kilogram">Kilograms</option>
                      </optgroup>
                      <optgroup label="Volume">
                        <option value="milliliter">Milliliters</option>
                        <option value="liter">Liters</option>
                        <option value="fluid_ounce">Fluid Ounces</option>
                        <option value="gallon">Gallons</option>
                      </optgroup>
                    </Select>
                  </FieldRow>
                </div>

                {/* Price Tiers */}
                <div className="space-y-2">
                  {(customTiers[config.id] || config.blueprint.price_breaks)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((priceBreak) => {
                      const currentPrice = editingPrices[config.id]?.[priceBreak.break_id]?.price || '';
                      const tierState = editingPrices[config.id]?.[priceBreak.break_id] || { price: '', enabled: true };
                      const tierEnabled = Boolean(tierState.enabled !== false);

                      return (
                        <div
                          key={priceBreak.break_id}
                          className={`bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-3 transition-all ${!tierEnabled ? 'opacity-30' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Enable Toggle */}
                            <input
                              type="checkbox"
                              checked={tierEnabled}
                              onChange={() => toggleTierEnabled(config.id, priceBreak.break_id)}
                              className="w-4 h-4 cursor-pointer rounded mt-0.5 flex-shrink-0"
                            />

                            {/* Tier Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-black text-xs uppercase tracking-tight mb-1" style={{ fontWeight: 900 }}>
                                {priceBreak.label}
                              </div>
                              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                                {isWholesale && (priceBreak.min_qty || priceBreak.max_qty) ? (
                                  <>
                                    {`${priceBreak.min_qty || 0}–${priceBreak.max_qty || '∞'} ${formatUnit(displayUnits[config.id] || 'pound')}`}
                                    {pricingMode[config.id] === 'cost_plus' && currentPrice && tierEnabled && (
                                      <span className="ml-2 text-green-400">
                                        +${currentPrice}
                                      </span>
                                    )}
                                  </>
                                ) : priceBreak.qty && priceBreak.unit ? (
                                  <>
                                    {`${(() => {
                                      const currentUnit = displayUnits[config.id] || 'gram';
                                      const converted = convertUnits(priceBreak.qty, priceBreak.unit, currentUnit);
                                      return `${converted.toFixed(converted < 1 ? 3 : converted < 10 ? 2 : 1)}${formatUnit(currentUnit)}`;
                                    })()}`}
                                    {pricingMode[config.id] === 'cost_plus' && currentPrice && tierEnabled && (
                                      <span className="ml-2 text-green-400">
                                        +${currentPrice}
                                      </span>
                                    )}
                                  </>
                                ) : ''}
                              </div>
                            </div>

                            {/* Price Input */}
                            <div className="w-32 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] uppercase tracking-[0.15em]">
                                {pricingMode[config.id] === 'cost_plus' ? '+$' : '$'}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={currentPrice}
                                onChange={(e) => updatePrice(config.id, priceBreak.break_id, e.target.value)}
                                placeholder={pricingMode[config.id] === 'cost_plus' ? '100' : '1200'}
                                disabled={!tierEnabled}
                                className="w-full bg-white/5 border border-white/10 text-white pl-9 pr-3 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-all hover:bg-white/10"
                              />
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeTier(config.id, priceBreak.break_id)}
                              disabled={!tierEnabled}
                              className="text-white/40 hover:text-red-400 text-sm w-6 h-6 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all disabled:opacity-20"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <Button variant="secondary" onClick={() => addTier(config.id)}>
                    <Plus size={14} strokeWidth={2} className="inline mr-1" />
                    Add Tier
                  </Button>
                  <Button onClick={() => saveConfig(config)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
                    );
                  })}
                </div>
              );
            });
          })()}

          {/* Available Blueprints */}
          {availableBlueprints.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-white/5">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Add pricing structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableBlueprints.map((blueprint) => (
                  <div key={blueprint.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
                    <h4 className="text-white font-black text-xs uppercase tracking-tight mb-1" style={{ fontWeight: 900 }}>{blueprint.name}</h4>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-3">{blueprint.description}</p>
                    <button
                      onClick={() => enableBlueprint(blueprint.id)}
                      disabled={saving}
                      className="bg-white text-black px-4 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all disabled:opacity-50"
                      style={{ fontWeight: 900 }}
                    >
                      Enable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {configs.length === 0 && availableBlueprints.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">💰</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/60">No pricing structures available</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
