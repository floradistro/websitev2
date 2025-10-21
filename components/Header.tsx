"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, User, Menu, X, ChevronDown, LayoutDashboard, Users, Flower2, Droplets, Cookie, Wind, Coffee, Store, TrendingUp, Tag, Sparkles, Award, UserPlus, Mail, HelpCircle, BookOpen, LogIn, Info, FileText, Shield, ArrowRight, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CartDrawer from "./CartDrawer";
import SearchModal from "./SearchModal";
import LoyaltyBadge from "./LoyaltyBadge";
import { showConfirm } from "./NotificationToast";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { itemCount, items, total } = useCart();
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
        <div className="relative flex items-center justify-between h-16 px-4 sm:px-6 max-w-[1920px] mx-auto">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-3 -ml-2 hover:bg-white/10 active:bg-white/20 transition-smooth rounded click-feedback touch-target relative z-10"
            aria-label="Toggle menu"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo - centered on mobile */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 flex items-center gap-1 sm:gap-2 transition-smooth hover:opacity-80 active:opacity-90 active:scale-95 click-feedback">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club Marketplace" 
                fill
                priority
                sizes="(max-width: 640px) 48px, 64px"
                className="object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            <span className="text-xl sm:text-2xl logo-font text-white">Yacht Club</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs uppercase tracking-wider">
            <LoyaltyBadge />
            
            {/* Products Mega Menu */}
            <div 
              className="relative group"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <Link
                href="/products"
                className="nav-link text-white/80 hover:text-white active:text-white click-feedback flex items-center gap-1.5"
              >
                <span>Products</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>
              
              {/* Mega Menu */}
              {productsDropdownOpen && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[720px] z-[120]"
                  onMouseEnter={() => setProductsDropdownOpen(true)}
                  onMouseLeave={() => setProductsDropdownOpen(false)}
                >
                  <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-0">
                      {/* Categories Column */}
                      <div className="col-span-2 p-8 border-r border-white/5">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-6 font-light">Shop by Category</p>
                        <div className="space-y-1">
                          <Link
                            href="/products?category=flower"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <Flower2 size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div className="flex-1">
                              <div className="text-sm font-light uppercase tracking-wider">Flower</div>
                            </div>
                          </Link>
                          
                          <Link
                            href="/products?category=concentrates"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <Droplets size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div className="flex-1">
                              <div className="text-sm font-light uppercase tracking-wider">Concentrates</div>
                            </div>
                          </Link>
                          
                          <Link
                            href="/products?category=edibles"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <Cookie size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div className="flex-1">
                              <div className="text-sm font-light uppercase tracking-wider">Edibles</div>
                            </div>
                          </Link>
                          
                          <Link
                            href="/products?category=vapes"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <Wind size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div className="flex-1">
                              <div className="text-sm font-light uppercase tracking-wider">Vapes</div>
                            </div>
                          </Link>
                          
                          <Link
                            href="/products?category=beverages"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <Coffee size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div className="flex-1">
                              <div className="text-sm font-light uppercase tracking-wider">Beverages</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                      
                      {/* Quick Links Column */}
                      <div className="p-8 bg-black/30">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-6 font-light">Browse</p>
                        <div className="space-y-1">
                          <Link
                            href="/products?featured=true"
                            className="flex items-center gap-2 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-wider font-light"
                          >
                            <Sparkles size={12} className="text-white/40" />
                            Featured
                          </Link>
                          <Link
                            href="/products?sort=newest"
                            className="flex items-center gap-2 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-wider font-light"
                          >
                            <TrendingUp size={12} className="text-white/40" />
                            New Arrivals
                          </Link>
                          <Link
                            href="/products?on_sale=true"
                            className="flex items-center gap-2 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-wider font-light"
                          >
                            <Tag size={12} className="text-white/40" />
                            On Sale
                          </Link>
                          <Link
                            href="/products?sort=rating"
                            className="flex items-center gap-2 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-wider font-light"
                          >
                            <Award size={12} className="text-white/40" />
                            Top Rated
                          </Link>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/5">
                          <Link
                            href="/products"
                            className="block text-center py-3 bg-white text-black hover:bg-white/90 transition-all text-[10px] font-medium uppercase tracking-[0.2em]"
                          >
                            View All
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Vendors Mega Menu */}
            <div 
              className="relative group"
              onMouseEnter={() => setVendorDropdownOpen(true)}
              onMouseLeave={() => setVendorDropdownOpen(false)}
            >
              <Link
                href="/vendors"
                className="nav-link text-white/80 hover:text-white active:text-white click-feedback flex items-center gap-1.5"
              >
                <span>Vendors</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${vendorDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>
              
              {/* Mega Menu */}
              {vendorDropdownOpen && (
                <div 
                  className="absolute top-full left-0 pt-2 w-[520px] z-[120]"
                  onMouseEnter={() => setVendorDropdownOpen(true)}
                  onMouseLeave={() => setVendorDropdownOpen(false)}
                >
                  <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-0">
                      {/* For Customers */}
                      <div className="p-8 border-r border-white/5">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-6 font-light">For Customers</p>
                        <div className="space-y-1">
                          <Link
                            href="/vendors"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <Store size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div>
                              <div className="text-sm font-light uppercase tracking-wider">Browse All</div>
                              <div className="text-[10px] text-white/30 mt-0.5 font-light">View all vendors</div>
                            </div>
                          </Link>
                          <Link
                            href="/vendors?featured=true"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <Award size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div>
                              <div className="text-sm font-light uppercase tracking-wider">Featured</div>
                              <div className="text-[10px] text-white/30 mt-0.5 font-light">Top rated sellers</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                      
                      {/* For Vendors */}
                      <div className="p-8 bg-black/30">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-6 font-light">For Vendors</p>
                        <div className="space-y-1">
                          <Link
                            href="/about"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <BookOpen size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div>
                              <div className="text-sm font-light uppercase tracking-wider">How It Works</div>
                              <div className="text-[10px] text-white/30 mt-0.5 font-light">Learn about selling</div>
                            </div>
                          </Link>
                          <Link
                            href="/contact?subject=vendor"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <HelpCircle size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div>
                              <div className="text-sm font-light uppercase tracking-wider">Resources</div>
                              <div className="text-[10px] text-white/30 mt-0.5 font-light">Support & guides</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* About Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setAboutDropdownOpen(true)}
              onMouseLeave={() => setAboutDropdownOpen(false)}
            >
              <Link
                href="/about"
                className="nav-link text-white/80 hover:text-white active:text-white click-feedback flex items-center gap-1.5"
              >
                <span>About</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${aboutDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>
              
              {/* Dropdown Menu */}
              {aboutDropdownOpen && (
                <div 
                  className="absolute top-full left-0 pt-2 w-[280px] z-[120]"
                  onMouseEnter={() => setAboutDropdownOpen(true)}
                  onMouseLeave={() => setAboutDropdownOpen(false)}
                >
                  <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn">
                    <div className="p-6">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-4 font-light">Learn More</p>
                      <div className="space-y-1">
                        <Link
                          href="/about"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                        >
                          <Info size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">Our Story</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">About Yacht Club</div>
                          </div>
                        </Link>
                        <Link
                          href="/about#how-it-works"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                        >
                          <BookOpen size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">How It Works</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">Our process</div>
                          </div>
                        </Link>
                        <Link
                          href="/terms"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                        >
                          <FileText size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">Terms & Conditions</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">Legal info</div>
                          </div>
                        </Link>
                        <Link
                          href="/privacy"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                        >
                          <Shield size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">Privacy Policy</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">Your data</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Contact Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setContactDropdownOpen(true)}
              onMouseLeave={() => setContactDropdownOpen(false)}
            >
              <Link
                href="/contact"
                className="nav-link text-white/80 hover:text-white active:text-white click-feedback flex items-center gap-1.5"
              >
                <span>Contact</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${contactDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>
              
              {/* Dropdown Menu */}
              {contactDropdownOpen && (
                <div 
                  className="absolute top-full right-0 pt-2 w-[280px] z-[120]"
                  onMouseEnter={() => setContactDropdownOpen(true)}
                  onMouseLeave={() => setContactDropdownOpen(false)}
                >
                  <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn">
                    <div className="p-6">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-4 font-light">Get In Touch</p>
                      <div className="space-y-1">
                        <Link
                          href="/contact"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                        >
                          <Mail size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">Contact Us</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">General inquiries</div>
                          </div>
                        </Link>
                        <Link
                          href="/contact?subject=vendor"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                        >
                          <UserPlus size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">Become a Vendor</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">Start selling with us</div>
                          </div>
                        </Link>
                        <Link
                          href="/contact?subject=support"
                          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                        >
                          <HelpCircle size={16} className="text-white/40 group-hover:text-white transition-colors" />
                          <div>
                            <div className="text-sm font-light uppercase tracking-wider">Support</div>
                            <div className="text-[10px] text-white/30 mt-0.5 font-light">Need help?</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-3 sm:space-x-5 relative z-10">
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
              <div 
                className="relative hidden sm:block"
                onMouseEnter={() => setAccountDropdownOpen(true)}
                onMouseLeave={() => setAccountDropdownOpen(false)}
              >
                <button 
                  className="text-white/80 hover:text-white active:text-white transition-smooth p-3 hover:bg-white/10 active:bg-white/20 rounded click-feedback group touch-target" 
                  aria-label="Account" 
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <User size={18} className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
                </button>
                
                {/* Account Dropdown */}
                {accountDropdownOpen && (
                  <div 
                    className="absolute top-full right-0 pt-2 w-[240px] z-[120]"
                    onMouseEnter={() => setAccountDropdownOpen(true)}
                    onMouseLeave={() => setAccountDropdownOpen(false)}
                  >
                    <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn">
                      <div className="p-6">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-4 font-light">Sign In</p>
                        <div className="space-y-1">
                          <Link
                            href="/login"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group border-b border-white/5"
                          >
                            <User size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div>
                              <div className="text-sm font-light uppercase tracking-wider">Customer Login</div>
                              <div className="text-[10px] text-white/30 mt-0.5 font-light">Shop & track orders</div>
                            </div>
                          </Link>
                          <Link
                            href="/vendor/login"
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <LayoutDashboard size={16} className="text-white/40 group-hover:text-white transition-colors" />
                            <div>
                              <div className="text-sm font-light uppercase tracking-wider">Vendor Login</div>
                              <div className="text-[10px] text-white/30 mt-0.5 font-light">Manage your store</div>
                            </div>
                          </Link>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <Link
                            href="/login"
                            className="block text-center py-2.5 bg-white text-black hover:bg-white/90 transition-all text-[10px] font-medium uppercase tracking-[0.2em]"
                          >
                            Create Account
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div 
              className="relative"
              onMouseEnter={() => setCartDropdownOpen(true)}
              onMouseLeave={() => setCartDropdownOpen(false)}
            >
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

              {/* Cart Preview Dropdown */}
              {cartDropdownOpen && (
                <div 
                  className="absolute top-full right-0 pt-2 w-[380px] z-[120]"
                  onMouseEnter={() => setCartDropdownOpen(true)}
                  onMouseLeave={() => setCartDropdownOpen(false)}
                >
                  <div className="bg-[#1a1a1a] border border-white/10 animate-fadeIn max-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-light">Shopping Cart</p>
                      <p className="text-sm text-white/60 mt-1 font-light">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                    </div>
                    
                    {items && items.length > 0 ? (
                      <>
                        <div className="flex-1 overflow-y-auto max-h-[280px]">
                          {items.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 border-b border-white/5 hover:bg-white/5 transition-all">
                              <div className="flex gap-3">
                                {item.image && (
                                  <div className="w-16 h-16 bg-white/5 flex-shrink-0">
                                    <Image 
                                      src={item.image} 
                                      alt={item.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-light truncate">{item.name}</p>
                                  <p className="text-xs text-white/40 mt-0.5 font-light">{item.quantity} × ${item.price}</p>
                                  <p className="text-sm text-white/80 mt-1 font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="p-4 text-center">
                              <p className="text-xs text-white/40 font-light">
                                +{items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6 border-t border-white/5 bg-black/30">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-white/60 uppercase tracking-wider font-light">Subtotal</span>
                            <span className="text-lg text-white font-light">${total.toFixed(2)}</span>
                          </div>
                          <Link
                            href="/checkout"
                            onClick={() => setCartDropdownOpen(false)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-white/90 transition-all text-xs font-medium uppercase tracking-[0.2em]"
                          >
                            Checkout
                            <ArrowRight size={14} />
                          </Link>
                          <button
                            onClick={() => {
                              setCartDropdownOpen(false);
                              setCartOpen(true);
                            }}
                            className="w-full mt-2 py-2.5 text-white/60 hover:text-white text-xs uppercase tracking-wider font-light transition-all"
                          >
                            View Full Cart
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <ShoppingBag size={32} className="mx-auto text-white/20 mb-3" />
                        <p className="text-sm text-white/60 font-light">Your cart is empty</p>
                        <Link
                          href="/products"
                          onClick={() => setCartDropdownOpen(false)}
                          className="inline-block mt-4 px-6 py-2.5 bg-white text-black hover:bg-white/90 transition-all text-xs font-medium uppercase tracking-[0.2em]"
                        >
                          Shop Now
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              <div className="text-white/60 text-xs mb-2">
                <span>Vendors</span>
              </div>
              <div className="flex flex-col space-y-2 pb-3 pl-4">
                <Link
                  href="/vendors"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Store size={12} />
                  Browse All
                </Link>
                <Link
                  href="/vendors?featured=true"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Award size={12} />
                  Featured
                </Link>
              </div>
            </div>
            
            {/* About Section */}
            <div className="border-b border-white/5">
              <div className="text-white/60 text-xs mb-2">
                <span>About</span>
              </div>
              <div className="flex flex-col space-y-2 pb-3 pl-4">
                <Link
                  href="/about"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Info size={12} />
                  Our Story
                </Link>
                <Link
                  href="/about#how-it-works"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BookOpen size={12} />
                  How It Works
                </Link>
                <Link
                  href="/terms"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText size={12} />
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield size={12} />
                  Privacy Policy
                </Link>
              </div>
            </div>
            
            {/* Contact Section */}
            <div className="border-b border-white/5">
              <div className="text-white/60 text-xs mb-2">
                <span>Contact</span>
              </div>
              <div className="flex flex-col space-y-2 pb-3 pl-4">
                <Link
                  href="/contact"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Mail size={12} />
                  Get In Touch
                </Link>
                <Link
                  href="/contact?subject=vendor"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserPlus size={12} />
                  Become a Vendor
                </Link>
                <Link
                  href="/contact?subject=support"
                  className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HelpCircle size={12} />
                  Support
                </Link>
              </div>
            </div>
            
            {/* Account Section */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="text-white/80 hover:text-white transition-smooth py-2 sm:hidden hover:pl-2 click-feedback"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Dashboard
              </Link>
            ) : (
              <div className="border-t border-white/5 pt-3 sm:hidden">
                <div className="text-white/60 text-xs mb-2">
                  <span>Account</span>
                </div>
                <div className="flex flex-col space-y-2 pb-3 pl-4">
                  <Link
                    href="/login"
                    className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={12} />
                    Customer Login
                  </Link>
                  <Link
                    href="/vendor/login"
                    className="text-white/70 hover:text-white transition-smooth py-1.5 text-xs flex items-center gap-2 click-feedback"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={12} />
                    Vendor Login
                  </Link>
                </div>
              </div>
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
