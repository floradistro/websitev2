"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProductSelectorDropdownProps {
  vendorId: string;
  selectedProductIds: string[];
  onChange: (productIds: string[]) => void;
}

export function ProductSelectorDropdown({
  vendorId,
  selectedProductIds,
  onChange,
}: ProductSelectorDropdownProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`/api/products?vendor_id=${vendorId}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [vendorId]);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onChange([...selectedProductIds, productId]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedProducts.map(product => (
            <div
              key={product.id}
              className="flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-1 rounded"
            >
              <span>{product.name}</span>
              <button
                onClick={() => toggleProduct(product.id)}
                className="hover:bg-blue-700 rounded"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-white"
      />

      {/* Product List */}
      <div className="max-h-48 overflow-y-auto border border-neutral-800 rounded bg-neutral-950">
        {loading ? (
          <div className="p-4 text-center text-neutral-500 text-xs">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-xs">No products found</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredProducts.map(product => (
              <label
                key={product.id}
                className="flex items-center gap-2 p-2 hover:bg-neutral-900 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{product.name}</div>
                  <div className="text-xs text-neutral-500">${product.price || '0.00'}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        {selectedProducts.length === 0 
          ? 'Select products or leave empty to show all' 
          : `${selectedProducts.length} product(s) selected`}
      </p>
    </div>
  );
}

