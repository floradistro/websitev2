/**
 * Template Component Loader
 * 
 * Dynamically loads template components based on vendor's template_id
 */

import { getTemplate } from './templates';

// Import all template components
// Minimalist Template (current Flora Distro design)
import MinimalistHomePage from '@/components/storefront/templates/minimalist/HomePage';
import MinimalistShopPage from '@/components/storefront/templates/minimalist/ShopPage';
import MinimalistProductPage from '@/components/storefront/templates/minimalist/ProductPage';
import MinimalistHeader from '@/components/storefront/templates/minimalist/Header';
import MinimalistFooter from '@/components/storefront/templates/minimalist/Footer';
import MinimalistProductCard from '@/components/storefront/templates/minimalist/ProductCard';

// Default Template
import DefaultHomePage from '@/components/storefront/templates/default/HomePage';
import DefaultShopPage from '@/components/storefront/templates/default/ShopPage';
import DefaultProductPage from '@/components/storefront/templates/default/ProductPage';
import DefaultHeader from '@/components/storefront/templates/default/Header';
import DefaultFooter from '@/components/storefront/templates/default/Footer';
import DefaultProductCard from '@/components/storefront/templates/default/ProductCard';

/**
 * Component map for dynamic loading
 */
const COMPONENT_MAP: Record<string, any> = {
  // Minimalist template components
  'minimalist-HomePage': MinimalistHomePage,
  'minimalist-ShopPage': MinimalistShopPage,
  'minimalist-ProductPage': MinimalistProductPage,
  'minimalist-Header': MinimalistHeader,
  'minimalist-Footer': MinimalistFooter,
  'minimalist-ProductCard': MinimalistProductCard,
  
  // Default template components
  'default-HomePage': DefaultHomePage,
  'default-ShopPage': DefaultShopPage,
  'default-ProductPage': DefaultProductPage,
  'default-Header': DefaultHeader,
  'default-Footer': DefaultFooter,
  'default-ProductCard': DefaultProductCard,
};

/**
 * Load a template component
 */
export function loadTemplateComponent(
  templateId: string,
  componentName: string
): React.ComponentType<any> {
  const key = `${templateId}-${componentName}`;
  const component = COMPONENT_MAP[key];
  
  if (!component) {
    // Fallback to default template
    const defaultKey = `default-${componentName}`;
    console.warn(`Template component ${key} not found, falling back to ${defaultKey}`);
    return COMPONENT_MAP[defaultKey] || (() => null);
  }
  
  return component;
}

/**
 * Get all components for a template
 */
export function getTemplateComponents(templateId: string) {
  return {
    HomePage: loadTemplateComponent(templateId, 'HomePage'),
    ShopPage: loadTemplateComponent(templateId, 'ShopPage'),
    ProductPage: loadTemplateComponent(templateId, 'ProductPage'),
    Header: loadTemplateComponent(templateId, 'Header'),
    Footer: loadTemplateComponent(templateId, 'Footer'),
    ProductCard: loadTemplateComponent(templateId, 'ProductCard'),
  };
}

