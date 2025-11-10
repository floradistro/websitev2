"use client";

interface PricingTiersProps {
  tiers: Array<{
    quantity: number;
    price: number;
    label?: string;
    name?: string;
  }>;
  onPriceSelect: (price: number, quantity: number, tierName: string) => void;
}

export default function PricingTiers({ tiers, onPriceSelect }: PricingTiersProps) {
  if (!tiers || tiers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Volume Pricing</h3>
      <div className="grid gap-2">
        {tiers.map((tier, index) => (
          <button
            key={index}
            onClick={() =>
              onPriceSelect(tier.price, tier.quantity, tier.name || tier.label || "Standard")
            }
            className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <span className="text-white/90">
              {tier.quantity}+ {tier.label || "units"}
            </span>
            <span className="text-white font-medium">${tier.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
