"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Package, Store, Settings, LogOut, Users, CheckSquare,
  FileText, DollarSign, BarChart3, Menu, X, MapPin, Globe, FolderTree, Layers, ShoppingBag, Activity, FileCode, FlaskConical, Monitor, Sparkles
} from 'lucide-react';
import { showConfirm } from '@/components/NotificationToast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import '../globals-dashboard.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isVisible = useAutoHideHeader(); // ✅ Shared hook - no memory leak
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    // CORE - Platform Overview
    { href: '/admin/dashboard', icon: Home, label: 'Overview' },

    // CORE - Tenant Management
    { href: '/admin/vendors', icon: Store, label: 'Tenants' },
    { href: '/admin/users', icon: Users, label: 'Users' },

    // CORE - Platform Insights
    { href: '/admin/products', icon: Package, label: 'Master Catalog' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Transactions' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },

    // CONFIGURATION - Platform Rules
    { href: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { href: '/admin/field-groups', icon: Layers, label: 'Product Fields' },
    { href: '/admin/pricing-tiers', icon: DollarSign, label: 'Pricing Rules' },

    // CONFIGURATION - System
    { href: '/admin/pos-management', icon: Monitor, label: 'POS' },
    { href: '/admin/domains', icon: Globe, label: 'Domains' },
    { href: '/storefront-builder', icon: Sparkles, label: 'Storefront Builder' },
    { href: '/admin/monitoring', icon: Activity, label: 'System Health' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const currentPage = navItems.find(item => pathname?.startsWith(item.href))?.label || 'Admin';
  const isActive = (href: string) => pathname?.startsWith(href);

  async function handleLogout() {
    await showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to log out of the admin panel?',
      confirmText: 'Logout',
      cancelText: 'Stay',
      type: 'danger',
      onConfirm: async () => {
        // Clear localStorage for backward compatibility
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_email');
        router.push('/admin/login');
      },
    });
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <AdminProtectedRoute>
      {/* PWA Safe Area Spacer */}
      <div 
        className="fixed top-0 left-0 right-0 z-[120] pointer-events-none bg-black"
        style={{ 
          height: 'env(safe-area-inset-top, 0px)'
        }}
      />

      {/* Mobile Top Bar */}
      <nav 
        className={`lg:hidden sticky z-[110] border-b border-white/5 transition-all duration-500 bg-black/95 backdrop-blur-xl ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          top: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-white/70 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-[14px]"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-sm font-light text-white tracking-[0.2em] uppercase">{currentPage}</h1>
          </div>

          <Link href="/admin/dashboard" className="transition-all duration-300 hover:opacity-80">
            <img src="/whale.png" alt="WhaleTools" className="w-10 h-10 object-contain" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[280px] border-r border-white/5 flex flex-col shadow-2xl bg-black/98 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div 
              className="absolute top-0 left-0 right-0 pointer-events-none bg-black"
              style={{ 
                height: 'env(safe-area-inset-top, 0px)', 
                marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))'
              }}
            />
            
            <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
              <Link href="/admin/dashboard" className="flex items-center gap-4 group" onClick={() => setMobileMenuOpen(false)}>
                <img src="/whale.png" alt="WhaleTools" className="w-14 h-14 object-contain transition-all duration-300 group-hover:opacity-80" />
                <div>
                  <div className="text-white text-base font-light tracking-wider">WHALETOOLS</div>
                  <div className="text-white/40 text-[10px] tracking-[0.15em] uppercase">Admin Platform</div>
                </div>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/50 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-[10px]"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 relative z-10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 mb-1 rounded-[14px] transition-all duration-300 border ${
                      active 
                        ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border-white/20 shadow-lg' 
                        : 'text-white/50 hover:text-white/80 border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                      <span className="text-xs uppercase tracking-wider font-light">{item.label}</span>
                    </div>
                    {active && <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5 relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
              <Link 
                href="/" 
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white/50 text-xs uppercase tracking-wider border border-white/10 rounded-[14px] transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:text-white/70 mb-2"
              >
                Back to Store
              </Link>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 text-white/70 text-xs uppercase tracking-wider border border-white/10 rounded-[14px] transition-all duration-300 hover:border-white/20 hover:text-white flex items-center justify-center gap-2"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header - Fixed */}
      <nav 
        className="hidden lg:block border-b border-white/5 fixed top-0 left-0 right-0 z-[110] luxury-glow bg-black/95 backdrop-blur-xl"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="w-full px-6 xl:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/admin/dashboard" className="flex items-center gap-5 group">
              <img src="/whale.png" alt="WhaleTools" className="w-16 h-16 object-contain transition-all duration-300 group-hover:opacity-80" />
              <div>
                <div className="text-white text-xl font-light tracking-[0.15em]">WHALETOOLS</div>
                <div className="text-white/40 text-[11px] tracking-[0.2em] uppercase">Admin Platform</div>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-white/40 hover:text-white/70 text-xs uppercase tracking-[0.15em] transition-all duration-300 font-light"
              >
                Back to Store
              </Link>
              <button 
                onClick={handleLogout}
                className="group text-white/40 hover:text-white/70 text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 font-light"
              >
                <LogOut size={14} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed inset-0 bg-black" style={{ 
        top: 'calc(80px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Desktop Sidebar - Fixed */}
        <aside 
          className="hidden lg:block w-72 border-r border-white/5 fixed left-0 bottom-0 overflow-y-auto bg-black/98 backdrop-blur-xl"
          style={{ 
            top: 'calc(80px + env(safe-area-inset-top, 0px))',
            bottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <nav className="p-4 space-y-1 pb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-5 py-3 transition-all duration-300 border rounded-[14px] ${
                    active
                      ? 'text-white bg-gradient-to-r from-white/10 to-white/5 border-white/20 shadow-lg'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5 border-transparent hover:border-white/10'
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2 : 1.5} className="transition-all duration-300 group-hover:scale-110" />
                  <span className="text-[11px] uppercase tracking-[0.15em] font-light">{item.label}</span>
                  {active && <div className="ml-auto w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content - Scrollable area only */}
        <main className="absolute inset-0 lg:left-72 overflow-y-auto overflow-x-hidden">
          <div className="lg:py-10 lg:px-10 xl:px-16 px-0 pt-16 lg:pt-10 pb-10">
            {children}
          </div>
        </main>
      </div>

    </AdminProtectedRoute>
  );
}
