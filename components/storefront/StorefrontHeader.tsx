'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X, Search, User } from 'lucide-react';
import { VendorStorefront } from '@/lib/storefront/get-vendor';

interface StorefrontHeaderProps {
  vendor: VendorStorefront;
}

export function StorefrontHeader({ vendor }: StorefrontHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {vendor.logo_url ? (
              <img 
                src={vendor.logo_url} 
                alt={vendor.store_name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div 
                className="h-10 px-4 flex items-center justify-center rounded font-bold text-lg"
                style={{ 
                  backgroundColor: vendor.brand_colors?.primary || '#000',
                  color: vendor.brand_colors?.secondary || '#fff'
                }}
              >
                {vendor.store_name}
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
              Home
            </Link>
            <Link href="/shop" className="text-gray-700 hover:text-gray-900 font-medium">
              Shop
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">
              Contact
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-700 hover:text-gray-900">
              <Search size={22} />
            </button>
            <button className="p-2 text-gray-700 hover:text-gray-900">
              <User size={22} />
            </button>
            <Link href="/cart" className="p-2 text-gray-700 hover:text-gray-900 relative">
              <ShoppingCart size={22} />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
                Home
              </Link>
              <Link href="/shop" className="text-gray-700 hover:text-gray-900 font-medium">
                Shop
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

