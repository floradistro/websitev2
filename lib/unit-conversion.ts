/**
 * Unit Conversion Utilities
 * 
 * Cannabis industry operates in both retail (grams) and wholesale (pounds)
 * All inventory is stored in BASE UNITS in the database
 * - Weight products: stored in GRAMS
 * - Volume products: stored in MILLILITERS
 * These utilities handle conversion for display and calculations
 */

export type WeightUnit = 'gram' | 'ounce' | 'pound' | 'kilogram' | 'milligram';
export type VolumeUnit = 'milliliter' | 'liter' | 'fluid_ounce' | 'gallon';
export type Unit = WeightUnit | VolumeUnit;

/**
 * Conversion factors to grams (for weight)
 */
export const GRAM_CONVERSIONS = {
  milligram: 0.001,
  gram: 1,
  ounce: 28.3495,
  pound: 453.592,
  kilogram: 1000
} as const;

/**
 * Conversion factors to milliliters (for volume)
 */
export const MILLILITER_CONVERSIONS = {
  milliliter: 1,
  liter: 1000,
  fluid_ounce: 29.5735,
  gallon: 3785.41
} as const;

/**
 * Convert any weight unit to grams (base unit for storage)
 */
export function toGrams(quantity: number, unit: WeightUnit): number {
  return quantity * GRAM_CONVERSIONS[unit];
}

/**
 * Convert grams to any display unit
 */
export function fromGrams(grams: number, unit: WeightUnit): number {
  return grams / GRAM_CONVERSIONS[unit];
}

/**
 * Convert any volume unit to milliliters (base unit for storage)
 */
export function toMilliliters(quantity: number, unit: VolumeUnit): number {
  return quantity * MILLILITER_CONVERSIONS[unit];
}

/**
 * Convert milliliters to any display unit
 */
export function fromMilliliters(milliliters: number, unit: VolumeUnit): number {
  return milliliters / MILLILITER_CONVERSIONS[unit];
}

/**
 * Universal converter - handles both weight and volume
 */
export function convertToBaseUnit(quantity: number, unit: Unit): number {
  // Check if it's a weight unit
  if (unit in GRAM_CONVERSIONS) {
    return toGrams(quantity, unit as WeightUnit);
  }
  // Check if it's a volume unit
  if (unit in MILLILITER_CONVERSIONS) {
    return toMilliliters(quantity, unit as VolumeUnit);
  }
  // Unknown unit, return as-is
  return quantity;
}

/**
 * Universal converter from base unit to display unit
 */
export function convertFromBaseUnit(baseQuantity: number, unit: Unit): number {
  // Check if it's a weight unit
  if (unit in GRAM_CONVERSIONS) {
    return fromGrams(baseQuantity, unit as WeightUnit);
  }
  // Check if it's a volume unit
  if (unit in MILLILITER_CONVERSIONS) {
    return fromMilliliters(baseQuantity, unit as VolumeUnit);
  }
  // Unknown unit, return as-is
  return baseQuantity;
}

/**
 * Format grams to display with appropriate unit
 */
export function formatWeight(grams: number, unit: WeightUnit, decimals: number = 1): string {
  const converted = fromGrams(grams, unit);
  
  switch(unit) {
    case 'milligram':
      return `${converted.toFixed(decimals)}mg`;
    case 'gram':
      return `${converted.toFixed(decimals)}g`;
    case 'ounce':
      return `${converted.toFixed(decimals)} oz`;
    case 'pound':
      return `${converted.toFixed(decimals)} lb${converted !== 1 ? 's' : ''}`;
    case 'kilogram':
      return `${converted.toFixed(decimals)} kg`;
    default:
      return `${grams.toFixed(decimals)}g`;
  }
}

/**
 * Format milliliters to display with appropriate unit
 */
export function formatVolume(milliliters: number, unit: VolumeUnit, decimals: number = 1): string {
  const converted = fromMilliliters(milliliters, unit);
  
  switch(unit) {
    case 'milliliter':
      return `${converted.toFixed(decimals)}ml`;
    case 'liter':
      return `${converted.toFixed(decimals)}L`;
    case 'fluid_ounce':
      return `${converted.toFixed(decimals)} fl oz`;
    case 'gallon':
      return `${converted.toFixed(decimals)} gal`;
    default:
      return `${milliliters.toFixed(decimals)}ml`;
  }
}

/**
 * Universal formatter - auto-detects unit type
 */
export function formatQuantity(baseQuantity: number, unit: Unit, decimals: number = 1): string {
  if (unit in GRAM_CONVERSIONS) {
    return formatWeight(baseQuantity, unit as WeightUnit, decimals);
  }
  if (unit in MILLILITER_CONVERSIONS) {
    return formatVolume(baseQuantity, unit as VolumeUnit, decimals);
  }
  return `${baseQuantity.toFixed(decimals)} ${unit}`;
}

/**
 * Detect if a unit is weight or volume
 */
