/**
 * Default Template - Header Component
 * Simple, clean header design for vendors without a specific template
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { useCart } from '@/context/CartContext';
import { usePathname, useSearchParams } from 'next/navigation';

interface HeaderProps {
  vendor: VendorStorefront;
}

export default function Header({ vendor }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  const vendorParam = searchParams?.get('vendor');
  
  const getHref = (path: string) => {
    if (vendorParam && path.startsWith('/storefront')) {
      return `${path}${path.includes('?') ? '&' : '?'}vendor=${vendorParam}`;
    }
    return path;
  };

  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={getHref(basePath || "/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {vendor.logo_url && (
              <div className="relative w-10 h-10">
                <Image 
                  src={vendor.logo_url} 
                  alt={vendor.store_name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span className="text-xl font-semibold text-white tracking-tight">{vendor.store_name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href={getHref(`${basePath}/shop`)} className="text-white/70 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider">
              Shop
            </Link>
            <Link href={getHref(`${basePath}/about`)} className="text-white/70 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider">
              About
            </Link>
            <Link href={getHref(`${basePath}/contact`)} className="text-white/70 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider">
              Contact
            </Link>
          </nav>

          {/* Cart Button */}
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ShoppingBag size={22} className="text-white" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10">
          <div className="px-4 py-2 space-y-1">
            <Link 
              href={getHref(`${basePath}/shop`)} 
              className="block py-3 text-white/70 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link 
              href={getHref(`${basePath}/about`)} 
              className="block py-3 text-white/70 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href={getHref(`${basePath}/contact`)} 
              className="block py-3 text-white/70 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

