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
  Layers,
  CreditCard,
  Tv,
  Megaphone,
  Users,
  Sparkles,
  Smartphone,
  Wallet
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: any;
  label: string;
  description?: string;
  isCore?: boolean; // Show in mobile bottom nav
  group?: 'core' | 'sales' | 'content' | 'settings';
  appKey?: string; // App access key - if undefined, always visible
}

// Consolidated navigation - 13 core items
export const vendorNavItems: NavItem[] = [
  // Core Operations (3)
  {
    href: '/vendor/apps',
    icon: Home,
    label: 'Dashboard',
    description: 'Overview & metrics',
    isCore: true,
    group: 'core'
    // No appKey - always visible
  },
  {
    href: '/vendor/products',
    icon: Package,
    label: 'Products',
    description: 'Catalog & inventory',
    isCore: true,
    group: 'core',
    appKey: 'products'
  },
  {
    href: '/vendor/lab-results',
    icon: FileText,
    label: 'Lab Results',
    description: 'COAs & compliance',
    isCore: false,
    group: 'core',
    appKey: 'products'
  },
  {
    href: '/vendor/orders',
    icon: ShoppingBag,
    label: 'Orders',
    description: 'Transactions',
    isCore: true,
    group: 'sales',
    appKey: 'orders'
  },
  {
    href: '/vendor/customers',
    icon: Users,
    label: 'Customers',
    description: 'Customer management',
    isCore: false,
    group: 'sales',
    appKey: 'customers'
  },
  {
    href: '/pos/register',
    icon: CreditCard,
    label: 'Point of Sale',
    description: 'In-store register',
    isCore: true,
    group: 'sales',
    appKey: 'pos'
  },
  {
    href: '/vendor/terminals',
    icon: Smartphone,
    label: 'Terminals',
    description: 'POS registers',
    isCore: false,
    group: 'sales',
    appKey: 'pos'
  },
  {
    href: '/vendor/analytics',
    icon: TrendingUp,
    label: 'Analytics',
    description: 'Performance insights',
    isCore: false,
    group: 'sales',
    appKey: 'analytics'
  },
  {
    href: '/vendor/marketing',
    icon: Megaphone,
    label: 'Marketing',
    description: 'Campaigns & loyalty',
    isCore: false,
    group: 'sales',
    appKey: 'marketing'
  },
  {
    href: '/vendor/apple-wallet',
    icon: Wallet,
    label: 'Apple Wallet',
    description: 'Digital loyalty cards',
    isCore: false,
    group: 'sales',
    appKey: 'marketing'
  },

  // Inventory (1)
  {
    href: '/vendor/inventory',
    icon: BarChart3,
    label: 'Inventory',
    description: 'Stock management',
    isCore: false,
    group: 'core',
    appKey: 'inventory'
  },

  // Content & Media (3)
  {
    href: '/vendor/media-library',
    icon: Image,
    label: 'Media',
    description: 'Images & assets',
    isCore: false,
    group: 'content',
    appKey: 'products'
  },
  {
    href: '/vendor/branding',
    icon: Palette,
    label: 'Branding',
    description: 'Store customization',
    isCore: false,
    group: 'content',
    appKey: 'code'
  },
  {
    href: '/vendor/tv-menus',
    icon: Tv,
    label: 'Digital Signage',
    description: 'TV menus & displays',
    isCore: false,
    group: 'content',
    appKey: 'tv_menus'
  },

  // Financial (1)
  {
    href: '/vendor/payouts',
    icon: DollarSign,
    label: 'Payouts',
    description: 'Earnings & payments',
    isCore: false,
    group: 'sales',
    appKey: 'analytics'
  },

  // Settings (2)
  {
    href: '/vendor/payment-processors',
    icon: CreditCard,
    label: 'Payment Processors',
    description: 'Terminal credentials',
    isCore: false,
    group: 'settings'
    // No appKey - always visible for setup
  },
  {
    href: '/vendor/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Account & preferences',
    isCore: true,
    group: 'settings'
    // No appKey - always visible
  },
];

// Secondary features accessible through main pages
export const secondaryFeatures = [
  { href: '/vendor/locations', parent: '/vendor/settings', label: 'Locations' },
  { href: '/vendor/employees', parent: '/vendor/settings', label: 'Team' },
  { href: '/vendor/domains', parent: '/vendor/branding', label: 'Custom Domains' },
  { href: '/vendor/purchase-orders', parent: '/vendor/inventory', label: 'Purchase Orders' },
  { href: '/vendor/suppliers', parent: '/vendor/inventory', label: 'Suppliers' },
  { href: '/vendor/wholesale-customers', parent: '/vendor/inventory', label: 'Wholesale Customers' },
  { href: '/vendor/reviews', parent: '/vendor/products', label: 'Reviews' },
  { href: '/vendor/component-editor', parent: '/vendor/branding', label: 'Visual Editor' },
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

