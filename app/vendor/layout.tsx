import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, BarChart3, Settings, LogOut, Palette } from 'lucide-react';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add actual auth check when backend is ready
  // For now, allow all logged-in users for testing
  
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Vendor Navigation */}
      <nav className="bg-[#2a2a2a] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/vendor/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Vendor Portal</div>
                <div className="text-white/40 text-xs">Flora Distro</div>
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
              <button className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#2a2a2a] border-r border-white/10 min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-1">
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              <Home size={20} />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            
            <Link
              href="/vendor/products"
              className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              <Package size={20} />
              <span className="text-sm font-medium">My Products</span>
            </Link>
            
            <Link
              href="/vendor/inventory"
              className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              <BarChart3 size={20} />
              <span className="text-sm font-medium">Inventory</span>
            </Link>
            
            <Link
              href="/vendor/branding"
              className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              <Palette size={20} />
              <span className="text-sm font-medium">Branding</span>
            </Link>

            <Link
              href="/vendor/settings"
              className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              <Settings size={20} />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </nav>

          {/* Help Section */}
          <div className="p-4 mt-8">
            <div className="bg-white/5 border border-white/10 rounded p-4">
              <h3 className="text-white text-xs font-medium uppercase tracking-wider mb-2">Need Help?</h3>
              <p className="text-white/60 text-xs mb-3">
                Contact our vendor support team
              </p>
              <button className="text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors w-full">
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

