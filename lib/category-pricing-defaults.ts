/**
 * Per-Category Pricing Configuration
 * Defines which price breaks are available for each category
 */

export type CategoryPricingConfig = {
  [category: string]: {
    available: string[];
    selected: string[];
  };
};

// Default pricing configurations for common cannabis categories
export const CATEGORY_PRICING_DEFAULTS: Record<string, string[]> = {
  Flower: ["1g", "3_5g", "7g", "14g", "28g"],
  "Pre-Rolls": ["single", "pack_3", "pack_5", "pack_10"],
  Concentrates: ["0_5g", "1g", "2g"],
  Edibles: ["single", "pack"],
  Beverages: ["single", "pack_4", "pack_6"],
  Vape: ["0_3g", "0_5g", "1g"],
  Tinctures: ["15ml", "30ml", "60ml"],
  Topicals: ["single"],
  Accessories: ["single"],
  Default: ["1g", "3_5g", "7g"], // Fallback for unknown categories
};

// Human-readable labels for price breaks
export const PRICE_BREAK_LABELS: Record<string, string> = {
  "0_3g": "0.3g",
  "0_5g": "0.5g",
  "1g": "1g",
  "1_5g": "1.5g",
  "2g": "2g",
  "3_5g": "3.5g",
  "7g": "7g",
  "14g": "14g",
  "28g": "28g",
  single: "Single",
  pack: "Pack",
  pack_3: "3-Pack",
  pack_4: "4-Pack",
  pack_5: "5-Pack",
  pack_6: "6-Pack",
  pack_10: "10-Pack",
  "15ml": "15ml",
  "30ml": "30ml",
  "60ml": "60ml",
  // VAPE quantity-based tiers
  "1": "1",
  "2": "2",
  "3": "3",
};

/**
 * Get available price breaks for a category
 */
export function getAvailablePriceBreaks(category: string): string[] {
  return (
    CATEGORY_PRICING_DEFAULTS[category] || CATEGORY_PRICING_DEFAULTS["Default"]
  );
}

/**
 * Initialize category pricing config from selected categories
 */
export function initializeCategoryPricingConfig(
  selectedCategories: string[],
  existingConfig?: CategoryPricingConfig,
): CategoryPricingConfig {
  const config: CategoryPricingConfig = {};

  selectedCategories.forEach((category) => {
    const available = getAvailablePriceBreaks(category);

    config[category] = {
      available,
      // Preserve existing selections if available, otherwise select all by default
      selected: existingConfig?.[category]?.selected || available,
    };
  });

  return config;
}

/**
 * Get all unique price breaks from category config (for global display)
 */
export function getAllPriceBreaks(config: CategoryPricingConfig): string[] {
  const allBreaks = new Set<string>();

  Object.values(config).forEach(({ selected }) => {
    selected.forEach((priceBreak) => allBreaks.add(priceBreak));
  });

  return Array.from(allBreaks).sort((a, b) => {
    const order = Object.keys(PRICE_BREAK_LABELS);
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}
