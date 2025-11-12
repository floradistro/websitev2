/**
 * Compact List Product Card - Ultra-dense Apple Store Style
 * Designed to fit 30+ products on one TV screen
 */

import { motion } from "framer-motion";
import type { TVTheme } from "@/lib/themes";
import { PRICE_BREAK_LABELS } from "@/lib/category-pricing-defaults";

interface CompactListProductCardProps {
  product: any;
  theme: TVTheme;
  index: number;
  visiblePriceBreaks?: string[];
  customFieldsToShow?: string[];
  customFieldsConfig?: { [field: string]: { showLabel: boolean } };
  hideAllFieldLabels?: boolean;
}

export function CompactListProductCard({
  product,
  theme,
  index,
  visiblePriceBreaks = [],
  customFieldsToShow = [],
  customFieldsConfig = {},
  hideAllFieldLabels = false,
}: CompactListProductCardProps) {
  const pricing_tiers = product.pricing_tiers || {};

  // Get available prices based on visible price breaks
  const availablePrices =
    visiblePriceBreaks.length > 0
      ? Object.keys(pricing_tiers)
          .map((key) => {
            const tier = pricing_tiers[key];
            const tierObj = typeof tier === "object" ? tier : { price: tier };

            // Use the actual tier label and unit from pricing_tiers
            const quantity = tierObj.quantity || 1;
            const unit = tierObj.unit || "g";
            const tierLabel = tierObj.label || PRICE_BREAK_LABELS[key] || key;

            // Smart label formatting:
            // If label already includes unit info (like "1 gram" or "3.5g (Eighth)"), use as-is
            // Otherwise, format as "{quantity} {unit(s)}"
            let displayLabel = tierLabel;
            if (!tierLabel.toLowerCase().includes(unit.toLowerCase())) {
              // Label doesn't include unit, so format it
              const pluralUnit = quantity > 1 ? `${unit}s` : unit;
              displayLabel = `${quantity} ${pluralUnit}`;
            }

            return {
              id: key,
              price: parseFloat(tierObj.price),
              label: displayLabel,
              tierLabel, // Keep original label for matching
            };
          })
          .filter((priceInfo) => {
            // Check if either the ID or the label matches visiblePriceBreaks
            return (
              visiblePriceBreaks.includes(priceInfo.id) ||
              visiblePriceBreaks.includes(priceInfo.tierLabel)
            );
          })
          .sort((a, b) => {
            // Check both ID and label for sorting
            const indexA = Math.max(
              visiblePriceBreaks.indexOf(a.id),
              visiblePriceBreaks.indexOf(a.tierLabel),
            );
            const indexB = Math.max(
              visiblePriceBreaks.indexOf(b.id),
              visiblePriceBreaks.indexOf(b.tierLabel),
            );
            return indexA - indexB;
          })
      : [];

  // Get the primary price (first available)
  const primaryPrice = availablePrices.length > 0 ? availablePrices[0] : null;

  // Get first custom field value (ultra compact - only show one)
  const firstCustomField =
    customFieldsToShow.length > 0 ? product.custom_fields?.[customFieldsToShow[0]] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.005, duration: 0.15 }}
      className="flex-shrink-0"
      style={{
        borderBottom: `1px solid ${theme.styles.productCard.borderColor}15`,
      }}
    >
      <div className="px-3 py-1.5 flex items-center justify-between gap-3">
        {/* Product Name - Truncated */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold truncate"
            style={{
              color: theme.styles.productName.color,
              fontSize: "0.95rem",
              lineHeight: "1.3",
            }}
          >
            {product.name}
          </h3>
        </div>

        {/* Single Custom Field (optional) */}
        {firstCustomField && (
          <div
            className="flex-shrink-0"
            style={{
              color: theme.styles.productDescription.color,
              fontSize: "0.75rem",
              opacity: 0.6,
              minWidth: "60px",
              textAlign: "center",
            }}
          >
            {firstCustomField}
          </div>
        )}

        {/* Price - Compact */}
        {primaryPrice && (
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            {/* Tier Label */}
            {availablePrices.length > 1 && (
              <span
                className="font-medium"
                style={{
                  color: theme.styles.price.color,
                  fontSize: "0.8rem",
                  opacity: 0.7,
                }}
              >
                {primaryPrice.label}
              </span>
            )}
            {/* Price */}
            <span
              className="font-bold"
              style={{
                color: theme.styles.price.color,
                fontSize: "1.1rem",
                letterSpacing: "-0.01em",
              }}
            >
              ${primaryPrice.price.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
