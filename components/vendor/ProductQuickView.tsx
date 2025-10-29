"use client";

import { useState, useEffect } from 'react';
import { X, Save, Trash2, ImageIcon, DollarSign, FileText, AlertCircle, Package } from 'lucide-react';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import axios from 'axios';

interface ProductQuickViewProps {
  product: any;
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function ProductQuickView({ product, vendorId, isOpen, onClose, onSave, onDelete }: ProductQuickViewProps) {
  const [fullProduct, setFullProduct] = useState<any>(null);
  const [editedProduct, setEditedProduct] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'details'>('basic');
  const [availableBlueprints, setAvailableBlueprints] = useState<any[]>([]);
  const [selectedBlueprintIds, setSelectedBlueprintIds] = useState<string[]>([]);
  const [originalBlueprintIds, setOriginalBlueprintIds] = useState<string[]>([]);

  // Load full product details when modal opens
  useEffect(() => {
    const loadFullProduct = async () => {
      if (isOpen && product?.id) {
        setLoading(true);
        try {
          const response = await axios.get(`/api/vendor/products/${product.id}`, {
            headers: { 'x-vendor-id': vendorId }
          });

          if (response.data.success) {
            const loadedProduct = response.data.product;
            console.log('Loaded product:', loadedProduct);
            console.log('Pricing tiers:', loadedProduct.pricing_tiers);
            console.log('Custom fields:', loadedProduct.custom_fields);
            setFullProduct(loadedProduct);
            setEditedProduct({
              name: loadedProduct.name || '',
              sku: loadedProduct.sku || '',
              category: loadedProduct.category || '',
              regular_price: loadedProduct.regular_price || loadedProduct.price || 0,
              cost_price: loadedProduct.cost_price || 0,
              description: loadedProduct.description || ''
            });

            // Load available pricing blueprints
            try {
              const blueprintsRes = await axios.get(`/api/vendor/pricing-config?vendor_id=${vendorId}`);
              if (blueprintsRes.data.success) {
                const allBlueprints = blueprintsRes.data.configs
                  .filter((config: any) => config.blueprint && config.is_active)
                  .map((config: any) => config.blueprint);
                setAvailableBlueprints(allBlueprints);
              }
            } catch (err) {
              console.error('Failed to load blueprints:', err);
            }

            // Load current pricing tier assignments
            try {
              console.log('🔍 Loading pricing assignments for product:', product.id);
              const assignmentsRes = await axios.get(`/api/vendor/product-pricing?product_id=${product.id}`);
              console.log('📦 Assignments response:', assignmentsRes.data);
              if (assignmentsRes.data.success && assignmentsRes.data.assignments) {
                const assignedIds = assignmentsRes.data.assignments
                  .filter((a: any) => a.is_active)
                  .map((a: any) => a.blueprint_id);
                console.log('✅ Loaded assigned blueprint IDs:', assignedIds);
                setSelectedBlueprintIds(assignedIds);
                setOriginalBlueprintIds(assignedIds); // Track original state
              } else {
                console.log('ℹ️ No assignments found, setting empty array');
                setSelectedBlueprintIds([]);
                setOriginalBlueprintIds([]);
              }
            } catch (err) {
              console.error('❌ Failed to load assignments (non-blocking):', err);
              setSelectedBlueprintIds([]);
            }
          }
        } catch (error) {
          console.error('Failed to load product details:', error);
          showNotification({
            type: 'error',
            title: 'Load Failed',
            message: 'Failed to load product details'
          });
        } finally {
          setLoading(false);
        }
        setActiveTab('basic');
      }
    };

    loadFullProduct();
  }, [isOpen, product?.id, vendorId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.patch('/api/vendor/products/update', {
        product_id: product.id,
        updates: editedProduct
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        // Save pricing tier assignments
        console.log('💾 Saving pricing tier assignments:', selectedBlueprintIds);
        console.log('📋 Original assignments:', originalBlueprintIds);

        // Find removed assignments (were selected, now unselected)
        const removedIds = originalBlueprintIds.filter(id => !selectedBlueprintIds.includes(id));
        console.log('🗑️ Removed assignments:', removedIds);

        // Find added assignments (newly selected)
        const addedIds = selectedBlueprintIds.filter(id => !originalBlueprintIds.includes(id));
        console.log('➕ Added assignments:', addedIds);

        try {
          // Remove unassigned tiers
          for (const blueprintId of removedIds) {
            console.log('🗑️ Removing assignment for blueprint:', blueprintId);
            await axios.delete(`/api/vendor/product-pricing?product_id=${product.id}&blueprint_id=${blueprintId}`);
            console.log('✅ Assignment removed');
          }

          // Add new assignments
          for (const blueprintId of addedIds) {
            console.log('📤 Adding assignment for blueprint:', blueprintId);
            const res = await axios.post('/api/vendor/product-pricing', {
              vendor_id: vendorId,
              product_ids: [product.id],
              blueprint_id: blueprintId,
              price_overrides: {}
            });
            console.log('✅ Assignment added:', res.data);
          }
        } catch (pricingError) {
          console.error('❌ Error saving pricing assignments:', pricingError);
        }

        showNotification({
          type: 'success',
          title: 'Saved',
          message: 'Product updated successfully'
        });
        onSave();
        onClose();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed',
        message: error.response?.data?.error || 'Failed to save product'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This will remove it from all locations.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/vendor/products?product_id=${product.id}`, {
            headers: { 'x-vendor-id': vendorId }
          });

          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'Deleted',
              message: 'Product deleted successfully'
            });
            onDelete();
            onClose();
          }
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete product'
          });
        }
      }
    });
  };

  if (!isOpen) return null;

  const displayProduct = fullProduct || product;
  const margin = displayProduct.cost_price && displayProduct.price
    ? ((displayProduct.price - displayProduct.cost_price) / displayProduct.price * 100).toFixed(1)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
        style={{ animation: 'fade-in 0.2s ease-out' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-4xl bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          style={{
            animation: 'fade-in 0.3s ease-out',
            boxShadow: '0 0 60px rgba(255,255,255,0.05)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/10 p-6 bg-white/[0.02]">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/60 text-sm">Loading product details...</p>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-light text-white mb-2 tracking-tight">{displayProduct.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-white/60 rounded-[8px]">
                      {displayProduct.status}
                    </span>
                    {displayProduct.sku && <span>SKU: {displayProduct.sku}</span>}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Package size={12} />
                      {displayProduct.total_stock?.toFixed(2) || displayProduct.stock_quantity?.toFixed(2) || '0.00'}g in stock
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors p-2 ml-4"
                >
                  <X size={24} />
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10 bg-white/[0.01]">
            <div className="flex items-center gap-1 px-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 text-xs uppercase tracking-wider font-medium transition-all border-b-2 ${
                  activeTab === 'basic'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-3 text-xs uppercase tracking-wider font-medium transition-all border-b-2 ${
                  activeTab === 'pricing'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-xs uppercase tracking-wider font-medium transition-all border-b-2 ${
                  activeTab === 'details'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                Details
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div>
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Product Name</label>
                    <input
                      type="text"
                      value={editedProduct.name || ''}
                      onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">SKU</label>
                    <input
                      type="text"
                      value={editedProduct.sku || ''}
                      onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, sku: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    value={editedProduct.category || ''}
                    onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={editedProduct.description || ''}
                    onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all resize-none"
                    placeholder="Describe this product..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Retail Price ($/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.regular_price || ''}
                      onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Cost Price ($/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.cost_price || ''}
                      onChange={(e) => setEditedProduct((prev: any) => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                </div>

                {/* Margin Display */}
                {margin && (
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[14px]">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Profit Margin</div>
                        <div className="text-3xl font-light text-white">{margin}%</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Profit per Gram</div>
                        <div className="text-2xl font-light text-white">
                          ${((editedProduct.regular_price || 0) - (editedProduct.cost_price || 0)).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Potential Revenue</div>
                        <div className="text-2xl font-light text-white">
                          ${((editedProduct.regular_price || 0) * (displayProduct.total_stock || displayProduct.stock_quantity || 0)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assign Pricing Tiers */}
                {availableBlueprints.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign size={16} className="text-white/60" />
                      <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Assign Pricing Tiers</h4>
                    </div>

                    {(() => {
                      const grouped: Record<string, any[]> = {};
                      availableBlueprints.forEach(bp => {
                        const ctx = bp.context || 'retail';
                        if (!grouped[ctx]) grouped[ctx] = [];
                        grouped[ctx].push(bp);
                      });

                      const masterGroups = [
                        { key: 'retail', label: 'Retail', icon: '🛍️' },
                        { key: 'wholesale', label: 'Wholesale', icon: '📦' },
                        { key: 'distributor', label: 'Distributor', icon: '🚚' }
                      ];

                      return masterGroups.map(mg => {
                        const groupBlueprints = grouped[mg.key] || [];
                        if (groupBlueprints.length === 0) return null;

                        return (
                          <div key={mg.key} className="mb-4 last:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">{mg.icon}</span>
                              <h5 className="text-white/60 text-xs font-medium uppercase">{mg.label}</h5>
                            </div>

                            <div className="space-y-2 pl-4">
                              {groupBlueprints.map(blueprint => {
                                const isSelected = selectedBlueprintIds.includes(blueprint.id);

                                return (
                                  <label
                                    key={blueprint.id}
                                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-white/10 border-white/30'
                                        : 'bg-white/5 border-white/10 hover:bg-white/8'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          console.log('✓ Adding blueprint:', blueprint.name, blueprint.id);
                                          setSelectedBlueprintIds([...selectedBlueprintIds, blueprint.id]);
                                        } else {
                                          console.log('✗ Removing blueprint:', blueprint.name, blueprint.id);
                                          setSelectedBlueprintIds(selectedBlueprintIds.filter(id => id !== blueprint.id));
                                        }
                                      }}
                                      className="w-4 h-4 mt-0.5 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                      <div className="text-white text-xs font-medium">{blueprint.name}</div>
                                      {blueprint.description && (
                                        <div className="text-white/40 text-[10px] mt-0.5">{blueprint.description}</div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    <div className="mt-3 pt-3 border-t border-white/10 text-white/40 text-[10px]">
                      {selectedBlueprintIds.length === 0
                        ? 'No tiers selected'
                        : `${selectedBlueprintIds.length} tier${selectedBlueprintIds.length === 1 ? '' : 's'} selected`
                      }
                    </div>
                  </div>
                )}

                {/* Volume Pricing Tiers */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={16} className="text-white/60" />
                    <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Volume Pricing</h4>
                  </div>
                  {displayProduct.pricing_tiers && displayProduct.pricing_tiers.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {displayProduct.pricing_tiers.map((tier: any, idx: number) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-[12px]">
                          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">{tier.label || tier.tier_name || 'Tier'}</div>
                          <div className="text-white text-xl font-medium">${parseFloat(tier.price).toFixed(2)}</div>
                          {(tier.min_quantity || tier.quantity) && (
                            <div className="text-white/40 text-xs mt-1">
                              {tier.min_quantity || tier.quantity}{tier.max_quantity ? `-${tier.max_quantity}` : '+'} {tier.unit || 'g'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/[0.02] border border-white/5 rounded-[14px]">
                      <DollarSign size={32} className="text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No volume pricing configured</p>
                      <p className="text-white/30 text-xs mt-1">Edit this product to add pricing tiers</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Custom Fields */}
                {displayProduct.custom_fields && Object.keys(displayProduct.custom_fields).length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText size={16} className="text-white/60" />
                      <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Custom Fields</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(displayProduct.custom_fields).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-white/5 border border-white/10 p-4 rounded-[12px]">
                          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-white text-sm">{value || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No custom fields configured</p>
                  </div>
                )}

                {/* Images */}
                {displayProduct.images && displayProduct.images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon size={16} className="text-white/60" />
                      <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Product Images</h4>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {displayProduct.images.map((img: string, idx: number) => (
                        <div key={idx} className="aspect-square bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
                          <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-6 bg-white/[0.02] flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="px-4 py-3 bg-black/40 border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70 transition-all rounded-[14px] text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Product
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-white/60 hover:text-white transition-colors text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-[14px] text-sm uppercase tracking-wider flex items-center gap-2 font-medium"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
