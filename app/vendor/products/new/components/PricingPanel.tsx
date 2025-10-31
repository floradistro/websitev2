"use client";

import { Plus, X, Zap } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

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
  onPricingModeChange: (mode: 'single' | 'tiered') => void;
  onFormDataChange: (formData: any) => void;
  onNewTierChange: (field: 'weight' | 'qty' | 'price', value: string) => void;
  onAddTier: () => void;
  onUpdateTier: (index: number, field: string, value: string) => void;
  onRemoveTier: (index: number) => void;
  onApplyTemplate: (template: 'budget' | 'mid' | 'premium' | 'exotic') => void;
}

export default function PricingPanel({
  productType,
  pricingMode,
  formData,
  pricingTiers,
  newTierWeight,
  newTierQty,
  newTierPrice,
  onPricingModeChange,
  onFormDataChange,
  onNewTierChange,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
  onApplyTemplate
}: PricingPanelProps) {
  if (productType !== 'simple') return null;

  const costPrice = parseFloat(formData.cost_price);
  const sellingPrice = parseFloat(formData.price);
  const hasValidPrices = costPrice > 0 && sellingPrice > 0;
  const margin = hasValidPrices ? ((sellingPrice - costPrice) / sellingPrice * 100) : 0;
  const profit = hasValidPrices ? (sellingPrice - costPrice) : 0;

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
      <SectionHeader>Pricing</SectionHeader>

      <div className="space-y-4">
        {/* Pricing Mode */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            Pricing Mode <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPricingModeChange('single')}
              className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                pricingMode === 'single'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => onPricingModeChange('tiered')}
              className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                pricingMode === 'tiered'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
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
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Cost Price
                <span className="ml-1.5 text-emerald-400 text-[9px]">🔒</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => onFormDataChange({...formData, cost_price: e.target.value})}
                  placeholder="10.00"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
                />
              </div>
              <p className="text-white/40 text-[10px] mt-1.5">Private</p>
            </div>

            {/* SELLING PRICE */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Selling Price <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  required={pricingMode === 'single'}
                  value={formData.price}
                  onChange={(e) => onFormDataChange({...formData, price: e.target.value})}
                  placeholder="14.99"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
                />
              </div>

              {/* SHOW MARGIN CALCULATION */}
              {hasValidPrices && (
                <div className="mt-2 flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2">
                  <div className={`font-black text-[10px] uppercase tracking-[0.15em] ${
                    margin >= 40 ? 'text-green-400' : margin >= 25 ? 'text-yellow-400' : 'text-red-400'
                  }`} style={{ fontWeight: 900 }}>
                    {margin.toFixed(1)}%
                  </div>
                  <div className="w-px h-3 bg-white/20" />
                  <div className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
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
        <div className="mt-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-4">
          <SectionHeader
            as="h3"
            withMargin={false}
            className="mb-3"
            rightContent={
              <div className="flex items-center gap-1.5">
                <Zap size={11} strokeWidth={2.5} className="text-yellow-400" />
                <span className="text-yellow-400 text-[9px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  Quick Pick
                </span>
              </div>
            }
          >
            Pricing Tiers
          </SectionHeader>

          {/* Quick-Pick Pricing Templates */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              type="button"
              onClick={() => onApplyTemplate('budget')}
              className="bg-[#141414] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
              style={{ fontWeight: 900 }}
            >
              Budget
            </button>
            <button
              type="button"
              onClick={() => onApplyTemplate('mid')}
              className="bg-[#141414] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
              style={{ fontWeight: 900 }}
            >
              Mid-Shelf
            </button>
            <button
              type="button"
              onClick={() => onApplyTemplate('premium')}
              className="bg-[#141414] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
              style={{ fontWeight: 900 }}
            >
              Premium
            </button>
            <button
              type="button"
              onClick={() => onApplyTemplate('exotic')}
              className="bg-[#141414] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
              style={{ fontWeight: 900 }}
            >
              Exotic
            </button>
          </div>

          <p className="text-white/40 text-[10px] mb-4 uppercase tracking-[0.15em]">
            Or add custom tiers below
          </p>

          {/* Add Pricing Tier */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Weight</label>
              <input
                type="text"
                value={newTierWeight}
                onChange={(e) => onNewTierChange('weight', e.target.value)}
                placeholder="1g"
                className="w-full bg-[#141414] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 text-xs focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Qty <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={newTierQty}
                onChange={(e) => onNewTierChange('qty', e.target.value)}
                placeholder="1"
                className="w-full bg-[#141414] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 text-xs focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Price <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={newTierPrice}
                  onChange={(e) => onNewTierChange('price', e.target.value)}
                  placeholder="14.99"
                  className="w-full bg-[#141414] border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 text-xs focus:outline-none focus:border-white/20 transition-all"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={onAddTier}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.15em]"
                style={{ fontWeight: 900 }}
              >
                <Plus size={11} strokeWidth={2.5} />
                Add
              </button>
            </div>
          </div>

          {/* Pricing Tiers List */}
          {pricingTiers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                Current ({pricingTiers.length})
              </h4>
              <div className="space-y-2">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className="bg-[#141414] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={tier.weight || ''}
                        onChange={(e) => onUpdateTier(index, 'weight', e.target.value)}
                        placeholder="Weight"
                        className="w-full bg-black border border-white/10 rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20"
                      />
                      <input
                        type="number"
                        value={tier.qty}
                        onChange={(e) => onUpdateTier(index, 'qty', e.target.value)}
                        placeholder="Qty"
                        className="w-full bg-black border border-white/10 rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => onUpdateTier(index, 'price', e.target.value)}
                          placeholder="Price"
                          className="w-full bg-black border border-white/10 rounded-xl text-white placeholder-white/20 pl-6 pr-2.5 py-2 text-xs focus:outline-none focus:border-white/20"
                        />
                      </div>
                    </div>
                    <div className="text-white text-[10px] font-black uppercase tracking-[0.15em] min-w-[80px]" style={{ fontWeight: 900 }}>
                      {tier.weight || `${tier.qty}x`} ${parseFloat(tier.price.toString()).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveTier(index)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-500/10 transition-all"
                    >
                      <X size={14} />
                    </button>
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
