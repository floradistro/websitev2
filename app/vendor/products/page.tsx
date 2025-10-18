"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Package, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  image: string;
  status: 'approved' | 'pending' | 'rejected';
  quantity: number;
  price: string;
  category: string;
  coaStatus?: 'approved' | 'pending' | 'missing' | 'expired';
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
          id: 50001,
          name: "OG Kush",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 156.75,
          price: "$15.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50002,
          name: "Blue Dream",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 203.5,
          price: "$14.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50003,
          name: "Sour Diesel",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 127.25,
          price: "$16.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50004,
          name: "Girl Scout Cookies",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 145.0,
          price: "$17.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50005,
          name: "Gelato",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 98.5,
          price: "$18.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50006,
          name: "Sunset Sherbet",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 76.25,
          price: "$17.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50007,
          name: "Purple Punch",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 112.0,
          price: "$16.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50008,
          name: "Zkittlez",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 89.75,
          price: "$15.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50009,
          name: "Wedding Cake",
          image: "/placeholder.jpg",
          status: "approved",
          quantity: 134.5,
          price: "$18.99",
          category: "Flower",
          coaStatus: "approved"
        },
        {
          id: 50010,
          name: "Durban Poison",
          image: "/placeholder.jpg",
          status: "pending",
          quantity: 0,
          price: "$16.99",
          category: "Flower",
          coaStatus: "pending"
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-white/5 text-white/60 border-white/10",
      pending: "bg-white/5 text-white/60 border-white/10",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getCOABadge = (coaStatus?: string) => {
    if (!coaStatus) return null;

    const config = {
      approved: { icon: CheckCircle, text: 'COA', className: 'text-white/40' },
      pending: { icon: AlertCircle, text: 'COA', className: 'text-white/40' },
      missing: { icon: XCircle, text: 'No COA', className: 'text-red-500' },
      expired: { icon: AlertCircle, text: 'Expired', className: 'text-red-500' },
    };

    const { icon: Icon, text, className } = config[coaStatus as keyof typeof config] || config.missing;

    return (
      <div className={`flex items-center gap-1 ${className}`} title={`COA Status: ${coaStatus}`}>
        <Icon size={14} />
        <span className="text-xs">{text}</span>
      </div>
    );
  };

  const filteredProducts = products.filter(product => {
    if (filter !== 'all' && product.status !== filter) return false;
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="lg:max-w-7xl lg:mx-auto animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            My Products
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Link
          href="/vendor/products/new"
          className="group flex items-center gap-2 bg-black border border-white/20 text-white px-4 lg:px-6 py-2.5 lg:py-3 text-[10px] lg:text-xs font-medium uppercase tracking-[0.2em] active:bg-white active:text-black lg:hover:bg-white lg:hover:text-black lg:hover:border-white transition-all duration-300"
        >
          <Plus size={16} className="lg:hidden" />
          <Plus size={18} className="hidden lg:block group-hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 mb-0 lg:mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === 'approved'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
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

      {/* Products Table - Mobile: List View, Desktop: Table */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center text-white/60">Loading products...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
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
        <>
          {/* Mobile List View */}
          <div className="lg:hidden divide-y divide-white/5">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/vendor/products/${product.id}/edit`}
                className="flex items-center gap-3 px-4 py-3 active:bg-white/5 transition-all bg-[#1a1a1a]"
              >
                <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium mb-0.5">{product.name}</div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>{product.category}</span>
                    <span>•</span>
                    <span>{product.price}</span>
                    <span>•</span>
                    <span className={product.quantity > 0 ? 'text-white/60' : 'text-red-500'}>
                      {product.quantity > 0 ? `${product.quantity}g` : 'Out of stock'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(product.status)}
                  {getCOABadge(product.coaStatus)}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-[#1a1a1a] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Price</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Stock</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">COA</th>
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
                    {getCOABadge(product.coaStatus)}
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
        </>
      )}
    </div>
  );
}

