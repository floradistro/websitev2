"use client";

import Link from 'next/link';
import { Home, Package, BarChart3, Settings, LogOut, Palette, ShoppingBag, FileText } from 'lucide-react';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add actual auth check when backend is ready
  // For now, allow all logged-in users for testing
  
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <style jsx global>{`
        @font-face {
          font-family: 'Lobster';
          src: url('/Lobster 1.4.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
      {/* Vendor Navigation */}
      <nav className="bg-[#1a1a1a] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/vendor/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                <img src="/yachtclub.png" alt="Yacht Club" className="w-full h-full object-contain p-0.5" />
              </div>
              <div>
                <div className="text-white text-base tracking-wide" style={{ fontFamily: 'Lobster' }}>Yacht Club</div>
                <div className="text-white/40 text-xs tracking-wide">Vendor Portal</div>
              </div>
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Back to Store
              </Link>
              <button className="group text-white/60 hover:text-white text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2">
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-white/5 min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-1">
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <Home size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Dashboard</span>
            </Link>
            
            <Link
              href="/vendor/products"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <Package size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">My Products</span>
            </Link>
            
            <Link
              href="/vendor/inventory"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <BarChart3 size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Inventory</span>
            </Link>
            
            <Link
              href="/vendor/orders"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Orders</span>
            </Link>
            
            <Link
              href="/vendor/lab-results"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <FileText size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Lab Results</span>
            </Link>
            
            <Link
              href="/vendor/branding"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <Palette size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Branding</span>
            </Link>

            <Link
              href="/vendor/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5"
            >
              <Settings size={18} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Settings</span>
            </Link>
          </nav>

          {/* Help Section */}
          <div className="p-4 mt-8">
            <div className="bg-white/5 border border-white/5 p-4">
              <h3 className="text-white/80 text-xs uppercase tracking-[0.15em] mb-2">Need Help?</h3>
              <p className="text-white/50 text-xs mb-3 leading-relaxed">
                Contact our vendor support team
              </p>
              <button className="text-xs text-white bg-black border border-white/20 hover:bg-white hover:text-black hover:border-white px-3 py-2 transition-all duration-300 w-full uppercase tracking-wider">
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 bg-[#1a1a1a]">
          {children}
        </main>
      </div>
    </div>
  );
}

