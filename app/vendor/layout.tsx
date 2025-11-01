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
import { UniversalSearch } from '@/components/UniversalSearch';
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
  const { vendor, isAuthenticated, isLoading, logout, hasAppAccess } = useAppAuth();

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

  // Don't block rendering - let pages handle their own loading states
  // The redirect will happen via useEffect if not authenticated

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
        className={`xl:hidden sticky z-[110] border-b border-white/5 transition-all duration-300 bg-[#0a0a0a] ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          top: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="flex items-center justify-between h-12 px-4 gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 -ml-1.5 text-white/60 hover:text-white transition-all duration-200 hover:bg-white/5 rounded-lg flex-shrink-0"
          >
            <Menu size={18} strokeWidth={2} />
          </button>

          <div className="flex-1 flex justify-center">
            <UniversalSearch />
          </div>

          <Link href="/vendor/apps" className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-200 hover:border-white/20 flex-shrink-0">
            <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-1" />
          </Link>
        </div>
      </nav>

      {/* Mobile/Tablet Menu Overlay - Shows below xl breakpoint */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-[150] bg-black/90 backdrop-blur-lg" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] border-r border-white/5 flex flex-col shadow-2xl bg-[#0a0a0a]"
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

            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 relative z-10">
              <Link href="/vendor/apps" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-white/20">
                  <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <div className="text-white text-xs tracking-wide">{vendorName}</div>
                  <div className="text-white/30 text-[9px] tracking-[0.15em] uppercase">Portal</div>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-white/40 hover:text-white transition-all duration-200 hover:bg-white/5 rounded-lg"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 relative z-10">
              {vendorNavItems
                .filter(item => !item.appKey || hasAppAccess(item.appKey))
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={() => handleNavHover(item.href)}
                      className={`flex items-center justify-between px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 border ${
                        active
                          ? 'bg-white/10 text-white border-white/20'
                          : 'text-white/40 hover:text-white/70 border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                        <span className="text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                      </div>
                      {active && <div className="w-1 h-1 rounded-full bg-white" />}
                    </Link>
                  );
                })}
            </nav>

            <div className="px-3 py-3 border-t border-white/5 relative z-10 space-y-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
              <Link
                href="/vendor/apps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-white/60 text-[10px] uppercase tracking-[0.15em] border border-white/20 rounded-xl transition-all duration-200 hover:bg-white/10 hover:border-white/30 hover:text-white"
              >
                All Apps
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-3 py-2.5 bg-white/5 text-white/50 text-[10px] uppercase tracking-[0.15em] border border-white/10 rounded-xl transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:text-white/70 flex items-center justify-center gap-2"
              >
                <LogOut size={12} strokeWidth={2} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header - DESKTOP ONLY (xl breakpoint = 1280px+) */}
      <nav
        className="hidden xl:block border-b border-white/5 fixed top-0 left-0 right-0 z-[110] bg-[#0a0a0a]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/vendor/apps" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-200 group-hover:border-white/20">
                <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <div className="text-white text-xs tracking-wide">{vendorName}</div>
                <div className="text-white/30 text-[9px] tracking-[0.15em] uppercase">Portal</div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <UniversalSearch />
              <Link
                href="/vendor/apps"
                className="text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-all duration-200"
              >
                Apps
              </Link>
              <button
                onClick={handleLogout}
                className="group text-white/40 hover:text-white/70 text-[10px] uppercase tracking-[0.15em] transition-all duration-200 flex items-center gap-1.5"
              >
                <LogOut size={12} strokeWidth={2} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed inset-0 bg-black xl:top-16" style={{
        top: 'calc(48px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Desktop Sidebar - DESKTOP ONLY (hidden on mobile/tablet) */}
        <aside
          className="hidden xl:block w-64 border-r border-white/5 fixed left-0 bottom-0 overflow-y-auto bg-[#0a0a0a]"
          style={{
            top: 'calc(64px + env(safe-area-inset-top, 0px))',
            bottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <nav className="px-3 py-4 space-y-1 pb-8">
            {vendorNavItems
              .filter(item => !item.appKey || hasAppAccess(item.appKey))
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => handleNavHover(item.href)}
                    className={`group flex items-center justify-between px-3 py-2.5 transition-all duration-200 border rounded-xl ${
                      active
                        ? 'text-white bg-white/10 border-white/20'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                      <span className="text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                    </div>
                    {active && <div className="w-1 h-1 rounded-full bg-white" />}
                  </Link>
                );
              })}
          </nav>
        </aside>

        {/* Main Content - FULL WIDTH on mobile/tablet, with sidebar on desktop */}
        <main className="absolute inset-0 xl:left-64 overflow-y-auto overflow-x-hidden">
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

