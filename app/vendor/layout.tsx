"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, BarChart3, Settings, LogOut, Palette, ShoppingBag, FileText, DollarSign, Star, ChevronLeft, Menu, X, MapPin, Globe, Image, Layout, FileEdit, PenTool } from 'lucide-react';
import VendorSupportChat from '@/components/VendorSupportChat';
import AIActivityMonitor from '@/components/AIActivityMonitor';
import { useVendorAuth, VendorAuthProvider } from '@/context/VendorAuthContext';
import { showConfirm } from '@/components/NotificationToast';

function VendorLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorLogo, setVendorLogo] = useState<string>('/yacht-club-logo.png');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { vendor, isAuthenticated, isLoading, logout } = useVendorAuth();

  // Protect vendor routes - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/vendor/login') {
      router.push('/vendor/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Auto-hide header on scroll
  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;

    const controlHeader = () => {
      const currentScrollY = window.scrollY;

      // Show header when at top
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
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

  // Vendor logo - use default for now (can be added to Supabase vendors table later)
  useEffect(() => {
    if (isAuthenticated && vendor) {
      // Could fetch from Supabase vendors table if logo_url field is added
      // For now, use default logo
      setVendorLogo('/yacht-club-logo.png');
    }
  }, [isAuthenticated, vendor]);

  const navItems = [
    { href: '/vendor/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/vendor/products', icon: Package, label: 'Products' },
    { href: '/vendor/inventory', icon: BarChart3, label: 'Inventory' },
    { href: '/vendor/media-library', icon: Image, label: 'Media Library' },
    { href: '/vendor/pricing', icon: DollarSign, label: 'Pricing Tiers' },
    { href: '/vendor/purchase-orders', icon: FileText, label: 'Purchase Orders' },
    { href: '/vendor/locations', icon: MapPin, label: 'Locations' },
    { href: '/vendor/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/vendor/lab-results', icon: FileText, label: 'Lab Results' },
    { href: '/vendor/payouts', icon: DollarSign, label: 'Payouts' },
    { href: '/vendor/reviews', icon: Star, label: 'Reviews' },
    { href: '/vendor/live-editor', icon: PenTool, label: 'Live Editor' },
    { href: '/vendor/storefront-builder', icon: Layout, label: 'Template Selector' },
    { href: '/vendor/content-manager', icon: FileEdit, label: 'Content Manager' },
    { href: '/vendor/branding', icon: Palette, label: 'Branding' },
    { href: '/vendor/domains', icon: Globe, label: 'Domains' },
    { href: '/vendor/settings', icon: Settings, label: 'Settings' },
  ];

  const currentPage = navItems.find(item => pathname?.startsWith(item.href))?.label || 'Portal';
  const isActive = (href: string) => pathname?.startsWith(href);

  const vendorName = vendor?.store_name || 'Vendor';

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Allow login page without auth
  if (pathname === '/vendor/login') {
    return <>{children}</>;
  }

  // Live editor needs special layout (no navigation)
  if (pathname === '/vendor/live-editor') {
    return <>{children}</>;
  }

  // If not authenticated, don't render (will redirect)
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
        /* Prevent horizontal overflow */
        body {
          overflow-x: hidden;
          max-width: 100vw;
        }
        * {
          box-sizing: border-box;
        }
        /* Ensure all inputs don't zoom on iOS */
        input, textarea, select {
          font-size: 16px !important;
        }
        /* Prevent long words/URLs from overflowing */
        input[type="url"], input[type="text"], input[type="email"] {
          word-break: break-all;
        }
        /* Prevent table overflow on mobile */
        @media (max-width: 1024px) {
          table {
            display: none !important;
          }
        }
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* PWA Safe Area Spacer - Fixed at very top */}
      <div 
        className="fixed top-0 left-0 right-0 bg-[#1a1a1a] z-[120] pointer-events-none"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />

      {/* Mobile Top Bar */}
      <nav 
        className={`lg:hidden sticky bg-[#1a1a1a] z-[110] border-b border-white/5 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          top: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-white/80 active:text-white active:bg-white/10 rounded-lg transition-all"
          >
            <Menu size={22} />
          </button>

          {/* Page Title */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-base font-medium text-white tracking-tight">{currentPage}</h1>
          </div>

          {/* Logo */}
          <Link href="/vendor/dashboard" className="w-8 h-8 bg-white/5 rounded flex items-center justify-center overflow-hidden">
            <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-0.5" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Full Height */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-r border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Safe Area Top Fill */}
            <div 
              className="absolute top-0 left-0 right-0 bg-[#0a0a0a] pointer-events-none"
              style={{ height: 'env(safe-area-inset-top, 0px)', marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))' }}
            />
            
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 relative z-10">
              <Link href="/vendor/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                  <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-0.5" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{vendorName}</div>
                  <div className="text-white/40 text-xs tracking-wide">Vendor Portal</div>
                </div>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/60 hover:text-white active:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation - Scrollable */}
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
                        ? 'bg-white/10 text-white' 
                        : 'text-white/60 active:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} strokeWidth={1.5} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions - Fixed */}
            <div className="p-4 border-t border-white/5 relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsChatOpen(true);
                }}
                className="w-full px-4 py-3 mb-2 bg-white/5 text-white/80 text-sm border border-white/10 rounded-lg active:bg-white/10 transition-all"
              >
                Contact Support
              </button>
              <Link 
                href="/" 
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white/60 text-sm border border-white/5 rounded-lg active:bg-white/5 transition-all"
              >
                Back to Store
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <nav 
        className="hidden lg:block bg-[#1a1a1a] border-b border-white/5 sticky top-0 z-[110]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="w-full px-6 xl:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/vendor/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                <img src={vendorLogo} alt={vendorName} className="w-full h-full object-contain p-0.5" />
              </div>
              <div>
                <div className="text-white text-base font-medium">{vendorName}</div>
                <div className="text-white/40 text-xs tracking-wide">Vendor Portal</div>
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

      <div className="flex bg-[#1a1a1a] min-h-screen pb-[env(safe-area-inset-bottom)]">
        {/* Desktop Sidebar */}
        <aside 
          className="hidden lg:block w-64 bg-[#1a1a1a] border-r border-white/5"
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
                      ? 'text-white bg-white/5 border-white/5'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-wider">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-8">
            <div className="bg-white/5 border border-white/5 p-4">
              <h3 className="text-white/80 text-xs uppercase tracking-[0.15em] mb-2">Need Help?</h3>
              <p className="text-white/50 text-xs mb-3 leading-relaxed">
                Contact our vendor support team
              </p>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="text-xs text-white bg-black border border-white/20 hover:bg-white hover:text-black hover:border-white px-3 py-2 transition-all duration-300 w-full uppercase tracking-wider"
              >
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content - Edge to Edge on Mobile, Full Width on Desktop */}
        <main className="flex-1 lg:py-8 lg:px-8 xl:px-12 bg-[#1a1a1a] safe-bottom overflow-x-hidden w-full max-w-full pt-16 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - iOS Style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 backdrop-blur-xl z-[120]" 
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 pt-1 pb-1">
          {[
            { href: '/vendor/dashboard', icon: Home, label: 'Home' },
            { href: '/vendor/products', icon: Package, label: 'Products' },
            { href: '/vendor/orders', icon: ShoppingBag, label: 'Orders' },
            { href: '/vendor/settings', icon: Settings, label: 'Settings' },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all min-w-[64px] ${
                  active ? 'text-white' : 'text-white/50'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

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
    <VendorAuthProvider>
      <VendorLayoutContent>{children}</VendorLayoutContent>
    </VendorAuthProvider>
  );
}

