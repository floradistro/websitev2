"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, DollarSign, Percent, Save, Calculator } from 'lucide-react';
import Link from 'next/link';
import { showNotification } from '@/components/NotificationToast';

interface MarkupTier {
  tier_id: string;
  tier_name: string;
  min_quantity: number;
  min_quantity_unit: string;
  min_quantity_grams: number;
  markup_type: 'flat' | 'percentage';
  markup_value: number;
  sort_order: number;
}

export default function CostPlusPricingPage() {
  const [loading, setLoading] = useState(false);
  const [exampleCost, setExampleCost] = useState('1000'); // Example cost for preview only
  const [costUnit, setCostUnit] = useState<'pound' | 'ounce' | 'gram'>('pound');
  
  const [markupTiers, setMarkupTiers] = useState<MarkupTier[]>([
    {
      tier_id: 'tier_1',
      tier_name: 'Bulk (10+ lbs)',
      min_quantity: 10,
      min_quantity_unit: 'pound',
      min_quantity_grams: 4536,
      markup_type: 'flat',
      markup_value: 100,
      sort_order: 1
    },
    {
      tier_id: 'tier_2',
      tier_name: 'Standard (5-9 lbs)',
      min_quantity: 5,
      min_quantity_unit: 'pound',
      min_quantity_grams: 2268,
      markup_type: 'flat',
      markup_value: 200,
      sort_order: 2
    },
    {
      tier_id: 'tier_3',
      tier_name: 'Small (1-4 lbs)',
      min_quantity: 1,
      min_quantity_unit: 'pound',
      min_quantity_grams: 453.6,
      markup_type: 'flat',
      markup_value: 300,
      sort_order: 3
    }
  ]);

  // Convert quantity to grams
  function convertToGrams(qty: number, unit: string): number {
    switch(unit) {
      case 'pound':
      case 'lb': return qty * 453.592;
      case 'ounce':
      case 'oz': return qty * 28.3495;
      case 'gram':
      case 'g': return qty;
      default: return qty;
    }
  }

  // Calculate selling price for a tier (using example cost for preview)
  function calculateTierPrice(tier: MarkupTier): number {
    const cost = parseFloat(exampleCost);
    if (tier.markup_type === 'flat') {
      return cost + tier.markup_value;
    } else {
      return cost * (1 + tier.markup_value / 100);
    }
  }

  // Calculate margin percentage
  function calculateMargin(sellingPrice: number): number {
    const cost = parseFloat(exampleCost);
    if (cost === 0) return 0;
    return ((sellingPrice - cost) / sellingPrice) * 100;
  }

  // Add new tier
  function addTier() {
    const newTier: MarkupTier = {
      tier_id: `tier_${markupTiers.length + 1}`,
      tier_name: `Tier ${markupTiers.length + 1}`,
      min_quantity: 1,
      min_quantity_unit: 'pound',
      min_quantity_grams: 453.6,
      markup_type: 'flat',
      markup_value: 0,
      sort_order: markupTiers.length + 1
    };
    setMarkupTiers([...markupTiers, newTier]);
  }

  // Remove tier
  function removeTier(index: number) {
    setMarkupTiers(markupTiers.filter((_, i) => i !== index));
  }

  // Update tier
  function updateTier(index: number, updates: Partial<MarkupTier>) {
    setMarkupTiers(markupTiers.map((tier, i) => {
      if (i === index) {
        const updated = { ...tier, ...updates };
        // Recalculate grams if quantity or unit changed
        if (updates.min_quantity !== undefined || updates.min_quantity_unit !== undefined) {
          updated.min_quantity_grams = convertToGrams(
            updated.min_quantity,
            updated.min_quantity_unit
          );
        }
        return updated;
      }
      return tier;
    }));
  }

  // Save configuration
  async function saveConfiguration() {
    setLoading(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      const config = {
        name: 'Wholesale Flower Cost-Plus Pricing',
        cost_unit: costUnit,
        markup_tiers: markupTiers
      };

      const response = await fetch('/api/vendor/cost-plus-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId || ''
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Saved',
          message: 'Cost-plus pricing configuration saved successfully'
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save configuration'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vendor/pricing"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Pricing
        </Link>
        <h1 className="text-3xl font-light text-white mb-2">Cost-Plus Pricing</h1>
        <p className="text-white/60 text-sm">
          Set your cost and markup tiers. Prices calculate automatically.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 mb-6">
        <h3 className="text-blue-400 font-medium mb-2">How Cost-Plus Pricing Works</h3>
        <ul className="text-white/60 text-sm space-y-2">
          <li>• <strong>Each product has its own cost</strong> - You'll enter cost when adding/editing products</li>
          <li>• <strong>Define your markup strategy here</strong> - These markup tiers apply to all products</li>
          <li>• <strong>Prices calculate automatically</strong> - Product cost + markup tier = selling price</li>
          <li>• <strong>Volume discounts built-in</strong> - Higher quantities get lower markups</li>
        </ul>
      </div>

      {/* Example Cost (for preview only) */}
      <div className="bg-black border border-white/5 p-6 mb-6">
        <h2 className="text-white font-medium mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-white/60" />
          Preview Calculator
          <span className="ml-2 text-white/40 text-xs">(Example cost for preview only)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/80 text-sm mb-2">
              Example Product Cost
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
              <input
                type="number"
                step="0.01"
                value={exampleCost}
                onChange={(e) => setExampleCost(e.target.value)}
                placeholder="1000.00"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded-[14px] focus:outline-none focus:border-white/20"
              />
            </div>
            <p className="text-white/40 text-xs mt-1">
              For preview only - actual costs set per product
            </p>
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">
              Cost Unit
            </label>
            <select
              value={costUnit}
              onChange={(e) => setCostUnit(e.target.value as 'pound' | 'ounce' | 'gram')}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/20"
            >
              <option value="pound">Per Pound (lb)</option>
              <option value="ounce">Per Ounce (oz)</option>
              <option value="gram">Per Gram (g)</option>
            </select>
            <p className="text-white/40 text-xs mt-1">
              Default unit for your products
            </p>
          </div>
        </div>
      </div>

      {/* Markup Tiers */}
      <div className="bg-black border border-white/5 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-medium flex items-center gap-2">
            <DollarSign size={20} className="text-white/60" />
            Markup Tiers
          </h2>
          <button
            onClick={addTier}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <Plus size={16} />
            Add Tier
          </button>
        </div>

        <p className="text-white/60 text-sm mb-6">
          Define your markup tiers. Higher quantities get lower markups (better prices for bulk buyers).
        </p>

        {/* Tiers List */}
        <div className="space-y-4">
          {markupTiers.map((tier, index) => {
            const sellingPrice = calculateTierPrice(tier);
            const margin = calculateMargin(sellingPrice);
            
            return (
              <div key={tier.tier_id} className="bg-white/5 border border-white/10 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black border border-white/20 flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={tier.tier_name}
                        onChange={(e) => updateTier(index, { tier_name: e.target.value })}
                        placeholder="Tier Name"
                        className="bg-transparent border-none text-white font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeTier(index)}
                    className="text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Minimum Quantity */}
                  <div>
                    <label className="block text-white/60 text-xs mb-2">Min Quantity</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.min_quantity}
                      onChange={(e) => updateTier(index, { min_quantity: parseFloat(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-[14px] focus:outline-none focus:border-white/20"
                    />
                  </div>

                  {/* Quantity Unit */}
                  <div>
                    <label className="block text-white/60 text-xs mb-2">Unit</label>
                    <select
                      value={tier.min_quantity_unit}
                      onChange={(e) => updateTier(index, { min_quantity_unit: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-[14px] focus:outline-none focus:border-white/20"
                    >
                      <option value="pound">Pounds</option>
                      <option value="ounce">Ounces</option>
                      <option value="gram">Grams</option>
                    </select>
                  </div>

                  {/* Markup Type */}
                  <div>
                    <label className="block text-white/60 text-xs mb-2">Markup Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTier(index, { markup_type: 'flat' })}
                        className={`flex-1 px-3 py-2 text-xs border transition-all ${
                          tier.markup_type === 'flat'
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <DollarSign size={14} className="inline" /> Flat
                      </button>
                      <button
                        onClick={() => updateTier(index, { markup_type: 'percentage' })}
                        className={`flex-1 px-3 py-2 text-xs border transition-all ${
                          tier.markup_type === 'percentage'
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Percent size={14} className="inline" /> %
                      </button>
                    </div>
                  </div>

                  {/* Markup Value */}
                  <div>
                    <label className="block text-white/60 text-xs mb-2">
                      {tier.markup_type === 'flat' ? 'Markup Amount' : 'Markup %'}
                    </label>
                    <div className="relative">
                      {tier.markup_type === 'flat' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">$</span>
                      )}
                      <input
                        type="number"
                        step={tier.markup_type === 'flat' ? '1' : '0.1'}
                        value={tier.markup_value}
                        onChange={(e) => updateTier(index, { markup_value: parseFloat(e.target.value) || 0 })}
                        className={`w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-[14px] focus:outline-none focus:border-white/20 ${
                          tier.markup_type === 'flat' ? 'pl-7' : ''
                        }`}
                      />
                      {tier.markup_type === 'percentage' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calculated Price Display */}
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-white/40 text-xs mb-1">Selling Price</div>
                    <div className="text-white text-lg font-medium">
                      ${sellingPrice.toFixed(2)}
                      <span className="text-white/40 text-sm ml-1">/{costUnit}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">Margin</div>
                    <div className={`text-lg font-medium ${
                      margin >= 40 ? 'text-green-400' :
                      margin >= 25 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {margin.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">Profit</div>
                    <div className="text-green-400 text-lg font-medium">
                      ${(sellingPrice - parseFloat(exampleCost)).toFixed(2)}
                      <span className="text-white/40 text-sm ml-1">/{costUnit}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {markupTiers.length < 10 && (
          <button
            onClick={addTier}
            className="w-full mt-4 py-3 border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Another Tier
          </button>
        )}
      </div>

      {/* Preview / Summary */}
      <div className="bg-black border border-white/5 p-6 mb-6">
        <h2 className="text-white font-medium mb-4">Pricing Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Example Product Cost:</span>
            <span className="text-white font-medium">${parseFloat(exampleCost).toFixed(2)}/{costUnit}</span>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="text-white/60 text-xs mb-3">Your Pricing Tiers (Lowest to Highest Markup):</div>
            <div className="space-y-2">
              {[...markupTiers]
                .sort((a, b) => a.markup_value - b.markup_value)
                .map((tier, index) => {
                  const price = calculateTierPrice(tier);
                  const margin = calculateMargin(price);
                  
                  return (
                    <div key={tier.tier_id} className="flex items-center justify-between bg-white/5 px-4 py-2">
                      <div className="text-sm text-white">
                        <span className="font-medium">{tier.tier_name}</span>
                        <span className="text-white/40 ml-2">
                          ({tier.min_quantity}+ {tier.min_quantity_unit})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-white/40">Markup:</span>
                          <span className="text-white ml-2">
                            {tier.markup_type === 'flat' ? `+$${tier.markup_value}` : `+${tier.markup_value}%`}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-white/40">Price:</span>
                          <span className="text-white font-medium ml-2">${price.toFixed(2)}</span>
                        </div>
                        <div className={`text-sm font-medium ${
                          margin >= 40 ? 'text-green-400' :
                          margin >= 25 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {margin.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="text-white/60 text-xs mb-2">Example: Customer buying 10 lbs</div>
            <div className="text-sm">
              {(() => {
                // Find the tier for 10 lbs
                const applicableTier = [...markupTiers]
                  .sort((a, b) => b.min_quantity_grams - a.min_quantity_grams)
                  .find(tier => convertToGrams(10, 'lb') >= tier.min_quantity_grams);
                
                if (applicableTier) {
                  const price = calculateTierPrice(applicableTier);
                  return (
                    <div className="bg-white/5 border border-white/10 px-4 py-3">
                      <div className="text-white">
                        Qualifies for: <span className="font-medium">{applicableTier.tier_name}</span>
                      </div>
                      <div className="text-white/60 mt-1">
                        Price: <span className="text-white font-medium">${price.toFixed(2)}/{costUnit}</span>
                        {' × '}10 {costUnit} = <span className="text-green-400 font-medium">${(price * 10).toFixed(2)} total</span>
                      </div>
                    </div>
                  );
                }
                return <div className="text-white/40">No applicable tier</div>;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveConfiguration}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
        <Link
          href="/vendor/pricing"
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* Help Text */}
      <div className="mt-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 p-6">
        <h3 className="text-green-400 font-medium mb-3">Complete Workflow</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-white/60">
          <div>
            <h4 className="text-white mb-2">1. Configure Markup Strategy (Here)</h4>
            <ul className="space-y-1 text-xs">
              <li>• Define your markup tiers</li>
              <li>• Tier 1: +$100 (bulk orders)</li>
              <li>• Tier 2: +$200 (standard)</li>
              <li>• Tier 3: +$300 (small orders)</li>
              <li>• Save configuration</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-2">2. Add Products with Costs</h4>
            <ul className="space-y-1 text-xs">
              <li>• Blue Dream: Cost $1,000/lb</li>
              <li>• Gelato 33: Cost $1,500/lb</li>
              <li>• OG Kush: Cost $800/lb</li>
              <li>• System applies YOUR markup tiers</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-2">3. Automatic Pricing</h4>
            <ul className="space-y-1 text-xs">
              <li>• Blue Dream Tier 1: $1,100/lb</li>
              <li>• Gelato 33 Tier 1: $1,600/lb</li>
              <li>• OG Kush Tier 1: $900/lb</li>
              <li>• Each product, same markup strategy!</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-2">4. Update Costs Anytime</h4>
            <ul className="space-y-1 text-xs">
              <li>• Supplier raises Blue Dream to $1,100</li>
              <li>• Update cost in product</li>
              <li>• Tier prices auto-recalculate</li>
              <li>• Tier 1: $1,200, Tier 2: $1,300, etc.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

