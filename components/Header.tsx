"use client";

import Link from "next/link";
import { Search, ShoppingBag, User, Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 bg-[#c5c5c2] z-50 border-b border-[#a8a8a5]">
      {/* Top announcement bar */}
      <div className="bg-black text-white text-center py-1.5 px-4 text-[10px] uppercase tracking-wider">
        Free shipping on orders over $500
      </div>

      {/* Main header */}
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="text-2xl logo-font">
            Flora Distro
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs uppercase tracking-wider">
            <Link
              href="/products"
              className="hover:opacity-60 transition-opacity"
            >
              Products
            </Link>
            <Link
              href="/about"
              className="hover:opacity-60 transition-opacity"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:opacity-60 transition-opacity"
            >
              Contact
            </Link>
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-5">
            <button className="hover:opacity-60 transition-opacity">
              <Search size={18} />
            </button>
            <Link href="/register" className="hover:opacity-60 transition-opacity hidden sm:block">
              <User size={18} />
            </Link>
            <button className="hover:opacity-60 transition-opacity hidden sm:block">
              <Heart size={18} />
            </button>
            <button 
              onClick={() => setCartOpen(true)}
              className="hover:opacity-60 transition-opacity relative"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-[10px] font-medium flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#a8a8a5] bg-[#c5c5c2]">
          <nav className="container mx-auto px-6 py-4 flex flex-col space-y-3 text-xs uppercase tracking-wider">
            <Link
              href="/products"
              className="hover:opacity-60 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/about"
              className="hover:opacity-60 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:opacity-60 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
