/**
 * Smart Header Component
 * Fully editable header with logo, navigation, cart, and search
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X, Search, User, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import SearchModal from '@/components/SearchModal';

interface SmartHeaderProps {
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  logoUrl?: string;
  vendorLogo?: string; // Alias for logoUrl
  
  // Styling
  backgroundColor?: string;
  textColor?: string;
  hoverColor?: string;
  borderColor?: string;
  
  // Features
  showAnnouncement?: boolean;
  announcementText?: string;
  announcementBg?: string;
  
  showSearch?: boolean;
  showCart?: boolean;
  showAccount?: boolean;
  
  // Navigation Links (editable)
  navLinks?: Array<{
    label: string;
    href: string;
    showDropdown?: boolean;
  }>;
  
  // Behavior
  hideOnScroll?: boolean;
  sticky?: boolean;
}

export function SmartHeader({
  vendorId,
  vendorSlug,
  vendorName,
  logoUrl: logoUrlProp,
  vendorLogo,
  backgroundColor = 'bg-black/95 backdrop-blur-xl',
  textColor = 'text-white/80',
  hoverColor = 'hover:text-white',
  borderColor = 'border-white/5',
  showAnnouncement = true,
  announcementText = 'Free shipping over $45',
  announcementBg = 'bg-black/50',
  showSearch = true,
  showCart = true,
  showAccount = true,
  navLinks = [
    { label: 'Shop', href: '/shop', showDropdown: true },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  hideOnScroll = true,
  sticky = true,
}: SmartHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  // Use vendorLogo if logoUrl not provided (renderer compatibility)
  const logoUrl = logoUrlProp || vendorLogo;
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  const vendorParam = searchParams?.get('vendor');
  
  const getHref = (path: string) => {
    const fullPath = path.startsWith('/') ? `${basePath}${path}` : path;
    if (vendorParam && fullPath.startsWith('/storefront')) {
      return `${fullPath}${fullPath.includes('?') ? '&' : '?'}vendor=${vendorParam}`;
    }
    return fullPath;
  };

  // Fetch vendor's product categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/page-data/products');
        const result = await response.json();
        
        if (result.success) {
          const products = result.data.products || [];
          const vendorProducts = products.filter((p: any) => p.vendor_id === vendorId);
          
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
  }, [vendorId]);

  // Hide on scroll
  useEffect(() => {
    if (!hideOnScroll) return;
    
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
  }, [lastScrollY, hideOnScroll]);

  // Lock body scroll when mobile menu open
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
        className={`${sticky ? 'sticky' : 'relative'} top-0 bg-black/95 backdrop-blur-xl border-b border-white/5 z-[110] transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)'
        }}
      >
        {/* Announcement Bar */}
        {showAnnouncement && announcementText && (
          <div className={`${announcementBg} backdrop-blur-xl ${textColor} text-center py-2.5 text-xs font-semibold tracking-wide border-b ${borderColor}`}>
            {announcementText}
          </div>
        )}

        {/* Main Header */}
        <div className="relative bg-transparent">
          <div className="relative flex items-center justify-center h-16 px-6 max-w-7xl mx-auto">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden absolute left-6 ${textColor} p-2.5 hover:bg-white/10 transition-all rounded-2xl`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center space-x-8 text-xs">
              {/* Home Link */}
              <Link
                href={getHref("/")}
                className="text-white/60 hover:text-white transition-colors font-black uppercase tracking-[0.12em]"
                style={{ fontWeight: 900 }}
              >
                Home
              </Link>
              {navLinks.map((link, index) => {
                const isShopLink = link.showDropdown && categories.length > 0;
                
                return (
                  <div 
                    key={index}
                    className={isShopLink ? "relative group" : ""}
                    onMouseEnter={() => isShopLink && setProductsDropdownOpen(true)}
                    onMouseLeave={() => isShopLink && setProductsDropdownOpen(false)}
                  >
                    <Link
                      href={getHref(link.href)}
                      className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 font-black uppercase tracking-[0.12em]"
                      style={{ fontWeight: 900 }}
                    >
                      <span>{link.label}</span>
                      {isShopLink && (
                        <ChevronDown size={14} className={`transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </Link>
                    
                    {/* Dropdown Menu */}
                    {isShopLink && productsDropdownOpen && (
                      <div 
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[280px] z-[9999]"
                        onMouseEnter={() => setProductsDropdownOpen(true)}
                        onMouseLeave={() => setProductsDropdownOpen(false)}
                      >
                        <div className="bg-black/95 backdrop-blur-2xl border border-white/20 rounded-[24px] overflow-hidden shadow-2xl shadow-black/50">
                          <div className="p-2">
                            <div className="space-y-0.5">
                              {categories.map((category) => {
                                const categoryHref = vendorParam 
                                  ? `${basePath}/shop?vendor=${vendorParam}&category=${category.slug}`
                                  : `${basePath}/shop?category=${category.slug}`;
                                return (
                                  <Link 
                                    key={category.slug}
                                    href={categoryHref} 
                                    className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/10 transition-all rounded-[16px]"
                                  >
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
                );
              })}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-1 absolute right-6">
              {showSearch && (
                <button 
                  onClick={() => setSearchOpen(true)}
                  className="text-white/60 hover:text-white p-2.5 hover:bg-white/10 rounded-2xl transition-all"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              )}
              {showAccount && (
                <Link 
                  href={getHref('/login')}
                  className="text-white/60 hover:text-white p-2.5 hover:bg-white/10 rounded-2xl transition-all hidden sm:block"
                  aria-label="Account"
                >
                  <User size={18} />
                </Link>
              )}
              {showCart && (
                <button 
                  onClick={() => setCartOpen(true)}
                  className="text-white/60 hover:text-white relative p-2.5 hover:bg-white/10 rounded-2xl transition-all"
                  aria-label="Cart"
                >
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full shadow-lg">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-neutral-950 flex flex-col z-[10001] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4 border-b border-white/10">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-[16px] transition-all"
              >
                <X size={20} />
              </button>
              
              <Link href={getHref("/")} className="block" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 mb-2">
                  {logoUrl ? (
                    <div className="w-12 h-12 rounded-[20px] overflow-hidden border border-white/20">
                      <Image src={logoUrl} alt={vendorName} width={48} height={48} className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white/10 rounded-[20px] flex items-center justify-center border border-white/20">
                      <span className="text-white text-sm font-semibold">{vendorName[0]}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-white text-lg font-semibold tracking-tight">{vendorName}</div>
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link, index) => (
                  <Link 
                    key={index}
                    href={getHref(link.href)} 
                    className="group block py-3.5 px-4 text-white hover:bg-white/10 transition-all rounded-[16px]" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-base font-semibold">{link.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            <div className="p-6 border-t border-white/10 bg-black/40">
              <div className="text-center text-neutral-500 text-xs font-medium">
                © {new Date().getFullYear()} {vendorName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />}
      
      {/* Search Modal */}
      {showSearch && <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} vendorId={vendorId} />}
    </>
  );
}

