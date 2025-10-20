
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  category: string;
  vendor: string;
  status: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${baseUrl}/wp-json/wc/v3/products?${authParams}&per_page=100&_t=${Date.now()}`
      );

      const productsList = response.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock_quantity || 0,
        category: product.categories[0]?.name || 'Uncategorized',
        vendor: product.store?.name || 'FloraDistro',
        status: product.status,
      }));

      setProducts(productsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setLoading(false);
    }
  }

  async function deleteProduct(productId: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(
        `${baseUrl}/wp-json/wc/v3/products/${productId}?${authParams}&force=true`
      );

      alert('Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  }

  const filteredProducts = products.filter(product =>
    search ? product.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            All Products
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6">
        <div className="relative">
          <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-sm lg:text-base"
          />
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center text-white/60">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center">
          <Package size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No products found</div>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="lg:hidden">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="block bg-[#1a1a1a] border-b border-white/5 p-4"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-base font-medium mb-2">{product.name}</div>
                    <div className="text-white/60 text-sm mb-2">
                      ${product.price} • {product.stock}g in stock
                    </div>
                    <div className="text-white/40 text-xs mb-3">{product.vendor}</div>
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-xs text-white/60 hover:text-white px-3 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-xs text-red-500/60 hover:text-red-500 px-3 py-1.5 border border-red-500/10 hover:border-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-[#1a1a1a] border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/5 bg-[#1a1a1a]">
                <tr>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Vendor</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Price</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Stock</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#303030] transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                          <Package size={18} className="text-white/40" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{product.name}</div>
                          <div className="text-white/40 text-xs">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">{product.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">{product.vendor}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm">${product.price}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${product.stock > 0 ? 'text-white' : 'text-red-500'}`}>
                        {product.stock > 0 ? `${product.stock}g` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-white/60 hover:text-white text-sm transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500/60 hover:text-red-500 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

