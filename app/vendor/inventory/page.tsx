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
          product_id: 41735,
          name: "Lemon Cherry Diesel",
          sku: "LCD-FLW-001",
          quantity: 127.5,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 2,
          product_id: 41734,
          name: "Blue Zushi",
          sku: "BZ-FLW-002",
          quantity: 98.25,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 3,
          product_id: 41588,
          name: "Black Jack",
          sku: "BJ-FLW-003",
          quantity: 156.75,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 4,
          product_id: 41587,
          name: "Space Runtz",
          sku: "SR-FLW-004",
          quantity: 203.5,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 5,
          product_id: 41585,
          name: "Mango Gusher",
          sku: "MG-FLW-005",
          quantity: 12.25,
          category: "Flower",
          image: "/placeholder.jpg"
        },
        {
          id: 6,
          product_id: 41732,
          name: "Dirty Sprite",
          sku: "DS-VAP-006",
          quantity: 4.0,
          category: "Vape",
          image: "/placeholder.jpg"
        },
        {
          id: 7,
          product_id: 41731,
          name: "Pink Lemonade",
          sku: "PL-VAP-007",
          quantity: 45.0,
          category: "Vape",
          image: "/placeholder.jpg"
        },
        {
          id: 8,
          product_id: 41730,
          name: "Orange Candy Crush",
          sku: "OCC-VAP-008",
          quantity: 32.0,
          category: "Vape",
          image: "/placeholder.jpg"
        },
        {
          id: 9,
          product_id: 41729,
          name: "Girl Scout Cookie",
          sku: "GSC-VAP-009",
          quantity: 28.0,
          category: "Vape",
          image: "/placeholder.jpg"
        },
        {
          id: 10,
          product_id: 41584,
          name: "Zkittlez",
          sku: "ZKT-FLW-010",
          quantity: 89.0,
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
      return { text: 'Low Stock', color: 'text-yellow-500' };
    }
    return { text: 'In Stock', color: 'text-green-500' };
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Inventory Management
        </h1>
        <p className="text-white/60 text-sm">
          Manage stock levels for your location
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="bg-[#2a2a2a] border border-white/10 rounded p-12">
          <div className="text-center text-white/60">Loading inventory...</div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-[#2a2a2a] border border-white/10 rounded p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60">No inventory items found</div>
          </div>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] border border-white/10 rounded overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">SKU</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Category</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Quantity</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
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
                          className="w-24 bg-white/5 border border-white/10 text-white placeholder-white/40 px-2 py-1 text-sm rounded focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => submitAdjustment(item.id, 'add')}
                          className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
                          title="Add"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => submitAdjustment(item.id, 'subtract')}
                          className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                          title="Subtract"
                        >
                          <Minus size={16} />
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
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded p-4">
        <div className="flex gap-3">
          <div className="text-blue-500 flex-shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div className="text-blue-500 text-sm font-medium mb-1">Inventory Notes</div>
            <div className="text-white/60 text-xs">
              All inventory changes are logged for auditing. Adjustments below 10g will trigger a low stock warning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

