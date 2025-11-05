'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X, Search, User, ArrowRight, ChevronDown, Flower2, Droplets, Cookie, Wind, Tag } from 'lucide-react';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { useCart } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import SearchModal from '@/components/SearchModal';

interface StorefrontHeaderProps {
  vendor: VendorStorefront;
}

// Category icon mapping
const categoryIcons: { [key: string]: any } = {
  flower: Flower2,
  concentrate: Droplets,
  edibles: Cookie,
  vape: Wind,
  default: Tag
};

function StorefrontHeader({ vendor }: StorefrontHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const { itemCount, items, total } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine base path based on current path
  // If we're under /storefront, use '/storefront' prefix
  // Otherwise (custom domains), use '' (root)
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  
  // Preserve vendor query param for local testing
  const vendorParam = searchParams?.get('vendor');
  const getHref = (path: string) => {
    if (vendorParam && path.startsWith('/storefront')) {
      return `${path}${path.includes('?') ? '&' : '?'}vendor=${vendorParam}`;
    }
    return path;
  };

  // Fetch vendor's product categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/page-data/products');
        const result = await response.json();
        
        if (result.success) {
          const products = result.data.products || [];
          
          // Filter to only this vendor's products
          const vendorProducts = products.filter((p: any) => p.vendor_id === vendor.id);
          
          // Extract unique categories
          const categoryMap = new Map();
          vendorProducts.forEach((product: any) => {
            if (product.categories && Array.isArray(product.categories)) {
              product.categories.forEach((cat: any) => {
                if (cat && cat.slug && !categoryMap.has(cat.slug)) {
                  categoryMap.set(cat.slug, {
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug
                  });
                }
              });
            }
          });
          
          const uniqueCategories = Array.from(categoryMap.values()).sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, [vendor.id]);

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
        className={`sticky bg-black/40 backdrop-blur-3xl border-b border-white/[0.08] z-[110] transition-transform duration-300 shadow-lg shadow-black/20 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          top: 'env(safe-area-inset-top, 0px)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)'
        }}
      >
        {/* Top announcement bar - iOS 26 */}
        <div className="bg-black/50 backdrop-blur-xl text-white text-center py-2.5 text-xs font-semibold tracking-wide border-b border-white/[0.08]">
          Free shipping over $45
        </div>

        {/* Main header */}
        <div className="relative bg-transparent">
          <div className="relative flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2.5 -ml-2 hover:bg-white/10 transition-all rounded-[16px]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link href={getHref(basePath || "/")} className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 flex items-center gap-3 hover:opacity-70 transition-opacity">
              {vendor.logo_url ? (
                <div className="relative w-8 h-8 lg:w-10 lg:h-10">
                  <Image 
                    src={vendor.logo_url} 
                    alt={vendor.store_name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 32px, 40px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
                  <span className="text-base sm:text-xl text-white font-semibold tracking-tight">
                    {vendor.store_name}
                  </span>
                </div>
              )}
              <span className="hidden sm:block text-base sm:text-xl text-white font-semibold tracking-tight">
                {vendor.store_name}
              </span>
            </Link>

            {/* Desktop Navigation - iOS 26 */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm">
              {/* Products Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setProductsDropdownOpen(true)}
                onMouseLeave={() => setProductsDropdownOpen(false)}
              >
                <Link
                  href={getHref(`${basePath}/shop`)}
                  className="nav-link text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
                >
                  <span>Shop</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
                </Link>
                
                {/* Dropdown Menu - iOS 26 */}
                {productsDropdownOpen && categories.length > 0 && (
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[280px] z-[120]"
                    onMouseEnter={() => setProductsDropdownOpen(true)}
                    onMouseLeave={() => setProductsDropdownOpen(false)}
                  >
                    <div className="bg-black/95 backdrop-blur-2xl border border-white/20 rounded-[24px] overflow-hidden shadow-2xl shadow-black/50">
                      <div className="p-2">
                        <div className="space-y-0.5">
                          {categories.map((category) => {
                            const IconComponent = categoryIcons[category.slug.toLowerCase()] || categoryIcons.default;
                            const categoryHref = vendorParam 
                              ? `${basePath}/shop?vendor=${vendorParam}&category=${category.slug}`
                              : `${basePath}/shop?category=${category.slug}`;
                            return (
                              <Link 
                                key={category.slug}
                                href={categoryHref} 
                                className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/10 transition-all rounded-[16px] group"
                              >
                                <IconComponent size={18} className="text-neutral-500 group-hover:text-white transition-colors" />
                                <div className="text-sm font-semibold">{category.name}</div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href={getHref(`${basePath}/about`)} className="nav-link text-neutral-400 hover:text-white transition-colors font-semibold">
                About
              </Link>
              <Link href={getHref(`${basePath}/contact`)} className="nav-link text-neutral-400 hover:text-white transition-colors font-semibold">
                Contact
              </Link>
            </nav>

            {/* Right icons - iOS 26 */}
            <div className="flex items-center space-x-1 relative z-10">
              <button 
                onClick={() => setSearchOpen(true)}
                className="text-neutral-400 hover:text-white p-2.5 hover:bg-white/10 rounded-[16px] transition-all group"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <Link 
                href={getHref(`${basePath}/login`)}
                className="text-neutral-400 hover:text-white p-2.5 hover:bg-white/10 rounded-[16px] transition-all hidden sm:block group"
                aria-label="Account"
              >
                <User size={18} />
              </Link>
              <button 
                onClick={() => setCartOpen(true)}
                className="text-neutral-400 hover:text-white relative p-2.5 hover:bg-white/10 rounded-[16px] transition-all group"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full shadow-lg">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - iOS 26 Dark */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-neutral-950 flex flex-col z-[10001] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/10">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-[16px] transition-all"
              >
                <X size={20} />
              </button>
              
              <Link href={getHref(basePath || "/")} className="block" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 mb-2">
                  {vendor.logo_url ? (
                    <div className="w-12 h-12 rounded-[20px] overflow-hidden border border-white/20">
                      <Image src={vendor.logo_url} alt={vendor.store_name} width={48} height={48} className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white/10 rounded-[20px] flex items-center justify-center border border-white/20">
                      <span className="text-white text-sm font-semibold">{vendor.store_name[0]}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-white text-lg font-semibold tracking-tight">{vendor.store_name}</div>
                    <div className="text-neutral-500 text-xs font-medium">Premium Cannabis</div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="flex flex-col space-y-1">
                <Link href={getHref(basePath || "/")} className="group block py-3.5 px-4 text-white hover:bg-white/10 transition-all rounded-[16px]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Home</span>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link href={getHref(`${basePath}/shop`)} className="group block py-3.5 px-4 text-white hover:bg-white/10 transition-all rounded-[16px]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Shop</span>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link href={getHref(`${basePath}/about`)} className="group block py-3.5 px-4 text-white hover:bg-white/10 transition-all rounded-[16px]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">About</span>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link href={getHref(`${basePath}/contact`)} className="group block py-3.5 px-4 text-white hover:bg-white/10 transition-all rounded-[16px]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Contact</span>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-black/40">
              <div className="text-center text-neutral-500 text-xs font-medium">
                © 2025 {vendor.store_name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
      {/* Search Modal - Vendor Scoped */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} vendorId={vendor.id} />
    </>
  );
}

export default StorefrontHeader;

