/**
 * Template Component Loader
 * 
 * Dynamically loads template components based on vendor's template_id
 * Uses dynamic imports to avoid server-side import issues
 */

import { ComponentType } from 'react';
import { getTemplate } from './templates';

/**
 * Dynamically import template components
 * This avoids loading all templates at build time
 */
async function importTemplateComponent(
  templateId: string,
  componentName: string
): Promise<ComponentType<any>> {
  try {
    const module = await import(`@/components/storefront/templates/${templateId}/${componentName}`);
    return module.default;
  } catch (error) {
    console.warn(`Failed to load ${templateId}/${componentName}, falling back to default`);
    // Fallback to default template
    try {
      const defaultModule = await import(`@/components/storefront/templates/default/${componentName}`);
      return defaultModule.default;
    } catch (fallbackError) {
      // Return empty component as last resort
      return (() => null) as ComponentType<any>;
    }
  }
}

/**
 * Get all components for a template
 * This function should only be called on the server
 */
export async function getTemplateComponentsAsync(templateId: string) {
  const [
    HomePage,
    ShopPage,
    ProductPage,
    Header,
    Footer,
    ProductCard,
  ] = await Promise.all([
    importTemplateComponent(templateId, 'HomePage'),
    importTemplateComponent(templateId, 'ShopPage'),
    importTemplateComponent(templateId, 'ProductPage'),
    importTemplateComponent(templateId, 'Header'),
    importTemplateComponent(templateId, 'Footer'),
    importTemplateComponent(templateId, 'ProductCard'),
  ]);

  return {
    HomePage,
    ShopPage,
    ProductPage,
    Header,
    Footer,
    ProductCard,
  };
}

/**
 * Synchronous version for pages that need immediate access
 * Pre-imports all template components
 */
import MinimalistHomePage from '@/components/storefront/templates/minimalist/HomePage';
import MinimalistShopPage from '@/components/storefront/templates/minimalist/ShopPage';
import MinimalistProductPage from '@/components/storefront/templates/minimalist/ProductPage';
import MinimalistHeader from '@/components/storefront/templates/minimalist/Header';
import MinimalistFooter from '@/components/storefront/templates/minimalist/Footer';
import MinimalistProductCard from '@/components/storefront/templates/minimalist/ProductCard';

import DefaultHomePage from '@/components/storefront/templates/default/HomePage';
import DefaultShopPage from '@/components/storefront/templates/default/ShopPage';
import DefaultProductPage from '@/components/storefront/templates/default/ProductPage';
import DefaultHeader from '@/components/storefront/templates/default/Header';
import DefaultFooter from '@/components/storefront/templates/default/Footer';
import DefaultProductCard from '@/components/storefront/templates/default/ProductCard';

const COMPONENT_MAP: Record<string, any> = {
  'minimalist-HomePage': MinimalistHomePage,
  'minimalist-ShopPage': MinimalistShopPage,
  'minimalist-ProductPage': MinimalistProductPage,
  'minimalist-Header': MinimalistHeader,
  'minimalist-Footer': MinimalistFooter,
  'minimalist-ProductCard': MinimalistProductCard,
  'default-HomePage': DefaultHomePage,
  'default-ShopPage': DefaultShopPage,
  'default-ProductPage': DefaultProductPage,
  'default-Header': DefaultHeader,
  'default-Footer': DefaultFooter,
  'default-ProductCard': DefaultProductCard,
};

export function loadTemplateComponent(
  templateId: string,
  componentName: string
): ComponentType<any> {
  const key = `${templateId}-${componentName}`;
  const component = COMPONENT_MAP[key];
  
  if (!component) {
    const defaultKey = `default-${componentName}`;
    console.warn(`Template component ${key} not found, falling back to ${defaultKey}`);
    return COMPONENT_MAP[defaultKey] || (() => null);
  }
  
  return component;
}

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
