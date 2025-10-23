"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface PriceBreak {
  break_id: string;
  label: string;
  qty?: number;
  unit?: string;
  min_qty?: number;
  max_qty?: number | null;
  discount_expected?: number;
  sort_order: number;
}

interface PricingBlueprint {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier_type: 'weight' | 'quantity' | 'percentage' | 'flat' | 'custom';
  price_breaks: PriceBreak[];
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  applicable_to_categories: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const TIER_TYPES = [
  { value: 'weight', label: 'Weight-Based', description: 'Pricing by weight (grams, ounces, etc.)' },
  { value: 'quantity', label: 'Quantity-Based', description: 'Pricing by unit quantity (wholesale tiers)' },
  { value: 'percentage', label: 'Percentage Discount', description: 'Discount percentage off base price' },
  { value: 'flat', label: 'Flat Discount', description: 'Fixed dollar amount off' },
  { value: 'custom', label: 'Custom', description: 'Custom pricing structure' },
];

const WEIGHT_UNITS = ['g', 'oz', 'lb', 'kg', 'mg'];

export default function AdminPricingTiers() {
  const [blueprints, setBlueprints] = useState<PricingBlueprint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<Partial<PricingBlueprint> | null>(null);
  const [expandedBlueprints, setExpandedBlueprints] = useState<Set<string>>(new Set());
  
  // Price break editor state
  const [editingBreaks, setEditingBreaks] = useState<PriceBreak[]>([]);
  const [newBreak, setNewBreak] = useState<Partial<PriceBreak>>({
    break_id: '',
    label: '',
    sort_order: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [blueprintsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/pricing-blueprints'),
        fetch('/api/supabase/categories')
      ]);
      
      if (blueprintsRes.ok) {
        const data = await blueprintsRes.json();
        setBlueprints(data.blueprints || []);
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading pricing tiers:', error);
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingBlueprint({
      name: '',
      slug: '',
      description: '',
      tier_type: 'weight',
      price_breaks: [],
      is_active: true,
      is_default: false,
      display_order: blueprints.length + 1,
      applicable_to_categories: null
    });
    setEditingBreaks([]);
    setShowBlueprintModal(true);
  }

  function openEditModal(blueprint: PricingBlueprint) {
    setEditingBlueprint(blueprint);
    setEditingBreaks([...blueprint.price_breaks]);
    setShowBlueprintModal(true);
  }

  function addPriceBreak() {
    if (!newBreak.break_id || !newBreak.label) {
      showNotification({
        type: 'warning',
        title: 'Invalid Break',
        message: 'Break ID and label are required'
      });
      return;
    }
    
    const breakToAdd: PriceBreak = {
      break_id: newBreak.break_id,
      label: newBreak.label,
      qty: newBreak.qty,
      unit: newBreak.unit,
      min_qty: newBreak.min_qty,
      max_qty: newBreak.max_qty,
      discount_expected: newBreak.discount_expected,
      sort_order: newBreak.sort_order || editingBreaks.length + 1
    };
    
    setEditingBreaks([...editingBreaks, breakToAdd]);
    setNewBreak({
      break_id: '',
      label: '',
      sort_order: editingBreaks.length + 2
    });
  }

  function removePriceBreak(index: number) {
    const updated = editingBreaks.filter((_, i) => i !== index);
    setEditingBreaks(updated);
  }

  function movePriceBreak(index: number, direction: 'up' | 'down') {
    const updated = [...editingBreaks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= updated.length) return;
    
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update sort orders
    updated.forEach((brk, idx) => {
      brk.sort_order = idx + 1;
    });
    
    setEditingBreaks(updated);
  }

  async function saveBlueprint() {
    if (!editingBlueprint?.name || !editingBlueprint?.slug) {
      showNotification({
        type: 'warning',
        title: 'Invalid Data',
        message: 'Name and slug are required'
      });
      return;
    }
    
    if (editingBreaks.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Price Breaks',
        message: 'Add at least one price break'
      });
      return;
    }
    
    try {
      const blueprintData = {
        ...editingBlueprint,
        price_breaks: editingBreaks
      };
      
      const url = editingBlueprint.id 
        ? `/api/admin/pricing-blueprints/${editingBlueprint.id}`
        : '/api/admin/pricing-blueprints';
      
      const method = editingBlueprint.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blueprintData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save blueprint');
      }
      
      showNotification({
        type: 'success',
        title: 'Blueprint Saved',
        message: `${editingBlueprint.name} saved successfully`
      });
      
      setShowBlueprintModal(false);
      loadData();
      
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save pricing blueprint'
      });
    }
  }

  async function deleteBlueprint(id: string, name: string) {
    const confirmed = await showConfirm({
      title: 'Delete Pricing Blueprint?',
      message: `Are you sure you want to delete "${name}"? This will affect all products using this blueprint.`,
      confirmText: 'Delete',
      confirmStyle: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/admin/pricing-blueprints/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete blueprint');
      }
      
      showNotification({
        type: 'success',
        title: 'Blueprint Deleted',
        message: `${name} has been deleted`
      });
      
      loadData();
      
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete pricing blueprint'
      });
    }
  }

  function toggleExpanded(id: string) {
    const newExpanded = new Set(expandedBlueprints);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedBlueprints(newExpanded);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">
            Pricing Tier Blueprints
          </h1>
          <p className="text-white/50 text-sm">
            Define pricing structures for vendors to use across products
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Blueprint</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-white/5 border border-white/10 p-4 mb-6 -mx-4 lg:mx-0">
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/90 text-sm mb-1">About Pricing Blueprints</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Blueprints define the pricing structure (1g, 3.5g, 7g, etc.). Vendors then set their own prices for each tier. 
              Changes here affect all vendors using these blueprints.
            </p>
          </div>
        </div>
      </div>

      {/* Blueprints List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mb-4"></div>
          <p className="text-white/60 text-sm">Loading pricing blueprints...</p>
        </div>
      ) : blueprints.length === 0 ? (
        <div className="text-center py-12 bg-[#111111] border border-white/10 -mx-4 lg:mx-0">
          <DollarSign size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-4">No pricing blueprints found</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs uppercase tracking-wider hover:bg-white/90"
          >
            <Plus size={16} />
            Create First Blueprint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {blueprints.map((blueprint) => (
            <div 
              key={blueprint.id} 
              className="bg-[#111111] border border-white/10 overflow-hidden -mx-4 lg:mx-0"
            >
              {/* Header */}
              <div 
                className="p-4 lg:p-6 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpanded(blueprint.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium text-lg truncate">{blueprint.name}</h3>
                      {blueprint.is_default && (
                        <span className="px-2 py-1 bg-white/10 text-white/90 text-xs uppercase tracking-wider border border-white/20">
                          Default
                        </span>
                      )}
                      {!blueprint.is_active && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs uppercase tracking-wider border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm mb-2">{blueprint.description || 'No description'}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-white/40">Type: <span className="text-white/60">{TIER_TYPES.find(t => t.value === blueprint.tier_type)?.label}</span></span>
                      <span className="text-white/20">•</span>
                      <span className="text-white/40">{blueprint.price_breaks.length} price {blueprint.price_breaks.length === 1 ? 'break' : 'breaks'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(blueprint);
                      }}
                      className="p-2 hover:bg-white/10 transition-colors"
                      title="Edit Blueprint"
                    >
                      <Edit2 size={16} className="text-white/60" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBlueprint(blueprint.id, blueprint.name);
                      }}
                      className="p-2 hover:bg-red-500/10 transition-colors"
                      title="Delete Blueprint"
                    >
                      <Trash2 size={16} className="text-red-500/60" />
                    </button>
                    {expandedBlueprints.has(blueprint.id) ? (
                      <ChevronUp size={20} className="text-white/40" />
                    ) : (
                      <ChevronDown size={20} className="text-white/40" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content - Price Breaks */}
              {expandedBlueprints.has(blueprint.id) && (
                <div className="border-t border-white/10 p-4 lg:p-6 bg-black/20">
                  <h4 className="text-white/90 text-sm uppercase tracking-wider mb-4">Price Breaks</h4>
                  <div className="space-y-2">
                    {blueprint.price_breaks.length === 0 ? (
                      <p className="text-white/40 text-sm">No price breaks defined</p>
                    ) : (
                      blueprint.price_breaks
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((brk, index) => (
                          <div key={index} className="bg-[#111111] border border-white/10 p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-white/40 text-xs">#{brk.sort_order}</span>
                                <span className="text-white font-medium">{brk.label}</span>
                                <code className="px-2 py-1 bg-white/5 text-white/70 text-xs font-mono">{brk.break_id}</code>
                              </div>
                              <div className="text-white/50 text-xs">
                                {blueprint.tier_type === 'weight' && (
                                  <span>{brk.qty}{brk.unit}</span>
                                )}
                                {blueprint.tier_type === 'quantity' && (
                                  <span>{brk.min_qty}–{brk.max_qty ? brk.max_qty : '∞'} units</span>
                                )}
                                {blueprint.tier_type === 'percentage' && brk.discount_expected && (
                                  <span>{brk.discount_expected}% discount</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Blueprint Editor Modal */}
      {showBlueprintModal && editingBlueprint && (
        <AdminModal
          isOpen={showBlueprintModal}
          onClose={() => setShowBlueprintModal(false)}
          title={editingBlueprint.id ? 'Edit Pricing Blueprint' : 'Create Pricing Blueprint'}
          size="xl"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Blueprint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBlueprint.name || ''}
                  onChange={(e) => {
                    setEditingBlueprint({
                      ...editingBlueprint,
                      name: e.target.value,
                      slug: editingBlueprint.id ? editingBlueprint.slug : generateSlug(e.target.value)
                    });
                  }}
                  placeholder="e.g., Retail Cannabis Flower"
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBlueprint.slug || ''}
                  onChange={(e) => setEditingBlueprint({ ...editingBlueprint, slug: e.target.value })}
                  placeholder="retail-cannabis-flower"
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={editingBlueprint.description || ''}
                onChange={(e) => setEditingBlueprint({ ...editingBlueprint, description: e.target.value })}
                placeholder="Describe this pricing structure..."
                rows={2}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-colors text-sm resize-none"
              />
            </div>

            {/* Tier Type */}
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Tier Type <span className="text-red-500">*</span>
              </label>
              <select
                value={editingBlueprint.tier_type || 'weight'}
                onChange={(e) => setEditingBlueprint({ ...editingBlueprint, tier_type: e.target.value as any })}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
              >
                {TIER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBlueprint.is_active !== false}
                  onChange={(e) => setEditingBlueprint({ ...editingBlueprint, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white/90 text-sm">Active</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBlueprint.is_default || false}
                  onChange={(e) => setEditingBlueprint({ ...editingBlueprint, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white/90 text-sm">Set as Default</span>
              </label>
            </div>

            {/* Price Breaks Editor */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white font-medium mb-4">Price Breaks</h3>
              
              {/* Existing Breaks */}
              <div className="space-y-2 mb-4">
                {editingBreaks.length === 0 ? (
                  <div className="text-center py-8 bg-black/20 border border-white/10">
                    <p className="text-white/40 text-sm">No price breaks added yet</p>
                  </div>
                ) : (
                  editingBreaks.map((brk, index) => (
                    <div key={index} className="bg-[#0a0a0a] border border-white/10 p-3 flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => movePriceBreak(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp size={14} className="text-white/60" />
                        </button>
                        <button
                          onClick={() => movePriceBreak(index, 'down')}
                          disabled={index === editingBreaks.length - 1}
                          className="p-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown size={14} className="text-white/60" />
                        </button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-white/40 text-xs block mb-1">Break ID</span>
                          <code className="text-white/90 font-mono text-xs">{brk.break_id}</code>
                        </div>
                        <div>
                          <span className="text-white/40 text-xs block mb-1">Label</span>
                          <span className="text-white/90 text-xs">{brk.label}</span>
                        </div>
                        {editingBlueprint.tier_type === 'weight' && (
                          <>
                            <div>
                              <span className="text-white/40 text-xs block mb-1">Quantity</span>
                              <span className="text-white/90 text-xs">{brk.qty}{brk.unit}</span>
                            </div>
                          </>
                        )}
                        {editingBlueprint.tier_type === 'quantity' && (
                          <>
                            <div>
                              <span className="text-white/40 text-xs block mb-1">Min-Max</span>
                              <span className="text-white/90 text-xs">{brk.min_qty}–{brk.max_qty || '∞'}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removePriceBreak(index)}
                        className="p-2 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} className="text-red-500/60" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Break */}
              <div className="bg-black/40 border border-white/20 p-4">
                <h4 className="text-white/90 text-sm uppercase tracking-wider mb-3">Add Price Break</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <input
                    type="text"
                    value={newBreak.break_id || ''}
                    onChange={(e) => setNewBreak({ ...newBreak, break_id: e.target.value })}
                    placeholder="Break ID (e.g., 1g)"
                    className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                  />
                  
                  <input
                    type="text"
                    value={newBreak.label || ''}
                    onChange={(e) => setNewBreak({ ...newBreak, label: e.target.value })}
                    placeholder="Label (e.g., 1 gram)"
                    className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                  />
                  
                  {editingBlueprint.tier_type === 'weight' && (
                    <>
                      <input
                        type="number"
                        step="0.1"
                        value={newBreak.qty || ''}
                        onChange={(e) => setNewBreak({ ...newBreak, qty: parseFloat(e.target.value) })}
                        placeholder="Quantity"
                        className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                      />
                      <select
                        value={newBreak.unit || 'g'}
                        onChange={(e) => setNewBreak({ ...newBreak, unit: e.target.value })}
                        className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                      >
                        {WEIGHT_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  {editingBlueprint.tier_type === 'quantity' && (
                    <>
                      <input
                        type="number"
                        value={newBreak.min_qty || ''}
                        onChange={(e) => setNewBreak({ ...newBreak, min_qty: parseInt(e.target.value) })}
                        placeholder="Min Quantity"
                        className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                      />
                      <input
                        type="number"
                        value={newBreak.max_qty || ''}
                        onChange={(e) => setNewBreak({ ...newBreak, max_qty: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Max (blank = ∞)"
                        className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                      />
                    </>
                  )}
                  
                  {editingBlueprint.tier_type === 'percentage' && (
                    <input
                      type="number"
                      value={newBreak.discount_expected || ''}
                      onChange={(e) => setNewBreak({ ...newBreak, discount_expected: parseFloat(e.target.value) })}
                      placeholder="Discount %"
                      className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>
                
                <button
                  onClick={addPriceBreak}
                  className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-white/20 transition-all"
                >
                  <Plus size={14} />
                  Add Break
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowBlueprintModal(false)}
                className="px-5 py-2.5 bg-[#111111] text-white border border-white/10 text-xs uppercase tracking-wider hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveBlueprint}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
              >
                <Save size={14} />
                Save Blueprint
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

