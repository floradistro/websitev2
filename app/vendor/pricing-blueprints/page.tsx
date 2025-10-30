"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, Globe, Lock, Save, X, GripVertical } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import PageHeader, { Button } from '@/components/dashboard/PageHeader';

interface PriceBreak {
  break_id: string;
  label: string;
  qty?: number;
  unit?: string;
  min_qty?: number;
  max_qty?: number | null;
  sort_order: number;
}

interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier_type: string;
  context: string;
  price_breaks: PriceBreak[];
  applicable_to_categories: string[];
  vendor_id: string | null;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function VendorPricingBlueprintsPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContext, setFormContext] = useState<'retail' | 'wholesale' | 'distributor'>('retail');
  const [formTierType, setFormTierType] = useState<'exotic' | 'top-shelf' | 'mid-shelf' | 'value'>('top-shelf');
  const [formPriceBreaks, setFormPriceBreaks] = useState<PriceBreak[]>([]);
  const [formCategories, setFormCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor?.id) {
      loadData();
    }
  }, [authLoading, isAuthenticated, vendor?.id]);

  async function loadData() {
    setLoading(true);
    try {
      // Load blueprints
      const blueprintsRes = await fetch('/api/vendor/pricing-blueprints', {
        headers: { 'x-vendor-id': vendor?.id || '' }
      });
      const blueprintsData = await blueprintsRes.json();
      if (blueprintsData.success) {
        setBlueprints(blueprintsData.blueprints || []);
      }

      // Load categories
      const categoriesRes = await fetch(`/api/categories?vendor_id=${vendor?.id}`);
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load pricing blueprints'
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingBlueprint(null);
    setFormName('');
    setFormDescription('');
    setFormContext('retail');
    setFormTierType('top-shelf');
    setFormPriceBreaks([
      { break_id: '1g', label: '1 Gram', qty: 1, unit: 'gram', sort_order: 1 },
      { break_id: '3.5g', label: '3.5 Grams', qty: 3.5, unit: 'gram', sort_order: 2 },
      { break_id: '7g', label: '7 Grams', qty: 7, unit: 'gram', sort_order: 3 }
    ]);
    setFormCategories([]);
    setShowCreateModal(true);
  }

  function openEditModal(blueprint: Blueprint) {
    setEditingBlueprint(blueprint);
    setFormName(blueprint.name);
    setFormDescription(blueprint.description || '');
    setFormContext(blueprint.context as any);
    setFormTierType(blueprint.tier_type as any);
    setFormPriceBreaks([...blueprint.price_breaks]);
    setFormCategories(blueprint.applicable_to_categories || []);
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setEditingBlueprint(null);
  }

  function addPriceBreak() {
    const nextOrder = formPriceBreaks.length + 1;
    const newBreak: PriceBreak = {
      break_id: `tier_${nextOrder}_${Date.now()}`,
      label: `Tier ${nextOrder}`,
      qty: nextOrder * 3.5,
      unit: 'gram',
      sort_order: nextOrder
    };
    setFormPriceBreaks([...formPriceBreaks, newBreak]);
  }

  function updatePriceBreak(index: number, updates: Partial<PriceBreak>) {
    const updated = [...formPriceBreaks];
    updated[index] = { ...updated[index], ...updates };
    setFormPriceBreaks(updated);
  }

  function removePriceBreak(index: number) {
    setFormPriceBreaks(formPriceBreaks.filter((_, i) => i !== index));
  }

  function toggleCategory(categoryId: string) {
    setFormCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter a pricing blueprint name'
      });
      return;
    }

    if (formPriceBreaks.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Price Breaks Required',
        message: 'Add at least one price tier'
      });
      return;
    }

    setSaving(true);

    try {
      const method = editingBlueprint ? 'PUT' : 'POST';
      const body = editingBlueprint
        ? {
            id: editingBlueprint.id,
            name: formName,
            description: formDescription,
            tier_type: formTierType,
            price_breaks: formPriceBreaks,
            applicable_to_categories: formCategories
          }
        : {
            name: formName,
            description: formDescription,
            tier_type: formTierType,
            context: formContext,
            price_breaks: formPriceBreaks,
            applicable_to_categories: formCategories
          };

      const res = await fetch('/api/vendor/pricing-blueprints', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor?.id || ''
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: editingBlueprint ? 'Blueprint Updated' : 'Blueprint Created',
          message: data.message || 'Pricing structure saved successfully'
        });
        closeModal();
        loadData();
      } else {
        throw new Error(data.error || 'Operation failed');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Operation Failed',
        message: error.message || 'Could not save pricing blueprint'
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(blueprint: Blueprint) {
    if (!blueprint.vendor_id) {
      showNotification({
        type: 'error',
        title: 'Cannot Delete',
        message: 'Global pricing blueprints cannot be deleted'
      });
      return;
    }

    if (!confirm(`Delete "${blueprint.name}"? This cannot be undone.`)) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/vendor/pricing-blueprints?id=${blueprint.id}`, {
        method: 'DELETE',
        headers: { 'x-vendor-id': vendor?.id || '' }
      });

      const data = await res.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Blueprint Deleted',
          message: data.message || 'Pricing blueprint deleted'
        });
        loadData();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Could not delete pricing blueprint'
      });
    } finally {
      setSaving(false);
    }
  }

  const globalBlueprints = blueprints.filter(b => !b.vendor_id);
  const customBlueprints = blueprints.filter(b => b.vendor_id);

  const contextInfo = {
    retail: { label: 'Retail', icon: '🛍️', color: 'blue' },
    wholesale: { label: 'Wholesale', icon: '📦', color: 'green' },
    distributor: { label: 'Distributor', icon: '🚚', color: 'purple' }
  };

  const tierInfo = {
    exotic: { label: 'Exotic', color: '#9333ea' },
    'top-shelf': { label: 'Top Shelf', color: '#3b82f6' },
    'mid-shelf': { label: 'Mid Shelf', color: '#10b981' },
    value: { label: 'Value', color: '#f59e0b' }
  };

  return (
    <div className="w-full px-4 lg:px-0">
      <PageHeader
        title="Pricing Blueprints"
        subtitle="Design custom pricing structures for your products"
        icon={Sparkles}
        actions={
          <Button onClick={openCreateModal}>
            <Plus size={14} strokeWidth={2.5} className="mr-1.5" />
            New Blueprint
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <div className="flex gap-1 mr-3">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em]">Loading blueprints</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom Blueprints */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-white/60" strokeWidth={2} />
              <h2 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                Your Custom Pricing
              </h2>
              <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                {customBlueprints.length} custom
              </span>
            </div>

            {customBlueprints.length === 0 ? (
              <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">✨</div>
                <div className="text-white/60 text-sm font-black uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
                  Design Your First Pricing Structure
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-6">
                  Create custom price tiers that match your business model
                </p>
                <button
                  onClick={openCreateModal}
                  className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all inline-flex items-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Create Blueprint
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {customBlueprints.map((blueprint) => {
                  const context = contextInfo[blueprint.context as keyof typeof contextInfo];
                  const tier = tierInfo[blueprint.tier_type as keyof typeof tierInfo];

                  return (
                    <div
                      key={blueprint.id}
                      className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{context.icon}</span>
                            <div>
                              <h3 className="text-white font-black text-base tracking-tight" style={{ fontWeight: 900 }}>
                                {blueprint.name}
                              </h3>
                              {blueprint.description && (
                                <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mt-0.5">
                                  {blueprint.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span
                              className="px-2 py-1 rounded-lg text-[8px] uppercase tracking-[0.15em] font-black"
                              style={{
                                backgroundColor: `${tier.color}20`,
                                color: tier.color,
                                fontWeight: 900
                              }}
                            >
                              {tier.label}
                            </span>
                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] uppercase tracking-[0.15em] text-white/60 font-black" style={{ fontWeight: 900 }}>
                              {blueprint.price_breaks.length} Tiers
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(blueprint)}
                          className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 font-black transition-all flex items-center justify-center gap-1.5"
                          style={{ fontWeight: 900 }}
                        >
                          <Edit2 size={10} strokeWidth={2.5} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(blueprint)}
                          disabled={saving}
                          className="flex-1 bg-white/5 border border-white/10 text-red-400 rounded-xl px-3 py-2 text-[9px] uppercase tracking-[0.15em] hover:bg-red-500/10 hover:border-red-500/20 font-black transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          style={{ fontWeight: 900 }}
                        >
                          <Trash2 size={10} strokeWidth={2.5} />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Global Blueprints */}
          {globalBlueprints.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-white/60" strokeWidth={2} />
                <h2 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  Global Templates
                </h2>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                  {globalBlueprints.length} available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {globalBlueprints.map((blueprint) => {
                  const context = contextInfo[blueprint.context as keyof typeof contextInfo];
                  const tier = tierInfo[blueprint.tier_type as keyof typeof tierInfo];

                  return (
                    <div
                      key={blueprint.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-60"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{context.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-xs font-black tracking-tight truncate" style={{ fontWeight: 900 }}>
                            {blueprint.name}
                          </h3>
                          <div className="flex gap-1 mt-1">
                            <span
                              className="px-1.5 py-0.5 rounded text-[7px] uppercase tracking-wider font-black"
                              style={{
                                backgroundColor: `${tier.color}20`,
                                color: tier.color,
                                fontWeight: 900
                              }}
                            >
                              {tier.label}
                            </span>
                            <span className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] uppercase tracking-wider text-white/40 font-black" style={{ fontWeight: 900 }}>
                              System
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-3xl shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
              <h2 className="text-white font-black text-lg tracking-tight" style={{ fontWeight: 900 }}>
                {editingBlueprint ? 'Edit Pricing Blueprint' : 'Create Pricing Blueprint'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white transition-all"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-2">
                    Blueprint Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Premium Flower Pricing"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-2">
                    Context *
                  </label>
                  <select
                    value={formContext}
                    onChange={(e) => setFormContext(e.target.value as any)}
                    disabled={!!editingBlueprint}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all disabled:opacity-50"
                  >
                    <option value="retail">🛍️ Retail</option>
                    <option value="wholesale">📦 Wholesale</option>
                    <option value="distributor">🚚 Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-2">
                    Tier Type *
                  </label>
                  <select
                    value={formTierType}
                    onChange={(e) => setFormTierType(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all"
                  >
                    <option value="exotic">Exotic</option>
                    <option value="top-shelf">Top Shelf</option>
                    <option value="mid-shelf">Mid Shelf</option>
                    <option value="value">Value</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Price Breaks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                    Price Tiers *
                  </label>
                  <button
                    type="button"
                    onClick={addPriceBreak}
                    className="text-white/60 hover:text-white text-[9px] uppercase tracking-[0.15em] font-black flex items-center gap-1"
                    style={{ fontWeight: 900 }}
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    Add Tier
                  </button>
                </div>

                <div className="space-y-2">
                  {formPriceBreaks.map((priceBreak, index) => (
                    <div
                      key={priceBreak.break_id}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3"
                    >
                      <GripVertical size={14} className="text-white/20" />

                      <input
                        type="text"
                        value={priceBreak.label}
                        onChange={(e) => updatePriceBreak(index, { label: e.target.value })}
                        placeholder="Label"
                        className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20"
                      />

                      <input
                        type="number"
                        value={priceBreak.qty || ''}
                        onChange={(e) => updatePriceBreak(index, { qty: parseFloat(e.target.value) || 0 })}
                        placeholder="Qty"
                        step="0.1"
                        className="w-20 bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20"
                      />

                      <select
                        value={priceBreak.unit || 'gram'}
                        onChange={(e) => updatePriceBreak(index, { unit: e.target.value })}
                        className="bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20"
                      >
                        <option value="gram">g</option>
                        <option value="ounce">oz</option>
                        <option value="pound">lb</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removePriceBreak(index)}
                        className="text-white/40 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicable Categories */}
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-3">
                  Apply to Categories (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                        formCategories.includes(category.id)
                          ? 'bg-white/20 border-2 border-white/30 text-white'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <span>{category.icon || '📦'}</span>
                      <span className="truncate">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 text-[10px] uppercase tracking-[0.15em] font-black transition-all"
                  style={{ fontWeight: 900 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName.trim() || formPriceBreaks.length === 0}
                  className="flex-1 bg-white text-black px-4 py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={12} strokeWidth={2.5} />
                      {editingBlueprint ? 'Update' : 'Create'} Blueprint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
