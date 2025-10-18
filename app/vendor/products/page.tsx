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
          id: 41735,
          name: "Lemon Cherry Diesel",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 127.5,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41734,
          name: "Blue Zushi",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 98.25,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41733,
          name: "Detroit Runts",
          image: "/placeholder.jpg",
          status: "pending",
          quantity: 0,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41732,
          name: "Dirty Sprite",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 4.0,
          price: "$34.99",
          category: "Vape"
        },
        {
          id: 41731,
          name: "Pink Lemonade",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 45.0,
          price: "$34.99",
          category: "Vape"
        },
        {
          id: 41730,
          name: "Orange Candy Crush",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 32.0,
          price: "$34.99",
          category: "Vape"
        },
        {
          id: 41729,
          name: "Girl Scout Cookie",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 28.0,
          price: "$34.99",
          category: "Vape"
        },
        {
          id: 41588,
          name: "Black Jack",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 156.75,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41587,
          name: "Space Runtz",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 203.5,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41586,
          name: "Black Ice Runtz",
          image: "/placeholder.jpg",
          status: "rejected",
          quantity: 0,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41585,
          name: "Mango Gusher",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 12.25,
          price: "$14.99",
          category: "Flower"
        },
        {
          id: 41584,
          name: "Zkittlez",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 89.0,
          price: "$14.99",
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
          className="group flex items-center gap-2 bg-black border border-white/20 text-white px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all duration-300"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#2a2a2a] border border-white/5 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/10 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filter === 'approved'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filter === 'pending'
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filter === 'rejected'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="bg-[#2a2a2a] border border-white/5 p-12">
          <div className="text-center text-white/60">Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#2a2a2a] border border-white/5 p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-4">No products found</div>
            <Link
              href="/vendor/products/new"
              className="group inline-flex items-center gap-2 bg-black border border-white/20 text-white px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all duration-300"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              Add Your First Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Price</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Stock</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#303030] transition-all">
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

