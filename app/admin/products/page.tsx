"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Trash2 } from 'lucide-react';
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
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl text-white mb-2 font-light">All Products</h1>
          <p className="text-white/60 text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-2.5 focus:outline-none focus:border-white/10 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-16 text-center">
          <div className="inline-block w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white/60">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
          <Package size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No products found</div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
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
      )}
    </div>
  );
}
