"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import VendorSupportChat from '@/components/VendorSupportChat';
import AIActivityMonitor from '@/components/AIActivityMonitor';
import { useAppAuth, AppAuthProvider } from '@/context/AppAuthContext';
import { showConfirm } from '@/components/NotificationToast';
import { dashboardKeyframes } from '@/lib/dashboard-theme';
import { vendorNavItems, mobileNavItems } from '@/lib/vendor-navigation';
import { prefetchVendorData } from '@/hooks/useVendorData';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import '../globals-dashboard.css';

function VendorLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorLogo, setVendorLogo] = useState<string>('/yacht-club-logo.png');
  const isVisible = useAutoHideHeader(); // ✅ Shared hook - no memory leak
  const pathname = usePathname();
  const router = useRouter();
  const { vendor, isAuthenticated, isLoading, logout } = useAppAuth();

  // Protect vendor routes - redirect to login if not authenticated
  useEffect(() => {
    // Allow special pages without auth
    if (pathname === '/vendor/login') {
      return;
    }
    
    if (!isLoading && !isAuthenticated) {
      router.push('/vendor/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Vendor logo - use custom logo if uploaded, otherwise fallback to default
  useEffect(() => {
    if (isAuthenticated && vendor) {
      setVendorLogo(vendor.logo_url || '/yacht-club-logo.png');
    }
  }, [isAuthenticated, vendor]);

  // Prefetch data on hover for faster navigation
  const handleNavHover = (href: string) => {
    const dataEndpoint = {
      '/vendor/apps': '/api/page-data/vendor-dashboard',
      '/vendor/dashboard': '/api/page-data/vendor-dashboard', // Keep for backwards compatibility
      '/vendor/products': '/api/page-data/vendor-products',
      '/vendor/inventory': '/api/page-data/vendor-inventory',
    }[href];
    
    if (dataEndpoint) {
      prefetchVendorData(dataEndpoint);
    }
  };

  const currentPage = vendorNavItems.find(item => pathname?.startsWith(item.href))?.label || 'Portal';
  const isActive = (href: string) => pathname?.startsWith(href);

  const vendorName = vendor?.store_name || 'Vendor';

  // Special pages without auth/navigation
  if (pathname === '/vendor/login' || pathname === '/vendor/component-editor') {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // If not authenticated, don't render (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  async function handleLogout() {
    await showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to log out of your vendor account?',
      confirmText: 'Logout',
      cancelText: 'Stay',
      type: 'warning',
      onConfirm: () => {
        logout();
        router.push('/vendor/login');
      },
    });
  }

    return (
    <>
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
        ${dashboardKeyframes}
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

      {/* Mobile/Tablet Top Bar - Shows below xl breakpoint (< 1280px) */}
      <nav
        className={`xl:hidden sticky z-[110] border-b border-white/5 transition-all duration-500 bg-black/95 backdrop-blur-xl ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          top: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-white/70 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-2xl"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-sm font-light text-white tracking-[0.2em] uppercase">{currentPage}</h1>
          </div>

          <Link href="/vendor/apps" className="w-9 h-9 bg-gradient-to-br from-white/8 to-white/3 rounded-[12px] flex items-center justify-center overflow-hidden border border-white/5 transition-all duration-300 hover:border-white/20 luxury-glow">
            <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-1" />
          </Link>
        </div>
      </nav>

      {/* Mobile/Tablet Menu Overlay - Shows below xl breakpoint */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-[150] bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}>
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
              <Link href="/vendor/apps" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-11 h-11 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-white/20 luxury-glow">
                  <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <div className="text-white text-sm font-light tracking-wider">{vendorName}</div>
                  <div className="text-white/40 text-[10px] tracking-[0.15em] uppercase">Vendor Portal</div>
                </div>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/50 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-2xl"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 relative z-10">
              {vendorNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    onMouseEnter={() => handleNavHover(item.href)}
                    className={`flex items-center justify-between px-4 py-3 mb-1 rounded-2xl transition-all duration-300 border ${
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
                href="/vendor/apps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white/60 text-xs uppercase tracking-wider border border-white/20 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:text-white mb-2"
              >
                View All Apps
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white/50 text-xs uppercase tracking-wider border border-white/10 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:text-white/70 mb-2"
              >
                Back to Store
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 text-white/70 text-xs uppercase tracking-wider border border-white/10 rounded-2xl transition-all duration-300 hover:border-white/20 hover:text-white flex items-center justify-center gap-2"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header - DESKTOP ONLY (xl breakpoint = 1280px+) */}
      <nav
        className="hidden xl:block border-b border-white/5 fixed top-0 left-0 right-0 z-[110] luxury-glow bg-black/95 backdrop-blur-xl"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="w-full px-6 xl:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/vendor/apps" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-[16px] flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-white/30 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-1.5" />
              </div>
              <div>
                <div className="text-white text-lg font-light tracking-[0.15em]">{vendorName}</div>
                <div className="text-white/30 text-[10px] tracking-[0.2em] uppercase">Vendor Portal</div>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/vendor/apps"
                className="text-white/60 hover:text-white text-xs uppercase tracking-[0.15em] transition-all duration-300 font-light"
              >
                Apps
              </Link>
              <Link
                href="/"
                className="text-white/40 hover:text-white/70 text-xs uppercase tracking-[0.15em] transition-all duration-300 font-light"
              >
                Store
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

      <div className="fixed inset-0 bg-black xl:top-20" style={{
        top: 'calc(56px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Desktop Sidebar - DESKTOP ONLY (hidden on mobile/tablet) */}
        <aside
          className="hidden xl:block w-72 border-r border-white/5 fixed left-0 bottom-0 overflow-y-auto bg-black/98 backdrop-blur-xl"
          style={{
            top: 'calc(80px + env(safe-area-inset-top, 0px))',
            bottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <nav className="p-4 space-y-1 pb-8">
            {vendorNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => handleNavHover(item.href)}
                  className={`group flex items-center gap-3 px-5 py-3 transition-all duration-300 border rounded-2xl ${
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

        {/* Main Content - FULL WIDTH on mobile/tablet, with sidebar on desktop */}
        <main className="absolute inset-0 xl:left-72 overflow-y-auto overflow-x-hidden">
          <div className="px-4 md:px-6 lg:px-8 xl:py-10 xl:px-10 2xl:px-16 pt-4 md:pt-6 pb-10">
            {children}
          </div>
        </main>
      </div>

      <VendorSupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AIActivityMonitor />
    </>
  );
}

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAuthProvider>
      <VendorLayoutContent>{children}</VendorLayoutContent>
    </AppAuthProvider>
  );
}

