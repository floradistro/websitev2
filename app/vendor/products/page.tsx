"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Package } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  image: string;
  status: 'approved' | 'pending' | 'rejected';
  quantity: number;
  price: string;
  category: string;
}

export default function VendorProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // TODO: Fetch actual products from API
    // Mock data for testing
    setTimeout(() => {
      setProducts([
        {
          id: 1,
          name: "Blue Dream",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 150,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 2,
          name: "OG Kush",
          image: "/placeholder.jpg",
          status: "pending",
          quantity: 0,
          price: "$16.99",
          category: "Flower"
        },
        {
          id: 3,
          name: "Sour Diesel",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 75,
          price: "$15.99",
          category: "Flower"
        },
        {
          id: 4,
          name: "Purple Haze",
          image: "/placeholder.jpg",
          status: "rejected",
          quantity: 0,
          price: "$17.99",
          category: "Flower"
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const filteredProducts = products.filter(product => {
    if (filter !== 'all' && product.status !== filter) return false;
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
            My Products
          </h1>
          <p className="text-white/60 text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Link
          href="/vendor/products/new"
          className="flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-white/90 transition-colors"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#2a2a2a] border border-white/10 p-4 rounded mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-2 text-sm rounded focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                filter === 'approved'
                  ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-500/20 text-red-500 border border-red-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="bg-[#2a2a2a] border border-white/10 rounded p-12">
          <div className="text-center text-white/60">Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#2a2a2a] border border-white/10 rounded p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-4">No products found</div>
            <Link
              href="/vendor/products/new"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-white/90 transition-colors"
            >
              <Plus size={18} />
              Add Your First Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] border border-white/10 rounded overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Price</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Stock</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center">
                        <Package size={20} className="text-white/40" />
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
                    <span className="text-white text-sm">{product.price}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${product.quantity > 0 ? 'text-white' : 'text-red-500'}`}>
                      {product.quantity > 0 ? `${product.quantity}g` : 'Out of stock'}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/vendor/products/${product.id}/edit`}
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Edit
                    </Link>
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

