"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, User, Menu, X, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";
import SearchModal from "./SearchModal";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { itemCount } = useCart();

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
    <header 
      className={`sticky top-0 bg-[#1a1a1a] text-white z-[110] border-b border-white/10 transition-transform duration-300 relative ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Top announcement bar */}
      <div className="bg-black text-white text-center py-1.5 px-4 text-[10px] uppercase tracking-wider relative z-[111]">
        Free shipping on orders over $45
      </div>

      {/* Main header */}
      <div className="px-4 sm:px-6 lg:container lg:mx-auto relative z-[111]">
        <div className="flex items-center justify-between h-16">
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
            <Image 
              src="/logoprint.png" 
              alt="Flora Distro Logo" 
              width={32} 
              height={32}
              className="object-contain sm:w-10 sm:h-10 transition-transform duration-300 hover:scale-105"
            />
            <span className="text-xl sm:text-2xl logo-font text-white">Flora Distro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs uppercase tracking-wider">
            <Link
              href="/products"
              className="nav-link text-white/80 hover:text-white active:text-white click-feedback"
            >
              Products
            </Link>
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
            <Link href="/register" className="text-white/80 hover:text-white active:text-white transition-smooth hidden sm:block p-3 hover:bg-white/10 active:bg-white/20 rounded click-feedback group touch-target" aria-label="Account" style={{ minHeight: '44px', minWidth: '44px' }}>
              <User size={18} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
            </Link>
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
            <Link
              href="/register"
              className="text-white/80 hover:text-white transition-smooth py-2 sm:hidden hover:pl-2 click-feedback"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Account
            </Link>
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
