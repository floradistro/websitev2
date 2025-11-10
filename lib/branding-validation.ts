/**
 * 🎨 Branding Validation Utilities
 *
 * Form validation and data sanitization for vendor branding
 */

import type { BrandingFormState, BrandingValidation } from "@/types/branding";

export function validateBrandingForm(formData: Partial<BrandingFormState>): BrandingValidation {
  const errors: { [key: string]: string } = {};

  // Tagline validation
  if (formData.tagline && formData.tagline.length > 100) {
    errors.tagline = "Tagline must be 100 characters or less";
  }

  // Description validation
  if (formData.about && formData.about.length > 500) {
    errors.about = "Description must be 500 characters or less";
  }

  // Color validation
  const colorFields = [
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "backgroundColor",
    "textColor",
  ] as const;

  colorFields.forEach((field) => {
    const color = formData[field];
    if (color && !isValidHexColor(color)) {
      errors[field] = "Invalid color format (use #RRGGBB)";
    }
  });

  // Color contrast validation (basic)
  if (formData.primaryColor && formData.backgroundColor) {
    const contrast = getContrastRatio(formData.primaryColor, formData.backgroundColor);
    if (contrast < 3) {
      errors.colorContrast =
        "Low contrast between primary color and background. Consider choosing colors with better contrast for readability.";
    }
  }

  // URL validation
  if (formData.website && !isValidUrl(formData.website)) {
    errors.website = "Invalid website URL";
  }

  // Social media validation
  if (formData.instagram && formData.instagram.length > 50) {
    errors.instagram = "Instagram handle too long";
  }

  if (formData.facebook && formData.facebook.length > 50) {
    errors.facebook = "Facebook page name too long";
  }

  // Policy length validation
  if (formData.returnPolicy && formData.returnPolicy.length > 2000) {
    errors.returnPolicy = "Return policy must be 2000 characters or less";
  }

  if (formData.shippingPolicy && formData.shippingPolicy.length > 2000) {
    errors.shippingPolicy = "Shipping policy must be 2000 characters or less";
  }

  // Custom CSS validation (basic safety check)
  if (formData.customCss && formData.customCss.length > 10000) {
    errors.customCss = "Custom CSS must be 10,000 characters or less";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Calculate contrast ratio between two hex colors
 * WCAG 2.0 formula
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a hex color
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Sanitize social media handle
 */
export function sanitizeSocialHandle(handle: string): string {
  return handle.replace(/^@/, "").trim();
}

/**
 * Format URL to ensure it has protocol
 */
export function formatUrl(url: string): string {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Validate and sanitize file for upload
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): string | null {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!validTypes.includes(file.type)) {
    return "Please upload a JPG, PNG, WEBP, or GIF image";
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return null;
}

/**
 * Get contrast rating (AAA, AA, or Fail)
 */
export function getContrastRating(contrast: number): {
  rating: "AAA" | "AA" | "Fail";
  description: string;
} {
  if (contrast >= 7) {
    return {
      rating: "AAA",
      description: "Excellent contrast for all text sizes",
    };
  }
  if (contrast >= 4.5) {
    return {
      rating: "AA",
      description: "Good contrast for normal text",
    };
  }
  return {
    rating: "Fail",
    description: "Insufficient contrast - may be hard to read",
  };
}
