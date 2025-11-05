"use client";

import { Plus, X, Zap, Sparkles } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { ds, cn } from '@/components/ds';
import type { PricingBlueprint } from '@/lib/types/product';

interface PricingTier {
  weight?: string;
  qty: number;
  price: string;
}

interface PricingPanelProps {
  productType: 'simple' | 'variable';
  pricingMode: 'single' | 'tiered';
  formData: {
    price: string;
    cost_price: string;
  };
  pricingTiers: PricingTier[];
  newTierWeight: string;
  newTierQty: string;
  newTierPrice: string;
  selectedBlueprintId?: string;
  availableBlueprints?: PricingBlueprint[];
  onPricingModeChange: (mode: 'single' | 'tiered') => void;
  onFormDataChange: (formData: {
    price: string;
    cost_price: string;
  }) => void;
  onNewTierChange: (field: 'weight' | 'qty' | 'price', value: string) => void;
  onAddTier: () => void;
  onUpdateTier: (index: number, field: string, value: string) => void;
  onRemoveTier: (index: number) => void;
  onBlueprintSelect?: (blueprintId: string) => void;
  onApplyBlueprint?: () => void;
}

export default function PricingPanel({
  productType,
  pricingMode,
  formData,
  pricingTiers,
  newTierWeight,
  newTierQty,
  newTierPrice,
  selectedBlueprintId,
  availableBlueprints = [],
  onPricingModeChange,
  onFormDataChange,
  onNewTierChange,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
  onBlueprintSelect,
  onApplyBlueprint
}: PricingPanelProps) {
  console.log('[PricingPanel] Rendering with:', {
    pricingMode,
    availableBlueprints: availableBlueprints.length,
    pricingTiers: pricingTiers.length,
    selectedBlueprintId
  });

  if (productType !== 'simple') return null;

  const costPrice = parseFloat(formData.cost_price);
  const sellingPrice = parseFloat(formData.price);
  const hasValidPrices = costPrice > 0 && sellingPrice > 0;
  const margin = hasValidPrices ? ((sellingPrice - costPrice) / sellingPrice * 100) : 0;
  const profit = hasValidPrices ? (sellingPrice - costPrice) : 0;

  return (
    <div className={cn(ds.components.card, "rounded-2xl")}>
      <SectionHeader>Pricing</SectionHeader>

      <div className="space-y-4">
        {/* Pricing Mode */}
        <div>
          <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
            Pricing Mode <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPricingModeChange('single')}
              className={cn(
                "px-3 py-2.5 rounded-xl border transition-all",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                pricingMode === 'single'
                  ? 'bg-white/10 border-white/20 text-white'
                  : cn(ds.colors.bg.primary, 'border-white/10 text-white/60 hover:border-white/20')
              )}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => onPricingModeChange('tiered')}
              className={cn(
                "px-3 py-2.5 rounded-xl border transition-all",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                pricingMode === 'tiered'
                  ? 'bg-white/10 border-white/20 text-white'
                  : cn(ds.colors.bg.primary, 'border-white/10 text-white/60 hover:border-white/20')
              )}
            >
              Tiered
            </button>
          </div>
        </div>

        {/* Single Price Mode */}
        {pricingMode === 'single' && (
          <>
            {/* COST PRICE (Private - Vendor Only) */}
            <div>
              <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                Cost Price
                <span className="ml-1.5 text-emerald-400 text-[9px]">🔒</span>
              </label>
              <div className="relative">
                <span className={cn("absolute left-3 top-1/2 -translate-y-1/2", ds.typography.size.micro, ds.colors.text.quaternary)}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => onFormDataChange({...formData, cost_price: e.target.value})}
                  placeholder="10.00"
                  className={cn(ds.colors.bg.primary, "w-full border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs")}
                />
              </div>
              <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1.5")}>Private</p>
            </div>

            {/* SELLING PRICE */}
            <div>
              <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                Selling Price <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className={cn("absolute left-3 top-1/2 -translate-y-1/2", ds.typography.size.micro, ds.colors.text.quaternary)}>$</span>
                <input
                  type="number"
                  step="0.01"
                  required={pricingMode === 'single'}
                  value={formData.price}
                  onChange={(e) => onFormDataChange({...formData, price: e.target.value})}
                  placeholder="14.99"
                  className={cn(ds.colors.bg.primary, "w-full border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs")}
                />
              </div>

              {/* SHOW MARGIN CALCULATION */}
              {hasValidPrices && (
                <div className={cn(ds.colors.bg.primary, "mt-2 flex items-center gap-2 border border-white/10 rounded-xl px-3 py-2")}>
                  <div className={cn(
                    ds.typography.size.micro,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    margin >= 40 ? 'text-green-400' : margin >= 25 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {margin.toFixed(1)}%
                  </div>
                  <div className="w-px h-3 bg-white/20" />
                  <div className={cn("text-emerald-400", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
                    ${profit.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tiered Pricing Panel */}
      {pricingMode === 'tiered' && (
        <div className={cn(ds.colors.bg.primary, "mt-4 border border-white/10 rounded-2xl p-4")}>
          <SectionHeader
            as="h3"
            withMargin={false}
            className="mb-3"
          >
            Pricing Tiers
          </SectionHeader>

          {/* Pricing Blueprint Selector */}
          {availableBlueprints.length > 0 && (
            <div className="mb-4">
              <label className={cn("block mb-2", ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                <Sparkles size={10} className="inline mr-1.5 text-purple-400" />
                Pricing Template <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedBlueprintId || ''}
                  onChange={(e) => onBlueprintSelect?.(e.target.value)}
                  className={cn(ds.components.card, "flex-1 rounded-xl text-white text-xs px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all")}
                >
                  <option value="">Select a pricing template...</option>
                  {availableBlueprints.map((blueprint) => (
                    <option key={blueprint.id} value={blueprint.id}>
                      {blueprint.name}
                      {blueprint.quality_tier && ` (${blueprint.quality_tier})`}
                    </option>
                  ))}
                </select>
                {selectedBlueprintId && onApplyBlueprint && (
                  <button
                    type="button"
                    onClick={onApplyBlueprint}
                    className={cn(
                      "px-3 py-2.5 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all",
                      ds.typography.size.micro,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide
                    )}
                  >
                    Apply
                  </button>
                )}
              </div>
              {selectedBlueprintId && (
                <p className={cn("text-purple-400/60 mt-1.5", ds.typography.size.micro)}>
                  {availableBlueprints.find(b => b.id === selectedBlueprintId)?.description || 'Template selected'}
                </p>
              )}
            </div>
          )}

          {/* Pricing Tiers Preview (Read-Only) */}
          {pricingTiers.length > 0 && (
            <div className="space-y-2">
              <h4 className={cn(ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
                Pricing Tiers from Template ({pricingTiers.length})
              </h4>
              <div className="space-y-2">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className={cn(ds.components.card, "rounded-xl px-4 py-3 flex items-center justify-between")}>
                    <div className="text-white/60 text-xs">
                      {tier.weight || `${tier.qty}x`}
                    </div>
                    <div className={cn("text-white", ds.typography.size.sm)}>
                      ${tier.price && !isNaN(parseFloat(tier.price.toString())) ? parseFloat(tier.price.toString()).toFixed(2) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
