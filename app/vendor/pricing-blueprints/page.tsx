"use client";

import { useState, useEffect } from 'react';
import {
  Sparkles, Plus, ChevronRight, ChevronDown, Copy, Edit2, Trash2,
  Package, DollarSign, Layers
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

interface StructuredData {
  rootTemplates: Blueprint[];
  vendorBlueprints: Blueprint[];
}

export default function PricingBlueprintsPage() {
  const { vendor, isAuthenticated } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [structured, setStructured] = useState<StructuredData>({ rootTemplates: [], vendorBlueprints: [] });
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
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
        setStructured(response.data.structured);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load pricing templates'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (templateId: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  const handleUseTemplate = (template: Blueprint) => {
    setSelectedTemplate(template);

    // Pre-populate form with template info
    const defaultName = template.variation_name
      ? `My ${template.variation_name} Pricing`
      : `My ${template.name}`;

    setFormData({
      name: defaultName,
      description: '',
      prices: {}
    });

    setShowCreateModal(true);
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

  const handleSaveBlueprint = async () => {
    if (!formData.name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a name for your pricing'
      });
      return;
    }

    if (!selectedTemplate) {
      showNotification({
        type: 'error',
        title: 'No Template',
        message: 'Please select a template to continue'
      });
      return;
    }

    try {
      setSaving(true);

      // Build price_breaks with user's prices
      const priceBreaks = selectedTemplate.price_breaks.map(priceBreak => ({
        ...priceBreak,
        price: parseFloat(formData.prices[priceBreak.break_id] || '0') || 0
      }));

      const response = await axios.post('/api/vendor/pricing-blueprints', {
        name: formData.name,
        description: formData.description || null,
        tier_type: selectedTemplate.tier_type,
        quality_tier: selectedTemplate.quality_tier,
        context: selectedTemplate.context,
        price_breaks: priceBreaks,
        applicable_to_categories: selectedTemplate.applicable_to_categories || []
      }, {
        headers: { 'x-vendor-id': vendor?.id }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Pricing Created',
          message: `${formData.name} has been created successfully`
        });

        handleCloseModal();
        loadBlueprints(); // Reload to show new blueprint
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to create pricing blueprint'
      });
    } finally {
      setSaving(false);
    }
  };

  const contextIcons: Record<string, string> = {
    retail: '🏪',
    wholesale: '📦',
    delivery: '🚚'
  };

  const contextColors: Record<string, string> = {
    retail: '#3b82f6',
    wholesale: '#8b5cf6',
    delivery: '#10b981'
  };

  const tierTypeInfo: Record<string, { label: string; color: string }> = {
    weight: { label: 'Weight-Based', color: '#3b82f6' },
    quantity: { label: 'Quantity-Based', color: '#10b981' },
    percentage: { label: 'Percentage', color: '#f59e0b' },
    flat: { label: 'Flat Rate', color: '#ef4444' },
    custom: { label: 'Custom', color: '#8b5cf6' }
  };

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
            Pricing Templates
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Build custom pricing from industry templates
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/60">Loading templates...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* System Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white/90 font-bold text-lg" style={{ fontWeight: 900 }}>
                  System Templates
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  Pre-built structures from industry standards
                </p>
              </div>
              <div className="px-3 py-1.5 bg-white/5 rounded-lg">
                <span className="text-white/60 text-xs font-bold">
                  {structured.rootTemplates.length} available
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {structured.rootTemplates.map((template) => {
                const isExpanded = expandedTemplates.has(template.id);
                const hasVariations = template.variations && template.variations.length > 0;
                const contextColor = contextColors[template.context] || '#666';
                const tierType = tierTypeInfo[template.tier_type];

                return (
                  <div
                    key={template.id}
                    className="bg-gradient-to-br from-white/[0.07] to-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
                  >
                    {/* Template Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${contextColor}20` }}
                            >
                              {contextIcons[template.context] || '📊'}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-black text-base" style={{ fontWeight: 900 }}>
                                {template.name}
                              </h3>
                              <p className="text-white/60 text-xs mt-0.5">
                                {template.template_description || template.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className="px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider font-black"
                              style={{
                                backgroundColor: `${tierType.color}20`,
                                color: tierType.color,
                                fontWeight: 900
                              }}
                            >
                              {tierType.label}
                            </span>
                            <span
                              className="px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider font-black"
                              style={{
                                backgroundColor: `${contextColor}20`,
                                color: contextColor,
                                fontWeight: 900
                              }}
                            >
                              {template.context}
                            </span>
                            <span className="px-2 py-1 bg-white/5 rounded-lg text-[9px] uppercase tracking-wider text-white/60 font-black">
                              {template.price_breaks.length} Tiers
                            </span>
                          </div>

                          {/* Price Breaks Preview */}
                          <div className="flex flex-wrap gap-2">
                            {template.price_breaks.slice(0, 5).map((priceBreak) => (
                              <div
                                key={priceBreak.break_id}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
                              >
                                <div className="text-white/80 text-xs font-bold">
                                  {priceBreak.label}
                                </div>
                              </div>
                            ))}
                            {template.price_breaks.length > 5 && (
                              <div className="px-3 py-1.5 bg-white/5 rounded-lg">
                                <div className="text-white/40 text-xs">
                                  +{template.price_breaks.length - 5} more
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {hasVariations && (
                            <button
                              onClick={() => toggleTemplate(template.id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title={isExpanded ? 'Hide Variations' : 'Show Variations'}
                            >
                              {isExpanded ? (
                                <ChevronDown size={20} className="text-white/60" />
                              ) : (
                                <ChevronRight size={20} className="text-white/60" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            <Copy size={14} />
                            Use Template
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Variations */}
                    {isExpanded && hasVariations && (
                      <div className="border-t border-white/10 bg-black/20 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Layers size={16} className="text-white/60" />
                          <h4 className="text-white/80 text-sm font-bold">
                            Available Variations
                          </h4>
                          <span className="text-white/40 text-xs">
                            ({template.variations?.length} options)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {template.variations?.map((variation) => (
                            <div
                              key={variation.id}
                              className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all group"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="text-white font-bold text-sm">
                                    {variation.variation_name || variation.name}
                                  </h5>
                                  <p className="text-white/40 text-xs mt-1">
                                    {variation.template_description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-white/10 rounded text-[8px] uppercase tracking-wider text-white/60 font-black">
                                  {variation.price_breaks.length} tiers
                                </span>
                              </div>

                              <button
                                onClick={() => handleUseTemplate(variation)}
                                className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <Copy size={12} />
                                Use This
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your Custom Pricing */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white/90 font-bold text-lg" style={{ fontWeight: 900 }}>
                  Your Custom Pricing
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  Pricing structures you've created for your products
                </p>
              </div>
              <button
                onClick={handleCreateCustom}
                className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Custom
              </button>
            </div>

            {structured.vendorBlueprints.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                <DollarSign size={48} className="mx-auto mb-4 text-white/20" />
                <div className="text-white/60 mb-2">No custom pricing yet</div>
                <p className="text-white/40 text-sm mb-4">
                  Use a system template or create your own from scratch
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {structured.vendorBlueprints.map((blueprint) => {
                  const contextColor = contextColors[blueprint.context] || '#666';
                  const tierType = tierTypeInfo[blueprint.tier_type];

                  return (
                    <div
                      key={blueprint.id}
                      className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{contextIcons[blueprint.context]}</span>
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
                                backgroundColor: `${tierType.color}20`,
                                color: tierType.color,
                                fontWeight: 900
                              }}
                            >
                              {tierType.label}
                            </span>
                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] uppercase tracking-[0.15em] text-white/60 font-black" style={{ fontWeight: 900 }}>
                              {blueprint.price_breaks.length} Tiers
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-white/60" />
                          </button>
                          <button
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Price Breaks */}
                      <div className="flex flex-wrap gap-2">
                        {blueprint.price_breaks.map((priceBreak) => (
                          <div
                            key={priceBreak.break_id}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
                          >
                            <div className="text-white/80 text-xs font-bold">
                              {priceBreak.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/20 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={32} className="text-blue-400" />
                <div>
                  <h2 className="text-white text-2xl font-black" style={{ fontWeight: 900 }}>
                    {selectedTemplate
                      ? (selectedTemplate.variation_name
                        ? `Use ${selectedTemplate.variation_name}`
                        : `Use ${selectedTemplate.name}`)
                      : 'Create Custom Pricing'}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    {selectedTemplate
                      ? selectedTemplate.template_description || 'Customize this template with your pricing'
                      : 'Build a pricing structure from scratch'}
                  </p>
                </div>
              </div>

              {/* Template Info Badge */}
              {selectedTemplate && (
                <div className="flex gap-2 mb-6">
                  <span className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold">
                    {selectedTemplate.context}
                  </span>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs font-bold">
                    {selectedTemplate.price_breaks.length} price tiers
                  </span>
                </div>
              )}
            </div>

            {selectedTemplate ? (
              <>
                {/* Name & Description */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-white/80 text-sm font-bold mb-2">
                      Pricing Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., My Exotic Flower Pricing"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-bold mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add notes about when to use this pricing..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Price Breaks */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/90 font-bold">
                      Set Your Prices
                    </h3>
                    <span className="text-white/40 text-xs">
                      {selectedTemplate.price_breaks.length} price points
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTemplate.price_breaks.map((priceBreak) => (
                      <div
                        key={priceBreak.break_id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-white font-bold text-sm">
                            {priceBreak.label}
                          </label>
                          {priceBreak.qty && priceBreak.unit && (
                            <span className="text-white/40 text-xs">
                              {priceBreak.qty}{priceBreak.unit}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.prices[priceBreak.break_id] || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              prices: {
                                ...formData.prices,
                                [priceBreak.break_id]: e.target.value
                              }
                            })}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBlueprint}
                    disabled={saving || !formData.name.trim()}
                    className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Create Pricing
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 mb-4">
                  Custom pricing from scratch is coming soon!
                </p>
                <p className="text-white/40 text-sm mb-6">
                  For now, please use one of the system templates above.
                </p>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
