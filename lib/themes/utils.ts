/**
 * Theme Utility Functions
 */

import type { TVTheme } from "./types";
import { themes } from "./collections";

/**
 * Get a theme by ID, returns first theme (platinum) as default
 */
export const getTheme = (themeId: string | null | undefined): TVTheme => {
  if (!themeId) return themes[0]; // Default to first theme (apple-light)
  return themes.find((t) => t.id === themeId) || themes[0];
};

/**
 * Get the default theme (first theme in collection)
 */
export const getDefaultTheme = (): TVTheme => themes[0];
