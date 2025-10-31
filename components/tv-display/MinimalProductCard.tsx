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
  visiblePriceBreaks?: string[]; // e.g. ['1g', '3_5g'] - which tiers to show
}

export function MinimalProductCard({ product, theme, index, visiblePriceBreaks }: MinimalProductCardProps) {
  const pricing_tiers = product.pricing_tiers || {};
  const blueprint = product.pricing_blueprint;
  const priceBreaks = blueprint?.price_breaks || [];

  // Debug logging for first product
  if (index === 0) {
    console.log('🔍 Product pricing debug:', {
      name: product.name,
      has_pricing_tiers: !!product.pricing_tiers,
      pricing_tiers: product.pricing_tiers,
      has_blueprint: !!product.pricing_blueprint,
      blueprint: product.pricing_blueprint,
      price_breaks: priceBreaks,
      visible_price_breaks: visiblePriceBreaks
    });
  }

  // Filter by visible price breaks if configured
  // If visiblePriceBreaks is not set or empty, show NO pricing (user must configure)
  const availablePrices = !visiblePriceBreaks || visiblePriceBreaks.length === 0
    ? [] // Show nothing by default
    : priceBreaks
        .filter((pb: any) => {
          // Must have a price AND be in the visible list
          return pricing_tiers[pb.break_id]?.price && visiblePriceBreaks.includes(pb.break_id);
        })
        .map((pb: any) => ({
          label: pb.display || pb.break_id,
          price: parseFloat(pricing_tiers[pb.break_id].price),
          id: pb.break_id
        }))
        // Sort by the order specified in visiblePriceBreaks
        .sort((a: any, b: any) => {
          const indexA = visiblePriceBreaks.indexOf(a.id);
          const indexB = visiblePriceBreaks.indexOf(b.id);
          return indexA - indexB;
        });

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="p-1.5 flex flex-col h-full"
      style={{
        background: theme.styles.productCard.background,
        borderColor: theme.styles.productCard.borderColor,
        borderWidth: '1px',
        backdropFilter: theme.styles.productCard.backdropBlur ? `blur(${theme.styles.productCard.backdropBlur})` : undefined
      }}
    >
      {/* Product Name - Super Compact */}
      <h3
        className="font-medium uppercase tracking-wide leading-tight mb-0.5 line-clamp-2"
        style={{
          color: theme.styles.productName.color,
          fontSize: '0.625rem', // 10px
          opacity: 0.95
        }}
      >
        {product.name}
      </h3>

      {/* Strain + THC - One Line */}
      <div className="flex items-center gap-1.5 mb-1">
        {product.metadata?.strain_type && (
          <span
            className="text-[7px] font-medium uppercase"
            style={{
              color: theme.styles.productDescription.color,
              opacity: 0.5,
              letterSpacing: '0.03em'
            }}
          >
            {product.metadata.strain_type.slice(0, 3)}
          </span>
        )}
        {product.metadata?.thc_percentage && (
          <span
            className="text-[7px] font-semibold"
            style={{
              color: theme.styles.price.color,
              opacity: 0.8
            }}
          >
            {product.metadata.thc_percentage}%
          </span>
        )}
      </div>

      {/* Pricing - Ultra Compact (show max 2 tiers) */}
      <div className="mt-auto">
        {availablePrices.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5">
            {availablePrices.slice(0, 2).map((item: any) => (
              <div
                key={item.id}
                className="text-center py-0.5 px-1"
                style={{
                  background: `${theme.styles.price.color}08`,
                  borderWidth: '1px',
                  borderColor: `${theme.styles.price.color}20`
                }}
              >
                <div
                  className="text-[6px] uppercase font-medium"
                  style={{
                    color: theme.styles.productDescription.color,
                    opacity: 0.4,
                    letterSpacing: '0.02em'
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="text-[10px] font-semibold"
                  style={{ color: theme.styles.price.color }}
                >
                  ${item.price.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-[7px] text-center py-1"
            style={{ color: theme.styles.productDescription.color, opacity: 0.3 }}
          >
            No pricing
          </div>
        )}
      </div>
    </motion.div>
  );
}
