/**
 * Vendor Navigation - Jobs-style simplification
 * 5 main categories with smart grouping
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
  CreditCard,
  Tv,
  Users,
  Smartphone,
  Globe,
  Store,
  Boxes
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: any;
  label: string;
  description?: string;
  isCore?: boolean;
  appKey?: string;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  icon: any;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Top-level always-visible items
export const topLevelNavItems: NavItem[] = [
  {
    href: '/vendor/apps',
    icon: Home,
    label: 'Dashboard',
    description: 'Overview & metrics',
    isCore: true,
  },
];

// Collapsible sections
export const navSections: NavSection[] = [
  // CATALOG - Products + Suppliers + Lab Results
  {
    label: 'Catalog',
    icon: Package,
    defaultOpen: true,
    items: [
      {
        href: '/vendor/products',
        icon: Package,
        label: 'Products',
        description: 'Manage catalog & inventory',
        appKey: 'products',
        isCore: true,
      },
      {
        href: '/vendor/suppliers',
        icon: Boxes,
        label: 'Suppliers',
        description: 'Manage vendors & procurement',
        appKey: 'products',
      },
      {
        href: '/vendor/lab-results',
        icon: FileText,
        label: 'Lab Results',
        description: 'COAs & compliance',
        appKey: 'products',
      },
    ],
  },

  // COMMERCE - Orders, POS, Customers, Wholesale, Payouts
  {
    label: 'Commerce',
    icon: ShoppingBag,
    defaultOpen: false,
    items: [
      {
        href: '/vendor/orders',
        icon: ShoppingBag,
        label: 'Orders',
        description: 'Customer orders',
        appKey: 'orders',
        isCore: true,
      },
      {
        href: '/pos/register',
        icon: CreditCard,
        label: 'Point of Sale',
        description: 'In-store register',
        appKey: 'pos',
        isCore: true,
      },
      {
        href: '/vendor/customers',
        icon: Users,
        label: 'Customers',
        description: 'Customer database',
        appKey: 'customers',
      },
      {
        href: '/vendor/wholesale-customers',
        icon: Boxes,
        label: 'Wholesale',
        description: 'B2B customers',
        appKey: 'products',
      },
      {
        href: '/vendor/payouts',
        icon: DollarSign,
        label: 'Payouts',
        description: 'Earnings & payments',
        appKey: 'analytics',
      },
    ],
  },

  // INSIGHTS - Analytics + Marketing
  {
    label: 'Insights',
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      {
        href: '/vendor/analytics',
        icon: BarChart3,
        label: 'Analytics',
        description: 'Performance data',
        appKey: 'analytics',
      },
      {
        href: '/vendor/marketing',
        icon: Smartphone,
        label: 'Marketing',
        description: 'Loyalty & campaigns',
        appKey: 'marketing',
      },
    ],
  },

  // STOREFRONT - Website, Branding, Media, Signage
  {
    label: 'Storefront',
    icon: Store,
    defaultOpen: false,
    items: [
      {
        href: '/vendor/website',
        icon: Globe,
        label: 'Website',
        description: 'Online presence',
      },
      {
        href: '/vendor/branding',
        icon: Palette,
        label: 'Branding',
        description: 'Theme & design',
        appKey: 'code',
      },
      {
        href: '/vendor/media-library',
        icon: Image,
        label: 'Media',
        description: 'Photos & assets',
        appKey: 'products',
      },
      {
        href: '/vendor/tv-menus',
        icon: Tv,
        label: 'Digital Signage',
        description: 'In-store displays',
        appKey: 'tv_menus',
      },
    ],
  },
];

// Settings at bottom (always visible)
export const settingsNavItem: NavItem = {
  href: '/vendor/settings',
  icon: Settings,
  label: 'Settings',
  description: 'Account & config',
  isCore: true,
};

// Flatten all items for searching/routing
export const allNavItems: NavItem[] = [
  ...topLevelNavItems,
  ...navSections.flatMap(section => section.items),
  settingsNavItem,
];

// Mobile bottom nav (most used features)
export const mobileNavItems = allNavItems.filter(item => item.isCore);

// Secondary features (accessed through main pages)
export const secondaryFeatures = [
  { href: '/vendor/locations', parent: '/vendor/settings', label: 'Locations' },
  { href: '/vendor/employees', parent: '/vendor/settings', label: 'Team' },
  { href: '/vendor/terminals', parent: '/vendor/settings', label: 'Terminals' },
  { href: '/vendor/payment-processors', parent: '/vendor/settings', label: 'Payment Processors' },
  { href: '/vendor/domains', parent: '/vendor/branding', label: 'Custom Domains' },
  { href: '/vendor/suppliers', parent: '/vendor/products', label: 'Suppliers' },
  { href: '/vendor/reviews', parent: '/vendor/products', label: 'Reviews' },
  { href: '/vendor/component-editor', parent: '/vendor/branding', label: 'Visual Editor' },
];
