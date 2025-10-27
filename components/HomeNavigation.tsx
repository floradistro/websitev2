'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export function HomeNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-4">
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={32} 
              height={32}
              className="object-contain sm:w-10 sm:h-10"
            />
            <span className="text-base sm:text-xl font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>WhaleTools</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link 
              href="/about" 
              className="text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" 
              style={{ fontWeight: 900 }}
            >
              About
            </Link>
            <Link 
              href="/api-status" 
              className="text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" 
              style={{ fontWeight: 900 }}
            >
              API
            </Link>
            <Link 
              href="/partners" 
              className="text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" 
              style={{ fontWeight: 900 }}
            >
              Partners
            </Link>
            <Link 
              href="/vendor/login" 
              className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.08em] hover:bg-white/90 transition-all"
              style={{ fontWeight: 900 }}
            >
              Get Started
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-t border-white/5"
          >
            <div className="px-4 py-6 space-y-4">
              <Link 
                href="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors py-2" 
                style={{ fontWeight: 900 }}
              >
                About
              </Link>
              <Link 
                href="/api-status" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors py-2" 
                style={{ fontWeight: 900 }}
              >
                API
              </Link>
              <Link 
                href="/partners" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors py-2" 
                style={{ fontWeight: 900 }}
              >
                Partners
              </Link>
              <Link 
                href="/vendor/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.08em] hover:bg-white/90 transition-all text-center"
                style={{ fontWeight: 900 }}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

