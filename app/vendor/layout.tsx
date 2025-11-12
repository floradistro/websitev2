"use client";

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
  const [vendorLogo, setVendorLogo] = useState<string>("/yacht-club-logo.png");

  // Use useMemo to ensure stable initial state and avoid hydration mismatch
  const initialExpandedState = useMemo(
    () =>
      navSections.reduce(
        (acc, section) => ({
          ...acc,
          [section.label]: section.defaultOpen ?? false,
        }),
        {},
      ),
    [], // Empty dependency array - only compute once
  );

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpandedState);
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
  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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

      {/* Mobile/Tablet Menu Overlay - Shows below md breakpoint */}
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

              {/* Collapsible sections */}
              {navSections.map((section) => {
                const SectionIcon = section.icon;
                const isExpanded = expandedSections[section.label];
                const hasActiveItem = section.items.some((item) => isActive(item.href));

                return (
                  <div key={section.label} className="mb-1">
                    <button
                      onClick={() => toggleSection(section.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                        hasActiveItem
                          ? "bg-white/5 text-white/90 border-white/10"
                          : "text-white/40 hover:text-white/70 border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SectionIcon size={16} strokeWidth={hasActiveItem ? 2 : 1.5} />
                        <span className="text-[10px] uppercase tracking-[0.15em]">
                          {section.label}
                        </span>
                      </div>
                      <svg
                        className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="mt-1 ml-3 space-y-1">
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
                    )}
                  </div>
                );
              })}

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
        {/* Icon-Only Sidebar - Expands on hover (Steve Jobs style) */}
        {!pathname?.includes("/tv-menus") && (
          <aside
            suppressHydrationWarning
            className="hidden md:flex flex-col w-[60px] hover:w-[240px] border-r border-white/[0.06] fixed left-0 top-0 bottom-0 bg-[#0a0a0a] transition-all duration-300 ease-out group overflow-hidden z-[100]"
          >
            {/* Logo/Brand at top */}
            <Link
              href="/vendor/apps"
              className="flex items-center gap-3 px-3 py-4 border-b border-white/[0.06] flex-shrink-0 overflow-hidden"
            >
              <div className="w-[36px] h-[36px] bg-white/[0.04] rounded-lg flex items-center justify-center overflow-hidden border border-white/[0.08] transition-all duration-200 group-hover:border-white/[0.12] flex-shrink-0">
                <img
                  src={vendorLogo}
                  alt={vendorName}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                <div className="text-white/90 text-[11px] tracking-wide font-medium">
                  {vendorName}
                </div>
                <div className="text-white/40 text-[9px] tracking-[0.15em] uppercase">Portal</div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5" suppressHydrationWarning>
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
                      onMouseEnter={() => handleNavHover(item.href)}
                      title={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 border rounded-lg overflow-hidden ${
                        active
                          ? "text-white bg-white/[0.08] border-white/[0.12]"
                          : "text-white/40 hover:text-white border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
                      <span className="text-[10px] uppercase tracking-[0.15em] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

              {/* Collapsible sections */}
              {navSections.map((section) => {
                const SectionIcon = section.icon;
                const isExpanded = expandedSections[section.label];
                const hasActiveItem = section.items.some((item) => isActive(item.href));

                return (
                  <div key={section.label}>
                    <button
                      onClick={() => toggleSection(section.label)}
                      title={section.label}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 border overflow-hidden ${
                        hasActiveItem
                          ? "bg-white/[0.04] text-white border-white/[0.08]"
                          : "text-white/40 hover:text-white border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon size={18} strokeWidth={hasActiveItem ? 2 : 1.5} className="flex-shrink-0" />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {section.label}
                        </span>
                      </div>
                      <svg
                        className={`w-3 h-3 transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="mt-0.5 space-y-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {section.items
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
                                className={`flex items-center gap-3 px-3 pl-6 py-2 rounded-lg transition-all duration-200 overflow-hidden ${
                                  active
                                    ? "bg-white/[0.08] text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                                }`}
                              >
                                <Icon size={16} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
                                <span className="text-[9px] uppercase tracking-[0.15em] font-medium whitespace-nowrap">
                                  {item.label}
                                </span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Settings */}
              {(!settingsNavItem.appKey || hasAppAccess(settingsNavItem.appKey)) && (
                <Link
                  href={settingsNavItem.href}
                  title={settingsNavItem.label}
                  className={`flex items-center gap-3 px-3 py-2.5 mt-1 transition-all duration-200 border rounded-lg overflow-hidden ${
                    isActive(settingsNavItem.href)
                      ? "text-white bg-white/[0.08] border-white/[0.12]"
                      : "text-white/40 hover:text-white hover:bg-white/[0.04] border-transparent"
                  }`}
                >
                  <settingsNavItem.icon
                    size={18}
                    strokeWidth={isActive(settingsNavItem.href) ? 2 : 1.5}
                    className="flex-shrink-0"
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {settingsNavItem.label}
                  </span>
                </Link>
              )}
            </nav>

            {/* Logout at bottom */}
            <div className="px-2 py-3 border-t border-white/[0.06] flex-shrink-0">
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/70 text-[10px] uppercase tracking-[0.15em] transition-all duration-200 hover:bg-white/[0.04] rounded-lg overflow-hidden"
              >
                <LogOut size={18} strokeWidth={1.5} className="flex-shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Sign Out
                </span>
              </button>
            </div>
          </aside>
        )}

        {/* Main Content - FULL WIDTH on mobile/tablet and tv-menus, with sidebar on desktop */}
        <main
          suppressHydrationWarning
          className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${!pathname?.includes("/tv-menus") ? "md:left-[60px]" : ""}`}
        >
          <div
            className={
              pathname?.includes("/tv-menus")
                ? ""
                : "px-4 md:px-6 lg:px-8 md:py-6 md:px-10 lg:px-12 xl:px-16 pt-4 pb-10"
            }
          >
            {/* Page Title - Prominent and always visible */}
            {!pathname?.includes("/tv-menus") && (
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-light text-white/90 tracking-tight">
                  {currentPage}
                </h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Floating Mobile Menu Button - Bottom right */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        suppressHydrationWarning
        className="md:hidden fixed bottom-6 right-6 z-[90] w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          bottom: "calc(1.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      <VendorSupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AIActivityMonitor />
    </>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  // AppAuthProvider moved to root Providers - no longer duplicated here
  return <VendorLayoutContent>{children}</VendorLayoutContent>;
}
