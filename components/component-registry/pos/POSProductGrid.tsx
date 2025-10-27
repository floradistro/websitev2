'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';

interface PricingTier {
  break_id: string;
  label: string;
  qty: number;
  unit: string;
  price?: number;
  sort_order?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  inventory_quantity: number;
  inventory_id: string;
  pricing_tiers?: PricingTier[];
}

interface POSProductGridProps {
  locationId: string;
  onAddToCart: (product: Product, quantity: number) => void;
  onProductClick?: (productSlug: string) => void;
  displayMode?: 'cards' | 'list' | 'compact';
  showInventory?: boolean;
}

export function POSProductGrid({
  locationId,
  onAddToCart,
  onProductClick,
  displayMode = 'cards',
  showInventory = true,
}: POSProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load location inventory
  useEffect(() => {
    loadInventory();
  }, [locationId]);

  const loadInventory = async () => {
    try {
      const response = await fetch(`/api/pos/inventory?locationId=${locationId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load inventory');
      }

      const { products: inventoryProducts } = await response.json();
      setProducts(inventoryProducts || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      
      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAddProduct = (product: Product, priceTier?: PricingTier) => {
    // If pricing tier provided, use its qty, otherwise prompt
    let quantity: number;
    
    if (priceTier) {
      quantity = priceTier.qty;
    } else {
      quantity = parseFloat(prompt(`Enter quantity for ${product.name}:`, '1') || '0');
    }
    
    if (quantity > 0) {
      if (quantity > product.inventory_quantity) {
        // Just use the max available
        onAddToCart(product, product.inventory_quantity);
        return;
      }
      onAddToCart(product, quantity);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="text-white/40 text-center">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="text-red-500 font-bold mb-2">Error Loading Inventory</div>
        <div className="text-white/60">{error}</div>
        <button
          onClick={loadInventory}
          className="mt-4 px-4 py-2 bg-white text-black font-black uppercase rounded-xl text-sm hover:bg-white/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search & Filters - Fixed at top */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 placeholder-white/40 hover:bg-white/10 transition-all"
          />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all min-w-[140px]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat || ''} className="bg-black">
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Product Count */}
        <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
          {filteredProducts.length} Products
        </div>
      </div>

      {/* Products Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4" style={{ minHeight: 0 }}>
        {filteredProducts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-white/40">No products found</div>
          </div>
        ) : displayMode === 'cards' ? (
          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddProduct}
                onProductClick={onProductClick}
                showInventory={showInventory}
              />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  {product.image_url && (
                    <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 text-left">
                    <div className="text-white font-bold">{product.name}</div>
                    {product.category && (
                      <div className="text-white/40 text-xs">{product.category}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {showInventory && (
                    <div className={`text-sm font-bold ${
                      product.inventory_quantity > 10 ? 'text-green-500' :
                      product.inventory_quantity > 0 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {product.inventory_quantity} in stock
                    </div>
                  )}
                  
                  <div className="text-white font-black text-xl" style={{ fontWeight: 900 }}>
                    ${product.price.toFixed(2)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Product Card Component with Pricing Tiers
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, priceTier?: PricingTier) => void;
  onProductClick?: (productSlug: string) => void;
  showInventory: boolean;
}

function ProductCard({ product, onAddToCart, onProductClick, showInventory }: ProductCardProps) {
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [showAddButton, setShowAddButton] = useState(false);
  
  const tiers = product.pricing_tiers || [];

  const handleTierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    if (value === "") {
      setSelectedTierIndex(null);
      setShowAddButton(false);
    } else {
      const index = parseInt(value);
      if (!isNaN(index)) {
        setSelectedTierIndex(index);
        setShowAddButton(true);
      }
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedTierIndex !== null && tiers[selectedTierIndex]) {
      onAddToCart(product, tiers[selectedTierIndex]);
    } else {
      onAddToCart(product);
    }
    
    // Reset selection
    setSelectedTierIndex(null);
    setShowAddButton(false);
  };

  const handleProductClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on image or name, not on buttons
    if (onProductClick && product.name) {
      const productSlug = product.name.toLowerCase().replace(/\s+/g, '-');
      onProductClick(productSlug);
    }
  };

  // Get price display - SIMPLIFIED
  const getPriceDisplay = () => {
    if (tiers.length > 0) {
      const prices = tiers.map((t: any) => t.price || (product.price * t.qty));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice ? `$${minPrice.toFixed(0)}` : `$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`;
    }
    return `$${product.price.toFixed(0)}`;
  };

  return (
    <div className="group flex flex-col bg-[#0a0a0a] hover:bg-[#141414] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
      {/* Product Image - Clickable */}
      <div 
        className="relative aspect-[4/5] overflow-hidden bg-black cursor-pointer" 
        onClick={handleProductClick}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="33vw"
            className="object-contain transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            quality={85}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <div className="text-4xl">📦</div>
          </div>
        )}
        
        {/* Quick View Hint */}
        {onProductClick && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="text-white text-[10px] uppercase tracking-[0.15em] font-black bg-white/10 px-4 py-2 rounded-xl border border-white/20">
              Quick View
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4">
        {/* Product Name - Clickable */}
        <h3 
          className="text-white font-black uppercase text-xs tracking-tight leading-tight line-clamp-2 mb-3 cursor-pointer hover:text-white/80 transition-colors" 
          style={{ fontWeight: 900 }}
          onClick={handleProductClick}
        >
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="text-white font-black text-sm mb-3 tracking-tight" style={{ fontWeight: 900 }}>
          {getPriceDisplay()}
        </div>
        
        {/* Stock Status */}
        {showInventory && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              product.inventory_quantity > 0 ? 'bg-green-500' : 'bg-red-500/60'
            }`} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/60">
              {product.inventory_quantity > 0 ? `${product.inventory_quantity} in stock` : 'Out of Stock'}
            </span>
          </div>
        )}
        
        {/* Pricing Tier Selector */}
        {tiers.length > 0 && product.inventory_quantity > 0 ? (
          <div className="space-y-2 pt-3 mt-auto border-t border-white/5">
            <div className="relative">
              <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={(e) => e.stopPropagation()}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-3 py-3 pr-8 text-[10px] uppercase tracking-[0.15em] text-white hover:border-white/20 focus:border-white/20 focus:outline-none transition-all"
              >
                <option value="" className="bg-black">Select Quantity</option>
                {tiers.map((tier, index) => {
                  const price = tier.price || (product.price * tier.qty);
                  return (
                    <option key={index} value={index} className="bg-black">
                      {tier.label} - ${price.toFixed(0)}
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {showAddButton && (
              <button
                onClick={handleAddClick}
                className="w-full bg-white text-black border-2 border-white rounded-2xl py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-black hover:text-white font-black transition-all duration-300 flex items-center justify-center gap-2"
                style={{ fontWeight: 900 }}
              >
                <ShoppingBag size={12} strokeWidth={2.5} />
                Add to Cart
              </button>
            )}
          </div>
        ) : product.inventory_quantity > 0 ? (
          <button
            onClick={handleAddClick}
            className="w-full bg-white text-black border-2 border-white rounded-2xl py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-black hover:text-white font-black transition-all duration-300 flex items-center justify-center gap-2 mt-auto"
            style={{ fontWeight: 900 }}
          >
            <ShoppingBag size={12} strokeWidth={2.5} />
            Add to Cart
          </button>
        ) : null}
      </div>
    </div>
  );
}

