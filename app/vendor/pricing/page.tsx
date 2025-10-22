"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, Save, Edit2, Trash2, AlertCircle, TrendingUp, BarChart3, Package, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '@/components/NotificationToast';
import { useVendorAuth } from '@/context/VendorAuthContext';

interface PriceBreak {
  break_id: string;
  label: string;
  qty?: number;
  unit?: string;
  min_qty?: number;
  max_qty?: number;
  discount_percent?: number;
  discount_expected?: number;
  sort_order: number;
}

interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier_type: string;
  price_breaks: PriceBreak[];
  is_active: boolean;
  display_order: number;
  applicable_to_categories?: string[];
}

interface PricingConfig {
  id: string;
  vendor_id: string;
  blueprint_id: string;
  pricing_values: { [breakId: string]: { price?: string; discount_percent?: string; enabled: boolean } };
  notes: string | null;
  is_active: boolean;
  blueprint?: Blueprint;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  assigned_blueprints?: string[];
}

interface CategoryAssignment {
  category: string;
  blueprint_ids: string[];
}

export default function VendorPricingPage() {
  const router = useRouter();
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [availableBlueprints, setAvailableBlueprints] = useState<Blueprint[]>([]);
  const [editingConfig, setEditingConfig] = useState<Partial<PricingConfig> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  
  // New state for category and product assignments
  const [activeTab, setActiveTab] = useState<'tiers' | 'categories' | 'products'>('tiers');
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<CategoryAssignment[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAssignBlueprint, setBulkAssignBlueprint] = useState<string>('');

  const categories = ['Flower', 'Concentrate', 'Edibles', 'Vape', 'Topicals', 'Accessories'];

  useEffect(() => {
    // Don't load if auth is still loading or not authenticated
    if (!authLoading && isAuthenticated) {
      const vendorId = localStorage.getItem('vendor_id');
      if (vendorId) {
        loadPricingData(vendorId);
        loadProducts(vendorId);
        loadCategoryAssignments(vendorId);
      }
    }
  }, [authLoading, isAuthenticated]);

  async function loadPricingData(vId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/pricing-config?vendor_id=${vId}`);
      const data = await res.json();

      if (data.success) {
        setConfigs(data.configs);
        setAvailableBlueprints(data.available_blueprints);
      } else {
        showError(data.error || 'Failed to load pricing data');
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      showError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(vId: string) {
    try {
      const res = await fetch(`/api/vendor/products`, {
        headers: {
          'x-vendor-id': vId
        }
      });
      const data = await res.json();

      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async function loadCategoryAssignments(vId: string) {
    try {
      const res = await fetch(`/api/vendor/category-pricing?vendor_id=${vId}`);
      const data = await res.json();

      if (data.success) {
        setCategoryAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error loading category assignments:', error);
    }
  }

  function handleNewConfig(blueprint: Blueprint) {
    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) {
      showError('Vendor session not found');
      return;
    }
    
    // Initialize pricing values with all breaks disabled
    const initialValues: any = {};
    blueprint.price_breaks.forEach((priceBreak) => {
      initialValues[priceBreak.break_id] = {
        price: '',
        discount_percent: '',
        enabled: false
      };
    });

    setEditingConfig({
      vendor_id: vendorId,
      blueprint_id: blueprint.id,
      pricing_values: initialValues,
      notes: '',
      is_active: true
    });
    setSelectedBlueprint(blueprint);
    setShowEditor(true);
  }

  function handleEditConfig(config: PricingConfig) {
    setEditingConfig({ ...config });
    setSelectedBlueprint(config.blueprint || null);
    setShowEditor(true);
  }

  async function handleSaveConfig() {
    if (!editingConfig || !editingConfig.vendor_id || !editingConfig.blueprint_id) {
      showError('Missing required fields');
      return;
    }

    // Validate at least one price break is enabled
    const hasEnabledBreak = Object.values(editingConfig.pricing_values || {}).some(
      (v: any) => v.enabled && (v.price || v.discount_percent)
    );

    if (!hasEnabledBreak) {
      showError('Please enable and configure at least one price break');
      return;
    }

    try {
      const method = editingConfig.id ? 'PUT' : 'POST';
      const res = await fetch('/api/vendor/pricing-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfig)
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(`Pricing configuration ${editingConfig.id ? 'updated' : 'created'} successfully`);
        setShowEditor(false);
        setEditingConfig(null);
        setSelectedBlueprint(null);
        const vId = localStorage.getItem('vendor_id');
        if (vId) loadPricingData(vId);
      } else {
        showError(data.error || 'Failed to save pricing configuration');
      }
    } catch (error) {
      console.error('Error saving pricing config:', error);
      showError('Failed to save pricing configuration');
    }
  }

  async function handleDeleteConfig(id: string) {
    if (!confirm('Are you sure you want to delete this pricing configuration?')) return;

    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) {
      showError('Vendor session not found');
      return;
    }

    try {
      const res = await fetch(`/api/vendor/pricing-config?id=${id}&vendor_id=${vendorId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Pricing configuration deleted successfully');
        loadPricingData(vendorId);
      } else {
        showError(data.error || 'Failed to delete pricing configuration');
      }
    } catch (error) {
      console.error('Error deleting pricing config:', error);
      showError('Failed to delete pricing configuration');
    }
  }

  async function handleCategoryAssignment(category: string, blueprintId: string, assign: boolean) {
    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) {
      showError('Vendor session not found');
      return;
    }
    
    try {
      const res = await fetch('/api/vendor/category-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          category,
          blueprint_id: blueprintId,
          assign
        })
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(`Pricing tier ${assign ? 'assigned to' : 'removed from'} ${category}`);
        loadCategoryAssignments(vendorId);
      } else {
        showError(data.error || 'Failed to update category assignment');
      }
    } catch (error) {
      console.error('Error updating category assignment:', error);
      showError('Failed to update category assignment');
    }
  }

  async function handleProductAssignment(productIds: string[], blueprintId: string) {
    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) {
      showError('Vendor session not found');
      return;
    }
    
    try {
      const res = await fetch('/api/vendor/product-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          product_ids: productIds,
          blueprint_id: blueprintId
        })
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(`Pricing tier assigned to ${productIds.length} product(s)`);
        setSelectedProducts(new Set());
        setBulkAssignBlueprint('');
        loadProducts(vendorId);
      } else {
        showError(data.error || 'Failed to assign pricing to products');
      }
    } catch (error) {
      console.error('Error assigning pricing to products:', error);
      showError('Failed to assign pricing to products');
    }
  }

  function toggleCategory(category: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  }

  function toggleProductSelection(productId: string) {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  }

  function updatePricingValue(breakId: string, field: 'price' | 'discount_percent' | 'enabled', value: any) {
    if (!editingConfig) return;

    const currentValues = editingConfig.pricing_values || {};
    const currentBreak = currentValues[breakId] || { price: '', discount_percent: '', enabled: false };

    setEditingConfig({
      ...editingConfig,
      pricing_values: {
        ...currentValues,
        [breakId]: {
          ...currentBreak,
          [field]: value
        }
      }
    });
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Check authentication after loading
  if (!isAuthenticated) {
    return null; // Layout will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60">Loading pricing data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <h1 className="text-2xl lg:text-3xl font-bold">Pricing Configuration</h1>
          </div>
          <p className="text-white/60 text-sm lg:text-base">
            Configure your pricing tiers and assign them to categories or individual products.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111111] border border-white/10 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-white/60 text-sm">Configured Tiers</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold">{configs.length}</div>
          </div>

          <div className="bg-[#111111] border border-white/10 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-white/60 text-sm">Active Configs</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold">{configs.filter(c => c.is_active).length}</div>
          </div>

          <div className="bg-[#111111] border border-white/10 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="text-white/60 text-sm">Available Blueprints</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold">{availableBlueprints.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#111111] border border-white/10 p-1">
          <button
            onClick={() => setActiveTab('tiers')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'tiers' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Pricing Tiers
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'categories' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Category Pricing
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'products' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Product Pricing
          </button>
        </div>

        {/* Getting Started Guide */}
        {configs.length === 0 && activeTab === 'tiers' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">
              ✨ Get Started with Pricing Tiers
            </h3>
            <p className="text-white/80 mb-4">
              You haven't configured any pricing tiers yet. Follow these steps to get started:
            </p>
            <ol className="text-white/70 space-y-3">
              <li>
                <strong className="text-white">1. Choose a Blueprint:</strong> 
                <span className="ml-2 text-white/60">Select from the available pricing tiers below that match your products</span>
              </li>
              <li>
                <strong className="text-white">2. Set Your Prices:</strong>
                <span className="ml-2 text-white/60">Configure the price for each tier level (e.g., $10 for 1g, $30 for 3.5g)</span>
              </li>
              <li>
                <strong className="text-white">3. Assign to Products:</strong>
                <span className="ml-2 text-white/60">Use the Category or Product tabs to apply pricing to your inventory</span>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-yellow-400 text-sm">
                <strong>💡 Tip:</strong> Start with one pricing tier and test it on a few products before configuring multiple tiers.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'tiers' && (
          <>
            {/* Available Blueprints to Configure */}
            {availableBlueprints.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {configs.length === 0 ? 'Step 1: Choose a Pricing Tier' : 'Available Pricing Tiers'}
                </h2>
                <p className="text-white/60 text-sm mb-4">
                  {configs.length === 0 
                    ? 'Select a tier structure that matches your business model.' 
                    : 'Configure pricing for these platform-defined tier structures.'}
                </p>
                <div className="grid gap-4">
                  {availableBlueprints.map((blueprint) => (
                    <div key={blueprint.id} className="bg-[#111111] border border-white/10 overflow-hidden">
                      <div className="p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{blueprint.name}</h3>
                            <p className="text-white/60 text-sm mb-3">{blueprint.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" />
                                {blueprint.tier_type}
                              </span>
                              <span className="text-xs text-white/40">
                                {blueprint.price_breaks.length} price breaks
                              </span>
                              {blueprint.applicable_to_categories && blueprint.applicable_to_categories.length > 0 && (
                                <span className="text-xs text-blue-400">
                                  Restricted to: {blueprint.applicable_to_categories.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleNewConfig(blueprint)}
                            className="bg-white text-black px-4 py-2 hover:bg-white/90 transition-colors text-sm font-medium"
                          >
                            Configure Pricing
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configured Pricing */}
            {configs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Configured Pricing</h2>
                <div className="grid gap-4">
                  {configs.map((config) => (
                    <div key={config.id} className="bg-[#111111] border border-white/10 overflow-hidden">
                      <div className="p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{config.blueprint?.name}</h3>
                              {config.is_active ? (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1">Active</span>
                              ) : (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1">Inactive</span>
                              )}
                            </div>
                            {config.notes && (
                              <p className="text-white/60 text-sm mb-2">{config.notes}</p>
                            )}
                            <div className="text-xs text-white/40">
                              Updated: {new Date(config.updated_at).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditConfig(config)}
                              className="p-2 bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Price Breaks Display */}
                        <div className="border-t border-white/5 pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {config.blueprint?.price_breaks
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((priceBreak) => {
                                const value = config.pricing_values[priceBreak.break_id];
                                if (!value?.enabled) return null;

                                return (
                                  <div key={priceBreak.break_id} className="bg-white/5 p-3">
                                    <div className="text-xs text-white/60 mb-1">{priceBreak.label}</div>
                                    <div className="text-lg font-semibold">
                                      ${value.price || value.discount_percent + '%'}
                                    </div>
                                    {priceBreak.qty && (
                                      <div className="text-xs text-white/40 mt-1">
                                        {priceBreak.qty}{priceBreak.unit}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configs.length === 0 && availableBlueprints.length === 0 && (
              <div className="bg-[#111111] border border-white/10 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No pricing tiers available. Please contact support to set up pricing blueprints.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Category Pricing Assignment</h2>
            <p className="text-white/60 text-sm mb-6">
              Assign pricing tiers to entire categories. All products in the category will use these tiers by default.
            </p>
            
            <div className="grid gap-4">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category);
                const categoryConfigs = configs.filter(c => 
                  categoryAssignments.find(a => a.category === category)?.blueprint_ids.includes(c.blueprint_id)
                );
                const categoryProducts = products.filter(p => p.category === category);
                
                return (
                  <div key={category} className="bg-[#111111] border border-white/10">
                    <div 
                      className="p-4 lg:p-6 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <div>
                          <h3 className="font-semibold">{category}</h3>
                          <p className="text-xs text-white/60 mt-1">
                            {categoryProducts.length} products • {categoryConfigs.length} pricing tiers assigned
                          </p>
                        </div>
                      </div>
                      <Tag className="w-5 h-5 text-white/40" />
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-white/5 p-4 lg:p-6">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-3">Assigned Pricing Tiers</h4>
                          {categoryConfigs.length > 0 ? (
                            <div className="grid gap-2">
                              {categoryConfigs.map((config) => (
                                <div key={config.id} className="flex items-center justify-between bg-white/5 p-3">
                                  <span className="text-sm">{config.blueprint?.name}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCategoryAssignment(category, config.blueprint_id, false);
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-white/40 text-sm">No pricing tiers assigned to this category</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-3">Add Pricing Tier</h4>
                          <div className="flex gap-2">
                            <select
                              className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleCategoryAssignment(category, e.target.value, true);
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Select a pricing tier</option>
                              {configs
                                .filter(c => !categoryConfigs.find(cc => cc.id === c.id))
                                .map((config) => (
                                  <option key={config.id} value={config.blueprint_id}>
                                    {config.blueprint?.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Product-Specific Pricing</h2>
            <p className="text-white/60 text-sm mb-6">
              Assign pricing tiers to individual products or override category defaults.
            </p>
            
            {/* Bulk Assignment */}
            {selectedProducts.size > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <p className="text-sm">
                    {selectedProducts.size} product(s) selected
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={bulkAssignBlueprint}
                      onChange={(e) => setBulkAssignBlueprint(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                    >
                      <option value="">Select pricing tier</option>
                      {configs.map((config) => (
                        <option key={config.id} value={config.blueprint_id}>
                          {config.blueprint?.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (bulkAssignBlueprint) {
                          handleProductAssignment(Array.from(selectedProducts), bulkAssignBlueprint);
                        }
                      }}
                      disabled={!bulkAssignBlueprint}
                      className="bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Assign to Selected
                    </button>
                    <button
                      onClick={() => setSelectedProducts(new Set())}
                      className="text-white/60 hover:text-white px-3 py-2 text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Product List */}
            <div className="grid gap-2">
              {products.map((product) => (
                <div key={product.id} className="bg-[#111111] border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-xs text-white/60">
                          {product.sku} • {product.category}
                          {product.assigned_blueprints && product.assigned_blueprints.length > 0 && (
                            <span className="text-green-400 ml-2">
                              {product.assigned_blueprints.length} tier(s) assigned
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="bg-white/5 border border-white/10 text-white px-3 py-1 text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleProductAssignment([product.id], e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Quick assign</option>
                        {configs.map((config) => (
                          <option key={config.id} value={config.blueprint_id}>
                            {config.blueprint?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {products.length === 0 && (
              <div className="bg-[#111111] border border-white/10 p-8 text-center">
                <Package className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No products found. Add products first to assign pricing tiers.</p>
              </div>
            )}
          </div>
        )}

        {/* Pricing Editor Modal */}
        {showEditor && editingConfig && selectedBlueprint && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#111111] border-b border-white/10 p-4 lg:p-6">
                <h2 className="text-xl font-semibold mb-2">
                  {editingConfig.id ? 'Edit' : 'Configure'} Pricing: {selectedBlueprint.name}
                </h2>
                <p className="text-white/60 text-sm">{selectedBlueprint.description}</p>
              </div>

              <div className="p-4 lg:p-6">
                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-white/80 text-sm mb-2">Notes (Optional)</label>
                  <textarea
                    value={editingConfig.notes || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, notes: e.target.value })}
                    placeholder="Add notes about your pricing strategy..."
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 text-sm min-h-[80px]"
                  />
                </div>

                {/* Price Breaks */}
                <div>
                  <label className="block text-white/80 text-sm mb-4">Configure Price Breaks</label>
                  <div className="grid gap-4">
                    {selectedBlueprint.price_breaks
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((priceBreak) => {
                        const value = editingConfig.pricing_values?.[priceBreak.break_id] || 
                                     { price: '', discount_percent: '', enabled: false };

                        return (
                          <div key={priceBreak.break_id} className="bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <input
                                    type="checkbox"
                                    checked={value.enabled}
                                    onChange={(e) => updatePricingValue(priceBreak.break_id, 'enabled', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                  <label className="font-medium">{priceBreak.label}</label>
                                  {priceBreak.qty && (
                                    <span className="text-xs text-white/60">
                                      ({priceBreak.qty}{priceBreak.unit})
                                    </span>
                                  )}
                                </div>

                                {value.enabled && (
                                  <div className="grid grid-cols-2 gap-3 ml-7">
                                    <div>
                                      <label className="block text-xs text-white/60 mb-1">Price</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={value.price || ''}
                                          onChange={(e) => updatePricingValue(priceBreak.break_id, 'price', e.target.value)}
                                          placeholder="0.00"
                                          className="w-full bg-white/5 border border-white/10 text-white pl-7 pr-3 py-2 text-sm"
                                        />
                                      </div>
                                    </div>

                                    {selectedBlueprint.tier_type === 'quantity' && (
                                      <div>
                                        <label className="block text-xs text-white/60 mb-1">Discount %</label>
                                        <input
                                          type="number"
                                          step="1"
                                          value={value.discount_percent || ''}
                                          onChange={(e) => updatePricingValue(priceBreak.break_id, 'discount_percent', e.target.value)}
                                          placeholder="0"
                                          className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Active Status */}
                <div className="mt-6">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingConfig.is_active}
                      onChange={(e) => setEditingConfig({ ...editingConfig, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-white/80 text-sm">Active Configuration</span>
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-[#111111] border-t border-white/10 p-4 lg:p-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingConfig(null);
                    setSelectedBlueprint(null);
                  }}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-6 py-2 bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}