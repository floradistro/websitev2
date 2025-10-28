/**
 * PRICING CALCULATION UTILITY
 * Centralized logic for calculating final prices with promotions
 * Used by: POS, TV Display, Storefront
 */

export type Product = {
  id: string;
  name: string;
  regular_price?: number;
  price?: number;
  category?: string;
  metadata?: any;
  pricing_blueprint?: any;
  pricing_tiers?: Record<string, { price: string | number }>;
};

export type Promotion = {
  id: string;
  name: string;
  description?: string;
  promotion_type: 'product' | 'category' | 'tier' | 'global';
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  target_product_ids?: string[];
  target_categories?: string[];
  target_tier_rules?: {
    min_grams?: number;
    max_grams?: number;
    tier_ids?: string[];
  };
  badge_text?: string;
  badge_color?: string;
  show_original_price?: boolean;
  priority?: number;
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
  time_of_day_start?: string;
  time_of_day_end?: string;
};

export type PriceCalculation = {
  originalPrice: number;
  finalPrice: number;
  savings: number;
  discountPercentage: number;
  appliedPromotion?: Promotion;
  badge?: {
    text: string;
    color: string;
  };
};

/**
 * Check if a promotion is currently active based on schedule
 */
export function isPromotionActive(promo: Promotion, checkTime: Date = new Date()): boolean {
  if (!promo.is_active) return false;

  // Check date range
  if (promo.start_time) {
    const startTime = new Date(promo.start_time);
    if (checkTime < startTime) return false;
  }

  if (promo.end_time) {
    const endTime = new Date(promo.end_time);
    if (checkTime > endTime) return false;
  }

  // Check day of week (0=Sunday, 6=Saturday)
  if (promo.days_of_week && promo.days_of_week.length > 0) {
    const currentDay = checkTime.getDay();
    if (!promo.days_of_week.includes(currentDay)) return false;
  }

  // Check time of day
  if (promo.time_of_day_start && promo.time_of_day_end) {
    const checkTimeOnly = checkTime.toTimeString().slice(0, 8); // HH:MM:SS
    if (checkTimeOnly < promo.time_of_day_start || checkTimeOnly > promo.time_of_day_end) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a promotion applies to a specific product
 */
export function doesPromotionApply(
  promo: Promotion,
  product: Product,
  quantity: number = 1,
  tierId?: string
): boolean {
  if (!isPromotionActive(promo)) return false;

  switch (promo.promotion_type) {
    case 'product':
      // Check if product is in target list
      return promo.target_product_ids?.includes(product.id) || false;

    case 'category':
      // Check if product category is in target list
      if (!product.category) return false;
      return promo.target_categories?.includes(product.category) || false;

    case 'tier':
      // Check if tier meets minimum requirements
      if (!promo.target_tier_rules) return false;

      // If specific tier IDs are specified
      if (promo.target_tier_rules.tier_ids && tierId) {
        return promo.target_tier_rules.tier_ids.includes(tierId);
      }

      // Otherwise check quantity (grams)
      const minGrams = promo.target_tier_rules.min_grams || 0;
      const maxGrams = promo.target_tier_rules.max_grams || Infinity;
      return quantity >= minGrams && quantity <= maxGrams;

    case 'global':
      // Applies to everything
      return true;

    default:
      return false;
  }
}

/**
 * Calculate the discount amount for a promotion
 */
export function calculateDiscount(
  promo: Promotion,
  originalPrice: number
): number {
  if (promo.discount_type === 'percentage') {
    return originalPrice * (promo.discount_value / 100);
  } else {
    // fixed_amount
    return Math.min(promo.discount_value, originalPrice); // Don't discount below $0
  }
}

/**
 * Find the best applicable promotion for a product
 * Returns the promotion with the highest savings
 */
export function findBestPromotion(
  product: Product,
  activePromotions: Promotion[],
  quantity: number = 1,
  tierId?: string
): Promotion | null {
  const applicablePromos = activePromotions.filter((promo) =>
    doesPromotionApply(promo, product, quantity, tierId)
  );

  if (applicablePromos.length === 0) return null;

  // Get base price
  const basePrice = parseFloat(String(product.regular_price || product.price || 0));

  // Find promotion with highest savings
  let bestPromo: Promotion | null = null;
  let maxSavings = 0;

  for (const promo of applicablePromos) {
    const savings = calculateDiscount(promo, basePrice);

    // If savings are equal, use priority
    if (savings > maxSavings || (savings === maxSavings && (promo.priority || 0) > (bestPromo?.priority || 0))) {
      maxSavings = savings;
      bestPromo = promo;
    }
  }

  return bestPromo;
}

/**
 * Calculate final price for a product with promotions applied
 *
 * @param product - The product to calculate price for
 * @param activePromotions - List of active promotions
 * @param quantity - Quantity being purchased (for tier-based promos)
 * @param tierId - Specific tier ID (e.g., '3_5g') for tiered pricing
 * @param tierPrice - Specific tier price override (if using tiered pricing)
 * @returns Price calculation with original, final, savings, and applied promotion
 */
export function calculatePrice(
  product: Product,
  activePromotions: Promotion[],
  quantity: number = 1,
  tierId?: string,
  tierPrice?: number
): PriceCalculation {
  // Determine base price
  let originalPrice: number;

  if (tierPrice !== undefined) {
    // Use provided tier price
    originalPrice = tierPrice;
  } else if (tierId && product.pricing_tiers && product.pricing_tiers[tierId]) {
    // Use tier price from pricing_tiers
    originalPrice = parseFloat(String(product.pricing_tiers[tierId].price));
  } else {
    // Use regular price
    originalPrice = parseFloat(String(product.regular_price || product.price || 0));
  }

  // Find best applicable promotion
  const bestPromo = findBestPromotion(product, activePromotions, quantity, tierId);

  if (!bestPromo) {
    // No promotion applies
    return {
      originalPrice,
      finalPrice: originalPrice,
      savings: 0,
      discountPercentage: 0,
    };
  }

  // Calculate discount
  const savings = calculateDiscount(bestPromo, originalPrice);
  const finalPrice = Math.max(0, originalPrice - savings); // Don't go below $0
  const discountPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

  return {
    originalPrice,
    finalPrice,
    savings,
    discountPercentage,
    appliedPromotion: bestPromo,
    badge: bestPromo.badge_text
      ? {
          text: bestPromo.badge_text,
          color: bestPromo.badge_color || 'red',
        }
      : undefined,
  };
}

/**
 * Calculate price for all tiers of a product
 * Returns a map of tierId -> PriceCalculation
 */
export function calculateTierPrices(
  product: Product,
  activePromotions: Promotion[]
): Record<string, PriceCalculation> {
  const result: Record<string, PriceCalculation> = {};

  if (!product.pricing_tiers || !product.pricing_blueprint) {
    return result;
  }

  const priceBreaks = product.pricing_blueprint.price_breaks || [];

  for (const priceBreak of priceBreaks) {
    const tierId = priceBreak.break_id;
    const tierData = product.pricing_tiers[tierId];

    if (!tierData || !tierData.price) continue;

    const tierPrice = parseFloat(String(tierData.price));
    const quantity = priceBreak.qty || priceBreak.display_qty || 1;

    result[tierId] = calculatePrice(
      product,
      activePromotions,
      quantity,
      tierId,
      tierPrice
    );
  }

  return result;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Format savings for display
 */
export function formatSavings(savings: number): string {
  return savings > 0 ? `-${formatPrice(savings)}` : '';
}

/**
 * Format discount percentage for display
 */
export function formatDiscountPercentage(percentage: number): string {
  return percentage > 0 ? `${Math.round(percentage)}% OFF` : '';
}
