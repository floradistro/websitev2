"use client";

import { useState, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  featured_image_storage?: string;
  stock_status: string;
  total_stock: number;
  categories?: any[];
}

interface ProductPickerFieldProps {
  value: string[]; // Array of product IDs
  onChange: (value: string[]) => void;
  vendorId: string;
  maxSelections?: number;
  filter?: {
    categories?: string[];
    min_stock?: number;
    featured?: boolean;
  };
  label?: string;
}

export function ProductPickerField({
  value = [],
  onChange,
  vendorId,
  maxSelections = 10,
  filter = {},
  label = "Select Products",
}: ProductPickerFieldProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [vendorId]);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch("/api/page-data/products");

      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch products:", response.status);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.products) {
        let vendorProducts = data.data.products.filter(
          (p: any) => p.vendor_id === vendorId,
        );

        // Apply filters
        if (filter.min_stock) {
          vendorProducts = vendorProducts.filter(
            (p: any) => (p.total_stock || 0) >= (filter.min_stock || 0),
          );
        }

        if (filter.categories && filter.categories.length > 0) {
          vendorProducts = vendorProducts.filter((p: any) =>
            p.categories?.some((cat: any) =>
              filter.categories!.includes(cat.slug || cat.name),
            ),
          );
        }

        setProducts(vendorProducts);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading products:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedProducts = products.filter((p) => value.includes(p.id));
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleProduct = (productId: string) => {
    if (value.includes(productId)) {
      onChange(value.filter((id) => id !== productId));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        alert(`Maximum ${maxSelections} products allowed`);
        return;
      }
      onChange([...value, productId]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-white/80 text-sm mb-2">{label}</label>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="mb-2 space-y-1">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded p-2"
            >
              {product.featured_image_storage && (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={product.featured_image_storage}
                    alt={product.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs truncate">
                  {product.name}
                </div>
                <div className="text-white/40 text-[10px]">
                  ${product.price} • {product.total_stock}g stock
                </div>
              </div>
              <button
                onClick={() => toggleProduct(product.id)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Picker Button */}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded px-4 py-2 text-white text-sm flex items-center justify-center gap-2"
      >
        <Search size={16} />
        {selectedProducts.length > 0
          ? `Change Products (${selectedProducts.length})`
          : "Select Products"}
      </button>

      {/* Product Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-2xl w-full max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Select Products</h3>
                <button
                  onClick={() => setShowPicker(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white text-sm"
                autoFocus
              />

              <div className="text-white/40 text-xs mt-2">
                {value.length} / {maxSelections} selected
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-white/40">Loading products...</div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-white/40 text-sm">No products found</div>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = value.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-purple-500/20 border border-purple-500/40"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {product.featured_image_storage && (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={product.featured_image_storage}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">
                          {product.name}
                        </div>
                        <div className="text-white/60 text-xs mt-1">
                          ${product.price}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              product.total_stock > 50
                                ? "bg-green-500/20 text-green-400"
                                : product.total_stock > 0
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {product.total_stock}g stock
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check
                          size={20}
                          className="text-purple-400 flex-shrink-0"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 bg-white text-black px-4 py-2 rounded hover:bg-white/90"
              >
                Done ({value.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
