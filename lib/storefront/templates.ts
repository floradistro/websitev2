/**
 * Storefront Template System
 * 
 * This module provides a registry and loader for vendor storefront templates.
 * Each vendor can select a template_id which determines the design and layout
 * of their storefront.
 */

export interface StorefrontTemplate {
  id: string;
  name: string;
  description: string;
  // Component paths for dynamic import
  components: {
    HomePage: string;
    ShopPage: string;
    ProductPage: string;
    Header: string;
    Footer: string;
    ProductCard: string;
    // Add more as needed
  };
}

/**
 * Template Registry
 * Maps template IDs to their component implementations
 */
export const TEMPLATE_REGISTRY: Record<string, StorefrontTemplate> = {
  default: {
    id: 'default',
    name: 'Default Template',
    description: 'Clean, modern template suitable for all vendors',
    components: {
      HomePage: '@/components/storefront/templates/default/HomePage',
      ShopPage: '@/components/storefront/templates/default/ShopPage',
      ProductPage: '@/components/storefront/templates/default/ProductPage',
      Header: '@/components/storefront/templates/default/Header',
      Footer: '@/components/storefront/templates/default/Footer',
      ProductCard: '@/components/storefront/templates/default/ProductCard',
    },
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist Template',
    description: 'Ultra-modern minimalist design with black/white aesthetic',
    components: {
      HomePage: '@/components/storefront/templates/minimalist/HomePage',
      ShopPage: '@/components/storefront/templates/minimalist/ShopPage',
      ProductPage: '@/components/storefront/templates/minimalist/ProductPage',
      Header: '@/components/storefront/templates/minimalist/Header',
      Footer: '@/components/storefront/templates/minimalist/Footer',
      ProductCard: '@/components/storefront/templates/minimalist/ProductCard',
    },
  },
};

/**
 * Get template configuration by ID
 */
export function getTemplate(templateId: string): StorefrontTemplate {
  return TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.default;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): StorefrontTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Check if a template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in TEMPLATE_REGISTRY;
}

