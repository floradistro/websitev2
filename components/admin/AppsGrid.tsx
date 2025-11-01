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
  LucideIcon,
  ArrowUpRight
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
  glowColor: string;
}

const APPS: App[] = [
  {
    key: 'pos',
    name: 'Point of Sale',
    description: 'Process sales and manage transactions in real-time',
    icon: ShoppingCart,
    route: '/pos/register',
    category: 'Operations',
    gradient: 'from-blue-600 to-cyan-500',
    glowColor: 'blue'
  },
  {
    key: 'orders',
    name: 'Order Queue',
    description: 'Manage and fulfill customer pickup and delivery orders',
    icon: Package,
    route: '/pos/orders',
    category: 'Operations',
    gradient: 'from-purple-600 to-pink-500',
    glowColor: 'purple'
  },
  {
    key: 'tv_menus',
    name: 'Digital Menus',
    description: 'Create stunning TV displays for your store locations',
    icon: Monitor,
    route: '/vendor/tv-menus',
    category: 'Marketing',
    gradient: 'from-green-600 to-emerald-500',
    glowColor: 'green'
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Track stock levels and manage inventory across locations',
    icon: PackageSearch,
    route: '/vendor/inventory',
    category: 'Operations',
    gradient: 'from-orange-600 to-amber-500',
    glowColor: 'orange'
  },
  {
    key: 'products',
    name: 'Products',
    description: 'Manage your complete product catalog and pricing',
    icon: Tag,
    route: '/vendor/products',
    category: 'Management',
    gradient: 'from-red-600 to-rose-500',
    glowColor: 'red'
  },
  {
    key: 'analytics',
    name: 'Analytics',
    description: 'Deep insights into sales, performance, and trends',
    icon: BarChart3,
    route: '/vendor/dashboard',
    category: 'Intelligence',
    gradient: 'from-indigo-600 to-violet-500',
    glowColor: 'indigo'
  },
  {
    key: 'customers',
    name: 'Customers',
    description: 'Build relationships and understand your customer base',
    icon: Users,
    route: '/vendor/customers',
    category: 'Growth',
    gradient: 'from-teal-600 to-cyan-500',
    glowColor: 'teal'
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Create powerful campaigns and promotional content',
    icon: Megaphone,
    route: '/vendor/marketing',
    category: 'Growth',
    gradient: 'from-fuchsia-600 to-pink-500',
    glowColor: 'fuchsia'
  },
  {
    key: 'code',
    name: 'Code',
    description: 'Build custom apps with AI - storefronts, panels, and more',
    icon: Code2,
    route: '/vendor/code',
    category: 'Development',
    gradient: 'from-emerald-600 to-teal-500',
    glowColor: 'emerald'
  },
];

export function AppsGrid() {
  const { user, hasAppAccess } = useAppAuth();
  const router = useRouter();

  const accessibleApps = APPS.filter(app => hasAppAccess(app.key));

  const handleMouseEnter = (route: string) => {
    router.prefetch(route);
  };

  if (accessibleApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Package size={32} className="text-white/20" />
        </div>
        <div className="text-white/30 text-sm font-medium mb-2">
          No apps available
        </div>
        <p className="text-white/20 text-xs text-center max-w-md font-light">
          Contact your administrator to request access
        </p>
      </div>
    );
  }

  // Color mapping for icons
  const iconColors: Record<string, string> = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    indigo: 'text-indigo-400',
    teal: 'text-teal-400',
    fuchsia: 'text-fuchsia-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    pink: 'text-pink-400'
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-6">
      {accessibleApps.map((app) => {
        const Icon = app.icon;
        const iconColor = iconColors[app.glowColor] || 'text-white';

        return (
          <Link
            key={app.key}
            href={app.route}
            prefetch={true}
            onMouseEnter={() => handleMouseEnter(app.route)}
            className="group flex flex-col items-center gap-2 active:opacity-60 active:scale-95 transition-all duration-150"
          >
            {/* Dark Icon Container - POS Style */}
            <div className="relative w-20 h-20">
              {/* Dark container */}
              <div className="relative w-full h-full bg-[#0a0a0a] hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/5 transition-colors duration-200">
                {/* Colored icon */}
                <Icon size={40} className={iconColor} strokeWidth={2} />
              </div>
            </div>

            {/* App Name - POS Typography */}
            <div className="text-white text-[10px] text-center uppercase tracking-[0.15em] leading-tight">
              {app.name}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
