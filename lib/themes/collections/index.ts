/**
 * Theme Collections Index
 * Re-exports all theme collections as a single unified array
 */

import { appleThemes } from "./apple";
import { ios18Themes } from "./ios18";

/**
 * All TV Menu Display Themes - Curated Collection
 * Apple-quality themes with stunning iOS 18 animated gradients
 */
export const themes = [
  ...appleThemes, // 2 themes (Apple Light, Apple Dark)
  ...ios18Themes, // 5 themes (Aurora, Sunset, Ocean, Forest, Twilight)
]; // Total: 7 focused, beautiful themes

// Re-export individual collections for direct access
export { appleThemes, ios18Themes };
