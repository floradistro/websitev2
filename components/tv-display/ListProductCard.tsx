/**
 * List Product Card - Apple Store Style
 * Clean, minimal, data-dense product rows
 */

import { motion } from 'framer-motion';
import type { TVTheme } from '@/lib/themes';
import { PRICE_BREAK_LABELS } from '@/lib/category-pricing-defaults';

interface ListProductCardProps {
  product: any;
  theme: TVTheme;
  index: number;
  visiblePriceBreaks?: string[];
  customFieldsToShow?: string[];
  customFieldsConfig?: { [field: string]: { showLabel: boolean } };
  hideAllFieldLabels?: boolean;
}

export function ListProductCard({
  product,
  theme,
  index,
  visiblePriceBreaks = [],
  customFieldsToShow = [],
  customFieldsConfig = {},
  hideAllFieldLabels = false,
}: ListProductCardProps) {
  const pricing_tiers = product.pricing_tiers || {};

  // Get available prices based on visible price breaks
  const availablePrices = visiblePriceBreaks.length > 0
    ? Object.keys(pricing_tiers)
        .filter(key => visiblePriceBreaks.includes(key))
        .map(key => ({
          id: key,
          price: parseFloat(pricing_tiers[key].price || pricing_tiers[key]),
          label: PRICE_BREAK_LABELS[key] || key
        }))
        .sort((a, b) => {
          const indexA = visiblePriceBreaks.indexOf(a.id);
          const indexB = visiblePriceBreaks.indexOf(b.id);
          return indexA - indexB;
        })
    : [];

  // Get the primary price (first available or lowest)
  const primaryPrice = availablePrices.length > 0
    ? availablePrices[0]
    : null;

  // Format custom field value
  const formatFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined) return null;

    // Special formatting for common fields
    if (field === 'thc_percentage' || field === 'cbd_percentage') {
      return `${value}%`;
    }

    return String(value);
  };

  // Get custom field display
  const customFieldsDisplay = customFieldsToShow
    .map(field => {
      const value = product.custom_fields?.[field];
      if (!value) return null;

      const formattedValue = formatFieldValue(field, value);
      if (!formattedValue) return null;

      const showLabel = !hideAllFieldLabels && (customFieldsConfig[field]?.showLabel !== false);
      const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      return showLabel ? `${fieldLabel}: ${formattedValue}` : formattedValue;
    })
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="relative"
      style={{
        borderBottom: `1px solid ${theme.styles.productCard.borderColor}15`,
      }}
    >
      <div
        className="px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-200"
        style={{
          background: 'transparent',
        }}
      >
        {/* Left: Product Info */}
        <div className="flex-1 min-w-0 pr-8">
          {/* Product Name */}
          <h3
            className="font-bold mb-2 truncate"
            style={{
              color: theme.styles.productName.color,
              fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {product.name}
          </h3>

          {/* Custom Fields - Single line with dots */}
          {customFieldsDisplay.length > 0 && (
            <div
              className="flex items-center gap-3 flex-wrap"
              style={{
                color: theme.styles.productDescription.color,
                fontSize: 'clamp(0.875rem, 1.25vw, 1.25rem)',
                opacity: 0.7,
              }}
            >
              {customFieldsDisplay.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span>{field}</span>
                  {idx < customFieldsDisplay.length - 1 && (
                    <span style={{ opacity: 0.4 }}>·</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Additional price tiers (if more than one) */}
          {availablePrices.length > 1 && (
            <div
              className="flex items-center gap-4 mt-3 flex-wrap"
              style={{
                color: theme.styles.price.color,
                fontSize: 'clamp(0.75rem, 1vw, 1.125rem)',
                opacity: 0.6,
              }}
            >
              {availablePrices.slice(1).map((price, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span style={{ opacity: 0.7 }}>{price.label}</span>
                  <span className="font-bold">${price.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Primary Price */}
        {primaryPrice && (
          <div className="flex flex-col items-end justify-center flex-shrink-0">
            <div
              className="font-bold tracking-tight"
              style={{
                color: theme.styles.price.color,
                fontSize: 'clamp(2rem, 3.5vw, 3.5rem)',
                fontWeight: 600,
                letterSpacing: '-0.03em',
              }}
            >
              ${primaryPrice.price.toFixed(2)}
            </div>
            {availablePrices.length > 1 && (
              <div
                className="mt-1"
                style={{
                  color: theme.styles.price.color,
                  fontSize: 'clamp(0.75rem, 1vw, 1rem)',
                  opacity: 0.5,
                }}
              >
                {primaryPrice.label}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
