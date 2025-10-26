/**
 * Consolidated vendor navigation configuration
 * Reduces from 16 items to 10 core features
 */

import { 
  Home, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  BarChart3,
  Settings,
  Palette,
  DollarSign,
  FileText,
  Image,
  Layers
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: any;
  label: string;
  description?: string;
  isCore?: boolean; // Show in mobile bottom nav
  group?: 'core' | 'sales' | 'content' | 'settings';
}

// Consolidated navigation - 10 core items
export const vendorNavItems: NavItem[] = [
  // Core Operations (4)
  { 
    href: '/vendor/dashboard', 
    icon: Home, 
    label: 'Dashboard',
    description: 'Overview & metrics',
    isCore: true,
    group: 'core'
  },
  { 
    href: '/vendor/products', 
    icon: Package, 
    label: 'Products',
    description: 'Catalog & inventory',
    isCore: true,
    group: 'core'
  },
  { 
    href: '/vendor/orders', 
    icon: ShoppingBag, 
    label: 'Orders',
    description: 'Transactions',
    isCore: true,
    group: 'sales'
  },
  { 
    href: '/vendor/analytics', 
    icon: TrendingUp, 
    label: 'Analytics',
    description: 'Performance insights',
    isCore: false,
    group: 'sales'
  },
  
  // Inventory & Pricing (2)
  { 
    href: '/vendor/inventory', 
    icon: BarChart3, 
    label: 'Inventory',
    description: 'Stock management',
    isCore: false,
    group: 'core'
  },
  { 
    href: '/vendor/pricing', 
    icon: DollarSign, 
    label: 'Pricing',
    description: 'Price management',
    isCore: false,
    group: 'core'
  },
  { 
    href: '/vendor/product-fields', 
    icon: Layers, 
    label: 'Fields',
    description: 'Custom product fields',
    isCore: false,
    group: 'core'
  },
  
  // Content & Media (2)
  { 
    href: '/vendor/media-library', 
    icon: Image, 
    label: 'Media',
    description: 'Images & assets',
    isCore: false,
    group: 'content'
  },
  { 
    href: '/vendor/branding', 
    icon: Palette, 
    label: 'Branding',
    description: 'Store customization',
    isCore: false,
    group: 'content'
  },
  
  // Financial (1)
  { 
    href: '/vendor/payouts', 
    icon: DollarSign, 
    label: 'Payouts',
    description: 'Earnings & payments',
    isCore: false,
    group: 'sales'
  },
  
  // Settings (1)
  { 
    href: '/vendor/settings', 
    icon: Settings, 
    label: 'Settings',
    description: 'Account & preferences',
    isCore: true,
    group: 'settings'
  },
];

// Secondary features accessible through main pages
export const secondaryFeatures = [
  { href: '/vendor/locations', parent: '/vendor/settings', label: 'Locations' },
  { href: '/vendor/employees', parent: '/vendor/settings', label: 'Team' },
  { href: '/vendor/domains', parent: '/vendor/branding', label: 'Custom Domains' },
  { href: '/vendor/lab-results', parent: '/vendor/products', label: 'Lab Results' },
  { href: '/vendor/purchase-orders', parent: '/vendor/inventory', label: 'Purchase Orders' },
  { href: '/vendor/reviews', parent: '/vendor/products', label: 'Reviews' },
  { href: '/vendor/component-editor', parent: '/vendor/branding', label: 'Visual Editor' },
  { href: '/vendor/cost-plus-pricing', parent: '/vendor/pricing', label: 'Cost+ Pricing' },
];

// Mobile bottom navigation (4 core items)
export const mobileNavItems = vendorNavItems.filter(item => item.isCore);

// Group navigation by category
export const groupedNav = {
  core: vendorNavItems.filter(item => item.group === 'core'),
  sales: vendorNavItems.filter(item => item.group === 'sales'),
  content: vendorNavItems.filter(item => item.group === 'content'),
  settings: vendorNavItems.filter(item => item.group === 'settings'),
};

