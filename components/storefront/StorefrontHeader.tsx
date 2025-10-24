'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X, Search, User, ArrowRight, ChevronDown, Flower2, Droplets, Cookie, Wind } from 'lucide-react';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { useCart } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import SearchModal from '@/components/SearchModal';

interface StorefrontHeaderProps {
  vendor: VendorStorefront;
}

export function StorefrontHeader({ vendor }: StorefrontHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Determine base path based on current URL
  // Custom domains: '' (routes at root like floradistro.com/shop)
  // Localhost: '/storefront' (routes like localhost:3000/storefront/shop)
  const basePath = typeof window !== 'undefined' && window.location.hostname.includes('localhost') 
    ? '/storefront' 
    : '';
  const [lastScrollY, setLastScrollY] = useState(0);
  const { itemCount, items, total } = useCart();

  useEffect(() => {
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
    };

    const onScroll = () => {
      window.requestAnimationFrame(controlHeader);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header 
        className={`sticky bg-black text-white z-[110] border-b border-white/10 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Top announcement bar */}
        <div className="bg-black text-white text-center py-1.5 text-[10px] uppercase tracking-wider">
          Free shipping on orders over $45
        </div>

        {/* Main header */}
        <div className="relative bg-[#1a1a1a]">
          <div className="relative flex items-center justify-between h-16 px-4 sm:px-6 max-w-[1920px] mx-auto">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-3 -ml-2 hover:bg-white/10 transition-smooth rounded"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link href={basePath || "/"} className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 flex items-center gap-2 hover:opacity-80 transition-opacity">
              {vendor.logo_url ? (
                <div className="relative w-10 h-10 lg:w-16 lg:h-16">
                  <Image 
                    src={vendor.logo_url} 
                    alt={vendor.store_name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 40px, 64px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center">
                  <span className="text-lg sm:text-2xl text-white font-light tracking-wide">
                    {vendor.store_name}
                  </span>
                </div>
              )}
              <span className="hidden sm:block text-lg sm:text-2xl logo-font text-white font-light tracking-wide">
                {vendor.store_name}
              </span>
            </Link>

            {/* Desktop Navigation - Yacht Club Style */}
            <nav className="hidden lg:flex items-center space-x-6 text-xs uppercase tracking-wider">
              {/* Products Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setProductsDropdownOpen(true)}
                onMouseLeave={() => setProductsDropdownOpen(false)}
              >
                <Link
                  href={`${basePath}/shop`}
                  className="nav-link text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Shop</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
                </Link>
                
                {/* Dropdown Menu */}
                {productsDropdownOpen && (
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[520px] z-[120]"
                    onMouseEnter={() => setProductsDropdownOpen(true)}
                    onMouseLeave={() => setProductsDropdownOpen(false)}
                  >
                    <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-0">
                        <div className="col-span-2 p-8">
                          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-6 font-light">Shop by Category</p>
                          <div className="grid grid-cols-2 gap-1">
                            <Link href={`${basePath}/shop?category=flower`} className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group">
                              <Flower2 size={16} className="text-white/40 group-hover:text-white transition-colors" />
                              <div className="text-sm font-light uppercase tracking-wider">Flower</div>
                            </Link>
                            <Link href={`${basePath}/shop?category=concentrate`} className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group">
                              <Droplets size={16} className="text-white/40 group-hover:text-white transition-colors" />
                              <div className="text-sm font-light uppercase tracking-wider">Concentrate</div>
                            </Link>
                            <Link href={`${basePath}/shop?category=edibles`} className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group">
                              <Cookie size={16} className="text-white/40 group-hover:text-white transition-colors" />
                              <div className="text-sm font-light uppercase tracking-wider">Edibles</div>
                            </Link>
                            <Link href={`${basePath}/shop?category=vape`} className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group">
                              <Wind size={16} className="text-white/40 group-hover:text-white transition-colors" />
                              <div className="text-sm font-light uppercase tracking-wider">Vape</div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href={`${basePath}/about`} className="nav-link text-white/80 hover:text-white transition-colors">
                About
              </Link>
              <Link href={`${basePath}/contact`} className="nav-link text-white/80 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>

            {/* Right icons */}
            <div className="flex items-center space-x-3 sm:space-x-5 relative z-10">
              <button 
                onClick={() => setSearchOpen(true)}
                className="text-white/80 hover:text-white p-3 hover:bg-white/10 rounded transition-all group"
                aria-label="Search"
              >
                <Search size={18} className="transition-transform duration-300 group-hover:scale-110" />
              </button>
              <button 
                className="text-white/80 hover:text-white p-3 hover:bg-white/10 rounded transition-all hidden sm:block group"
                aria-label="Account"
              >
                <User size={18} className="transition-transform duration-300 group-hover:scale-110" />
              </button>
              <button 
                onClick={() => setCartOpen(true)}
                className="text-white/80 hover:text-white relative p-3 hover:bg-white/10 rounded transition-all group"
                aria-label="Cart"
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
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[320px] bg-gradient-to-b from-black via-[#0a0a0a] to-black border-r border-white/20 flex flex-col z-[10001] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 pb-4 border-b border-white/10">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full transition-all"
              >
                <X size={18} />
              </button>
              
              <Link href={basePath || "/"} className="block" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5 mb-2">
                  {vendor.logo_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                      <Image src={vendor.logo_url} alt={vendor.store_name} width={40} height={40} className="w-full h-full object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <span className="text-white text-xs">{vendor.store_name[0]}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-white text-base font-light tracking-wide">{vendor.store_name}</div>
                    <div className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-light">Premium Cannabis</div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                <div className="space-y-0.5">
                  <Link href={basePath || "/"} className="group block py-2.5 text-white/90 hover:text-white transition-all" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light tracking-wide">Home</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-50 transition-all" />
                    </div>
                  </Link>
                  <Link href={`${basePath}/shop`} className="group block py-2.5 text-white/90 hover:text-white transition-all" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light tracking-wide">Shop</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-50 transition-all" />
                    </div>
                  </Link>
                  <Link href={`${basePath}/about`} className="group block py-2.5 text-white/90 hover:text-white transition-all" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light tracking-wide">About</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-50 transition-all" />
                    </div>
                  </Link>
                  <Link href={`${basePath}/contact`} className="group block py-2.5 text-white/90 hover:text-white transition-all" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light tracking-wide">Contact</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-50 transition-all" />
                    </div>
                  </Link>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-gradient-to-b from-transparent to-black/50">
              <div className="text-center text-white/20 text-[9px] tracking-wider font-light">
                © 2025 {vendor.store_name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

