/**
 * TV Menu Display Themes - BACKWARD COMPATIBILITY LAYER
 *
 * This file maintains backward compatibility by re-exporting from the refactored structure.
 * The original 1,056-line file has been split into organized modules in lib/themes/
 *
 * All existing imports will continue to work:
 * import { themes, TVTheme, getTheme } from '@/lib/themes'
 *
 * New structure:
 * - lib/themes/types.ts - Type definitions
 * - lib/themes/collections/ - Theme collections (apple, luxury, premium)
 * - lib/themes/utils.ts - Helper functions
 * - lib/themes/index.ts - Main export
 */

export * from "./themes/index";
