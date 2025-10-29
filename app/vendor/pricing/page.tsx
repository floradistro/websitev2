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
  price_breaks: PriceBreak[];
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
            className="text-white/40 hover:text-white transition-all duration-300 text-sm font-light"
          >
            Cost Plus Calculator
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active Configs */}
          {configs.map((config) => {
            if (!config.blueprint) return null;

            const isWholesale = config.blueprint.slug.includes('wholesale');

            return (
              <div key={config.id} className="space-y-12 py-8">
                <SectionHeader
                  title={config.blueprint.name}
                  subtitle={config.blueprint.description || undefined}
                  actions={
                    <button
                      onClick={() => disableConfig(config.id)}
                      disabled={saving}
                      className="text-white/30 hover:text-white transition-all text-sm font-light"
                    >
                      Remove
                    </button>
                  }
                />

                {/* Settings */}
                <div className="space-y-8">
                  <FieldRow
                    label="Pricing mode"
                    description={pricingMode[config.id] === 'cost_plus' ? 'Enter markup amounts to add on top of each product\'s cost. Example: Product cost $1000/lb + $200 markup = $1200/lb final price' : undefined}
                  >
                    <Select
                      value={pricingMode[config.id] || 'fixed'}
                      onChange={(e) => setPricingMode(prev => ({ ...prev, [config.id]: e.target.value as 'fixed' | 'cost_plus' }))}
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="cost_plus">Cost Plus Markup</option>
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
                <div className="space-y-6">
                  {(customTiers[config.id] || config.blueprint.price_breaks)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((priceBreak) => {
                      const currentPrice = editingPrices[config.id]?.[priceBreak.break_id]?.price || '';
                      const tierState = editingPrices[config.id]?.[priceBreak.break_id] || { price: '', enabled: true };
                      const tierEnabled = Boolean(tierState.enabled !== false);

                      return (
                        <div
                          key={priceBreak.break_id}
                          className={`flex items-center gap-6 transition-opacity ${!tierEnabled ? 'opacity-30' : ''}`}
                        >
                          {/* Enable Toggle */}
                          <input
                            type="checkbox"
                            checked={tierEnabled}
                            onChange={() => toggleTierEnabled(config.id, priceBreak.break_id)}
                            className="w-5 h-5 cursor-pointer rounded-sm"
                          />

                          {/* Tier Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-base font-light mb-1">
                              {priceBreak.label}
                            </div>
                            <div className="text-white/40 text-sm font-light">
                              {isWholesale && (priceBreak.min_qty || priceBreak.max_qty) ? (
                                <>
                                  {`${priceBreak.min_qty || 0}–${priceBreak.max_qty || '∞'} ${formatUnit(displayUnits[config.id] || 'pound')}`}
                                  {pricingMode[config.id] === 'cost_plus' && currentPrice && tierEnabled && (
                                    <span className="ml-2 text-white/50">
                                      Cost + ${currentPrice}
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
                                    <span className="ml-2 text-white/50">
                                      Cost + ${currentPrice}
                                    </span>
                                  )}
                                </>
                              ) : ''}
                            </div>
                          </div>

                          {/* Price Input */}
                          <div className="w-40">
                            <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 text-base font-light">
                                {pricingMode[config.id] === 'cost_plus' ? '+$' : '$'}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={currentPrice}
                                onChange={(e) => updatePrice(config.id, priceBreak.break_id, e.target.value)}
                                placeholder={pricingMode[config.id] === 'cost_plus' ? '100' : '1200'}
                                disabled={!tierEnabled}
                                className="w-full bg-transparent border-b border-white/10 text-white text-base font-light pl-8 pr-2 py-3 focus:outline-none focus:border-white/30 disabled:opacity-50 transition-colors"
                              />
                            </div>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeTier(config.id, priceBreak.break_id)}
                            disabled={!tierEnabled}
                            className="text-white/20 hover:text-white transition-all disabled:opacity-10"
                          >
                            <Trash2 size={18} strokeWidth={1} />
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-8 pt-8 border-t border-white/[0.06]">
                  <Button variant="ghost" onClick={() => addTier(config.id)}>
                    <Plus size={18} strokeWidth={1} className="inline mr-2" />
                    Add Tier
                  </Button>
                  <div className="flex-1"></div>
                  <Button onClick={() => saveConfig(config)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Available Blueprints */}
          {availableBlueprints.length > 0 && (
            <div className="space-y-8 pt-16 border-t border-white/[0.06]">
              <h3 className="text-white/40 text-sm font-light">Add pricing structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {availableBlueprints.map((blueprint) => (
                  <div key={blueprint.id} className="group">
                    <h4 className="text-white text-lg font-light mb-2">{blueprint.name}</h4>
                    <p className="text-white/40 text-sm font-light mb-6">{blueprint.description}</p>
                    <button
                      onClick={() => enableBlueprint(blueprint.id)}
                      disabled={saving}
                      className="text-white/40 hover:text-white text-sm font-light transition-all"
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
            <div className="text-center py-32">
              <DollarSign size={64} className="text-white/10 mx-auto mb-6" strokeWidth={1} />
              <p className="text-white/30 text-sm font-light">No pricing structures available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
