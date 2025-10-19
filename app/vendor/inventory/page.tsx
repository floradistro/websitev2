"use client";

import { useEffect, useState } from 'react';
import { Search, ChevronRight, Package, CheckCircle, AlertTriangle, X, Save, Plus, Minus, Edit2, FileText, Send } from 'lucide-react';
import { getVendorInventory, adjustVendorInventory, setVendorInventory, createVendorChangeRequest, getVendorMyProducts } from '@/lib/wordpress';
import { useVendorAuth } from '@/context/VendorAuthContext';

interface FloraFields {
  thc_percentage?: string;
  cbd_percentage?: string;
  strain_type?: string;
  lineage?: string;
  terpenes?: string;
  effects?: string;
  nose?: string;
  taste?: string;
}

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  category_name: string;
  image: string | null;
  price: number;
  description?: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_status_label: string;
  location_name: string;
  location_id: number;
  flora_fields?: FloraFields;
}

type ViewMode = 'details' | 'adjust' | 'fields';

export default function VendorInventory() {
  const { isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<Record<number, ViewMode>>({});
  const [quickAdjustInput, setQuickAdjustInput] = useState<string>('');
  const [setQuantityInput, setSetQuantityInput] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'status'>('name');
  
  // Field editing
  const [editedFields, setEditedFields] = useState<Record<number, FloraFields>>({});
  const [submittingChange, setSubmittingChange] = useState(false);

  const loadInventory = async () => {
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }
    
      try {
        setLoading(true);
        
        // Fetch both products and inventory data in parallel
        const [productsResponse, inventoryData] = await Promise.all([
          getVendorMyProducts(1, 100),
          getVendorInventory().catch(() => []) // If inventory fetch fails, use empty array
        ]);
        
        // Get only approved products
        const approvedProducts = productsResponse?.products?.filter((p: any) => p.status === 'approved') || [];
        
        // Create inventory map for quick lookup
        const inventoryMap = new Map(
          Array.isArray(inventoryData) 
            ? inventoryData.map((inv: any) => [inv.product_id, inv])
            : []
        );
        
        // Merge products with inventory data
        const mappedData = approvedProducts.map((product: any) => {
          const inventoryRecord = inventoryMap.get(product.product_id);
          
          // If inventory record exists, use it
          if (inventoryRecord) {
            return {
              ...inventoryRecord,
              quantity: parseFloat(inventoryRecord.quantity) || 0,
              price: inventoryRecord.price ? parseFloat(inventoryRecord.price) : parseFloat(product.price || 0)
            };
          }
          
          // Otherwise, create a new inventory item from product data with 0 stock
          return {
            id: product.product_id || product.id,
            product_id: product.product_id || product.id,
            product_name: product.name || 'Unnamed Product',
            sku: product.sku || '',
            quantity: 0,
            category_name: product.category || 'Product',
            image: product.image || null,
            price: parseFloat(product.price || 0),
            description: product.description || '',
            stock_status: 'out_of_stock' as const,
            stock_status_label: 'Out of Stock',
            location_name: product.location_name || 'Not Set',
            location_id: product.location_id || 0,
            flora_fields: product.flora_fields || {}
          };
        });
        
        setInventory(mappedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading inventory:', error);
        setInventory([]);
        setLoading(false);
      }
  };
    
  useEffect(() => {
    loadInventory();
  }, [authLoading, isAuthenticated]);

  // Check for expand parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const expandProductId = params.get('expand');
      if (expandProductId) {
        setExpandedId(parseInt(expandProductId));
        // Remove param from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleQuickAdjust = async (productId: number, operation: 'add' | 'subtract') => {
    const amount = parseFloat(quickAdjustInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid amount');
      return;
    }

    try {
      setProcessing(true);
      const response = await adjustVendorInventory(productId, operation, amount);
      
      if (response.success) {
        setInventory(prev => prev.map(item => {
          if (item.product_id === productId) {
            return {
              ...item,
              quantity: response.new_quantity,
              stock_status: response.stock_status,
              stock_status_label: response.stock_status === 'out_of_stock' ? 'Out of Stock' 
                : response.stock_status === 'low_stock' ? 'Low Stock' : 'In Stock'
            };
          }
          return item;
        }));
        setQuickAdjustInput('');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to adjust');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetQuantity = async (productId: number) => {
    const qty = parseFloat(setQuantityInput);
    if (isNaN(qty) || qty < 0) {
      alert('Enter a valid quantity');
      return;
    }

    try {
      setProcessing(true);
      const response = await setVendorInventory(productId, qty);
      
      if (response.success) {
    setInventory(prev => prev.map(item => {
          if (item.product_id === productId) {
            return {
              ...item,
              quantity: response.new_quantity,
              stock_status: response.stock_status,
              stock_status_label: response.stock_status === 'out_of_stock' ? 'Out of Stock' 
                : response.stock_status === 'low_stock' ? 'Low Stock' : 'In Stock'
            };
      }
      return item;
    }));
        setSetQuantityInput('');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update');
    } finally {
      setProcessing(false);
    }
  };

  const [successMessage, setSuccessMessage] = useState<number | null>(null);
  
  const handleSubmitChangeRequest = async (productId: number) => {
    const changes = editedFields[productId];
    
    console.log('📝 Submitting change request for product:', productId);
    console.log('📝 Changes to submit:', changes);
    
    if (!changes || Object.keys(changes).length === 0) {
      alert('No changes to submit');
      return;
    }

    try {
      setSubmittingChange(true);
      console.log('🚀 Calling API...');
      
      const response = await createVendorChangeRequest(productId, changes);
      
      console.log('✅ API Response:', response);
      
      if (response.success) {
        console.log('✅ Change request created with ID:', response.change_request_id);
        
        // Show success message
        setSuccessMessage(productId);
        
        // Clear after 5 seconds
        setTimeout(() => {
          console.log('🔄 Clearing success message');
          setSuccessMessage(null);
        }, 5000);
        
        // Clear edited fields
        setEditedFields(prev => {
          const newFields = { ...prev };
          delete newFields[productId];
          console.log('🧹 Cleared edited fields for product:', productId);
          return newFields;
        });
      } else {
        console.error('❌ Response not successful:', response);
        alert('Submission failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error submitting change request:', error);
      console.error('❌ Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to submit change request');
    } finally {
      setSubmittingChange(false);
      console.log('🏁 Submission complete');
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-500';
      case 'low_stock': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const categories = ['all', ...Array.from(new Set(inventory.map(i => i.category_name)))];

  let filteredInventory = inventory.filter(item => {
    if (stockFilter !== 'all' && item.stock_status !== stockFilter) return false;
    if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false;
    if (search && !item.product_name.toLowerCase().includes(search.toLowerCase()) && 
        !(item.sku || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filteredInventory = filteredInventory.sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.product_name.localeCompare(b.product_name);
      case 'quantity': return b.quantity - a.quantity;
      case 'status': return a.stock_status.localeCompare(b.stock_status);
      default: return 0;
    }
  });

  const stats = {
    total: inventory.length,
    in_stock: inventory.filter(i => i.stock_status === 'in_stock').length,
    low_stock: inventory.filter(i => i.stock_status === 'low_stock').length,
    out_of_stock: inventory.filter(i => i.stock_status === 'out_of_stock').length
  };

  return (
    <div className="lg:max-w-7xl lg:mx-auto animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 tracking-tight">
          Inventory Management
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          {filteredInventory.length} {filteredInventory.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 -mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-white/40" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Total</span>
          </div>
          <div className="text-xl text-white font-light">{stats.total}</div>
        </div>
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">In Stock</span>
          </div>
          <div className="text-xl text-green-500 font-light">{stats.in_stock}</div>
        </div>
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Low</span>
          </div>
          <div className="text-xl text-yellow-500 font-light">{stats.low_stock}</div>
        </div>
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <X size={14} className="text-red-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Out</span>
          </div>
          <div className="text-xl text-red-500 font-light">{stats.out_of_stock}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4 mb-6 -mx-4 lg:mx-0">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
              placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
            >
              <option value="name">Name</option>
              <option value="quantity">Quantity</option>
              <option value="status">Status</option>
            </select>

            {['all', 'in_stock', 'low_stock', 'out_of_stock'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStockFilter(filter as any)}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                  stockFilter === filter 
                    ? filter === 'in_stock' ? 'border-green-500 text-green-500' 
                      : filter === 'low_stock' ? 'border-yellow-500 text-yellow-500'
                      : filter === 'out_of_stock' ? 'border-red-500 text-red-500'
                      : 'border-white text-white'
                    : 'border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Cards */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center text-white/60">Loading...</div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60">No items found</div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInventory.map((item) => {
            const isExpanded = expandedId === item.product_id;
            const currentView = viewMode[item.product_id] || 'details';
            const currentFields = editedFields[item.product_id] || item.flora_fields || {};
            const hasChanges = editedFields[item.product_id] && Object.keys(editedFields[item.product_id]).length > 0;
            
            return (
              <div
                key={item.id}
                className="bg-[#1a1a1a] lg:border border-t border-b border-white/[0.04] transition-all -mx-4 lg:mx-0"
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.product_id)}
                  className="flex items-center gap-4 px-4 lg:px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/40">
                    <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  <div className="w-12 h-12 bg-white/5 rounded flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-white/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm mb-0.5">{item.product_name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-white/40">
                      <span className="font-mono">{item.sku || 'No SKU'}</span>
                      <span>•</span>
                      <span>{item.category_name}</span>
                      <span>•</span>
                      <span>{item.location_name}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-light mb-0.5 ${getStockStatusColor(item.stock_status)}`}>
                      {item.quantity.toFixed(1)}g
                    </div>
                    <div className={`text-[10px] uppercase tracking-wider ${getStockStatusColor(item.stock_status)}`}>
                      {item.stock_status_label}
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-black/20">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-2 px-4 lg:px-6 py-3 border-b border-white/[0.04]">
                      <button
                        onClick={() => setViewMode(prev => ({ ...prev, [item.product_id]: 'details' }))}
                        className={`px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'details' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setViewMode(prev => ({ ...prev, [item.product_id]: 'adjust' }))}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'adjust' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <Edit2 size={12} />
                        Stock
                      </button>
                      <button
                        onClick={() => {
                          setViewMode(prev => ({ ...prev, [item.product_id]: 'fields' }));
                          // Initialize editing with current values
                          if (!editedFields[item.product_id]) {
                            setEditedFields(prev => ({ ...prev, [item.product_id]: { ...item.flora_fields } }));
                          }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'fields' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <FileText size={12} />
                        Product Fields
                        {hasChanges && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                      </button>
                    </div>

                    <div className="px-4 lg:px-6 py-6">
                      {/* Details */}
                      {currentView === 'details' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Product Info</div>
                            
                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">SKU</span>
                                <span className="text-white/80 text-xs font-mono">{item.sku || '—'}</span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Price/gram</span>
                                <span className="text-white/80 text-xs">${item.price.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Category</span>
                                <span className="text-white/80 text-xs">{item.category_name}</span>
              </div>
          </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Product ID</span>
                                <span className="text-white/80 text-xs font-mono">{item.product_id}</span>
                              </div>
                      </div>
                    </div>

                          <div className="space-y-3">
                            <div className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Stock Info</div>
                            
                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Current Stock</span>
                                <span className={`text-lg font-medium ${getStockStatusColor(item.stock_status)}`}>
                      {item.quantity.toFixed(2)}g
                    </span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Status</span>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider border ${
                                  item.stock_status === 'out_of_stock' ? 'border-red-500 text-red-500' :
                                  item.stock_status === 'low_stock' ? 'border-yellow-500 text-yellow-500' :
                                  'border-green-500 text-green-500'
                                }`}>
                                  {item.stock_status === 'out_of_stock' ? <X size={10} /> :
                                   item.stock_status === 'low_stock' ? <AlertTriangle size={10} /> :
                                   <CheckCircle size={10} />}
                                  {item.stock_status_label}
                                </span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Total Value</span>
                                <span className="text-white/80 text-xs font-medium">
                                  ${(item.quantity * item.price).toFixed(2)}
                    </span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Location</span>
                                <span className="text-white/80 text-xs">{item.location_name}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Quick Actions</div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMode(prev => ({ ...prev, [item.product_id]: 'adjust' }));
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
                            >
                              <Edit2 size={16} />
                              <span className="text-xs uppercase tracking-wider font-medium">Adjust Inventory</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMode(prev => ({ ...prev, [item.product_id]: 'fields' }));
                                if (!editedFields[item.product_id]) {
                                  setEditedFields(prev => ({ ...prev, [item.product_id]: { ...item.flora_fields } }));
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
                            >
                              <FileText size={16} />
                              <span className="text-xs uppercase tracking-wider font-medium">Edit Product Details</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Adjust Stock */}
                      {currentView === 'adjust' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="border border-white/[0.04] rounded p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Plus size={16} className="text-green-500" />
                              <span className="text-white text-sm font-medium">Quick Add / Remove</span>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-white/60 text-xs mb-2 block">Amount (grams)</label>
                        <input
                          type="number"
                          step="0.1"
                                  min="0"
                                  value={quickAdjustInput}
                                  onChange={(e) => setQuickAdjustInput(e.target.value)}
                                  placeholder="—"
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 text-base focus:outline-none focus:border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                        <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdjust(item.product_id, 'add');
                                  }}
                                  disabled={processing || !quickAdjustInput}
                                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/30 text-white px-4 py-3 transition-all disabled:cursor-not-allowed"
                                >
                                  <Plus size={18} />
                                  <span className="text-xs uppercase tracking-wider font-medium">Add</span>
                        </button>
                        <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdjust(item.product_id, 'subtract');
                                  }}
                                  disabled={processing || !quickAdjustInput}
                                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 text-white px-4 py-3 transition-all disabled:cursor-not-allowed"
                                >
                                  <Minus size={18} />
                                  <span className="text-xs uppercase tracking-wider font-medium">Remove</span>
                        </button>
                              </div>

                              <div className="pt-4 border-t border-white/5">
                                <div className="text-white/40 text-[10px] mb-2 uppercase tracking-wider">Quick Presets</div>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 3.5, 7, 14, 28].map(preset => (
                        <button
                                      key={preset}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickAdjustInput(preset.toString());
                                      }}
                                      className="px-2 py-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-xs"
                                    >
                                      {preset}g
                        </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border border-white/[0.04] rounded p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Save size={16} className="text-blue-500" />
                              <span className="text-white text-sm font-medium">Set Exact Quantity</span>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-white/60 text-xs mb-2 block">New Quantity (grams)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={setQuantityInput}
                                  onChange={(e) => setSetQuantityInput(e.target.value)}
                                  placeholder="—"
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 text-base focus:outline-none focus:border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                />
                      </div>

                      <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetQuantity(item.product_id);
                                }}
                                disabled={processing || !setQuantityInput}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 disabled:bg-white/30 text-black px-4 py-3 transition-all disabled:cursor-not-allowed"
                              >
                                <Save size={18} />
                                <span className="text-xs uppercase tracking-wider font-medium">Update Stock</span>
                      </button>

                              <div className="text-white/40 text-xs pt-3 border-t border-white/5">
                                Current: {item.quantity.toFixed(2)}g • This will override the stock level
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Product Fields */}
                      {currentView === 'fields' && (
                        <div>
                          {/* Success Message */}
                          {successMessage === item.product_id && (
                            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                              <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                              <div>
                                <div className="text-green-500 font-medium text-sm mb-1">✅ Change Request Submitted!</div>
                                <div className="text-green-500/80 text-xs">
                                  Your updates are pending admin approval. Changes will go live after review.
                                </div>
                              </div>
        </div>
                          )}
                          
                          {/* Header with Submit Button */}
                          {hasChanges && !successMessage && (
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-yellow-500" />
                                <span className="text-yellow-500 text-xs uppercase tracking-wider">Unsaved Changes</span>
                              </div>
                              <button
                                onClick={() => handleSubmitChangeRequest(item.product_id)}
                                disabled={submittingChange}
                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white px-4 py-2 transition-all disabled:cursor-not-allowed"
                              >
                                <Send size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-medium">
                                  {submittingChange ? 'Submitting...' : 'Submit for Approval'}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Compact Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* THC % */}
                            <div className="border border-white/[0.04] rounded p-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">THC %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={currentFields.thc_percentage || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, thc_percentage: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* CBD % */}
                            <div className="border border-white/[0.04] rounded p-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">CBD %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={currentFields.cbd_percentage || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, cbd_percentage: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Strain Type */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Strain Type</label>
                              <select
                                value={currentFields.strain_type || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, strain_type: e.target.value }
                                }))}
                                className="w-full bg-transparent border-none text-white text-sm focus:outline-none px-0 py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">—</option>
                                <option value="indica">Indica</option>
                                <option value="sativa">Sativa</option>
                                <option value="hybrid">Hybrid</option>
                              </select>
                            </div>

                            {/* Lineage */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Lineage</label>
                              <input
                                type="text"
                                value={currentFields.lineage || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, lineage: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Nose */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Nose / Aroma</label>
                              <input
                                type="text"
                                value={currentFields.nose || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, nose: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Terpenes */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-4">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Dominant Terpenes</label>
                              <input
                                type="text"
                                value={currentFields.terpenes || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, terpenes: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Effects */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-4">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Effects</label>
                              <input
                                type="text"
                                value={currentFields.effects || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, effects: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Taste */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-4">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Taste / Flavor</label>
                              <input
                                type="text"
                                value={currentFields.taste || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, taste: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

      {/* Info Box */}
                          {!hasChanges && !successMessage && (
                            <div className="mt-4 p-3 bg-white/5 border border-white/10 flex items-center gap-2">
                              <FileText size={14} className="text-white/60 flex-shrink-0" />
                              <span className="text-white/60 text-xs">
                                Edit any field above. Changes will be submitted for admin review before going live.
                              </span>
                            </div>
                          )}
                          
                          {/* Warning Box - Only if unsaved changes */}
                          {hasChanges && !successMessage && (
                            <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-2">
                              <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                              <span className="text-yellow-500/80 text-xs">
                                You have unsaved changes. Click "Submit for Approval" to send for admin review.
                              </span>
                            </div>
                          )}
          </div>
                      )}
            </div>
          </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
