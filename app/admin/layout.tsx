"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Package, Store, Settings, LogOut, Users, CheckSquare, 
  FileText, DollarSign, BarChart3, Menu, X, Shield 
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/products', icon: Package, label: 'Products' },
    { href: '/admin/vendors', icon: Store, label: 'Vendors' },
    { href: '/admin/approvals', icon: CheckSquare, label: 'Approvals' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/payouts', icon: DollarSign, label: 'Payouts' },
    { href: '/admin/reports', icon: FileText, label: 'Reports' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="bg-[#0a0a0a] border-b border-red-500/20 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded flex items-center justify-center">
              <Shield size={22} className="text-red-500" />
            </div>
            <div>
              <div className="text-white text-base font-medium">FloraDistro Admin</div>
              <div className="text-red-500/80 text-xs">Marketplace Control</div>
            </div>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      <div className="flex">
        <aside className="hidden lg:block w-64 bg-[#0a0a0a] border-r border-red-500/20 min-h-screen p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-all border ${
                    active
                      ? 'text-white bg-red-500/20 border-red-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-xs uppercase tracking-wider">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8 bg-[#0a0a0a]">
          {children}
        </main>
      </div>
    </div>
  );
}
