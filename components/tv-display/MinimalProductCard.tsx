/**
 * Ultra-Minimal Product Card - Steve Jobs Style
 * Clean, simple, essential information only
 * All pricing tiers displayed compactly
 */

import { motion } from 'framer-motion';

interface MinimalProductCardProps {
  product: any;
  theme: any;
  index: number;
}

export function MinimalProductCard({ product, theme, index }: MinimalProductCardProps) {
  const pricing_tiers = product.pricing_tiers || {};
  const blueprint = product.pricing_blueprint;
  const priceBreaks = blueprint?.price_breaks || [];

  // Get all available prices
  const availablePrices = priceBreaks
    .filter((pb: any) => pricing_tiers[pb.break_id]?.price)
    .map((pb: any) => ({
      label: pb.display || pb.break_id,
      price: parseFloat(pricing_tiers[pb.break_id].price),
      id: pb.break_id
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="p-4 flex flex-col justify-between h-full"
      style={{
        background: theme.styles.productCard.background,
        borderColor: theme.styles.productCard.borderColor,
        borderWidth: '1px',
        backdropFilter: theme.styles.productCard.backdropBlur ? `blur(${theme.styles.productCard.backdropBlur})` : undefined
      }}
    >
      {/* Top Section: Name + Strain */}
      <div>
        {/* Product Name */}
        <h3
          className="font-light uppercase tracking-[0.12em] leading-tight mb-2"
          style={{
            color: theme.styles.productName.color,
            fontSize: '0.8rem',
            opacity: 0.95
          }}
        >
          {product.name}
        </h3>

        {/* Strain Type + THC - Inline, minimal */}
        <div className="flex items-center gap-2 mb-3">
          {product.metadata?.strain_type && (
            <span
              className="text-[9px] font-medium uppercase px-1.5 py-0.5"
              style={{
                color: theme.styles.productDescription.color,
                opacity: 0.6,
                letterSpacing: '0.05em'
              }}
            >
              {product.metadata.strain_type}
            </span>
          )}
          {product.metadata?.thc_percentage && (
            <span
              className="text-[9px] font-medium"
              style={{
                color: theme.styles.price.color,
                opacity: 0.7
              }}
            >
              {product.metadata.thc_percentage}% THC
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section: Pricing - Compact Grid */}
      <div className="mt-auto">
        {availablePrices.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {availablePrices.map((item: any) => (
              <div
                key={item.id}
                className="text-center py-1.5 px-2"
                style={{
                  background: `${theme.styles.price.color}10`,
                  borderWidth: '1px',
                  borderColor: `${theme.styles.price.color}30`
                }}
              >
                <div
                  className="text-[8px] uppercase font-medium mb-0.5"
                  style={{
                    color: theme.styles.productDescription.color,
                    opacity: 0.5,
                    letterSpacing: '0.05em'
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: theme.styles.price.color }}
                >
                  ${item.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-[10px] text-center py-2"
            style={{ color: theme.styles.productDescription.color, opacity: 0.3 }}
          >
            No pricing
          </div>
        )}
      </div>
    </motion.div>
  );
}
