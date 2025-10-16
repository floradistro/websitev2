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
    };

    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
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
            className="lg:hidden text-white p-2 -ml-2 hover:bg-white/5 transition-colors rounded"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <Image 
              src="/logoprint.png" 
              alt="Flora Distro Logo" 
              width={32} 
              height={32}
              className="object-contain sm:w-10 sm:h-10"
            />
            <span className="text-xl sm:text-2xl logo-font text-white">Flora Distro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs uppercase tracking-wider">
            <Link
              href="/products"
              className="text-white/80 hover:text-white transition-colors"
            >
              Products
            </Link>
            <Link
              href="/about"
              className="text-white/80 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white/80 hover:text-white transition-colors"
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
              className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
              title="Clear Cache"
            >
              <RotateCcw size={14} />
              <span>Clear Cache</span>
            </button>
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <button 
              onClick={() => setSearchOpen(true)}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/5 rounded"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <Link href="/register" className="text-white/80 hover:text-white transition-colors hidden sm:block p-2 hover:bg-white/5 rounded" aria-label="Account">
              <User size={18} />
            </Link>
            <button 
              onClick={() => setCartOpen(true)}
              className="text-white/80 hover:text-white transition-colors relative p-2 hover:bg-white/5 rounded"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-white text-black text-[10px] font-medium flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#1a1a1a] relative z-[111]">
          <nav className="px-4 py-6 flex flex-col space-y-4 text-base uppercase tracking-wider">
            <Link
              href="/products"
              className="text-white/80 hover:text-white transition-colors py-2.5 border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/about"
              className="text-white/80 hover:text-white transition-colors py-2.5 border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white/80 hover:text-white transition-colors py-2.5 border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/register"
              className="text-white/80 hover:text-white transition-colors py-2.5 sm:hidden"
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
