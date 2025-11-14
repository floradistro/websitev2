"use client";

// CRITICAL: Force dynamic rendering to prevent stale cached layouts on mobile/tablet
// This prevents the notorious "navbar not updating" bug on production
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, RefreshCw } from "lucide-react";
import VendorSupportChat from "@/components/VendorSupportChat";
import AIActivityMonitor from "@/components/AIActivityMonitor";
import { useAppAuth } from "@/context/AppAuthContext";
import { showConfirm } from "@/components/NotificationToast";
import {
  allNavItems,
  mobileNavItems,
  topLevelNavItems,
  navSections,
  settingsNavItem,
} from "@/lib/vendor-navigation";
import { prefetchVendorData } from "@/hooks/useVendorData";
import { useAutoHideHeader } from "@/hooks/useAutoHideHeader";
import { UniversalSearch } from "@/components/UniversalSearch";
import "../globals-dashboard.css";
import "./vendor-globals.css";

function VendorLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { vendor, isAuthenticated, isLoading, logout, hasAppAccess } = useAppAuth();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [vendorLogo, setVendorLogo] = useState<string>("/yacht-club-logo.png");

  const isVisible = useAutoHideHeader(); // ✅ Shared hook - no memory leak

  // Protect vendor routes - redirect to login if not authenticated
  useEffect(() => {
    // Allow special pages without auth
    if (pathname === "/vendor/login") {
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.push("/vendor/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Vendor logo - use custom logo if uploaded, otherwise fallback to default
  useEffect(() => {
    if (isAuthenticated && vendor) {
      setVendorLogo(vendor.logo_url || "/yacht-club-logo.png");
    }
  }, [isAuthenticated, vendor]);

  // Prefetch data on hover for faster navigation
  const handleNavHover = (href: string) => {
    const dataEndpoint = {
      "/vendor/apps": "/api/page-data/vendor-dashboard",
      "/vendor/dashboard": "/api/page-data/vendor-dashboard", // Keep for backwards compatibility
      "/vendor/products": "/api/page-data/vendor-products",
      "/vendor/inventory": "/api/page-data/vendor-inventory",
    }[href];

    if (dataEndpoint) {
      prefetchVendorData(dataEndpoint);
    }
  };

  const currentPage =
    allNavItems.find((item) => pathname?.startsWith(item.href))?.label || "Portal";
  const isActive = (href: string) => pathname?.startsWith(href) ?? false;

  const vendorName = vendor?.store_name || "Vendor";

  // Special pages without auth/navigation
  if (pathname === "/vendor/login") {
    return <>{children}</>;
  }

  // Don't block rendering - let pages handle their own loading states
  // The redirect will happen via useEffect if not authenticated

  async function handleLogout() {
    await showConfirm({
      title: "Logout",
      message: "Are you sure you want to log out of your vendor account?",
      confirmText: "Logout",
      cancelText: "Stay",
      type: "warning",
      onConfirm: () => {
        logout();
        // Force full page reload to clear all state
        window.location.href = "/vendor/login";
      },
    });
  }

  const handleRefresh = () => {
    router.refresh();
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Menu Overlay - Shows below md breakpoint */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[150] bg-black/90 backdrop-blur-lg"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] border-r border-white/5 flex flex-col shadow-2xl bg-[#0a0a0a]"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none bg-black"
              style={{
                height: "env(safe-area-inset-top, 0px)",
                marginTop: "calc(-1 * env(safe-area-inset-top, 0px))",
              }}
            />

            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 relative z-10">
              <Link
                href="/vendor/apps"
                className="flex items-center gap-3 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-white/20">
                  <img
                    src={vendorLogo}
                    alt={vendorName}
                    className="w-full h-full object-contain p-1"
                  />
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
              {/* Top level items */}
              {topLevelNavItems
                .filter((item) => !item.appKey || hasAppAccess(item.appKey))
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
                          ? "bg-white/10 text-white border-white/20"
                          : "text-white/40 hover:text-white/70 border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                        <span className="text-[10px] uppercase tracking-[0.15em]">
                          {item.label}
                        </span>
                      </div>
                      {active && <div className="w-1 h-1 rounded-full bg-white" />}
                    </Link>
                  );
                })}

              {/* Section items - flat list on mobile */}
              {navSections.map((section) => (
                <div key={section.label} className="mb-2">
                  <div className="px-3 py-1.5 text-white/30 text-[8px] uppercase tracking-[0.2em] font-semibold">
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {section.items
                      .filter((item) => !item.appKey || hasAppAccess(item.appKey))
                      .map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            onMouseEnter={() => handleNavHover(item.href)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                              active
                                ? "bg-white/10 text-white"
                                : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
                              <span className="text-[9px] uppercase tracking-[0.15em]">
                                {item.label}
                              </span>
                            </div>
                            {active && <div className="w-1 h-1 rounded-full bg-white" />}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}

              {/* Settings at bottom */}
              {(!settingsNavItem.appKey || hasAppAccess(settingsNavItem.appKey)) && (
                <Link
                  href={settingsNavItem.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 mt-2 rounded-xl transition-all duration-200 border ${
                    isActive(settingsNavItem.href)
                      ? "bg-white/10 text-white border-white/20"
                      : "text-white/40 hover:text-white/70 border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <settingsNavItem.icon
                      size={16}
                      strokeWidth={isActive(settingsNavItem.href) ? 2 : 1.5}
                    />
                    <span className="text-[10px] uppercase tracking-[0.15em]">
                      {settingsNavItem.label}
                    </span>
                  </div>
                  {isActive(settingsNavItem.href) && (
                    <div className="w-1 h-1 rounded-full bg-white" />
                  )}
                </Link>
              )}
            </nav>

            <div
              className="px-3 py-3 border-t border-white/5 relative z-10 space-y-2"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
              }}
            >
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

      <div className="fixed inset-0 bg-black">
        {/* Backdrop overlay - closes secondary panel when clicked */}
        {activeSection && !pathname?.includes("/tv-menus") && (
          <div
            className="fixed inset-0 bg-black/50 z-[90] transition-opacity duration-300"
            onClick={() => setActiveSection(null)}
          />
        )}

        {/* TIER 1: Fixed 60px Icon Bar - NEVER EXPANDS */}
        {!pathname?.includes("/tv-menus") && (
          <aside
            suppressHydrationWarning
            className="flex flex-col border-r border-white/[0.06] fixed left-0 top-0 bottom-0 w-[60px] bg-[#0a0a0a] z-[100]"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Navigation - Icons Only */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-1 flex flex-col items-center" suppressHydrationWarning>
              {/* Top level items (no sub-pages) */}
              {topLevelNavItems
                .filter((item) => !item.appKey || hasAppAccess(item.appKey))
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => handleNavHover(item.href)}
                      title={item.label}
                      className={`w-11 h-11 flex items-center justify-center transition-all duration-200 border rounded-lg ${
                        active
                          ? "text-white bg-white/[0.08] border-white/[0.12]"
                          : "text-white/40 hover:text-white border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                    </Link>
                  );
                })}

              {/* Section icons (with sub-pages) */}
              {navSections.map((section) => {
                const SectionIcon = section.icon;
                const hasActiveItem = section.items.some((item) => isActive(item.href));
                const isSectionActive = activeSection === section.label;

                return (
                  <button
                    key={section.label}
                    onClick={() => setActiveSection(isSectionActive ? null : section.label)}
                    title={section.label}
                    className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all duration-200 border ${
                      hasActiveItem || isSectionActive
                        ? "bg-white/[0.08] text-white border-white/[0.12]"
                        : "text-white/40 hover:text-white border-transparent hover:bg-white/[0.04]"
                    }`}
                  >
                    <SectionIcon size={18} strokeWidth={hasActiveItem || isSectionActive ? 2 : 1.5} />
                  </button>
                );
              })}

              {/* Settings */}
              {(!settingsNavItem.appKey || hasAppAccess(settingsNavItem.appKey)) && (
                <Link
                  href={settingsNavItem.href}
                  title={settingsNavItem.label}
                  className={`w-11 h-11 flex items-center justify-center mt-1 transition-all duration-200 border rounded-lg ${
                    isActive(settingsNavItem.href)
                      ? "text-white bg-white/[0.08] border-white/[0.12]"
                      : "text-white/40 hover:text-white hover:bg-white/[0.04] border-transparent"
                  }`}
                >
                  <settingsNavItem.icon
                    size={18}
                    strokeWidth={isActive(settingsNavItem.href) ? 2 : 1.5}
                  />
                </Link>
              )}
            </nav>

            {/* Logout at bottom */}
            <div className="px-2 py-3 border-t border-white/[0.06] flex-shrink-0 flex items-center justify-center">
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-11 h-11 flex items-center justify-center text-white/40 hover:text-white/70 transition-all duration-200 hover:bg-white/[0.04] rounded-lg"
              >
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            </div>
          </aside>
        )}

        {/* TIER 2: Secondary Expandable Panel - Shows sub-pages for active section */}
        {!pathname?.includes("/tv-menus") && activeSection && (
          <aside
            suppressHydrationWarning
            className="flex flex-col border-r border-white/[0.06] fixed left-[60px] top-0 bottom-0 w-[200px] bg-[#0a0a0a] z-[95] transition-all duration-300 ease-out"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Section Header */}
            <div className="px-4 py-4 border-b border-white/[0.06]">
              <h2 className="text-white/90 text-sm font-medium tracking-wide">
                {activeSection}
              </h2>
            </div>

            {/* Sub-navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {navSections
                .find((s) => s.label === activeSection)
                ?.items.filter((item) => !item.appKey || hasAppAccess(item.appKey))
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => handleNavHover(item.href)}
                      onClick={() => setActiveSection(null)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
            </nav>
          </aside>
        )}

        {/* Main Content - Always offset by sidebar (60px) */}
        <main
          suppressHydrationWarning
          className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${!pathname?.includes("/tv-menus") ? "left-[60px]" : ""}`}
          style={{
            paddingTop: !pathname?.includes("/tv-menus") ? "env(safe-area-inset-top, 0px)" : undefined,
          }}
        >
          <div
            className={
              pathname?.includes("/tv-menus")
                ? ""
                : "px-4 md:px-6 lg:px-8 lg:py-6 lg:px-10 xl:px-12 2xl:px-16 pt-4 pb-10"
            }
          >
            {/* Page Title - Prominent, centered, always visible */}
            {!pathname?.includes("/tv-menus") && (
              <div className="mb-8 text-center">
                <h1 className="text-2xl md:text-3xl font-light text-white/90 tracking-tight">
                  {currentPage}
                </h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      <VendorSupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AIActivityMonitor />
    </>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  // AppAuthProvider moved to root Providers - no longer duplicated here
  // Layout version tag for debugging cache issues
  const LAYOUT_VERSION = "2.1.0-tablet-sidebar";

  return (
    <>
      {/* Hidden version tag for debugging */}
      <meta name="vendor-layout-version" content={LAYOUT_VERSION} />
      <VendorLayoutContent>{children}</VendorLayoutContent>
    </>
  );
}
