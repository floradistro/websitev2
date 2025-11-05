'use client';

/**
 * ProductQuickView - Comprehensive Product Editor Modal
 * Full-featured inline editing without needing separate page
 * Includes: Basic Info, Pricing Tiers, Blueprints, Images, Custom Fields
 */

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Sparkles, Image as ImageIcon, DollarSign, Layers } from 'lucide-react';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { Button, Input, Textarea, Modal, ds, cn } from '@/components/ds';
import PricingPanel from '@/app/vendor/products/new/components/PricingPanel';
import axios from 'axios';
import type { PricingBlueprint, PricingTier } from '@/lib/types/product';

interface ProductQuickViewProps {
  product: any;
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function ProductQuickView({ product, vendorId, isOpen, onClose, onSave, onDelete }: ProductQuickViewProps) {
  const [editedProduct, setEditedProduct] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'images' | 'fields'>('basic');

  // Pricing state
  const [pricingMode, setPricingMode] = useState<'single' | 'tiered'>('single');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [newTierWeight, setNewTierWeight] = useState('');
  const [newTierQty, setNewTierQty] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [availableBlueprints, setAvailableBlueprints] = useState<PricingBlueprint[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState('');

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen && product?.id) {
      setLoading(true);

      // Fetch product details
      axios.get(`/api/vendor/products/${product.id}`, {
        headers: { 'x-vendor-id': vendorId }
      })
        .then(response => {
          if (response.data.success) {
            const p = response.data.product;
            setEditedProduct({
              name: p.name || '',
              sku: p.sku || '',
              regular_price: p.regular_price || p.price || 0,
              cost_price: p.cost_price || 0,
              description: p.description || '',
              status: p.status || 'draft',
              category_id: p.category_id || ''
            });

            // Set custom fields
            setCustomFieldValues(p.custom_fields || {});

            // Set pricing mode from API response
            setPricingMode(p.pricing_mode || 'single');

            // Set pricing blueprint ID if present
            if (p.pricing_blueprint_id) {
              setSelectedBlueprintId(p.pricing_blueprint_id);
            }

            // Load pricing tiers if applicable
            if (p.pricing_tiers && p.pricing_tiers.length > 0) {
              setPricingTiers(p.pricing_tiers.map((tier: any) => ({
                weight: tier.label || `${tier.quantity}${tier.unit}`,
                qty: tier.quantity || tier.min_quantity || 1,
                price: tier.price?.toString() || '0'
              })));
            } else {
              setPricingTiers([]);
            }

            // Load images
            if (p.images && p.images.length > 0) {
              setImagePreviews(p.images);
            }

            // Fetch dynamic fields for category
            if (p.category_id) {
              axios.get(`/api/vendor/product-fields?category_id=${p.category_id}`, {
                headers: { 'x-vendor-id': vendorId }
              })
                .then(fieldsResponse => {
                  if (fieldsResponse.data.success) {
                    console.log('[ProductQuickView] Loaded fields:', fieldsResponse.data.fields.length);
                    setDynamicFields(fieldsResponse.data.fields || []);
                  }
                })
                .catch(error => {
                  console.error('Failed to fetch fields:', error);
                });
            }
          }
        })
        .catch(error => {
          showNotification({
            type: 'error',
            title: 'Load Failed',
            message: 'Failed to load product details'
          });
        })
        .finally(() => setLoading(false));

      // Fetch pricing blueprints
      axios.get('/api/vendor/pricing-blueprints', {
        headers: { 'x-vendor-id': vendorId }
      })
        .then(response => {
          if (response.data.success) {
            const blueprints = response.data.blueprints || [];
            console.log('[ProductQuickView] Fetched blueprints:', blueprints.length);
            console.log('[ProductQuickView] Product:', product);

            // Filter blueprints by product category
            const filteredBlueprints = blueprints.filter((blueprint: PricingBlueprint) => {
              const applicableCategories = blueprint.applicable_to_categories || [];

              // If no category restrictions, show it
              if (applicableCategories.length === 0) return true;

              // If product has no category, show all blueprints
              if (!product.category_id) return true;

              // Show if product's category is in the applicable list
              return applicableCategories.includes(product.category_id);
            });

            console.log('[ProductQuickView] Filtered blueprints:', filteredBlueprints.length, filteredBlueprints.map(b => b.name));
            setAvailableBlueprints(filteredBlueprints);
          }
        })
        .catch(error => {
          console.error('Failed to fetch blueprints:', error);
        });
    }
  }, [isOpen, product?.id, vendorId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setImageFiles(prev => [...prev, ...fileArray]);

    // Generate previews
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    try {
      setUploadingImages(true);

      // Upload all files in parallel
      const uploadPromises = fileArray.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', 'product');

        const response = await fetch('/api/supabase/vendor/upload', {
          method: 'POST',
          headers: { 'x-vendor-id': vendorId },
          body: uploadFormData
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Upload failed');
        return data.file.url;
      });

      const urls = await Promise.all(uploadPromises);

      showNotification({
        type: 'success',
        title: 'Images Uploaded',
        message: `${urls.length} image(s) uploaded`,
      });
    } catch (err) {
      console.error('Failed to upload images:', err);
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: err instanceof Error ? err.message : 'Failed to upload images',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewTierChange = (field: 'weight' | 'qty' | 'price', value: string) => {
    if (field === 'weight') setNewTierWeight(value);
    else if (field === 'qty') setNewTierQty(value);
    else if (field === 'price') setNewTierPrice(value);
  };

  const handleAddTier = () => {
    if (!newTierQty || !newTierPrice) return;

    setPricingTiers([
      ...pricingTiers,
      {
        weight: newTierWeight,
        qty: parseInt(newTierQty) || 1,
        price: newTierPrice
      }
    ]);

    setNewTierWeight('');
    setNewTierQty('');
    setNewTierPrice('');
  };

  const handleUpdateTier = (index: number, field: string, value: string) => {
    setPricingTiers(pricingTiers.map((tier, i) => {
      if (i === index) {
        if (field === 'qty') return { ...tier, qty: parseInt(value) || 1 };
        return { ...tier, [field]: value };
      }
      return tier;
    }));
  };

  const handleRemoveTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const handleApplyBlueprint = async () => {
    if (!selectedBlueprintId) {
      showNotification({
        type: 'warning',
        title: 'No Blueprint Selected',
        message: 'Please select a pricing blueprint first'
      });
      return;
    }

    const blueprint = availableBlueprints.find(b => b.id === selectedBlueprintId);
    if (!blueprint) {
      showNotification({
        type: 'error',
        title: 'Blueprint Not Found',
        message: 'Selected blueprint could not be found'
      });
      return;
    }

    try {
      // Templates now store the configured prices in default_tiers
      // The API transforms default_tiers to price_breaks format with prices included
      const tiers: PricingTier[] = blueprint.price_breaks
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(priceBreak => ({
          weight: priceBreak.label,
          qty: priceBreak.qty,
          price: priceBreak.default_price?.toString() || '' // Use template's configured price
        }));

      setPricingTiers(tiers);
      setPricingMode('tiered');

      showNotification({
        type: 'success',
        title: 'Blueprint Applied',
        message: `${blueprint.name} pricing tiers loaded`
      });
    } catch (error) {
      console.error('Failed to fetch pricing config:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Apply Blueprint',
        message: 'Could not load pricing configuration'
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        ...editedProduct,
        pricing_mode: pricingMode,
        custom_fields: customFieldValues
      };

      // Add pricing data
      if (pricingMode === 'single') {
        updateData.price = parseFloat(editedProduct.regular_price);
        updateData.regular_price = parseFloat(editedProduct.regular_price);
      } else {
        updateData.pricing_tiers = pricingTiers;
      }

      // Add blueprint ID if selected
      if (selectedBlueprintId) {
        updateData.pricing_blueprint_id = selectedBlueprintId;
      }

      // Add images if uploaded
      if (imagePreviews.length > 0) {
        updateData.image_urls = imagePreviews;
      }

      const response = await axios.put(
        `/api/vendor/products/${product.id}`,
        updateData,
        { headers: { 'x-vendor-id': vendorId } }
      );

      if (response.data.success) {
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
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save product'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Product',
      message: `Delete "${product.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/vendor/products/${product.id}`, {
          headers: { 'x-vendor-id': vendorId }
        });
        showNotification({
          type: 'success',
          title: 'Deleted',
          message: 'Product deleted successfully'
        });
        onDelete();
        onClose();
      } catch (error: any) {
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: error.response?.data?.error || 'Failed to delete product'
        });
      }
    }
  };

  const hasChanges = Object.keys(editedProduct).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Product"
      size="xl"
    >
      {loading ? (
        <div className="py-12 text-center">
          <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
            Loading...
          </div>
        </div>
      ) : (
        <>
          {/* Header with status badge */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={cn(ds.typography.size.base, ds.typography.weight.medium, "text-white/90")}>
                {product.name}
              </h2>
              <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mt-0.5")}>
                SKU: {product.sku}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-full border",
              ds.typography.size.micro,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              editedProduct.status === 'published' ? 'bg-green-500/10 text-green-400/70 border-green-500/20' :
              editedProduct.status === 'pending' ? 'bg-orange-500/10 text-orange-400/70 border-orange-500/20' :
              'bg-white/5 text-white/40 border-white/10'
            )}>
              {editedProduct.status}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveSection('basic')}
              className={cn(
                "px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === 'basic'
                  ? 'border-white/60 text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              )}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveSection('pricing')}
              className={cn(
                "px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === 'pricing'
                  ? 'border-white/60 text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              )}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveSection('images')}
              className={cn(
                "px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === 'images'
                  ? 'border-white/60 text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              )}
            >
              Images
            </button>
            <button
              onClick={() => setActiveSection('fields')}
              className={cn(
                "px-4 py-2",
                ds.typography.size.micro,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "border-b-2 transition-colors",
                activeSection === 'fields'
                  ? 'border-white/60 text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              )}
            >
              Custom Fields
            </button>
          </div>

          {/* Section Content */}
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto mb-6">
            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Product Name
                  </label>
                  <Input
                    value={editedProduct.name || ''}
                    onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Description
                  </label>
                  <Textarea
                    value={editedProduct.description || ''}
                    onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                    placeholder="Product description"
                    rows={4}
                  />
                </div>

                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Status
                  </label>
                  <select
                    value={editedProduct.status || 'draft'}
                    onChange={(e) => setEditedProduct({ ...editedProduct, status: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      ds.typography.size.xs,
                      ds.colors.bg.primary,
                      ds.colors.border.default,
                      "border text-white/90",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    )}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}

            {/* Pricing Section */}
            {activeSection === 'pricing' && (
              <div>
                <PricingPanel
                  productType="simple"
                  pricingMode={pricingMode}
                  formData={{
                    price: editedProduct.regular_price?.toString() || '',
                    cost_price: editedProduct.cost_price?.toString() || ''
                  }}
                  pricingTiers={pricingTiers}
                  newTierWeight={newTierWeight}
                  newTierQty={newTierQty}
                  newTierPrice={newTierPrice}
                  selectedBlueprintId={selectedBlueprintId}
                  availableBlueprints={availableBlueprints}
                  onPricingModeChange={setPricingMode}
                  onFormDataChange={(data) => setEditedProduct({ ...editedProduct, ...data })}
                  onNewTierChange={handleNewTierChange}
                  onAddTier={handleAddTier}
                  onUpdateTier={handleUpdateTier}
                  onRemoveTier={handleRemoveTier}
                  onBlueprintSelect={setSelectedBlueprintId}
                  onApplyBlueprint={handleApplyBlueprint}
                />
              </div>
            )}

            {/* Images Section */}
            {activeSection === 'images' && (
              <div className="space-y-4">
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-3")}>
                    Product Images
                  </label>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    ds.colors.border.default,
                    "hover:border-white/30 hover:bg-white/5"
                  )}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 mb-2 text-white/40" />
                      <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                        {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Custom Fields Section */}
            {activeSection === 'fields' && (
              <div className="space-y-4">
                {dynamicFields.length > 0 ? (
                  dynamicFields.map((field: any) => {
                    const fieldKey = field.fieldId || field.slug || field.name;
                    return (
                      <div key={fieldKey}>
                        <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={customFieldValues[fieldKey] || ''}
                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [fieldKey]: e.target.value })}
                            placeholder={field.placeholder}
                            rows={3}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={customFieldValues[fieldKey] || ''}
                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [fieldKey]: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border",
                              ds.typography.size.xs,
                              ds.colors.bg.primary,
                              ds.colors.border.default,
                              "text-white/90 focus:outline-none focus:ring-2 focus:ring-white/10"
                            )}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={field.type}
                            value={customFieldValues[fieldKey] || ''}
                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [fieldKey]: e.target.value })}
                            placeholder={field.placeholder}
                          />
                        )}
                        {field.description && (
                          <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1")}>
                            {field.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                      No custom fields available for this category
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: ds.colors.border.default }}>
            <button
              onClick={handleDelete}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "text-red-400/70 hover:bg-red-500/10",
                "focus:outline-none focus:ring-2 focus:ring-red-500/50"
              )}
            >
              <Trash2 className="w-3 h-3 inline mr-1.5" />
              Delete
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.colors.text.tertiary,
                  "hover:text-white/80",
                  "focus:outline-none focus:ring-2 focus:ring-white/20"
                )}
              >
                Cancel
              </button>

              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                <Save className="w-3 h-3 mr-1.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
