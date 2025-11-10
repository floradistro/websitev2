"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowUpRight,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";

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

interface BadgeCounts {
  [key: string]: number;
}

const APPS: App[] = [
  {
    key: "pos",
    name: "Point of Sale",
    description: "Process sales and manage transactions in real-time",
    icon: ShoppingCart,
    route: "/pos/register",
    category: "Operations",
    gradient: "from-blue-600 to-cyan-500",
    glowColor: "blue",
  },
  {
    key: "orders",
    name: "Order Queue",
    description: "Manage and fulfill customer pickup and delivery orders",
    icon: Package,
    route: "/pos/orders",
    category: "Operations",
    gradient: "from-purple-600 to-pink-500",
    glowColor: "purple",
  },
  {
    key: "tv_menus",
    name: "Digital Menus",
    description: "Create stunning TV displays for your store locations",
    icon: Monitor,
    route: "/vendor/tv-menus",
    category: "Marketing",
    gradient: "from-green-600 to-emerald-500",
    glowColor: "green",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Track stock levels and manage inventory across locations",
    icon: PackageSearch,
    route: "/vendor/inventory",
    category: "Operations",
    gradient: "from-orange-600 to-amber-500",
    glowColor: "orange",
  },
  {
    key: "products",
    name: "Products",
    description: "Manage your complete product catalog and pricing",
    icon: Tag,
    route: "/vendor/products",
    category: "Management",
    gradient: "from-red-600 to-rose-500",
    glowColor: "red",
  },
  {
    key: "analytics",
    name: "Analytics",
    description: "Deep insights into sales, performance, and trends",
    icon: BarChart3,
    route: "/vendor/dashboard",
    category: "Intelligence",
    gradient: "from-indigo-600 to-violet-500",
    glowColor: "indigo",
  },
  {
    key: "customers",
    name: "Customers",
    description: "Build relationships and understand your customer base",
    icon: Users,
    route: "/vendor/customers",
    category: "Growth",
    gradient: "from-teal-600 to-cyan-500",
    glowColor: "teal",
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Create powerful campaigns and promotional content",
    icon: Megaphone,
    route: "/vendor/marketing",
    category: "Growth",
    gradient: "from-fuchsia-600 to-pink-500",
    glowColor: "fuchsia",
  },
  {
    key: "code",
    name: "Code",
    description: "Build custom apps with AI - storefronts, panels, and more",
    icon: Code2,
    route: "/vendor/code",
    category: "Development",
    gradient: "from-emerald-600 to-teal-500",
    glowColor: "emerald",
  },
];

export function AppsGrid({ badgeCounts = {} }: { badgeCounts?: BadgeCounts }) {
  const { user, hasAppAccess } = useAppAuth();
  const router = useRouter();

  const accessibleApps = APPS.filter((app) => hasAppAccess(app.key));

  const handleMouseEnter = (route: string) => {
    router.prefetch(route);
  };

  if (accessibleApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-6 shadow-lg shadow-black/20">
          <Package size={32} className="text-white/20" strokeWidth={1.5} />
        </div>
        <div className="text-white/40 text-sm mb-2 tracking-tight">
          No apps available
        </div>
        <p className="text-white/20 text-[11px] text-center max-w-md font-light tracking-wide">
          Contact your administrator to request access
        </p>
      </div>
    );
  }

  // Color mapping for icons - Muted, refined palette
  const iconColors: Record<string, string> = {
    blue: "text-blue-400/70",
    purple: "text-purple-400/70",
    green: "text-green-400/70",
    orange: "text-orange-400/70",
    red: "text-red-400/70",
    indigo: "text-indigo-400/70",
    teal: "text-teal-400/70",
    fuchsia: "text-fuchsia-400/70",
    emerald: "text-emerald-400/70",
    cyan: "text-cyan-400/70",
    pink: "text-pink-400/70",
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-x-10 gap-y-8">
        {accessibleApps.map((app) => {
          const Icon = app.icon;
          const iconColor = iconColors[app.glowColor] || "text-white";

          return (
            <Link
              key={app.key}
              href={app.route}
              prefetch={true}
              onMouseEnter={() => handleMouseEnter(app.route)}
              className="group flex flex-col items-center gap-2.5 active:scale-[0.96] transition-transform duration-200 ease-out"
            >
              {/* Premium Icon Container */}
              <div className="relative w-14 h-14">
                {/* Dark container with premium hover */}
                <div className="relative w-full h-full bg-[#0a0a0a] group-hover:bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300 ease-out shadow-lg shadow-black/40">
                  {/* Colored icon with subtle refinement */}
                  <Icon
                    size={44}
                    className={`${iconColor} transition-opacity duration-300 ease-out group-hover:opacity-100`}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Notification Badge */}
                {badgeCounts[app.key] > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-white text-[9px] font-semibold">
                      {badgeCounts[app.key] > 99 ? "99+" : badgeCounts[app.key]}
                    </span>
                  </div>
                )}
              </div>

              {/* App Name - Premium Typography */}
              <div className="text-white/40 group-hover:text-white text-[9px] text-center uppercase tracking-[0.2em] leading-tight transition-colors duration-300 ease-out font-medium">
                {app.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
