"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, User, Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 bg-[#1a1a1a] text-white z-50 border-b border-white/10">
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
            className="lg:hidden text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logoprint.png" 
              alt="Flora Distro Logo" 
              width={40} 
              height={40}
              className="object-contain"
            />
            <span className="text-2xl logo-font text-white">Flora Distro</span>
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
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-5">
            <button className="text-white/80 hover:text-white transition-colors">
              <Search size={18} />
            </button>
            <Link href="/register" className="text-white/80 hover:text-white transition-colors hidden sm:block">
              <User size={18} />
            </Link>
            <button className="text-white/80 hover:text-white transition-colors hidden sm:block">
              <Heart size={18} />
            </button>
            <button 
              onClick={() => setCartOpen(true)}
              className="text-white/80 hover:text-white transition-colors relative"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-black text-[10px] font-medium flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#1a1a1a]">
          <nav className="container mx-auto px-6 py-4 flex flex-col space-y-3 text-xs uppercase tracking-wider">
            <Link
              href="/products"
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/about"
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white/80 hover:text-white transition-colors"
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
