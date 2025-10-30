'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  Monitor,
  PackageSearch,
  Tag,
  BarChart3,
  Users,
  Megaphone,
  Code2,
  LucideIcon
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

interface App {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  category: string;
  gradient: string;
}

const APPS: App[] = [
  {
    key: 'pos',
    name: 'Point of Sale',
    description: 'Process sales, manage transactions, and handle customer orders',
    icon: ShoppingCart,
    route: '/pos/register',
    category: 'operations',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    key: 'orders',
    name: 'Order Queue',
    description: 'Manage pickup and shipping orders, fulfill customer requests',
    icon: Package,
    route: '/pos/orders',
    category: 'operations',
    gradient: 'from-purple-500/20 to-pink-500/20'
  },
  {
    key: 'tv_menus',
    name: 'Digital Menus',
    description: 'Create and manage TV menu displays for your locations',
    icon: Monitor,
    route: '/vendor/tv-menus',
    category: 'marketing',
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Track stock levels, manage products, and view inventory reports',
    icon: PackageSearch,
    route: '/vendor/inventory',
    category: 'operations',
    gradient: 'from-orange-500/20 to-yellow-500/20'
  },
  {
    key: 'products',
    name: 'Products',
    description: 'Manage your product catalog, pricing, and product information',
    icon: Tag,
    route: '/vendor/products',
    category: 'management',
    gradient: 'from-red-500/20 to-rose-500/20'
  },
  {
    key: 'analytics',
    name: 'Analytics',
    description: 'View sales reports, performance metrics, and business insights',
    icon: BarChart3,
    route: '/vendor/dashboard',
    category: 'management',
    gradient: 'from-indigo-500/20 to-violet-500/20'
  },
  {
    key: 'customers',
    name: 'Customers',
    description: 'Manage customer relationships and view customer data',
    icon: Users,
    route: '/vendor/customers',
    category: 'sales',
    gradient: 'from-teal-500/20 to-cyan-500/20'
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Create campaigns, promotions, and marketing materials',
    icon: Megaphone,
    route: '/vendor/marketing',
    category: 'marketing',
    gradient: 'from-fuchsia-500/20 to-purple-500/20'
  },
  {
    key: 'code',
    name: 'Code',
    description: 'Build custom apps with AI - storefronts, admin panels, mobile apps, and more',
    icon: Code2,
    route: '/vendor/code',
    category: 'development',
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
];

export function AppsGrid() {
  const { user, hasAppAccess } = useAppAuth();
  const router = useRouter();

  // Filter apps based on user permissions
  const accessibleApps = APPS.filter(app => hasAppAccess(app.key));

  // Prefetch route on hover for instant navigation
  const handleMouseEnter = (route: string) => {
    router.prefetch(route);
  };

  if (accessibleApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-white/40 text-sm uppercase tracking-[0.15em] mb-2">
          No Apps Available
        </div>
        <p className="text-white/60 text-xs text-center max-w-md">
          You don't have access to any apps yet. Please contact your administrator to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {accessibleApps.map((app) => {
        const Icon = app.icon;
        return (
          <Link
            key={app.key}
            href={app.route}
            prefetch={true}
            onMouseEnter={() => handleMouseEnter(app.route)}
            className="group relative bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 overflow-hidden"
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Icon size={24} className="text-white" strokeWidth={1.5} />
              </div>

              {/* App Name */}
              <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tight" style={{ fontWeight: 900 }}>
                {app.name}
              </h3>

              {/* Description */}
              <p className="text-white/60 text-xs leading-relaxed">
                {app.description}
              </p>

              {/* Category Badge */}
              <div className="mt-4 inline-block">
                <span className="text-[9px] uppercase tracking-[0.15em] text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                  {app.category}
                </span>
              </div>
            </div>

            {/* Hover Arrow */}
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
