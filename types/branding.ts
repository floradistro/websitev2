/**
 * 🎨 Vendor Branding Types
 *
 * Type definitions for vendor branding, themes, and storefront customization
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Core Branding Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface SocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "21:00"
  closed?: boolean;
}

export interface BrandAssets {
  logos?: AssetVariant[];
  banners?: AssetVariant[];
  icons?: AssetVariant[];
  patterns?: AssetVariant[];
}

export interface AssetVariant {
  id: string;
  name: string;
  url: string;
  type: "logo" | "banner" | "icon" | "pattern";
  variant?: "light" | "dark" | "color" | "mono";
  width?: number;
  height?: number;
  fileSize?: number;
  uploadedAt: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Branding Interface (matches database schema)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface VendorBranding {
  // Visual Assets
  logo_url: string | null;
  banner_url: string | null;

  // Store Information
  store_tagline: string | null;
  store_description: string | null;

  // Design Tokens
  brand_colors: BrandColors | null;
  custom_font: string | null;
  custom_css: string | null;

  // Social & Contact
  social_links: SocialLinks | null;
  business_hours: BusinessHours | null;

  // Policies
  return_policy: string | null;
  shipping_policy: string | null;

  // Advanced
  brand_assets?: BrandAssets | null;
  theme_preset?: string | null;

  // Metadata
  last_updated?: string;
  updated_by?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Form State Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BrandingFormState {
  // Basic Info
  tagline: string;
  about: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;

  // Typography
  customFont: string;

  // Social
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;

  // Assets (file upload state)
  logoFile: File | null;
  logoPreview: string;
  bannerFile: File | null;
  bannerPreview: string;

  // Business Hours
  businessHours: BusinessHours;

  // Policies
  returnPolicy: string;
  shippingPolicy: string;

  // Custom CSS
  customCss: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface GetBrandingResponse {
  success: true;
  branding: VendorBranding;
}

export interface UpdateBrandingRequest {
  logo_url?: string;
  banner_url?: string;
  store_tagline?: string;
  store_description?: string;
  brand_colors?: string; // JSON stringified
  social_links?: string; // JSON stringified
  custom_font?: string;
  custom_css?: string;
  business_hours?: string; // JSON stringified
  return_policy?: string;
  shipping_policy?: string;
}

export interface UpdateBrandingResponse {
  success: true;
  branding: VendorBranding;
}

export interface UploadAssetResponse {
  success: true;
  file: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
}

export interface BrandingError {
  error: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Brand Presets
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BrandPreset {
  id: string;
  name: string;
  description: string;
  colors: BrandColors;
  font: string;
  preview?: string;
}

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "cannabis-modern",
    name: "Cannabis Modern",
    description: "Fresh, clean, professional cannabis aesthetic",
    colors: {
      primary: "#10B981",
      secondary: "#F3F4F6",
      accent: "#059669",
      background: "#FFFFFF",
      text: "#1A1A1A",
    },
    font: "Inter",
  },
  {
    id: "luxury-minimal",
    name: "Luxury Minimal",
    description: "Sophisticated high-end brand identity",
    colors: {
      primary: "#D4AF37",
      secondary: "#1F1F1F",
      accent: "#F5F5F5",
      background: "#FFFFFF",
      text: "#1F1F1F",
    },
    font: "Playfair Display",
  },
  {
    id: "earth-tones",
    name: "Earth Tones",
    description: "Natural, organic, grounded aesthetic",
    colors: {
      primary: "#8B7355",
      secondary: "#F5F1E8",
      accent: "#A8956B",
      background: "#FFFEF9",
      text: "#3D3D3D",
    },
    font: "Merriweather",
  },
  {
    id: "bold-vibrant",
    name: "Bold & Vibrant",
    description: "Eye-catching, energetic brand presence",
    colors: {
      primary: "#EC4899",
      secondary: "#8B5CF6",
      accent: "#F59E0B",
      background: "#FFFFFF",
      text: "#1A1A1A",
    },
    font: "Poppins",
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    description: "Sleek, modern dark theme",
    colors: {
      primary: "#FFFFFF",
      secondary: "#1A1A1A",
      accent: "#3B82F6",
      background: "#0A0A0A",
      text: "#F5F5F5",
    },
    font: "Inter",
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Validation & Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BrandingValidation {
  isValid: boolean;
  errors: {
    [key: string]: string;
  };
}

export type BrandingField = keyof VendorBranding;

export const AVAILABLE_FONTS = [
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Lato",
  "Roboto",
  "Open Sans",
  "Poppins",
  "Raleway",
  "Merriweather",
  "Crimson Text",
] as const;

export type AvailableFont = (typeof AVAILABLE_FONTS)[number];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const LOGO_RECOMMENDED_SIZE = { width: 300, height: 300 };
export const BANNER_RECOMMENDED_SIZE = { width: 1920, height: 600 };
