'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-light tracking-tight">
          STOREFRONT
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/shop" className="text-sm uppercase tracking-wider hover:text-gray-600 transition">
            Shop
          </Link>
          <Link href="/about" className="text-sm uppercase tracking-wider hover:text-gray-600 transition">
            About
          </Link>
          <Link href="/contact" className="text-sm uppercase tracking-wider hover:text-gray-600 transition">
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Search size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <ShoppingCart size={20} />
          </button>
          <button className="md:hidden p-2 hover:bg-gray-100 rounded">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

