/**
 * Precision Math Unit Tests
 *
 * Mission-critical tests for floating-point arithmetic fixes.
 * Tests real-world edge cases that could cause inventory/money loss.
 */

import {
  toDecimal,
  add,
  subtract,
  multiply,
  divide,
  formatQuantity,
  formatPrice,
  formatPercentage,
  round2,
  isZero,
  isNegative,
  isPositive,
  calculateMargin,
  calculateValue,
  validateNumber,
  nonNegative,
} from '../lib/utils/precision';

describe('Precision Math - Critical Edge Cases', () => {
  describe('Floating Point Precision Bugs', () => {
    test('0.1 + 0.2 should equal 0.30 exactly', () => {
      const result = add(0.1, 0.2);
      expect(result.toNumber()).toBe(0.3);
      expect(formatQuantity(result)).toBe('0.30');
    });

    test('0.3 - 0.1 should equal 0.20 exactly', () => {
      const result = subtract(0.3, 0.1);
      expect(result.toNumber()).toBe(0.2);
      expect(formatQuantity(result)).toBe('0.20');
    });

    test('0.07 * 100 should equal 7.00 exactly', () => {
      const result = multiply(0.07, 100);
      expect(result.toNumber()).toBe(7);
      expect(formatQuantity(result)).toBe('7.00');
    });
  });

  describe('Cannabis Inventory Scenarios', () => {
    test('Four eighths (7g each) should equal one ounce (28g)', () => {
      const eighth1 = add(0, 7);
      const eighth2 = add(eighth1, 7);
      const eighth3 = add(eighth2, 7);
      const ounce = add(eighth3, 7);

      expect(ounce.toNumber()).toBe(28);
      expect(formatQuantity(ounce)).toBe('28.00');
    });

    test('28g - 7g (selling an eighth) should equal 21g exactly', () => {
      const result = subtract(28, 7);
      expect(result.toNumber()).toBe(21);
      expect(formatQuantity(result)).toBe('21.00');
    });

    test('Quarter ounce (7g) + Half ounce (14g) = Three quarters (21g)', () => {
      const result = add(7, 14);
      expect(result.toNumber()).toBe(21);
      expect(formatQuantity(result)).toBe('21.00');
    });

    test('Zeroing out 28.00g with -28.00g should equal 0.00', () => {
      const result = add(28, -28);
      expect(result.toNumber()).toBe(0);
      expect(formatQuantity(result)).toBe('0.00');
    });

    test('Zeroing out 7.50g with -7.50g should equal 0.00', () => {
      const result = add(7.5, -7.5);
      expect(result.toNumber()).toBe(0);
      expect(formatQuantity(result)).toBe('0.00');
    });
  });

  describe('Financial Calculations', () => {
    test('Margin calculation: (10 - 6) / 10 * 100 = 40.0%', () => {
      const margin = calculateMargin(10, 6);
      expect(margin).not.toBeNull();
      expect(margin!.toNumber()).toBe(40);
      expect(formatPercentage(margin)).toBe('40.0');
    });

    test('Value calculation: 28g * $10.50 = $294.00', () => {
      const value = calculateValue(10.50, 28);
      expect(value.toNumber()).toBe(294);
      expect(formatPrice(value)).toBe('294.00');
    });

    test('High precision margin: (15.99 - 8.45) / 15.99 * 100', () => {
      const margin = calculateMargin(15.99, 8.45);
      expect(margin).not.toBeNull();
      // Should be 47.154471...%, formatted to 47.2%
      expect(formatPercentage(margin)).toBe('47.2');
    });

    test('Margin with zero price should return null', () => {
      const margin = calculateMargin(0, 5);
      expect(margin).toBeNull();
    });
  });

  describe('Rounding Edge Cases', () => {
    test('2.995 should round to 3.00 (half-up rounding)', () => {
      expect(round2(2.995)).toBe(3);
      expect(formatQuantity(2.995)).toBe('3.00');
    });

    test('2.994 should round to 2.99', () => {
      expect(round2(2.994)).toBe(2.99);
      expect(formatQuantity(2.994)).toBe('2.99');
    });

    test('2.5 should round to 2.50', () => {
      expect(round2(2.5)).toBe(2.5);
      expect(formatQuantity(2.5)).toBe('2.50');
    });

    test('0.005 should round to 0.01 (half-up)', () => {
      expect(round2(0.005)).toBe(0.01);
      expect(formatQuantity(0.005)).toBe('0.01');
    });
  });

  describe('Zero Detection', () => {
    test('0 should be detected as zero', () => {
      expect(isZero(0)).toBe(true);
    });

    test('0.001 should be detected as zero (within epsilon)', () => {
      expect(isZero(0.001)).toBe(true);
    });

    test('0.02 should NOT be detected as zero (beyond epsilon)', () => {
      expect(isZero(0.02)).toBe(false);
    });

    test('-0.001 should be detected as zero (abs value)', () => {
      expect(isZero(-0.001)).toBe(true);
    });
  });

  describe('Sign Detection', () => {
    test('Positive number detection', () => {
      expect(isPositive(5)).toBe(true);
      expect(isPositive(0.01)).toBe(true);
      expect(isPositive(0)).toBe(false);
      expect(isNegative(-0.01)).toBe(true);
    });

    test('Negative number detection', () => {
      expect(isNegative(-5)).toBe(true);
      expect(isNegative(-0.01)).toBe(true);
      expect(isNegative(0)).toBe(false);
      expect(isNegative(5)).toBe(false);
    });
  });

  describe('Non-Negative Clamping', () => {
    test('Positive number stays positive', () => {
      expect(nonNegative(5).toNumber()).toBe(5);
    });

    test('Zero stays zero', () => {
      expect(nonNegative(0).toNumber()).toBe(0);
    });

    test('Negative number clamps to zero', () => {
      expect(nonNegative(-5).toNumber()).toBe(0);
      expect(nonNegative(-0.01).toNumber()).toBe(0);
    });
  });

  describe('Input Validation', () => {
    test('Valid positive number', () => {
      const result = validateNumber(5, { min: 0 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.error).toBeNull();
    });

    test('Invalid: NaN', () => {
      const result = validateNumber('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    test('Invalid: Infinity', () => {
      const result = validateNumber(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite');
    });

    test('Invalid: Negative when not allowed', () => {
      const result = validateNumber(-5, { allowNegative: false });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    test('Invalid: Zero when not allowed', () => {
      const result = validateNumber(0, { allowZero: false });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be zero');
    });

    test('Invalid: Below minimum', () => {
      const result = validateNumber(5, { min: 10 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 10');
    });

    test('Invalid: Above maximum', () => {
      const result = validateNumber(15, { max: 10 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 10');
    });

    test('Valid: Within range', () => {
      const result = validateNumber(5, { min: 0, max: 10 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
    });

    test('Custom label in error message', () => {
      const result = validateNumber(-5, { label: 'Price', allowNegative: false });
      expect(result.error).toContain('Price cannot be negative');
    });
  });

  describe('Division by Zero', () => {
    test('Division by zero should return 0 safely', () => {
      const result = divide(10, 0);
      expect(result.toNumber()).toBe(0);
    });

    test('Percentage with zero denominator should return 0', () => {
      const margin = calculateMargin(0, 5);
      expect(margin).toBeNull();
    });
  });

  describe('Large Numbers', () => {
    test('Large inventory: 1000 ounces = 28000 grams', () => {
      const result = multiply(1000, 28);
      expect(result.toNumber()).toBe(28000);
      expect(formatQuantity(result)).toBe('28000.00');
    });

    test('Large value: 1000g * $100 = $100,000', () => {
      const result = calculateValue(100, 1000);
      expect(result.toNumber()).toBe(100000);
      expect(formatPrice(result)).toBe('100000.00');
    });
  });

  describe('Small Numbers', () => {
    test('Tiny adjustment: 0.01g (1 centigram)', () => {
      const result = add(10, 0.01);
      expect(formatQuantity(result)).toBe('10.01');
    });

    test('Micro price: $0.01', () => {
      const result = multiply(0.01, 1);
      expect(formatPrice(result)).toBe('0.01');
    });
  });

  describe('Real-World Bug Scenarios', () => {
    test('Bug: User sees 2.00g, tries to zero out with -2.00, but DB has 1.995g', () => {
      // Simulate: DB has 1.995g (slightly off due to prior floating point error)
      // User sees 2.00g (rounded for display)
      // User tries to zero out: 1.995 + (-2.00) = -0.005g

      const dbQuantity = 1.995;
      const displayedQuantity = 2.00; // What user sees
      const userAdjustment = -displayedQuantity;

      const newQty = add(dbQuantity, userAdjustment);

      // Should be very close to zero but might be slightly negative
      expect(newQty.toNumber()).toBeLessThan(0.01);
      expect(newQty.toNumber()).toBeGreaterThan(-0.01);

      // nonNegative should clamp it to 0
      const clamped = nonNegative(newQty);
      expect(clamped.toNumber()).toBe(0);
      expect(formatQuantity(clamped)).toBe('0.00');
    });

    test('Bug: Repeated small adjustments accumulate error', () => {
      // Simulate selling 7g eighths repeatedly
      let inventory = toDecimal(56); // Start with 2 ounces

      // Sell 8 eighths (should leave 0)
      for (let i = 0; i < 8; i++) {
        inventory = subtract(inventory, 7);
      }

      expect(inventory.toNumber()).toBe(0);
      expect(formatQuantity(inventory)).toBe('0.00');
    });

    test('Bug: Price * Quantity for many items should be exact', () => {
      // $10.99 * 37 units = $406.63 exactly
      const result = multiply(10.99, 37);
      expect(result.toNumber()).toBe(406.63);
      expect(formatPrice(result)).toBe('406.63');
    });
  });
});