export function getUnitType(unit: Unit): 'weight' | 'volume' | 'unknown' {
  if (unit in GRAM_CONVERSIONS) return 'weight';
  if (unit in MILLILITER_CONVERSIONS) return 'volume';
  return 'unknown';
}

/**
 * Get display label for common cannabis weights
 */
export function getCannabisFriendlyLabel(grams: number): string {
  // Common retail weights
  if (grams === 1) return '1g';
  if (grams === 3.5) return '3.5g (⅛ oz)';
  if (grams === 7) return '7g (¼ oz)';
  if (grams === 14) return '14g (½ oz)';
  if (grams === 28) return '28g (1 oz)';
  
  // Common wholesale weights (in pounds)
  if (grams === 113.4) return '¼ lb (113g)';
  if (grams === 226.8) return '½ lb (227g)';
  if (grams === 453.6) return '1 lb (454g)';
  if (grams >= 2268 && grams < 2300) return `${(grams / 453.592).toFixed(0)} lbs`;
  if (grams >= 4536 && grams < 4600) return `${(grams / 453.592).toFixed(0)} lbs`;
  
  // Default: show in most appropriate unit
  if (grams < 28) {
    return `${grams.toFixed(1)}g`;
  } else if (grams < 454) {
    return `${(grams / 28.3495).toFixed(1)} oz`;
  } else {
    return `${(grams / 453.592).toFixed(1)} lbs`;
  }
}

/**
 * Parse a pricing tier quantity to base unit (grams or milliliters)
 * Handles different formats from pricing blueprints
 */
export function parseTierQuantityToBase(
  qty: number,
  unit?: string
): number {
  if (!unit) return qty;
  
  const unitLower = unit.toLowerCase();
  
  // Weight units
  if (unitLower === 'g' || unitLower === 'gram') return qty;
  if (unitLower === 'mg' || unitLower === 'milligram') return toGrams(qty, 'milligram');
  if (unitLower === 'oz' || unitLower === 'ounce') return toGrams(qty, 'ounce');
  if (unitLower === 'lb' || unitLower === 'lbs' || unitLower === 'pound') return toGrams(qty, 'pound');
  if (unitLower === 'kg' || unitLower === 'kilogram') return toGrams(qty, 'kilogram');
  
  // Volume units
  if (unitLower === 'ml' || unitLower === 'milliliter') return qty;
  if (unitLower === 'l' || unitLower === 'liter') return toMilliliters(qty, 'liter');
  if (unitLower === 'fl oz' || unitLower === 'fluid_ounce') return toMilliliters(qty, 'fluid_ounce');
  if (unitLower === 'gal' || unitLower === 'gallon') return toMilliliters(qty, 'gallon');
  
  return qty; // Assume base unit if unknown
}

/**
 * Legacy alias for backwards compatibility
 */
export function parseTierQuantityToGrams(qty: number, unit?: string): number {
  return parseTierQuantityToBase(qty, unit);
}

/**
 * Check if requested quantity is available in stock
 */
export function isStockAvailable(
  stockInGrams: number,
  requestedGrams: number
): boolean {
  return stockInGrams >= requestedGrams;
}

/**
 * Get remaining stock message
 */
export function getStockMessage(
  stockInGrams: number,
  context: 'retail' | 'wholesale'
): string {
  if (stockInGrams === 0) {
    return 'Out of stock';
  }
  
  if (stockInGrams < 0) {
    return 'Stock unavailable';
  }
  
  // Low stock threshold
  const lowStockThreshold = context === 'retail' ? 28 : 453.6; // 1 oz or 1 lb
  
  if (stockInGrams < lowStockThreshold) {
    return `Only ${formatWeight(stockInGrams, context === 'retail' ? 'gram' : 'ounce')} left!`;
  }
  
  return `${formatWeight(stockInGrams, context === 'retail' ? 'gram' : 'pound')} available`;
}

/**
 * Calculate price per gram
 */
export function getPricePerGram(
  totalPrice: number,
  quantityInGrams: number
): number {
  if (quantityInGrams === 0) return 0;
  return totalPrice / quantityInGrams;
}

/**
 * Calculate discount percentage between two tiers
 */
export function calculateTierDiscount(
  higherPricePerGram: number,
  lowerPricePerGram: number
): number {
  if (higherPricePerGram === 0) return 0;
  return ((higherPricePerGram - lowerPricePerGram) / higherPricePerGram) * 100;
}

/**
 * Example pricing tier structure
 */
export interface PricingTier {
  break_id: string;
  label: string;
  qty: number;              // Always in grams
  display: string;          // Display label
  display_qty?: number;     // Quantity in display unit
  display_unit?: string;    // Display unit (lb, oz, g)
  price?: number;           // Price for this tier
  unit_price?: number;      // Price per unit (for wholesale)
}

/**
 * Convert pricing tier to cart item format
 */
export function tierToCartQuantity(tier: PricingTier): {
  quantity_grams: number;
  quantity_display: string;
} {
  return {
    quantity_grams: tier.qty,
    quantity_display: tier.display
  };
}


