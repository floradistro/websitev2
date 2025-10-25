"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Package, Store, Settings, LogOut, Users, CheckSquare, 
  FileText, DollarSign, BarChart3, Menu, X, MapPin, Globe, FolderTree, Layers, ShoppingBag, Activity, FileCode 
} from 'lucide-react';
import { showConfirm } from '@/components/NotificationToast';
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
    { href: '/admin/dashboard', icon: Home, label: 'Overview' },
    { href: '/admin/platform-editor', icon: FileCode, label: 'Yacht Club Editor' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Transactions' },
    { href: '/admin/products', icon: Package, label: 'Catalog' },
    { href: '/admin/categories', icon: FolderTree, label: 'Collections' },
    { href: '/admin/field-groups', icon: Layers, label: 'Attributes' },
    { href: '/admin/pricing-tiers', icon: DollarSign, label: 'Pricing' },
    { href: '/admin/vendors', icon: Store, label: 'Partners' },
    { href: '/admin/locations', icon: MapPin, label: 'Locations' },
    { href: '/admin/domains', icon: Globe, label: 'Domains' },
    { href: '/admin/approvals', icon: CheckSquare, label: 'Review' },
    { href: '/admin/users', icon: Users, label: 'Team' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Insights' },
    { href: '/admin/monitoring', icon: Activity, label: 'Performance' },
    { href: '/admin/payouts', icon: DollarSign, label: 'Payments' },
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
    return <>{children}</>;
  }

  return (
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
          background: #000000;
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
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.03); }
          50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.06); }
        }
        .luxury-glow {
          animation: subtle-glow 4s ease-in-out infinite;
        }
        .luxury-border {
          border-image: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03)) 1;
        }
        /* Sidebar scrollbar */
        aside::-webkit-scrollbar {
          width: 6px;
        }
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        aside::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        aside::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        aside {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
        /* Main content scrollbar */
        main::-webkit-scrollbar {
          width: 8px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        main {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
      `}</style>

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

          <Link href="/admin/dashboard" className="w-9 h-9 bg-gradient-to-br from-white/8 to-white/3 rounded-[12px] flex items-center justify-center overflow-hidden border border-white/5 transition-all duration-300 hover:border-white/20 luxury-glow">
            <img src="/yacht-club-logo.png" alt="Yacht Master" className="w-full h-full object-contain p-1" />
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
              <Link href="/admin/dashboard" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-11 h-11 bg-gradient-to-br from-white/10 to-white/5 rounded-[14px] flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-white/20 luxury-glow">
                  <img src="/yacht-club-logo.png" alt="Yacht Master" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <div className="text-white text-sm font-light tracking-wider">YACHT MASTER</div>
                  <div className="text-white/40 text-[10px] tracking-[0.15em] uppercase">Control Center</div>
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
            <Link href="/admin/dashboard" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-[16px] flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-white/30 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <img src="/yacht-club-logo.png" alt="Yacht Master" className="w-full h-full object-contain p-1.5" />
              </div>
              <div>
                <div className="text-white text-lg font-light tracking-[0.15em]">YACHT MASTER</div>
                <div className="text-white/30 text-[10px] tracking-[0.2em] uppercase">Control Center</div>
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
          <div className="lg:py-10 lg:px-10 xl:px-16 px-0 pt-16 lg:pt-10 pb-24 lg:pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 backdrop-blur-2xl z-[120] luxury-glow bg-black/98" 
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {[
            { href: '/admin/dashboard', icon: Home, label: 'Overview' },
            { href: '/admin/products', icon: Package, label: 'Catalog' },
            { href: '/admin/vendors', icon: Store, label: 'Partners' },
            { href: '/admin/settings', icon: Settings, label: 'Settings' },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-[12px] transition-all duration-300 min-w-[64px] ${
                  active 
                    ? 'text-white' 
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} className={active ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''} />
                <span className="text-[9px] font-light tracking-wider uppercase">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </AdminProtectedRoute>
  );
}
