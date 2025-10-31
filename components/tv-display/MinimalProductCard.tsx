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
  displayConfig?: any; // Display configuration (show_strain_type, show_thc, etc.)
}

export function MinimalProductCard({ product, theme, index, visiblePriceBreaks, displayConfig }: MinimalProductCardProps) {
  const pricing_tiers = product.pricing_tiers || {};
  const blueprint = product.pricing_blueprint;
  const priceBreaks = blueprint?.price_breaks || [];

  // Debug logging for first product
  if (index === 0) {
    console.log('🔍 Product card debug:', {
      name: product.name,
      metadata: product.metadata,
      thc_percentage: product.metadata?.thc_percentage,
      thc_type: typeof product.metadata?.thc_percentage,
      strain_type: product.metadata?.strain_type,
      displayConfig: displayConfig,
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
      className="flex flex-col h-full justify-between overflow-hidden"
      style={{
        background: theme.styles.productCard.background,
        borderColor: theme.styles.productCard.borderColor,
        borderWidth: '1px',
        backdropFilter: theme.styles.productCard.backdropBlur ? `blur(${theme.styles.productCard.backdropBlur})` : undefined,
        padding: '3%',
      }}
    >
      {/* Product Name */}
      <h3
        className="font-black uppercase tracking-wide leading-none line-clamp-2"
        style={{
          color: theme.styles.productName.color,
          opacity: 0.95,
          fontSize: 'clamp(0.875rem, 1.8vw, 2.5rem)',
          marginBottom: '3%',
        }}
      >
        {product.name}
      </h3>

      {/* Product Metadata - Flexible middle section */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden" style={{ gap: '2%' }}>
        {displayConfig?.show_strain_type === true && product.metadata?.strain_type && (
          <div
            className="font-bold uppercase truncate"
            style={{
              color: theme.styles.productDescription.color,
              opacity: 0.7,
              letterSpacing: '0.05em',
              fontSize: 'clamp(0.75rem, 1.2vw, 1.75rem)',
            }}
          >
            {product.metadata.strain_type}
          </div>
        )}
        {displayConfig?.show_thc === true && product.metadata?.thc_percentage && (
          <div
            className="font-black truncate"
            style={{
              color: theme.styles.price.color,
              opacity: 1,
              fontSize: 'clamp(0.75rem, 1.2vw, 1.75rem)',
            }}
          >
            THC: {typeof product.metadata.thc_percentage === 'string' && product.metadata.thc_percentage.includes('%')
              ? product.metadata.thc_percentage
              : `${product.metadata.thc_percentage}%`}
          </div>
        )}
        {displayConfig?.show_cbd === true && product.metadata?.cbd_percentage && (
          <div
            className="font-black truncate"
            style={{
              color: theme.styles.price.color,
              opacity: 0.9,
              fontSize: 'clamp(0.75rem, 1.2vw, 1.75rem)',
            }}
          >
            CBD: {typeof product.metadata.cbd_percentage === 'string' && product.metadata.cbd_percentage.includes('%')
              ? product.metadata.cbd_percentage
              : `${product.metadata.cbd_percentage}%`}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div style={{ marginTop: '3%' }}>
        {availablePrices.length > 0 ? (
          <div className="grid grid-cols-2" style={{ gap: '2%' }}>
            {availablePrices.slice(0, 2).map((item: any) => (
              <div
                key={item.id}
                className="text-center flex flex-col justify-center overflow-hidden"
                style={{
                  background: `${theme.styles.price.color}08`,
                  borderWidth: '1px',
                  borderColor: `${theme.styles.price.color}30`,
                  padding: '6% 2%',
                }}
              >
                <div
                  className="uppercase font-bold leading-none truncate"
                  style={{
                    color: theme.styles.productDescription.color,
                    opacity: 0.65,
                    letterSpacing: '0.05em',
                    fontSize: 'clamp(0.5rem, 0.8vw, 1.25rem)',
                    marginBottom: '4%',
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="font-black leading-none"
                  style={{
                    color: theme.styles.price.color,
                    fontSize: 'clamp(1.25rem, 2.2vw, 3.5rem)',
                  }}
                >
                  ${item.price.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center"
            style={{
              color: theme.styles.productDescription.color,
              opacity: 0.3,
              padding: '4% 0',
              fontSize: 'clamp(0.75rem, 1.2vw, 1.5rem)',
            }}
          >
            No pricing
          </div>
        )}
      </div>
    </motion.div>
  );
}
