"use client";

export function InventoryLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-[#1a1a1a] border border-white/5 p-4">
          <div className="flex items-center gap-4">
            {/* Checkbox */}
            <div className="w-4 h-4 bg-white/10 rounded" />
            
            {/* Chevron */}
            <div className="w-4 h-4 bg-white/10 rounded" />
            
            {/* Image */}
            <div className="w-12 h-12 bg-white/10 rounded" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            
            {/* Quantity */}
            <div className="text-right space-y-2">
              <div className="h-6 bg-white/10 rounded w-16 ml-auto" />
              <div className="h-3 bg-white/5 rounded w-20 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyInventoryState() {
  return (
    <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-white text-lg font-medium mb-2">No Inventory Found</h3>
      <p className="text-white/60 text-sm mb-6">
        Create products and add them to your inventory to get started
      </p>
      <a
        href="/vendor/products"
        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-all"
      >
        Go to Products
      </a>
    </div>
  );
}

