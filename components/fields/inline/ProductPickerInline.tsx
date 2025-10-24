"use client";

import { useState, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  total_stock?: number;
}

export function ProductPickerFieldInline({ label, value = [], onChange, vendorId }: { label: string; value: string[]; onChange: (value: string[]) => void; vendorId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (showPicker && products.length === 0) {
      loadProducts();
    }
  }, [showPicker]);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch('/api/page-data/products');
      if (response.ok) {
        const data = await response.json();
        const vendorProducts = (data.data?.products || []).filter((p: any) => p.vendor_id === vendorId);
        setProducts(vendorProducts);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedProducts = products.filter(p => value.includes(p.id));
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mb-2">
      <label className="text-white/60 text-xs block mb-1">{label}</label>
      
      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedProducts.map(product => (
            <span key={product.id} className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px]">
              {product.name}
              <button
                onClick={() => onChange(value.filter(id => id !== product.id))}
                className="hover:text-purple-100"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Picker button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs flex items-center justify-between hover:border-white/30 transition-colors"
      >
        <span>{selectedProducts.length > 0 ? `${selectedProducts.length} products` : 'Select products'}</span>
        <ChevronDown size={12} className={`transition-transform ${showPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown picker */}
      {showPicker && (
        <div className="mt-1 bg-black border border-white/10 rounded">
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-black border border-white/10 text-white pl-7 pr-2 py-1 rounded text-[11px] placeholder:text-white/30"
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-white/40 text-xs">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-white/40 text-xs">No products found</div>
            ) : (
              <div className="p-1">
                {filteredProducts.slice(0, 50).map(product => {
                  const isSelected = value.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (isSelected) {
                          onChange(value.filter(id => id !== product.id));
                        } else {
                          onChange([...value, product.id]);
                        }
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${
                        isSelected ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                      }`}>
                        {isSelected && <Check size={8} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0 truncate">{product.name}</div>
                      <div className="text-white/40 text-[10px]">${product.price}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

