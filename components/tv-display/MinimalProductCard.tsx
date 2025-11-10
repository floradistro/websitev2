/**
 * Ultra-Minimal Product Card - Steve Jobs Style
 * Clean, simple, essential information only
 * All pricing tiers displayed compactly
 */

import { motion } from "framer-motion";

interface MinimalProductCardProps {
  product: any;
  theme: any;
  index: number;
  visiblePriceBreaks?: string[]; // e.g. ['1g', '3_5g'] - which tiers to show
  displayConfig?: any; // Display configuration (show_strain_type, show_thc, etc.)
  customFieldsToShow?: string[]; // Which custom fields to display (from menu config)
  customFieldsConfig?: { [field: string]: { showLabel: boolean } }; // Per-field label configuration
  hideAllFieldLabels?: boolean; // Global setting to hide all field labels
  splitSide?: "left" | "right" | null; // Which side of split view (for subtle styling)
  gridColumns?: number; // Number of columns in grid (for checkerboard pattern)
}

export function MinimalProductCard({
  product,
  theme,
  index,
  visiblePriceBreaks,
  displayConfig,
  customFieldsToShow,
  customFieldsConfig,
  hideAllFieldLabels,
  splitSide,
  gridColumns,
}: MinimalProductCardProps) {
  const pricing_tiers = product.pricing_tiers || {};
  const blueprint = product.pricing_blueprint;
  const priceBreaks = blueprint?.price_breaks || [];

  // Helper to get field value from custom_fields object
  const getFieldValue = (fieldName: string): string | null => {
    if (!product.custom_fields || typeof product.custom_fields !== "object") {
      return null;
    }
    return product.custom_fields[fieldName] || null;
  };

  // Get selected custom fields to display
  const customFieldsDisplay =
    customFieldsToShow && customFieldsToShow.length > 0
      ? customFieldsToShow
          .map((fieldName) => ({
            name: fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            value: getFieldValue(fieldName),
            // Global setting takes precedence: if hideAllFieldLabels is true, hide all
            // Otherwise, check individual field config (default to showing)
            showLabel: hideAllFieldLabels
              ? false
              : customFieldsConfig?.[fieldName]?.showLabel !== false,
          }))
          .filter((field) => field.value) // Only show fields that have values
      : [];

  // Debug logging for first product
  if (index === 0) {
  }

  // Filter by visible price breaks if configured
  // If visiblePriceBreaks is not set or empty, show NO pricing (user must configure)
  const availablePrices =
    !visiblePriceBreaks || visiblePriceBreaks.length === 0
      ? [] // Show nothing by default
      : priceBreaks
          .filter((pb: any) => {
            // Must have a price AND be in the visible list
            return pricing_tiers[pb.break_id]?.price && visiblePriceBreaks.includes(pb.break_id);
          })
          .map((pb: any) => ({
            label: pb.display || pb.break_id,
            price: parseFloat(pricing_tiers[pb.break_id].price),
            id: pb.break_id,
          }))
          // Sort by the order specified in visiblePriceBreaks
          .sort((a: any, b: any) => {
            const indexA = visiblePriceBreaks.indexOf(a.id);
            const indexB = visiblePriceBreaks.indexOf(b.id);
            return indexA - indexB;
          });

  // Calculate checkerboard position for subtle contrast
  const isCheckerboardDark = gridColumns
    ? (() => {
        const row = Math.floor(index / gridColumns);
        const col = index % gridColumns;
        return (row + col) % 2 === 0;
      })()
    : false;

  // Subtle styling variations for split view - Steve Jobs elegance
  const cardStyle = {
    // Checkerboard background: alternate between slightly lighter and darker
    background: isCheckerboardDark
      ? theme.styles.productCard.background // Original color
      : `${theme.styles.productName.color}05`, // Very subtle tint (5% opacity)
    borderColor: theme.styles.productCard.borderColor,
    borderWidth: "1px",
    backdropFilter: theme.styles.productCard.backdropBlur
      ? `blur(${theme.styles.productCard.backdropBlur})`
      : undefined,
    padding: "2%",
    // Subtle opacity shift for split view
    opacity: splitSide === "left" ? 0.98 : splitSide === "right" ? 1 : 1,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="flex flex-col h-full justify-between overflow-hidden"
      style={cardStyle}
    >
      {/* Product Name */}
      <h3
        className="font-black uppercase tracking-tight line-clamp-2 overflow-hidden"
        style={{
          color: theme.styles.productName.color,
          opacity: 0.95,
          fontSize: "clamp(0.75rem, 2.5vw, 3.5rem)",
          lineHeight: 0.95,
          marginBottom: "2%",
          wordBreak: "break-word",
          hyphens: "auto",
        }}
      >
        {product.name}
      </h3>

      {/* Product Metadata - Dynamic custom fields with equal spacing */}
      <div className="flex-1 flex flex-col justify-evenly overflow-hidden">
        {customFieldsDisplay.map((field, idx) => (
          <div
            key={idx}
            className="font-bold uppercase overflow-hidden"
            style={{
              color: idx === 0 ? theme.styles.productDescription.color : theme.styles.price.color,
              opacity: 0.85,
              letterSpacing: "0.02em",
              fontSize: "clamp(0.65rem, 1.5vw, 2rem)",
              lineHeight: 1,
              wordBreak: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}
          >
            {field.showLabel ? `${field.name}: ${field.value}` : field.value}
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ marginTop: "1.5%" }}>
        {availablePrices.length > 0 ? (
          <div className="grid grid-cols-2" style={{ gap: "1.5%" }}>
            {availablePrices.slice(0, 2).map((item: any) => (
              <div
                key={item.id}
                className="text-center flex flex-col justify-center overflow-hidden"
                style={{
                  background: `${theme.styles.price.color}08`,
                  borderWidth: "1px",
                  borderColor: `${theme.styles.price.color}30`,
                  padding: "4% 2%",
                }}
              >
                <div
                  className="uppercase font-bold leading-none truncate"
                  style={{
                    color: theme.styles.productDescription.color,
                    opacity: 0.65,
                    letterSpacing: "0.02em",
                    fontSize: "clamp(0.5rem, 0.8vw, 1.25rem)",
                    marginBottom: "2%",
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="font-black leading-none"
                  style={{
                    color: theme.styles.price.color,
                    fontSize: "clamp(1.25rem, 2.2vw, 3.5rem)",
                    lineHeight: 0.95,
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
              padding: "4% 0",
              fontSize: "clamp(0.75rem, 1.2vw, 1.5rem)",
            }}
          >
            No pricing
          </div>
        )}
      </div>
    </motion.div>
  );
}
