/**
 * List Product Card - Apple Store Style
 * Clean, minimal, data-dense product rows optimized for TV displays
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

  // Get the primary price (first available)
  const primaryPrice = availablePrices.length > 0 ? availablePrices[0] : null;

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015, duration: 0.2 }}
      className="flex-shrink-0"
      style={{
        borderBottom: `1px solid ${theme.styles.productCard.borderColor}20`,
      }}
    >
      <div className="px-4 py-3 flex items-center gap-4">
        {/* Product Name - Left aligned, takes available space */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold leading-tight"
            style={{
              color: theme.styles.productName.color,
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {product.name}
          </h3>
        </div>

        {/* Custom Fields - Compact inline */}
        {customFieldsDisplay.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {customFieldsDisplay.map((field, idx) => (
              <span
                key={idx}
                style={{
                  color: theme.styles.productDescription.color,
                  fontSize: '1rem',
                  opacity: 0.7,
                  whiteSpace: 'nowrap',
                }}
              >
                {field}
                {idx < customFieldsDisplay.length - 1 && <span style={{ opacity: 0.4, marginLeft: '0.5rem' }}>·</span>}
              </span>
            ))}
          </div>
        )}

        {/* Additional Prices - Compact but clear pairing */}
        {availablePrices.length > 1 && (
          <div className="flex items-center gap-4 flex-shrink-0">
            {availablePrices.slice(1).map((price, idx) => (
              <div key={idx} className="flex items-baseline gap-1.5" style={{ whiteSpace: 'nowrap' }}>
                <span
                  className="font-medium"
                  style={{
                    color: theme.styles.price.color,
                    fontSize: '1rem',
                    opacity: 0.75,
                  }}
                >
                  {price.label}
                </span>
                <span
                  className="font-bold"
                  style={{
                    color: theme.styles.price.color,
                    fontSize: '1.25rem',
                  }}
                >
                  ${price.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Primary Price - Right aligned, prominent with tier label */}
        {primaryPrice && (
          <div className="flex items-baseline gap-2 flex-shrink-0" style={{ minWidth: '140px' }}>
            {/* Tier Label - Prominent */}
            <div
              className="font-semibold"
              style={{
                color: theme.styles.price.color,
                fontSize: '1.25rem',
                opacity: 0.8,
                whiteSpace: 'nowrap',
              }}
            >
              {primaryPrice.label}
            </div>
            {/* Price */}
            <div
              className="font-bold"
              style={{
                color: theme.styles.price.color,
                fontSize: '2rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              ${primaryPrice.price.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
