/**
 * Precision Math Utilities
 *
 * Mission-critical arithmetic for inventory and financial calculations.
 * Uses Decimal.js to avoid floating-point precision errors.
 *
 * Apple Standard: Zero tolerance for money/inventory loss due to precision errors.
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
// 10 decimal places, round half-up (standard financial rounding)
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 9,
});

/**
 * Convert a value to Decimal, handling various input types safely
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }

  try {
    return new Decimal(value);
  } catch {
    console.warn(`Failed to convert "${value}" to Decimal, using 0`);
    return new Decimal(0);
  }
}

/**
 * Safe addition with precision
 */
export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Safe subtraction with precision
 */
export function subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Safe multiplication with precision
 */
export function multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Safe division with precision
 */
export function divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    console.warn('Division by zero, returning 0');
    return new Decimal(0);
  }
  return toDecimal(a).div(divisor);
}

/**
 * Calculate percentage (a / b * 100)
 */
export function percentage(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    return new Decimal(0);
  }
  return toDecimal(a).div(divisor).times(100);
}

/**
 * Format quantity for display (2 decimal places)
 * Ensures consistent rounding for user-facing values
 */
export function formatQuantity(value: number | string | Decimal | null | undefined): string {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Format price for display ($X.XX)
 */
export function formatPrice(value: number | string | Decimal | null | undefined): string {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Format percentage for display (X.X%)
 */
export function formatPercentage(value: number | string | Decimal | null | undefined): string {
  return toDecimal(value).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toFixed(1);
}

/**
 * Round to 2 decimal places and return as number
 * Use this before sending to API to ensure consistency
 */
export function round2(value: number | string | Decimal | null | undefined): number {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Check if value is effectively zero (within epsilon)
 * Handles floating point comparison issues
 */
export function isZero(value: number | string | Decimal | null | undefined, epsilon = 0.01): boolean {
  return toDecimal(value).abs().lessThan(epsilon);
}

/**
 * Check if value is negative
 */
export function isNegative(value: number | string | Decimal | null | undefined): boolean {
  return toDecimal(value).lessThan(0);
}

/**
 * Check if value is positive
 */
export function isPositive(value: number | string | Decimal | null | undefined): boolean {
  return toDecimal(value).greaterThan(0);
}

/**
 * Clamp value to a range
 */
export function clamp(
  value: number | string | Decimal,
  min: number | string | Decimal,
  max: number | string | Decimal
): Decimal {
  const val = toDecimal(value);
  const minVal = toDecimal(min);
  const maxVal = toDecimal(max);

  if (val.lessThan(minVal)) return minVal;
  if (val.greaterThan(maxVal)) return maxVal;
  return val;
}

/**
 * Ensure value is non-negative (clamp to 0)
 */
export function nonNegative(value: number | string | Decimal | null | undefined): Decimal {
  const val = toDecimal(value);
  return val.lessThan(0) ? new Decimal(0) : val;
}

/**
 * Calculate margin percentage: ((price - cost) / price) * 100
 * Returns null if price is 0 or undefined
 */
export function calculateMargin(
  price: number | string | Decimal | null | undefined,
  cost: number | string | Decimal | null | undefined
): Decimal | null {
  const priceVal = toDecimal(price);
  const costVal = toDecimal(cost);

  if (priceVal.isZero()) {
    return null;
  }

  return priceVal.minus(costVal).div(priceVal).times(100);
}

/**
 * Calculate total value: price * quantity
 */
export function calculateValue(
  price: number | string | Decimal,
  quantity: number | string | Decimal
): Decimal {
  return toDecimal(price).times(toDecimal(quantity));
}

/**
 * Validate numeric input
 * Returns { valid: boolean, value: number | null, error: string | null }
 */
export function validateNumber(
  input: string | number | null | undefined,
  options: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
    allowZero?: boolean;
    label?: string;
  } = {}
): { valid: boolean; value: number | null; error: string | null } {
  const {
    min,
    max,
    allowNegative = false,
    allowZero = true,
    label = 'Value'
  } = options;

  // Empty check
  if (input === null || input === undefined || input === '') {
    return { valid: false, value: null, error: `${label} is required` };
  }

  // Convert to number
  const num = typeof input === 'number' ? input : parseFloat(input);

  // NaN check
  if (isNaN(num)) {
    return { valid: false, value: null, error: `${label} must be a valid number` };
  }

  // Infinity check
  if (!isFinite(num)) {
    return { valid: false, value: null, error: `${label} must be a finite number` };
  }

  // Negative check
  if (!allowNegative && num < 0) {
    return { valid: false, value: null, error: `${label} cannot be negative` };
  }

  // Zero check
  if (!allowZero && num === 0) {
    return { valid: false, value: null, error: `${label} cannot be zero` };
  }

  // Min check
  if (min !== undefined && num < min) {
    return { valid: false, value: null, error: `${label} must be at least ${min}` };
  }

  // Max check
  if (max !== undefined && num > max) {
    return { valid: false, value: null, error: `${label} must be at most ${max}` };
  }

  return { valid: true, value: num, error: null };
}

/**
 * Edge case tests - Run in development to verify precision
 */
export function runPrecisionTests() {
  if (process.env.NODE_ENV !== 'development') return;

  const tests = [
    // Floating point precision issues
    { name: '0.1 + 0.2', fn: () => add(0.1, 0.2).toFixed(2), expected: '0.30' },
    { name: '0.3 - 0.1', fn: () => subtract(0.3, 0.1).toFixed(2), expected: '0.20' },

    // Inventory scenarios
    { name: '7g + 7g + 7g + 7g (4 eighths)', fn: () => add(add(add(7, 7), 7), 7).toFixed(2), expected: '28.00' },
    { name: '28g - 7g', fn: () => subtract(28, 7).toFixed(2), expected: '21.00' },

    // Margin calculation
    { name: 'Margin: (10 - 6) / 10 * 100', fn: () => calculateMargin(10, 6)?.toFixed(1), expected: '40.0' },

    // Value calculation
    { name: 'Value: 28g * $10.50', fn: () => calculateValue(10.50, 28).toFixed(2), expected: '294.00' },

    // Rounding
    { name: 'Round 2.995', fn: () => round2(2.995).toString(), expected: '3' },
    { name: 'Round 2.994', fn: () => round2(2.994).toString(), expected: '2.99' },
  ];

  console.group('🧪 Precision Tests');

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      const result = test.fn();
      if (result === test.expected) {
        console.log(`✅ ${test.name}: ${result}`);
        passed++;
      } else {
        console.error(`❌ ${test.name}: Expected ${test.expected}, got ${result}`);
        failed++;
      }
    } catch (error) {
      console.error(`💥 ${test.name}: ${error}`);
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.groupEnd();
}
