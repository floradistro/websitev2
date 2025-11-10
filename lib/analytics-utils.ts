/**
 * Analytics Utility Functions
 * Pure functions for calculations, formatting, and data transformation
 */

import { TrendData, TimeRange, DateRange } from "@/types/analytics";

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get start date based on time range
 */
export function getStartDate(range: TimeRange): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (range) {
    case "7d":
      now.setDate(now.getDate() - 7);
      break;
    case "30d":
      now.setDate(now.getDate() - 30);
      break;
    case "90d":
      now.setDate(now.getDate() - 90);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
      return new Date("2000-01-01");
    default:
      now.setDate(now.getDate() - 30);
  }

  return now;
}

/**
 * Get comparison period date range
 */
export function getComparisonPeriod(range: TimeRange): DateRange {
  const end = getStartDate(range);
  const start = new Date(end);

  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  format: "short" | "long" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "long") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// Calculation Utilities
// ============================================================================

/**
 * Calculate trend between current and previous values
 */
export function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return {
      value: current,
      change: current,
      changePercent: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : current < 0 ? "down" : "neutral",
    };
  }

  const change = current - previous;
  const changePercent = (change / previous) * 100;

  return {
    value: current,
    change,
    changePercent,
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

/**
 * Calculate percentage safely (avoiding division by zero)
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(
  currentData: Array<{ amount: number }>,
  previousData: Array<{ amount: number }>,
): number {
  const currentTotal = currentData.reduce((sum, d) => sum + d.amount, 0);
  const previousTotal = previousData.reduce((sum, d) => sum + d.amount, 0);

  return calculatePercentage(currentTotal - previousTotal, previousTotal);
}

/**
 * Calculate period-over-period growth from time series
 */
export function calculatePeriodGrowth(data: Array<{ amount: number }>): number {
  if (data.length < 2) return 0;

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data
    .slice(0, midpoint)
    .reduce((sum, d) => sum + d.amount, 0);
  const secondHalf = data.slice(midpoint).reduce((sum, d) => sum + d.amount, 0);

  return calculatePercentage(secondHalf - firstHalf, firstHalf);
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format currency with proper locale and decimals
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: {
    decimals?: number;
    compact?: boolean;
    showCents?: boolean;
  } = {},
): string {
  const { decimals = 2, compact = false, showCents = true } = options;

  // Handle null/undefined
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0.00";
  }

  // Ensure it's a number
  const numAmount = Number(amount);

  if (compact && Math.abs(numAmount) >= 1000) {
    if (Math.abs(numAmount) >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`;
    }
    return `$${(numAmount / 1000).toFixed(1)}K`;
  }

  const fractionDigits = showCents ? decimals : 0;

  return numAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Format number with compact notation
 */
export function formatNumber(
  value: number | null | undefined,
  options: {
    decimals?: number;
    compact?: boolean;
  } = {},
): string {
  const { decimals = 0, compact = false } = options;

  // Handle null/undefined
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }

  // Ensure it's a number
  const numValue = Number(value);

  if (compact && Math.abs(numValue) >= 1000) {
    if (Math.abs(numValue) >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    }
    return `${(numValue / 1000).toFixed(1)}K`;
  }

  return numValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | null | undefined,
  options: {
    decimals?: number;
    showSign?: boolean;
  } = {},
): string {
  const { decimals = 1, showSign = false } = options;

  // Handle null/undefined
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }

  // Ensure it's a number
  const numValue = Number(value);

  const sign = showSign && numValue > 0 ? "+" : "";
  return `${sign}${numValue.toFixed(decimals)}%`;
}

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * Group data by date
 */
export function groupByDate<T extends { date: string }>(
  data: T[],
  aggregator: (items: T[]) => any,
): any[] {
  const grouped = new Map<string, T[]>();

  data.forEach((item) => {
    const date = new Date(item.date).toISOString().split("T")[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(item);
  });

  return Array.from(grouped.entries())
    .map(([date, items]) => ({
      date,
      ...aggregator(items),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fill missing dates in time series
 */
export function fillMissingDates(
  data: Array<{ date: string; [key: string]: any }>,
  startDate: Date,
  endDate: Date,
  defaultValue: any = 0,
): Array<{ date: string; [key: string]: any }> {
  const filled: Array<{ date: string; [key: string]: any }> = [];
  const dataMap = new Map(data.map((d) => [d.date, d]));

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];

    if (dataMap.has(dateStr)) {
      filled.push(dataMap.get(dateStr)!);
    } else {
      // Create entry with default values
      const keys = data[0]
        ? Object.keys(data[0]).filter((k) => k !== "date")
        : [];
      const entry: any = { date: dateStr };
      keys.forEach((key) => {
        entry[key] = defaultValue;
      });
      filled.push(entry);
    }

    current.setDate(current.getDate() + 1);
  }

  return filled;
}

/**
 * Calculate percentile
 */
export function calculatePercentile(
  values: number[],
  percentile: number,
): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Safely parse float from database string/number
 */
export function safeParseFloat(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return value;

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse int from database string/number
 */
export function safeParseInt(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return Math.floor(value);

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate time range
 */
export function isValidTimeRange(range: string): range is TimeRange {
  return ["7d", "30d", "90d", "1y", "all"].includes(range);
}

/**
 * Validate vendor ID format
 */
export function isValidVendorId(id: string | null): boolean {
  if (!id) return false;
  // UUID v4 format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
