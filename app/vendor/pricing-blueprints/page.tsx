"use client";

import { useState, useEffect } from 'react';
import {
  Sparkles, Plus, Edit2, Trash2, DollarSign
} from 'lucide-react';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import axios from 'axios';

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
  quality_tier: string | null;
  context: string;
  price_breaks: PriceBreak[];
  vendor_id: string | null;
  parent_template_id: string | null;
  variation_name: string | null;
  is_template_root: boolean;
  template_description: string | null;
  applicable_to_categories?: string[];
  variations?: Blueprint[];
}

interface BlueprintsData {
  blueprints: Blueprint[];
}

export default function PricingBlueprintsPage() {
  const { vendor, isAuthenticated } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Blueprint | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prices: {} as Record<string, string>
  });

  useEffect(() => {
    if (isAuthenticated && vendor) {
      loadBlueprints();
    }
  }, [isAuthenticated, vendor]);

  const loadBlueprints = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vendor/pricing-blueprints', {
        headers: { 'x-vendor-id': vendor?.id }
      });

      if (response.data.success) {
        setBlueprints(response.data.blueprints || []);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load pricing blueprints'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      prices: {}
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedTemplate(null);
    setFormData({ name: '', description: '', prices: {} });
  };


  const contextInfo: Record<string, { label: string; icon: string; color: string; description: string }> = {
    retail: {
      label: 'Retail',
      icon: '🏪',
      color: '#3b82f6',
      description: 'Direct-to-consumer pricing for in-store and online sales'
    },
    wholesale: {
      label: 'Wholesale',
      icon: '📦',
      color: '#8b5cf6',
      description: 'Bulk pricing for business customers and resellers'
    },
    distributor: {
      label: 'Distributor',
      icon: '🚚',
      color: '#10b981',
      description: 'Large volume pricing for distribution partners'
    },
    delivery: {
      label: 'Delivery',
      icon: '🚗',
      color: '#f59e0b',
      description: 'Delivery service pricing'
    }
  };

  const qualityTierInfo: Record<string, { label: string; badge: string; order: number }> = {
    exotic: { label: 'Exotic', badge: '💎', order: 1 },
    'top-shelf': { label: 'Top Shelf', badge: '⭐', order: 2 },
    premium: { label: 'Premium', badge: '✨', order: 3 },
    'mid-shelf': { label: 'Mid Shelf', badge: '🌟', order: 4 },
    standard: { label: 'Standard', badge: '📌', order: 5 },
    value: { label: 'Value', badge: '💰', order: 6 },
    deals: { label: 'Deals', badge: '🔥', order: 7 }
  };

  const tierTypeInfo: Record<string, { label: string; color: string }> = {
    weight: { label: 'Weight-Based', color: '#3b82f6' },
    quantity: { label: 'Quantity-Based', color: '#10b981' },
    percentage: { label: 'Percentage', color: '#f59e0b' },
    flat: { label: 'Flat Rate', color: '#ef4444' },
    custom: { label: 'Custom', color: '#8b5cf6' }
  };

  // Helper to extract quality tier from blueprint name
  const extractQualityTier = (blueprint: Blueprint): string | null => {
    const name = blueprint.name.toLowerCase();
    if (name.includes('exotic')) return 'exotic';
    if (name.includes('top shelf')) return 'top-shelf';
    if (name.includes('premium')) return 'premium';
    if (name.includes('mid shelf')) return 'mid-shelf';
    if (name.includes('deals') || name.includes('value')) return 'deals';
    return null;
  };

  // Group blueprints by context
  const groupedBlueprints = blueprints.reduce((acc, blueprint) => {
    const context = blueprint.context || 'other';
    if (!acc[context]) acc[context] = [];
    acc[context].push(blueprint);
    return acc;
  }, {} as Record<string, Blueprint[]>);

  // Sort blueprints within each context by quality tier
  Object.keys(groupedBlueprints).forEach(context => {
    groupedBlueprints[context].sort((a, b) => {
      const tierA = extractQualityTier(a);
      const tierB = extractQualityTier(b);
      if (!tierA && !tierB) return 0;
      if (!tierA) return 1;
      if (!tierB) return -1;
      const orderA = qualityTierInfo[tierA]?.order || 999;
      const orderB = qualityTierInfo[tierB]?.order || 999;
      return orderA - orderB;
    });
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Please sign in to manage pricing</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-black tracking-tight" style={{ fontWeight: 900 }}>
            Pricing Blueprints
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your custom pricing structures
          </p>
        </div>
        <button
          onClick={handleCreateCustom}
          className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create New
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/60">Loading pricing blueprints...</div>
        </div>
      ) : blueprints.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <DollarSign size={48} className="mx-auto mb-4 text-white/20" />
          <div className="text-white/60 mb-2">No pricing blueprints yet</div>
          <p className="text-white/40 text-sm mb-4">
            Create your first pricing structure to get started
          </p>
          <button
            onClick={handleCreateCustom}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create First Blueprint
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBlueprints)
            .sort(([a], [b]) => {
              const order = ['retail', 'wholesale', 'distributor', 'delivery'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([context, contextBlueprints]) => {
              const info = contextInfo[context] || {
                label: context,
                icon: '📊',
                color: '#666',
                description: 'Pricing rules'
              };

              return (
                <div key={context}>
                  {/* Context Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                      style={{
                        backgroundColor: `${info.color}15`,
                        border: `2px solid ${info.color}30`
                      }}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2
                          className="text-xl font-black tracking-tight"
                          style={{
                            fontWeight: 900,
                            color: info.color
                          }}
                        >
                          {info.label}
                        </h2>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs font-bold">
                          {contextBlueprints.length} {contextBlueprints.length === 1 ? 'tier' : 'tiers'}
                        </span>
                      </div>
                      <p className="text-white/40 text-sm mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>

                  {/* Blueprints Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pl-[72px]">
                    {contextBlueprints.map((blueprint) => {
                      const tierType = tierTypeInfo[blueprint.tier_type];
                      const qualityTier = extractQualityTier(blueprint);
                      const qualityInfo = qualityTier ? qualityTierInfo[qualityTier] : null;

                      return (
                        <div
                          key={blueprint.id}
                          className="bg-gradient-to-br from-white/[0.07] to-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all group hover:shadow-xl"
                          style={{
                            borderLeftWidth: '3px',
                            borderLeftColor: info.color
                          }}
                        >
                          {/* Blueprint Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {qualityInfo && (
                                  <span className="text-lg">{qualityInfo.badge}</span>
                                )}
                                <div className="flex-1">
                                  <h3 className="text-white font-black text-base tracking-tight leading-tight" style={{ fontWeight: 900 }}>
                                    {blueprint.name.replace(' (Custom)', '')}
                                  </h3>
                                  {blueprint.description && (
                                    <p className="text-white/40 text-[10px] mt-0.5 line-clamp-1">
                                      {blueprint.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {qualityInfo && (
                                  <span
                                    className="px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider font-black"
                                    style={{
                                      backgroundColor: `${info.color}20`,
                                      color: info.color,
                                      fontWeight: 900
                                    }}
                                  >
                                    {qualityInfo.label}
                                  </span>
                                )}
                                <span
                                  className="px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider font-black"
                                  style={{
                                    backgroundColor: `${tierType.color}15`,
                                    color: tierType.color,
                                    fontWeight: 900
                                  }}
                                >
                                  {tierType.label}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 ml-2">
                              <button
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Edit"
                              >
                                <Edit2 size={14} className="text-white/60" />
                              </button>
                              <button
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          </div>

                          {/* Price Breaks */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">
                                Price Points
                              </span>
                              <span className="text-white/60 text-xs font-bold">
                                {blueprint.price_breaks.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {blueprint.price_breaks.slice(0, 4).map((priceBreak) => (
                                <div
                                  key={priceBreak.break_id}
                                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg"
                                >
                                  <div className="text-white/70 text-[11px] font-bold">
                                    {priceBreak.label}
                                  </div>
                                </div>
                              ))}
                              {blueprint.price_breaks.length > 4 && (
                                <div className="px-2.5 py-1 bg-white/5 rounded-lg">
                                  <div className="text-white/40 text-[11px] font-bold">
                                    +{blueprint.price_breaks.length - 4}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Create Modal - Coming Soon */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/20 rounded-3xl p-8 max-w-2xl w-full">
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto mb-4 text-blue-400" />
              <h2 className="text-white text-2xl font-black mb-4" style={{ fontWeight: 900 }}>
                Custom Pricing Builder Coming Soon
              </h2>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                We're building a powerful pricing blueprint creator. For now, you can use the pricing structures migrated from your previous configuration.
              </p>
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
