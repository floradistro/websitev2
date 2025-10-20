"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, User, Menu, X, RotateCcw, Store, ChevronDown, LayoutDashboard, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CartDrawer from "./CartDrawer";
import SearchModal from "./SearchModal";
import LoyaltyBadge from "./LoyaltyBadge";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { itemCount } = useCart();
  const { user, isAuthenticated } = useAuth();

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

  return (
    <>
      {/* PWA Safe Area Spacer - Fixed at top */}
      <div 
        className="fixed top-0 left-0 right-0 bg-black z-[120] pointer-events-none"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />
      
      <header 
        className={`sticky bg-black text-white z-[110] border-b border-white/10 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          top: 'env(safe-area-inset-top, 0px)',
          marginTop: 0,
          paddingTop: 0
        }}
      >
        {/* Top announcement bar */}
        <div className="bg-black text-white text-center py-1.5 text-[10px] uppercase tracking-wider relative z-[111]">
          Free shipping on orders over $45
        </div>

      {/* Main header */}
      <div className="relative z-[111] bg-[#1a1a1a]">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 max-w-[1920px] mx-auto">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-3 -ml-2 hover:bg-white/10 active:bg-white/20 transition-smooth rounded click-feedback touch-target"
            aria-label="Toggle menu"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 transition-smooth hover:opacity-80 active:opacity-90 active:scale-95 click-feedback">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <Image 
                src="/logoprint.png" 
                alt="Flora Distro Logo" 
                fill
                priority
                sizes="(max-width: 640px) 32px, 40px"
                className="object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            <span className="text-xl sm:text-2xl logo-font text-white">Flora Distro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs uppercase tracking-wider">
            <LoyaltyBadge />
            <Link
              href="/products"
              className="nav-link text-white/80 hover:text-white active:text-white click-feedback"
            >
              Products
            </Link>
            
            {/* Vendors Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setVendorDropdownOpen(true)}
              onMouseLeave={() => setVendorDropdownOpen(false)}
            >
              <Link
                href="/vendors"
                className="nav-link text-white/80 hover:text-white active:text-white click-feedback flex items-center gap-1.5"
              >
                <Store size={14} />
                <span>Vendors</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${vendorDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>
              
              {/* Dropdown Menu */}
              {vendorDropdownOpen && (
                <div 
                  className="absolute top-full left-0 pt-2 w-60 z-[120]"
                  onMouseEnter={() => setVendorDropdownOpen(true)}
                  onMouseLeave={() => setVendorDropdownOpen(false)}
                >
                  <div className="bg-[#1a1a1a] border border-white/10 backdrop-blur-sm animate-fadeIn">
                    <div className="py-1">
                      <Link
                        href="/vendors"
                        className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                      >
                        <Users size={14} className="text-white/40 group-hover:text-white transition-colors" />
                        <div>
                          <div className="text-xs uppercase tracking-wider">Browse Vendors</div>
                          <div className="text-[10px] text-white/40 tracking-wide mt-0.5">View all verified sellers</div>
                        </div>
                      </Link>
                      <Link
                        href="/vendor/login"
                        className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                      >
                        <LayoutDashboard size={14} className="text-white/40 group-hover:text-white transition-colors" />
                        <div>
                          <div className="text-xs uppercase tracking-wider">Vendor Portal</div>
                          <div className="text-[10px] text-white/40 tracking-wide mt-0.5">Manage your store</div>
                        </div>
                      </Link>
                      <Link
                        href="/contact"
                        className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all group"
                      >
                        <div className="w-6 h-6 bg-white/10 group-hover:bg-white group-hover:text-black text-white/60 flex items-center justify-center text-[9px] font-bold transition-all">
                          +
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider">Become a Vendor</div>
                          <div className="text-[10px] text-white/40 tracking-wide mt-0.5">Start selling with us</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Link
              href="/about"
              className="nav-link text-white/80 hover:text-white active:text-white click-feedback"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="nav-link text-white/80 hover:text-white active:text-white click-feedback"
            >
              Contact
            </Link>
            <button
              onClick={() => {
                if (confirm('Clear all cache and reload?')) {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }
              }}
              className="text-white/80 hover:text-white transition-smooth flex items-center gap-1 click-feedback"
              title="Clear Cache"
            >
              <RotateCcw size={14} className="transition-transform duration-300 hover:rotate-180" />
              <span>Clear Cache</span>
            </button>
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <button 
              onClick={() => setSearchOpen(true)}
              className="text-white/80 hover:text-white active:text-white transition-smooth p-3 hover:bg-white/10 active:bg-white/20 rounded click-feedback group touch-target"
              aria-label="Search"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Search size={18} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
            </button>
            {isAuthenticated && user ? (
              <Link 
                href="/dashboard" 
                className="text-white/80 hover:text-white active:text-white transition-smooth hidden sm:flex items-center gap-2 p-3 hover:bg-white/10 active:bg-white/20 rounded click-feedback group touch-target" 
                aria-label="Dashboard"
                style={{ minHeight: '44px' }}
              >
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium uppercase">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="text-white/80 hover:text-white active:text-white transition-smooth hidden sm:block p-3 hover:bg-white/10 active:bg-white/20 rounded click-feedback group touch-target" 
                aria-label="Account" 
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <User size={18} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
              </Link>
            )}
            <button 
              onClick={() => setCartOpen(true)}
              className="text-white/80 hover:text-white active:text-white transition-smooth relative p-3 hover:bg-white/10 active:bg-white/20 rounded click-feedback group touch-target"
              aria-label="Cart"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <ShoppingBag size={18} className="transition-transform duration-300 group-hover:scale-110" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-white text-black text-[10px] font-medium flex items-center justify-center rounded-full badge-pulse">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#1a1a1a] relative z-[111] animate-fadeInDown">
          <nav className="px-4 py-6 flex flex-col space-y-3.5 text-sm uppercase tracking-wider">
            <Link
              href="/products"
              className="text-white/80 hover:text-white transition-smooth py-2 border-b border-white/5 hover:pl-2 click-feedback"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            
            {/* Vendors Section */}
            <div className="border-b border-white/5">
              <div className="text-white/60 text-xs mb-2 flex items-center gap-2">
                <Store size={12} />
                <span>Vendors</span>
              </div>
              <div className="flex flex-col space-y-2 pb-3 pl-4">
                <Link
                  href="/vendors"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users size={12} />
                  Browse Vendors
                </Link>
                <Link
                  href="/vendor/login"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={12} />
                  Vendor Portal
                </Link>
              </div>
            </div>
            
            <Link
              href="/about"
              className="text-white/80 hover:text-white transition-smooth py-2 border-b border-white/5 hover:pl-2 click-feedback"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white/80 hover:text-white transition-smooth py-2 border-b border-white/5 hover:pl-2 click-feedback"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="text-white/80 hover:text-white transition-smooth py-2 sm:hidden hover:pl-2 click-feedback"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-white/80 hover:text-white transition-smooth py-2 sm:hidden hover:pl-2 click-feedback"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
    </>
  );
}
