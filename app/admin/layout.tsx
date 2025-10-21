"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Package, Store, Settings, LogOut, Users, CheckSquare, 
  FileText, DollarSign, BarChart3, Menu, X, MapPin, Globe, FolderTree 
} from 'lucide-react';
import { showConfirm } from '@/components/NotificationToast';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-hide header on scroll
  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;

    const controlHeader = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        rafId = window.requestAnimationFrame(controlHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [lastScrollY]);

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/products', icon: Package, label: 'Products' },
    { href: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { href: '/admin/vendors', icon: Store, label: 'Vendors' },
    { href: '/admin/locations', icon: MapPin, label: 'Locations' },
    { href: '/admin/domains', icon: Globe, label: 'Domains' },
    { href: '/admin/approvals', icon: CheckSquare, label: 'Approvals' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/payouts', icon: DollarSign, label: 'Payouts' },
    { href: '/admin/reports', icon: FileText, label: 'Reports' },
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
    return (
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    );
  }

  return (
    <AdminAuthProvider>
      <AdminProtectedRoute>
      <style jsx global>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .safe-bottom {
            padding-bottom: calc(env(safe-area-inset-bottom) + 4rem);
          }
        }
        body {
          overflow-x: hidden;
          max-width: 100vw;
        }
        * {
          box-sizing: border-box;
        }
        input, textarea, select {
          font-size: 16px !important;
        }
        input[type="url"], input[type="text"], input[type="email"] {
          word-break: break-all;
        }
        @media (max-width: 1024px) {
          table {
            display: none !important;
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* PWA Safe Area Spacer */}
      <div 
        className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[120] pointer-events-none"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />

      {/* Mobile Top Bar */}
      <nav 
        className={`lg:hidden sticky bg-[#0a0a0a] z-[110] border-b border-red-500/20 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          top: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-white/80 active:text-white active:bg-white/10 rounded-lg transition-all"
          >
            <Menu size={22} />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-base font-medium text-white tracking-tight">{currentPage}</h1>
          </div>

          <Link href="/admin/dashboard" className="w-8 h-8 bg-white/5 rounded flex items-center justify-center overflow-hidden">
            <img src="/yacht-club-logo.png" alt="Yacht Club" className="w-full h-full object-contain p-0.5" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-r border-red-500/20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div 
              className="absolute top-0 left-0 right-0 bg-[#0a0a0a] pointer-events-none"
              style={{ height: 'env(safe-area-inset-top, 0px)', marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))' }}
            />
            
            <div className="flex items-center justify-between p-4 border-b border-red-500/20 relative z-10">
              <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                  <img src="/yacht-club-logo.png" alt="Yacht Club" className="w-full h-full object-contain p-0.5" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Yacht Club Admin</div>
                  <div className="text-red-500/80 text-xs tracking-wide">Marketplace Control</div>
                </div>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/60 hover:text-white active:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2 relative z-10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 mb-1 rounded-lg transition-all ${
                      active 
                        ? 'bg-red-500/20 text-white border border-red-500/30' 
                        : 'text-white/60 active:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} strokeWidth={1.5} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-red-500/20 relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
              <Link 
                href="/" 
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white/60 text-sm border border-white/5 rounded-lg active:bg-white/5 transition-all mb-2"
              >
                Back to Store
              </Link>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-4 py-3 bg-red-500/10 text-red-500 text-sm border border-red-500/20 rounded-lg active:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <nav 
        className="hidden lg:block bg-[#0a0a0a] border-b border-red-500/20 sticky top-0 z-[110]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="w-full px-6 xl:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                <img src="/yacht-club-logo.png" alt="Yacht Club" className="w-full h-full object-contain p-0.5" />
              </div>
              <div>
                <div className="text-white text-base font-medium">Yacht Club Admin</div>
                <div className="text-red-500/80 text-xs tracking-wide">Marketplace Control</div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Back to Store
              </Link>
              <button 
                onClick={handleLogout}
                className="group text-white/60 hover:text-white text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
              >
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex bg-[#0a0a0a] min-h-screen pb-[env(safe-area-inset-bottom)]">
        {/* Desktop Sidebar */}
        <aside 
          className="hidden lg:block w-64 bg-[#0a0a0a] border-r border-red-500/20"
          style={{ minHeight: 'calc(100vh - 64px - env(safe-area-inset-top, 0px))' }}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-200 border ${
                    active
                      ? 'text-white bg-red-500/20 border-red-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent hover:border-red-500/20'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-wider">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:py-8 lg:px-8 xl:px-12 bg-[#0a0a0a] safe-bottom overflow-x-hidden w-full max-w-full pt-16 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-red-500/20 backdrop-blur-xl z-[120]" 
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 pt-1 pb-1">
          {[
            { href: '/admin/dashboard', icon: Home, label: 'Home' },
            { href: '/admin/products', icon: Package, label: 'Products' },
            { href: '/admin/vendors', icon: Store, label: 'Vendors' },
            { href: '/admin/settings', icon: Settings, label: 'Settings' },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all min-w-[64px] ${
                  active ? 'text-red-500' : 'text-white/50'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      </AdminProtectedRoute>
    </AdminAuthProvider>
  );
}
