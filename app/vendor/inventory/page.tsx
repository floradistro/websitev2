"use client";

import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Package } from 'lucide-react';

interface InventoryItem {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  category: string;
  image: string;
}

export default function VendorInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');

  useEffect(() => {
    // TODO: Fetch actual inventory from API
    // Mock data for testing
    setTimeout(() => {
      setInventory([
        {
          id: 1,
          product_id: 50001,
          name: "OG Kush",
          sku: "YC-OGK-001",
          quantity: 156.75,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 2,
          product_id: 50002,
          name: "Blue Dream",
          sku: "YC-BD-002",
          quantity: 203.5,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 3,
          product_id: 50003,
          name: "Sour Diesel",
          sku: "YC-SD-003",
          quantity: 127.25,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 4,
          product_id: 50004,
          name: "Girl Scout Cookies",
          sku: "YC-GSC-004",
          quantity: 145.0,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 5,
          product_id: 50005,
          name: "Gelato",
          sku: "YC-GEL-005",
          quantity: 98.5,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 6,
          product_id: 50006,
          name: "Sunset Sherbet",
          sku: "YC-SS-006",
          quantity: 76.25,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 7,
          product_id: 50007,
          name: "Purple Punch",
          sku: "YC-PP-007",
          quantity: 112.0,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 8,
          product_id: 50008,
          name: "Zkittlez",
          sku: "YC-ZKT-008",
          quantity: 89.75,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 9,
          product_id: 50009,
          name: "Wedding Cake",
          sku: "YC-WC-009",
          quantity: 134.5,
          category: "Flower",
          image: "/placeholder.jpg"
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAdjust = (itemId: number, type: 'add' | 'subtract') => {
    setAdjusting(itemId);
    setAdjustAmount('');
  };

  const submitAdjustment = (itemId: number, type: 'add' | 'subtract') => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) return;

    // TODO: Submit to API
    console.log(`${type} ${amount}g to item ${itemId}`);

    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = type === 'add' 
          ? item.quantity + amount 
          : Math.max(0, item.quantity - amount);
        return { ...item, quantity: newQty };
      }
      return item;
    }));

    setAdjusting(null);
    setAdjustAmount('');
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-500' };
    } else if (quantity < 10) {
      return { text: 'Low Stock', color: 'text-red-500' };
    }
    return { text: 'In Stock', color: 'text-white/60' };
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lg:max-w-7xl lg:mx-auto animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 lg:mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 tracking-tight">
          Inventory Management
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Manage stock levels for your location
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 -mx-4 lg:mx-0">
        <div className="relative px-4 lg:px-0">
          <Search size={18} className="absolute left-7 lg:left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
          />
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center text-white/60">Loading inventory...</div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60">No inventory items found</div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="lg:hidden divide-y divide-white/5 -mx-4">
            {filteredInventory.map((item) => (
              <div key={item.id} className="px-4 py-3 active:bg-white/5 transition-all bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium mb-0.5">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span className={getStockStatus(item.quantity).color}>
                        {item.quantity.toFixed(2)}g
                      </span>
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
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">SKU</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Quantity</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-[#303030] transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center">
                        <Package size={20} className="text-white/40" />
                      </div>
                      <div className="text-white font-medium text-sm">{item.name}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm font-mono">{item.sku}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm font-medium">
                      {item.quantity.toFixed(2)}g
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${getStockStatus(item.quantity).color}`}>
                      {getStockStatus(item.quantity).text}
                    </span>
                  </td>
                  <td className="p-4">
                    {adjusting === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-24 bg-[#1a1a1a] border border-white/10 text-white placeholder-white/40 px-2 py-1 text-sm focus:outline-none focus:border-white/20 transition-colors"
                          autoFocus
                        />
                        <button
                          onClick={() => submitAdjustment(item.id, 'add')}
                          className="group p-1.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300"
                          title="Add"
                        >
                          <Plus size={16} className="group-hover:scale-110 transition-transform duration-300" />
                        </button>
                        <button
                          onClick={() => submitAdjustment(item.id, 'subtract')}
                          className="group p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
                          title="Subtract"
                        >
                          <Minus size={16} className="group-hover:scale-110 transition-transform duration-300" />
                        </button>
                        <button
                          onClick={() => setAdjusting(null)}
                          className="text-white/60 hover:text-white text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdjust(item.id, 'add')}
                        className="text-white/60 hover:text-white text-sm transition-colors"
                      >
                        Adjust
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-white/5 lg:border border-t border-b border-white/10 p-4 -mx-4 lg:mx-0">
        <div className="flex gap-3">
          <div className="text-white/60 flex-shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div className="text-white/80 text-sm font-medium mb-1">Inventory Notes</div>
            <div className="text-white/60 text-xs">
              All inventory changes are logged for auditing. Adjustments below 10g will trigger a low stock warning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

