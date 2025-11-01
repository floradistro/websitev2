"use client";

import { useState, useEffect } from 'react';
import { X, Save, Trash2, ImageIcon, DollarSign, AlertCircle, Package, FileText } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'fields' | 'images' | 'coas'>('basic');
  const [availableBlueprints, setAvailableBlueprints] = useState<any[]>([]);
  const [selectedBlueprintIds, setSelectedBlueprintIds] = useState<string[]>([]);
  const [originalBlueprintIds, setOriginalBlueprintIds] = useState<string[]>([]);
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [editedBlueprintFields, setEditedBlueprintFields] = useState<Record<string, string>>({});

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
            console.log('Images:', loadedProduct.images);
            console.log('COAs:', loadedProduct.coas);
            console.log('Blueprint fields:', loadedProduct.custom_fields);
            setFullProduct(loadedProduct);
            setEditedProduct({
              name: loadedProduct.name || '',
              sku: loadedProduct.sku || '',
              category: loadedProduct.category || '',
              regular_price: loadedProduct.regular_price || loadedProduct.price || 0,
              cost_price: loadedProduct.cost_price || 0,
              description: loadedProduct.description || ''
            });

            // Load available pricing blueprints (filtered by category)
            try {
              const blueprintsRes = await axios.get(`/api/vendor/pricing-config?vendor_id=${vendorId}`);
              if (blueprintsRes.data.success) {
                const allBlueprints = blueprintsRes.data.configs
                  .filter((config: any) => config.blueprint && config.is_active)
                  .map((config: any) => config.blueprint);

                // Filter blueprints by product category
                const filteredBlueprints = allBlueprints.filter((bp: any) => {
                  // If blueprint has no category restrictions, show it for all products
                  if (!bp.applicable_to_categories || bp.applicable_to_categories.length === 0) {
                    return true;
                  }
                  // Otherwise, only show if this product's category is in the list
                  return bp.applicable_to_categories.includes(loadedProduct.category_id);
                });

                setAvailableBlueprints(filteredBlueprints);
              }
            } catch (err) {
              console.error('Failed to load blueprints:', err);
            }

            // Load category fields
            try {
              if (loadedProduct.category_id) {
                const fieldsRes = await axios.get(`/api/vendor/product-fields?category_id=${loadedProduct.category_id}`, {
                  headers: { 'x-vendor-id': vendorId }
                });
                if (fieldsRes.data.success) {
                  setCategoryFields(fieldsRes.data.fields || []);

                  // Initialize edited fields from product's custom_fields
                  // custom_fields is stored as an object: { field_name: value }
                  const initialFields: Record<string, string> = {};
                  const blueprintFieldsData = loadedProduct.custom_fields || {};

                  // Handle both object format (new) and array format (legacy)
                  if (Array.isArray(blueprintFieldsData)) {
                    // Legacy array format: [{ field_name: 'x', field_value: 'y' }]
                    blueprintFieldsData.forEach((bf: any) => {
                      initialFields[bf.field_name] = bf.field_value || '';
                    });
                  } else if (typeof blueprintFieldsData === 'object') {
                    // New object format: { field_name: value }
                    Object.entries(blueprintFieldsData).forEach(([key, value]) => {
                      initialFields[key] = String(value || '');
                    });
                  }

                  setEditedBlueprintFields(initialFields);
                }
              }
            } catch (err) {
              console.error('Failed to load category fields:', err);
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
      // Build custom_fields object from edited fields (keep as object format)
      const blueprintFields: Record<string, string> = {};
      Object.entries(editedBlueprintFields).forEach(([fieldId, value]) => {
        if (value) { // Only include fields with values
          blueprintFields[fieldId] = value;
        }
      });

      const response = await axios.patch('/api/vendor/products/update', {
        product_id: product.id,
        updates: {
          ...editedProduct,
          custom_fields: blueprintFields
        }
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
          <div className="border-b border-white/5 p-6 bg-black">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Loading product details...</p>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xs uppercase tracking-[0.15em] text-white mb-2 font-black" style={{ fontWeight: 900 }}>{displayProduct.name}</h2>
                  <div className="flex items-center gap-3 text-[9px] text-white/40 uppercase tracking-[0.15em]">
                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400/80 rounded text-[8px]">
                      {displayProduct.status}
                    </span>
                    {displayProduct.sku && <span>SKU: {displayProduct.sku}</span>}
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1">
                      <Package size={10} />
                      {displayProduct.total_stock?.toFixed(2) || displayProduct.stock_quantity?.toFixed(2) || '0.00'}g in stock
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors p-2 ml-4"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-white/5 bg-black">
            <div className="flex items-center gap-1 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'basic'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
                style={{ fontWeight: 900 }}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'pricing'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
                style={{ fontWeight: 900 }}
              >
                Pricing
              </button>
              <button
                onClick={() => setActiveTab('fields')}
                className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'fields'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
                style={{ fontWeight: 900 }}
              >
                Fields
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'images'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
                style={{ fontWeight: 900 }}
              >
                Images
              </button>
              <button
                onClick={() => setActiveTab('coas')}
                className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'coas'
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
                style={{ fontWeight: 900 }}
              >
                Lab Results
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
                        { key: 'retail', label: 'Retail' },
                        { key: 'wholesale', label: 'Wholesale' },
                        { key: 'distributor', label: 'Distributor' }
                      ];

                      return masterGroups.map(mg => {
                        const groupBlueprints = grouped[mg.key] || [];
                        if (groupBlueprints.length === 0) return null;

                        return (
                          <div key={mg.key} className="mb-4 last:mb-0">
                            <div className="mb-3">
                              <h5 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">{mg.label}</h5>
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

            {activeTab === 'fields' && (
              <div className="space-y-6">
                {/* Custom Fields */}
                {categoryFields.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-white/60" />
                        <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Custom Fields</h4>
                      </div>
                      <span className="text-white/30 text-[10px]">{categoryFields.length} fields • {displayProduct.category}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {categoryFields.map((field: any) => {
                        const fieldId = field.fieldId || field.field_id;
                        const fieldLabel = field.label || fieldId;
                        const fieldValue = editedBlueprintFields[fieldId] || '';
                        const fieldDef = field.definition || field;
                        const fieldType = fieldDef.type || 'text';

                        return (
                          <div key={fieldId} className="space-y-2">
                            <label className="block text-white/40 text-[10px] uppercase tracking-wider">
                              {fieldLabel}
                              {fieldDef.required && <span className="text-red-400 ml-1">*</span>}
                            </label>

                            {fieldType === 'select' && fieldDef.options ? (
                              <select
                                value={fieldValue}
                                onChange={(e) => setEditedBlueprintFields(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value
                                }))}
                                className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                              >
                                <option value="">Select...</option>
                                {fieldDef.options.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : fieldType === 'textarea' ? (
                              <textarea
                                value={fieldValue}
                                onChange={(e) => setEditedBlueprintFields(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value
                                }))}
                                placeholder={fieldDef.placeholder || ''}
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all resize-none"
                              />
                            ) : fieldType === 'number' ? (
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={fieldValue}
                                  onChange={(e) => setEditedBlueprintFields(prev => ({
                                    ...prev,
                                    [fieldId]: e.target.value
                                  }))}
                                  placeholder={fieldDef.placeholder || ''}
                                  className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                                />
                                {fieldDef.suffix && (
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                                    {fieldDef.suffix}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={fieldValue}
                                onChange={(e) => setEditedBlueprintFields(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value
                                }))}
                                placeholder={fieldDef.placeholder || ''}
                                className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-[14px] focus:outline-none focus:border-white/30 transition-all"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No custom fields configured</p>
                    <p className="text-white/30 text-xs mt-2">Go to Categories tab to add custom fields for {displayProduct.category}</p>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-white/60" />
                    <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Product Images</h4>
                  </div>
                  <a
                    href="/vendor/media-library"
                    target="_blank"
                    className="px-3 py-2 bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all rounded-xl text-[10px] uppercase tracking-[0.15em] font-black"
                    style={{ fontWeight: 900 }}
                  >
                    Media Library
                  </a>
                </div>

                {!displayProduct.images || displayProduct.images.length === 0 ? (
                  <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                    <ImageIcon size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white text-xs uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>No images uploaded</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-6">Add product photos from your media library</p>
                    <a
                      href="/vendor/media-library"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-all"
                      style={{ fontWeight: 900 }}
                    >
                      Upload Images
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayProduct.images.map((img: string, idx: number) => (
                      <div key={idx} className="aspect-square bg-white/5 border border-white/5 rounded-xl overflow-hidden relative group">
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="p-2 bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-[8px] uppercase tracking-wider font-black">Featured</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'coas' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-white/60" />
                    <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Lab Results & COAs</h4>
                  </div>
                  <button
                    className="px-3 py-2 bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all rounded-xl text-[10px] uppercase tracking-[0.15em] font-black"
                    style={{ fontWeight: 900 }}
                  >
                    Upload COA
                  </button>
                </div>

                {!displayProduct.coas || displayProduct.coas.length === 0 ? (
                  <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                    <FileText size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white text-xs uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>No lab results uploaded</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-6">Upload certificates of analysis for this product</p>
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-all"
                      style={{ fontWeight: 900 }}
                    >
                      Upload COA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayProduct.coas.map((coa: any) => (
                      <div key={coa.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="text-white text-xs uppercase tracking-tight font-black" style={{ fontWeight: 900 }}>
                                {coa.file_name}
                              </h5>
                              {coa.is_verified && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400/80 rounded text-[8px] uppercase tracking-wider font-black">
                                  Verified
                                </span>
                              )}
                            </div>
                            {coa.lab_name && (
                              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                                Lab: {coa.lab_name}
                              </p>
                            )}
                            {coa.test_date && (
                              <p className="text-white/30 text-[9px] uppercase tracking-wider">
                                Test Date: {new Date(coa.test_date).toLocaleDateString()}
                              </p>
                            )}
                            {coa.batch_number && (
                              <p className="text-white/30 text-[9px] uppercase tracking-wider">
                                Batch: {coa.batch_number}
                              </p>
                            )}
                            {coa.test_results && (
                              <div className="mt-3 grid grid-cols-3 gap-3">
                                {Object.entries(coa.test_results).map(([key, value]: [string, any]) => (
                                  <div key={key}>
                                    <div className="text-white/40 text-[8px] uppercase tracking-wider mb-0.5">
                                      {key.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-white text-xs font-medium">{value}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {coa.file_url && (
                              <a
                                href={coa.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all rounded-lg"
                              >
                                <FileText size={16} />
                              </a>
                            )}
                            <button className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 p-6 bg-black flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="px-4 py-3 bg-black/40 border border-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all rounded-xl text-[10px] uppercase tracking-[0.15em] font-black flex items-center gap-2"
              style={{ fontWeight: 900 }}
            >
              <Trash2 size={12} />
              Delete Product
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-black/20 border border-white/5 text-white/60 hover:bg-white/5 hover:text-white transition-colors rounded-xl text-[10px] uppercase tracking-[0.15em] font-black"
                style={{ fontWeight: 900 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl text-[10px] uppercase tracking-[0.15em] font-black flex items-center gap-2"
                style={{ fontWeight: 900 }}
              >
                <Save size={12} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
