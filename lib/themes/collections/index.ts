/**
 * Theme Collections Index
 * Re-exports all theme collections as a single unified array
 */

import { appleThemes } from "./apple";
import { luxuryThemes } from "./luxury";
import { premiumThemes } from "./premium";

/**
 * All TV Menu Display Themes - Premium Collection
 * Steve Jobs-approved: Minimal, elegant, and sophisticated
 */
export const themes = [
  ...appleThemes, // 2 themes
  ...luxuryThemes, // 8 themes
  ...premiumThemes, // 12 themes
]; // Total: 22 themes

// Re-export individual collections for direct access
export { appleThemes, luxuryThemes, premiumThemes };
