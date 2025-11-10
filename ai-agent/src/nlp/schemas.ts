import { z } from "zod";

/**
 * Zod schemas for validating AI-generated storefront specifications
 */

export const ThemeColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  secondary: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  accent: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  background: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  text: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
});

export const TypographySchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  sizes: z.record(z.string(), z.string()),
});

export const ThemeSchema = z.object({
  style: z.enum(["minimalist", "luxury", "modern", "classic", "bold"]),
  colors: ThemeColorsSchema,
  typography: TypographySchema,
});

export const LayoutSchema = z.object({
  header: z.enum(["sticky", "static", "hidden"]),
  navigation: z.enum(["top", "side", "mega-menu"]),
  productGrid: z.number().min(2).max(5),
  showCategories: z.boolean(),
  showSearch: z.boolean(),
  showCart: z.boolean(),
});

export const FeaturesSchema = z.object({
  ageVerification: z.boolean().default(true),
  productFilters: z.array(z.string()),
  wishlist: z.boolean().default(false),
  productReviews: z.boolean().default(true),
  socialSharing: z.boolean().default(false),
});

export const PageConfigSchema = z.object({
  enabled: z.boolean(),
  title: z.string().optional(),
  description: z.string().optional(),
  layout: z.string().optional(),
  components: z.array(z.string()).optional(),
});

export const PagesSchema = z.object({
  home: PageConfigSchema,
  shop: PageConfigSchema,
  about: PageConfigSchema.optional(),
  contact: PageConfigSchema.optional(),
  custom: z.array(PageConfigSchema).optional(),
});

export const StoreRequirementsSchema = z.object({
  theme: ThemeSchema,
  layout: LayoutSchema,
  features: FeaturesSchema,
  pages: PagesSchema,
});

export type StoreRequirements = z.infer<typeof StoreRequirementsSchema>;
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type Features = z.infer<typeof FeaturesSchema>;
export type PageConfig = z.infer<typeof PageConfigSchema>;
