"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, AlertCircle, FileText, Image as ImageIcon,
  DollarSign, Package, Upload, X, Download, Trash2, Plus
} from 'lucide-react';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import axios from 'axios';
import { useAppAuth } from '@/context/AppAuthContext';

interface Product {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  cost_price: string;
  status: string;
  // Custom fields
  thc_percentage: string;
  cbd_percentage: string;
  strain_type: string;
  lineage: string;
  terpenes: string;
  effects: string;
  nose: string;
  taste: string;
}

interface COA {
  id: string;
  file_name: string;
  file_url: string;
  lab_name: string;
  test_date: string;
  batch_number: string;
  test_results: any;
  is_verified: boolean;
}

interface PricingTier {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  price: number;
  min_quantity?: number;
  max_quantity?: number;
}

interface PricingBlueprint {
  id: string;
  name: string;
  slug: string;
  description: string;
  context: string;
  tier_type: string;
  applicable_to_categories?: string[];
}

export default function ProductEditor() {
  const params = useParams();
  const router = useRouter();
  const { vendor } = useAppAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product>({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    cost_price: '',
    status: 'pending',
    thc_percentage: '',
    cbd_percentage: '',
    strain_type: '',
    lineage: '',
    terpenes: '',
    effects: '',
    nose: '',
    taste: '',
  });

  const [coas, setCoas] = useState<COA[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [availableBlueprints, setAvailableBlueprints] = useState<PricingBlueprint[]>([]);
  const [selectedBlueprintIds, setSelectedBlueprintIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'fields' | 'pricing' | 'coas' | 'images'>('basic');

  // Load product
  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const vendorId = vendor?.id;
      if (!vendorId) {
        router.push('/vendor/login');
        return;
      }

      const response = await axios.get(`/api/vendor/products/${productId}`, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        const p = response.data.product;
        
        setProduct({
          name: p.name || '',
          sku: p.sku || '',
          description: p.description || '',
          category: p.category || '',
          price: p.price ? p.price.toString() : '',
          cost_price: p.cost_price ? p.cost_price.toString() : '',
          status: p.status || 'pending',
          thc_percentage: p.custom_fields?.thc_percentage || '',
          cbd_percentage: p.custom_fields?.cbd_percentage || '',
          strain_type: p.custom_fields?.strain_type || '',
          lineage: p.custom_fields?.lineage || '',
          terpenes: p.custom_fields?.terpenes || '',
          effects: p.custom_fields?.effects || '',
          nose: p.custom_fields?.nose || '',
          taste: p.custom_fields?.taste || '',
        });

        setCoas(p.coas || []);
        setPricingTiers(p.pricing_tiers || []);
        setImages(p.images || []);

        // Load available pricing blueprints
        const blueprintsRes = await axios.get(`/api/vendor/pricing-config?vendor_id=${vendorId}`);
        if (blueprintsRes.data.success) {
          const allBlueprints = blueprintsRes.data.configs
            .filter((config: any) => config.blueprint && config.is_active)
            .map((config: any) => config.blueprint);
          setAvailableBlueprints(allBlueprints);
        }

        // Load current pricing tier assignments for this product
        const assignmentsRes = await axios.get(`/api/vendor/product-pricing?product_id=${productId}`);
        if (assignmentsRes.data.success) {
          const assignedBlueprintIds = assignmentsRes.data.assignments
            .filter((a: any) => a.is_active)
            .map((a: any) => a.blueprint_id);
          setSelectedBlueprintIds(assignedBlueprintIds);
        }
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Load error:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load product'
      });
      setLoading(false);
    }
  };

  // Save product
  const handleSave = async () => {
    try {
      setSaving(true);
      const vendorId = vendor?.id;

      // Build custom fields object (only include non-empty values)
      const customFields: any = {};
      if (product.thc_percentage) customFields.thc_percentage = product.thc_percentage;
      if (product.cbd_percentage) customFields.cbd_percentage = product.cbd_percentage;
      if (product.strain_type) customFields.strain_type = product.strain_type;
      if (product.lineage) customFields.lineage = product.lineage;
      if (product.terpenes) customFields.terpenes = product.terpenes;
      if (product.effects) customFields.effects = product.effects;
      if (product.nose) customFields.nose = product.nose;
      if (product.taste) customFields.taste = product.taste;

      console.log('Saving product:', {
        name: product.name,
        price: parseFloat(product.price),
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        custom_fields: customFields
      });

      const response = await axios.put(`/api/vendor/products/${productId}`, {
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        price: parseFloat(product.price),
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        custom_fields: customFields
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      console.log('Save response:', response.data);

      if (response.data.success) {
        // Save pricing tier assignments
        if (selectedBlueprintIds.length > 0) {
          try {
            await axios.post('/api/vendor/product-pricing', {
              vendor_id: vendorId,
              product_ids: [productId],
              blueprint_id: selectedBlueprintIds[0], // Start with first one
              price_overrides: {}
            });

            // Assign remaining tiers if any
            for (let i = 1; i < selectedBlueprintIds.length; i++) {
              await axios.post('/api/vendor/product-pricing', {
                vendor_id: vendorId,
                product_ids: [productId],
                blueprint_id: selectedBlueprintIds[i],
                price_overrides: {}
              });
            }
          } catch (pricingError) {
            console.error('Error saving pricing assignments:', pricingError);
            // Don't fail the whole save, just log it
          }
        }

        showNotification({
          type: 'success',
          title: 'Saved',
          message: 'Product updated successfully'
        });
        router.push('/vendor/products');
      } else {
        throw new Error(response.data.error || 'Save failed');
      }
    } catch (error: any) {
      console.error('Product save error:', error);
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.response?.data?.error || error.message || 'Failed to save product'
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate margin
  const margin = product.cost_price && product.price && parseFloat(product.cost_price) > 0 && parseFloat(product.price) > 0
    ? ((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.price) * 100)
    : null;

  if (loading) {
    return (
      <div className="w-full px-4 lg:px-0 py-12">
        <div className="minimal-glass p-12 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm uppercase tracking-wider">Loading Product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Catalog
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
              Edit Product
            </h1>
            <p className="text-white/40 text-xs font-light tracking-wide uppercase">
              {product.name || 'Untitled Product'} · Full Builder
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/products"
              className="px-6 py-3 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-2xl text-xs uppercase tracking-wider"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-30 transition-all duration-300 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Status Notice */}
        {product.status === 'pending' && (
          <div className="mt-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-sm mb-1">Pending Review</div>
                <div className="text-white/60 text-xs">This product is awaiting admin approval.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="minimal-glass p-2 mb-6 flex items-center gap-2">
        <button
          onClick={() => setActiveSection('basic')}
          className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider transition-all rounded-[12px] ${
            activeSection === 'basic'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white border border-transparent'
          }`}
        >
          <Package size={14} className="inline mr-2" />
          Basic Info
        </button>
        <button
          onClick={() => setActiveSection('fields')}
          className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider transition-all rounded-[12px] ${
            activeSection === 'fields'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white border border-transparent'
          }`}
        >
          <FileText size={14} className="inline mr-2" />
          Custom Fields
        </button>
        <button
          onClick={() => setActiveSection('pricing')}
          className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider transition-all rounded-[12px] ${
            activeSection === 'pricing'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white border border-transparent'
          }`}
        >
          <DollarSign size={14} className="inline mr-2" />
          Pricing
        </button>
        <button
          onClick={() => setActiveSection('coas')}
          className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider transition-all rounded-[12px] ${
            activeSection === 'coas'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white border border-transparent'
          }`}
        >
          <FileText size={14} className="inline mr-2" />
          Lab Results
        </button>
        <button
          onClick={() => setActiveSection('images')}
          className={`flex-1 px-4 py-3 text-xs uppercase tracking-wider transition-all rounded-[12px] ${
            activeSection === 'images'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white border border-transparent'
          }`}
        >
          <ImageIcon size={14} className="inline mr-2" />
          Images
        </button>
      </div>

      {/* Content Sections */}
      <div className="">
        {/* BASIC INFO */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="minimal-glass p-6">
              <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium mb-6">Product Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={product.name}
                    onChange={(e) => setProduct({...product, name: e.target.value})}
                    placeholder="e.g., Blue Dream"
                    className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">SKU</label>
                  <input
                    type="text"
                    value={product.sku}
                    onChange={(e) => setProduct({...product, sku: e.target.value})}
                    placeholder="e.g., BD-001"
                    className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Category *</label>
                  <select
                    required
                    value={product.category}
                    onChange={(e) => setProduct({...product, category: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                  >
                    <option value="">Select category</option>
                    <option value="Flower">Flower</option>
                    <option value="Edibles">Edibles</option>
                    <option value="Concentrates">Concentrates</option>
                    <option value="Vapes">Vapes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Description *</label>
                  <textarea
                    required
                    rows={6}
                    value={product.description}
                    onChange={(e) => setProduct({...product, description: e.target.value})}
                    placeholder="Describe your product..."
                    className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl resize-none text-base"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="minimal-glass p-6">
              <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium mb-6">Pricing</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Cost Price (Private)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={product.cost_price}
                      onChange={(e) => setProduct({...product, cost_price: e.target.value})}
                      placeholder="5.00"
                      className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-8 pr-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">/g</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">Your cost (not visible to customers)</p>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Selling Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={product.price}
                      onChange={(e) => setProduct({...product, price: e.target.value})}
                      placeholder="10.00"
                      className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-8 pr-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">/g</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">Customer price per gram</p>
                </div>
              </div>

              {/* Margin Display */}
              {margin !== null && (
                <div className="mt-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-white/40 text-xs mb-1">Margin</div>
                      <div className="text-white font-medium">{margin.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Profit</div>
                      <div className="text-white font-medium">${(parseFloat(product.price) - parseFloat(product.cost_price)).toFixed(2)}/g</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Markup</div>
                      <div className="text-white font-medium">{((parseFloat(product.price) / parseFloat(product.cost_price) - 1) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM FIELDS */}
        {activeSection === 'fields' && (
          <div className="minimal-glass p-6">
            <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium mb-6">Custom Fields</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">THC %</label>
                <input
                  type="number"
                  step="0.1"
                  value={product.thc_percentage}
                  onChange={(e) => setProduct({...product, thc_percentage: e.target.value})}
                  placeholder="25.5"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">CBD %</label>
                <input
                  type="number"
                  step="0.1"
                  value={product.cbd_percentage}
                  onChange={(e) => setProduct({...product, cbd_percentage: e.target.value})}
                  placeholder="0.3"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Strain Type</label>
                <select
                  value={product.strain_type}
                  onChange={(e) => setProduct({...product, strain_type: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                >
                  <option value="">Select type</option>
                  <option value="indica">Indica</option>
                  <option value="sativa">Sativa</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Lineage</label>
                <input
                  type="text"
                  value={product.lineage}
                  onChange={(e) => setProduct({...product, lineage: e.target.value})}
                  placeholder="e.g., Blueberry × Haze"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Terpenes</label>
                <input
                  type="text"
                  value={product.terpenes}
                  onChange={(e) => setProduct({...product, terpenes: e.target.value})}
                  placeholder="e.g., Myrcene, Pinene, Caryophyllene"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Effects</label>
                <input
                  type="text"
                  value={product.effects}
                  onChange={(e) => setProduct({...product, effects: e.target.value})}
                  placeholder="e.g., Relaxed, Creative, Euphoric"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Nose</label>
                <input
                  type="text"
                  value={product.nose}
                  onChange={(e) => setProduct({...product, nose: e.target.value})}
                  placeholder="e.g., Earthy, Pine"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">Taste</label>
                <input
                  type="text"
                  value={product.taste}
                  onChange={(e) => setProduct({...product, taste: e.target.value})}
                  placeholder="e.g., Sweet, Citrus"
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
                />
              </div>
            </div>
          </div>
        )}

        {/* PRICING TIERS */}
        {activeSection === 'pricing' && (
          <div className="space-y-6">
            {/* Pricing Tier Assignment */}
            <div className="minimal-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium">Assign Pricing Tiers</h2>
                <Link
                  href="/vendor/pricing"
                  className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all rounded-2xl text-xs uppercase tracking-wider"
                >
                  Configure Tiers
                </Link>
              </div>

              {availableBlueprints.length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-8 text-center rounded-2xl">
                  <DollarSign size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">No pricing tiers configured</p>
                  <p className="text-white/40 text-sm mb-4">Set up your pricing structure first</p>
                  <Link
                    href="/vendor/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-[12px] text-xs uppercase tracking-wider"
                  >
                    <Plus size={14} />
                    Configure Pricing
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-white/40 text-xs mb-4">Select which pricing tiers apply to this product (can select multiple)</p>

                  {/* Group blueprints by context */}
                  {(() => {
                    const grouped: Record<string, PricingBlueprint[]> = {};
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
                        <div key={mg.key} className="mb-6 last:mb-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{mg.icon}</span>
                            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">{mg.label}</h3>
                          </div>

                          <div className="space-y-2 pl-6">
                            {groupBlueprints.map(blueprint => {
                              const isSelected = selectedBlueprintIds.includes(blueprint.id);

                              return (
                                <label
                                  key={blueprint.id}
                                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-white/10 border-white/30 hover:bg-white/15'
                                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBlueprintIds([...selectedBlueprintIds, blueprint.id]);
                                      } else {
                                        setSelectedBlueprintIds(selectedBlueprintIds.filter(id => id !== blueprint.id));
                                      }
                                    }}
                                    className="w-5 h-5 mt-0.5 cursor-pointer rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="text-white text-sm font-medium mb-1">{blueprint.name}</div>
                                    {blueprint.description && (
                                      <div className="text-white/40 text-xs">{blueprint.description}</div>
                                    )}
                                    {blueprint.applicable_to_categories && blueprint.applicable_to_categories.length > 0 && (
                                      <div className="text-white/30 text-xs mt-1">
                                        Applies to: {blueprint.applicable_to_categories.join(', ')}
                                      </div>
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

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/40 text-xs">
                      {selectedBlueprintIds.length === 0
                        ? 'No tiers selected - product will use base price only'
                        : `${selectedBlueprintIds.length} tier${selectedBlueprintIds.length === 1 ? '' : 's'} selected`
                      }
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Current Volume Pricing Display */}
            <div className="minimal-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium">Volume Pricing Preview</h2>
              </div>

              {pricingTiers.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-8 text-center rounded-2xl">
                <DollarSign size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No pricing tiers set</p>
                <p className="text-white/40 text-sm mb-4">Add volume pricing to encourage bulk purchases</p>
                <Link
                  href="/vendor/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-[12px] text-xs uppercase tracking-wider"
                >
                  <Plus size={14} />
                  Add Pricing Tiers
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {pricingTiers.map((tier, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-[12px]">
                    <div className="text-white/40 text-xs mb-2 uppercase tracking-wider">{tier.label}</div>
                    <div className="text-white text-2xl font-thin mb-1">${tier.price.toFixed(2)}</div>
                    <div className="text-white/40 text-xs">
                      {tier.min_quantity}{tier.max_quantity ? `-${tier.max_quantity}` : '+'} {tier.unit}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {/* LAB RESULTS / COAs */}
        {activeSection === 'coas' && (
          <div className="minimal-glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium">Certificates of Analysis</h2>
              <Link
                href="/vendor/lab-results"
                className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all rounded-2xl text-xs uppercase tracking-wider"
              >
                COA Library
              </Link>
            </div>

            {coas.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-8 text-center rounded-2xl">
                <FileText size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No COAs uploaded</p>
                <p className="text-white/40 text-sm mb-4">Products require lab results for approval</p>
                <Link
                  href="/vendor/lab-results"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-[12px] text-xs uppercase tracking-wider"
                >
                  <Upload size={14} />
                  Upload COA
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {coas.map((coa) => (
                  <div key={coa.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-white font-medium mb-1">{coa.file_name}</div>
                        {coa.batch_number && (
                          <div className="text-white/40 text-xs">Batch: {coa.batch_number}</div>
                        )}
                        {coa.lab_name && (
                          <div className="text-white/40 text-xs">Lab: {coa.lab_name}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-white/60 rounded-[8px]">
                          {coa.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        <a
                          href={coa.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>

                    {coa.test_results && (
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        {coa.test_results.thc && (
                          <div>
                            <div className="text-white/40 text-xs">THC</div>
                            <div className="text-white">{coa.test_results.thc}%</div>
                          </div>
                        )}
                        {coa.test_results.cbd && (
                          <div>
                            <div className="text-white/40 text-xs">CBD</div>
                            <div className="text-white">{coa.test_results.cbd}%</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IMAGES */}
        {activeSection === 'images' && (
          <div className="minimal-glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white/60 text-xs uppercase tracking-wider font-medium">Product Images</h2>
              <Link
                href="/vendor/media-library"
                className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all rounded-2xl text-xs uppercase tracking-wider"
              >
                Media Library
              </Link>
            </div>

            {images.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-8 text-center rounded-2xl">
                <ImageIcon size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No images uploaded</p>
                <p className="text-white/40 text-sm mb-4">Add product photos from your media library</p>
                <Link
                  href="/vendor/media-library"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all rounded-[12px] text-xs uppercase tracking-wider"
                >
                  <Upload size={14} />
                  Upload Images
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="text-white/80 hover:text-white">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-white/60 text-sm">
            {margin !== null && (
              <span>Margin: <span className="text-white font-medium">{margin.toFixed(1)}%</span></span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/products"
              className="px-6 py-3 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-2xl text-xs uppercase tracking-wider"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:opacity-30 transition-all duration-300 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24"></div>
    </div>
  );
}

