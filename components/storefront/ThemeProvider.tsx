'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { VendorStorefront } from '@/lib/storefront/get-vendor';

interface ThemeContextValue {
  vendor: VendorStorefront;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  vendor: VendorStorefront;
}

export function StorefrontThemeProvider({ children, vendor }: ThemeProviderProps) {
  const colors = {
    primary: vendor.brand_colors?.primary || '#000000',
    secondary: vendor.brand_colors?.secondary || '#FFFFFF',
    accent: vendor.brand_colors?.accent || '#666666',
    background: vendor.brand_colors?.background || '#FFFFFF',
    text: vendor.brand_colors?.text || '#1A1A1A',
  };

  const fonts = {
    heading: vendor.custom_font || 'Inter',
    body: vendor.custom_font || 'Inter',
  };

  useEffect(() => {
    // Apply CSS variables to document root
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-text', colors.text);
    
    root.style.setProperty('--font-heading', fonts.heading);
    root.style.setProperty('--font-body', fonts.body);

    // Load Google Font if specified
    if (vendor.custom_font && vendor.custom_font !== 'Inter') {
      const fontLink = document.createElement('link');
      fontLink.href = `https://fonts.googleapis.com/css2?family=${vendor.custom_font.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }

    // Apply custom CSS if provided
    if (vendor.custom_css) {
      const styleElement = document.createElement('style');
      styleElement.id = 'vendor-custom-css';
      styleElement.textContent = vendor.custom_css;
      document.head.appendChild(styleElement);

      return () => {
        const existingStyle = document.getElementById('vendor-custom-css');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [vendor, colors, fonts]);

  const contextValue: ThemeContextValue = {
    vendor,
    colors,
    fonts,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useStorefrontTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useStorefrontTheme must be used within StorefrontThemeProvider');
  }
  return context;
}

