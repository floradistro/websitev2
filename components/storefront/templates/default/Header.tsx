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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={getHref(basePath || "/")} className="flex items-center gap-3">
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
            <span className="text-xl font-bold text-gray-900">{vendor.store_name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href={getHref(`${basePath}/shop`)} className="text-gray-700 hover:text-gray-900">
              Shop
            </Link>
            <Link href={getHref(`${basePath}/about`)} className="text-gray-700 hover:text-gray-900">
              About
            </Link>
            <Link href={getHref(`${basePath}/contact`)} className="text-gray-700 hover:text-gray-900">
              Contact
            </Link>
          </nav>

          {/* Cart Button */}
          <button className="relative p-2">
            <ShoppingBag size={24} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            <Link 
              href={getHref(`${basePath}/shop`)} 
              className="block py-2 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link 
              href={getHref(`${basePath}/about`)} 
              className="block py-2 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href={getHref(`${basePath}/contact`)} 
              className="block py-2 text-gray-700"
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

