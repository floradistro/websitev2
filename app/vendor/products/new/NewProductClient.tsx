"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';

export default function NewProduct() {
  const router = useRouter();
  const { vendor } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingCOA, setUploadingCOA] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [coaFile, setCoAFile] = useState<File | null>(null);
  const [uploadedCoaUrl, setUploadedCoaUrl] = useState<string | null>(null);
  
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [attributes, setAttributes] = useState<{name: string, values: string[]}[]>([]);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [variants, setVariants] = useState<{
    name: string;
    attributes: Record<string, string>;
    price: string;
    sku: string;
    stock: string;
  }[]>([]);
  
  // Pricing Tiers state
  const [pricingMode, setPricingMode] = useState<'single' | 'tiered'>('single');
  const [pricingTiers, setPricingTiers] = useState<{
    weight?: string;
    qty: number;
    price: string;
  }[]>([]);
  const [newTierWeight, setNewTierWeight] = useState('');
  const [newTierQty, setNewTierQty] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost_price: '',  // ← ADD COST TRACKING
    thc_percentage: '',
    cbd_percentage: '',
    strain_type: '',
    lineage: '',
    terpenes: '',
    effects: '',
    initial_quantity: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // Add to file list
    setImageFiles(prev => [...prev, ...fileArray]);
    
    // Generate previews
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Upload to Supabase Storage immediately
    try {
      setUploadingImages(true);
      const vendorId = vendor?.id;
      
      if (!vendorId) {
        showNotification({
          type: 'error',
          title: 'Upload Failed',
          message: 'Not authenticated. Please login again.',
        });
        return;
      }
      
      // Upload each file
      const uploadPromises = fileArray.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', 'product');
        
        const response = await fetch('/api/supabase/vendor/upload', {
          method: 'POST',
          headers: {
            'x-vendor-id': vendorId
          },
          body: uploadFormData
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Upload failed');
        }
        
        return data.file.url;
      });
      
      const urls = await Promise.all(uploadPromises);
      setUploadedImageUrls(prev => [...prev, ...urls]);
      
      showNotification({
        type: 'success',
        title: 'Images Uploaded',
        message: `${urls.length} image(s) uploaded successfully`,
      });
      
    } catch (err: any) {
      console.error('Failed to upload images:', err);
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Failed to upload images',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
    
    showNotification({
      type: 'info',
      title: 'Image Removed',
      message: 'Image removed from upload queue',
    });
  };

  const handleCOAUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCoAFile(file);
    
    // Upload to Supabase Storage
    try {
      setUploadingCOA(true);
      const vendorId = vendor?.id;
      
      if (!vendorId) {
        showNotification({
          type: 'error',
          title: 'Upload Failed',
          message: 'Not authenticated. Please login again.',
        });
        return;
      }
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'coa');
      
      const response = await fetch('/api/supabase/vendor/upload', {
        method: 'POST',
        headers: {
          'x-vendor-id': vendorId
        },
        body: uploadFormData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'COA upload failed');
      }
      
      setUploadedCoaUrl(data.file.url);
      
      showNotification({
        type: 'success',
        title: 'COA Uploaded',
        message: 'Certificate of Analysis uploaded successfully',
      });
      
    } catch (err: any) {
      console.error('Failed to upload COA:', err);
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Failed to upload COA',
      });
    } finally {
      setUploadingCOA(false);
    }
  };

  // Attribute & Variant Management
  const addAttribute = () => {
    if (!newAttributeName.trim()) return;
    
    const existingAttr = attributes.find(a => a.name.toLowerCase() === newAttributeName.toLowerCase());
    if (existingAttr) {
      setError('Attribute already exists');
      return;
    }
    
    setAttributes([...attributes, { name: newAttributeName, values: [] }]);
    setNewAttributeName('');
  };

  const removeAttribute = (attrName: string) => {
    setAttributes(attributes.filter(a => a.name !== attrName));
    // Remove variants that use this attribute
    setVariants(variants.filter(v => !v.attributes[attrName]));
  };

  const addAttributeValue = (attrName: string) => {
    if (!newAttributeValue.trim()) return;
    
    setAttributes(attributes.map(attr => {
      if (attr.name === attrName) {
        if (!attr.values.includes(newAttributeValue)) {
          return { ...attr, values: [...attr.values, newAttributeValue] };
        }
      }
      return attr;
    }));
    setNewAttributeValue('');
  };

  const removeAttributeValue = (attrName: string, value: string) => {
    setAttributes(attributes.map(attr => {
      if (attr.name === attrName) {
        return { ...attr, values: attr.values.filter(v => v !== value) };
      }
      return attr;
    }));
    // Remove variants that use this value
    setVariants(variants.filter(v => v.attributes[attrName] !== value));
  };

  const generateVariants = () => {
    if (attributes.length === 0) return;
    
    // Generate all combinations of attribute values
    const generateCombinations = (attrs: {name: string, values: string[]}[]): Record<string, string>[] => {
      if (attrs.length === 0) return [{}];
      
      const [first, ...rest] = attrs;
      const restCombinations = generateCombinations(rest);
      
      const combinations: Record<string, string>[] = [];
      for (const value of first.values) {
        for (const combo of restCombinations) {
          combinations.push({ [first.name]: value, ...combo });
        }
      }
      return combinations;
    };
    
    const combinations = generateCombinations(attributes);
    const newVariants = combinations.map(attrs => {
      const variantName = Object.values(attrs).join(' - ');
      return {
        name: variantName,
        attributes: attrs,
        price: '',
        sku: '',
        stock: ''
      };
    });
    
    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Pricing Tier Management
  const addPricingTier = () => {
    if (!newTierPrice || !newTierQty) {
      showNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please enter quantity and price for the tier',
      });
      setError('Please enter quantity and price for the tier');
      return;
    }

    const tier = {
      weight: newTierWeight || undefined,
      qty: parseInt(newTierQty),
      price: newTierPrice
    };

    setPricingTiers([...pricingTiers, tier]);
    setNewTierWeight('');
    setNewTierQty('');
    setNewTierPrice('');
    setError('');
  };

  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const updatePricingTier = (index: number, field: string, value: string) => {
    setPricingTiers(pricingTiers.map((tier, i) => {
      if (i === index) {
        if (field === 'qty') {
          return { ...tier, qty: parseInt(value) || 0 };
        }
        return { ...tier, [field]: value };
      }
      return tier;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const productData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        cost_price: formData.cost_price || null,  // ← ADD COST TRACKING
        thc_percentage: formData.thc_percentage,
        cbd_percentage: formData.cbd_percentage,
        strain_type: formData.strain_type,
        lineage: formData.lineage,
        terpenes: formData.terpenes,
        effects: formData.effects,
        image_urls: uploadedImageUrls,
        coa_url: uploadedCoaUrl,
        product_type: productType
      };

      if (productType === 'simple') {
        // Check pricing mode
        if (pricingMode === 'tiered') {
          if (pricingTiers.length === 0) {
            showNotification({
              type: 'warning',
              title: 'Pricing Required',
              message: 'Please add at least one pricing tier',
            });
            setError('Please add at least one pricing tier');
            setLoading(false);
            return;
          }
          productData.pricing_tiers = pricingTiers;
          productData.pricing_mode = 'tiered';
        } else {
          productData.price = formData.price;
          productData.pricing_mode = 'single';
        }
        productData.initial_quantity = formData.initial_quantity;
      } else {
        // Variable product
        if (variants.length === 0) {
          showNotification({
            type: 'warning',
            title: 'Variants Required',
            message: 'Please add at least one variant for variable products',
          });
          setError('Please add at least one variant for variable products');
          setLoading(false);
          return;
        }
        
        // Validate all variants have prices
        const emptyPriceVariants = variants.filter(v => !v.price || v.price === '');
        if (emptyPriceVariants.length > 0) {
          showNotification({
            type: 'warning',
            title: 'Variant Pricing Required',
            message: `Please set prices for all variants. ${emptyPriceVariants.length} variant(s) missing prices.`,
          });
          setError(`Please set prices for all variants. ${emptyPriceVariants.length} variant(s) missing prices.`);
          setLoading(false);
          return;
        }
        
        productData.attributes = attributes;
        productData.variants = variants;
      }

      // Create product via simplified API
      const vendorId = vendor?.id;
      const response = await axios.post('/api/vendor/products', productData, {
        headers: { 'x-vendor-id': vendorId || '' }
      }).then(r => r.data);
      

      if (response && response.success) {
        showNotification({
          type: 'success',
          title: 'Product Submitted',
          message: 'Your product has been submitted for admin approval',
          duration: 3000,
        });
        setSuccess(true);
        setTimeout(() => {
          router.push('/vendor/products');
        }, 2000);
      } else {
        console.error('Response missing success flag:', response);
        showNotification({
          type: 'error',
          title: 'Submission Failed',
          message: response?.message || 'Failed to create product. Please try again.',
        });
        setError(response?.message || 'Failed to create product. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      showNotification({
        type: 'error',
        title: 'Submission Error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to create product. Please check all fields.',
      });
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create product. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Ultra-Modern Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white text-xs uppercase tracking-widest mb-6 transition-all hover:gap-3 font-medium"
          >
            <ArrowLeft size={14} />
            Back to Products
          </Link>

          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <Plus size={32} className="text-white/80" strokeWidth={2} />
            </div>

            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight" style={{ fontWeight: 900 }}>
                Add New Product
              </h1>
              <p className="text-white/40 text-sm">
                Submit a new product for admin approval
              </p>
            </div>
          </div>

          {/* Progress Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/90 font-medium">Live Form</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2">
              <Upload size={12} className="text-purple-300" />
              <span className="text-xs text-purple-200 font-medium">Auto-Save Uploads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-3xl p-6 flex items-start gap-4 backdrop-blur-sm">
              <CheckCircle size={24} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-bold mb-1 text-lg">Product Submitted Successfully!</p>
                <p className="text-green-400/70 text-sm">Your product has been submitted for admin approval. Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-3xl p-6 flex items-start gap-4 backdrop-blur-sm">
              <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-bold mb-1 text-lg">Submission Failed</p>
                <p className="text-red-400/70 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
            <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-3" style={{ fontWeight: 900 }}>
              <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
                <FileText size={16} className="text-white/80" />
              </div>
              Basic Information
            </h2>
          
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Blue Dream"
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your product..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all resize-none text-base hover:border-white/20"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20 cursor-pointer"
              >
                <option value="">Select category</option>
                <option value="Flower">Flower</option>
                <option value="Concentrate">Concentrate</option>
                <option value="Edibles">Edibles</option>
                <option value="Vape">Vape</option>
              </select>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                Product Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProductType('simple')}
                  className={`px-6 py-4 rounded-2xl border transition-all group ${
                    productType === 'simple'
                      ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/30 text-white shadow-lg'
                      : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20 hover:bg-black/50'
                  }`}
                >
                  <div className="font-bold text-base">Simple Product</div>
                  <div className="text-xs text-white/50 mt-1">Single price point</div>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('variable')}
                  className={`px-6 py-4 rounded-2xl border transition-all group ${
                    productType === 'variable'
                      ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/30 text-white shadow-lg'
                      : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20 hover:bg-black/50'
                  }`}
                >
                  <div className="font-bold text-base">Variable Product</div>
                  <div className="text-xs text-white/50 mt-1">Multiple variations</div>
                </button>
              </div>
            </div>

            {/* Pricing Mode - Only for Simple Products */}
            {productType === 'simple' && (
              <div>
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Pricing Mode <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPricingMode('single')}
                    className={`px-6 py-4 rounded-2xl border transition-all group ${
                      pricingMode === 'single'
                        ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/30 text-white shadow-lg'
                        : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20 hover:bg-black/50'
                    }`}
                  >
                    <div className="font-bold text-base">Single Price</div>
                    <div className="text-xs text-white/50 mt-1">One price for all</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('tiered')}
                    className={`px-6 py-4 rounded-2xl border transition-all group ${
                      pricingMode === 'tiered'
                        ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/30 text-white shadow-lg'
                        : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20 hover:bg-black/50'
                    }`}
                  >
                    <div className="font-bold text-base">Tier Pricing</div>
                    <div className="text-xs text-white/50 mt-1">Different quantities</div>
                  </button>
                </div>
              </div>
            )}

            {/* Single Price - Only for Simple Products with Single Pricing */}
            {productType === 'simple' && pricingMode === 'single' && (
              <>
              {/* COST PRICE (Private - Vendor Only) */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Cost Price (Your Cost)
                  <span className="ml-2 text-emerald-400 text-xs">🔒 Private</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    placeholder="10.00"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 pl-10 pr-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
                  />
                </div>
                <p className="text-white/40 text-xs mt-2">
                  Your cost per unit (not visible to customers)
                </p>
              </div>

              {/* SELLING PRICE */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Selling Price <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required={productType === 'simple' && pricingMode === 'single'}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="14.99"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 pl-10 pr-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
                  />
                </div>

                {/* SHOW MARGIN CALCULATION */}
                {formData.cost_price && formData.price && parseFloat(formData.cost_price) > 0 && parseFloat(formData.price) > 0 && (
                  <div className="mt-3 flex items-center gap-4 bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
                    <div className={`font-bold text-sm ${
                      ((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100) >= 40
                        ? 'text-green-400'
                        : ((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100) >= 25
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      Margin: {((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100).toFixed(1)}%
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="text-emerald-400 font-medium text-sm">
                      Profit: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}/unit
                    </div>
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Pricing Tiers - Only for Simple Products with Tiered Pricing */}
        {productType === 'simple' && pricingMode === 'tiered' && (
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
            <h2 className="text-xl font-black text-white mb-2 tracking-tight flex items-center gap-3" style={{ fontWeight: 900 }}>
              <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
                <DollarSign size={16} className="text-white/80" />
              </div>
              Pricing Tiers
            </h2>
            <p className="text-white/50 text-sm mb-6">
              Offer different prices for different quantities (e.g., 1g at $15, 3.5g at $45, 7g at $80).
            </p>

            {/* Add Pricing Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
              <div>
                <label className="block text-white/90 text-xs font-medium mb-2">Weight/Size (Optional)</label>
                <input
                  type="text"
                  value={newTierWeight}
                  onChange={(e) => setNewTierWeight(e.target.value)}
                  placeholder="e.g., 1g, 3.5g"
                  className="w-full bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all hover:border-white/20"
                />
              </div>
              <div>
                <label className="block text-white/90 text-xs font-medium mb-2">Quantity <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={newTierQty}
                  onChange={(e) => setNewTierQty(e.target.value)}
                  placeholder="1"
                  className="w-full bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all hover:border-white/20"
                />
              </div>
              <div>
                <label className="block text-white/90 text-xs font-medium mb-2">Price ($) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={newTierPrice}
                  onChange={(e) => setNewTierPrice(e.target.value)}
                  placeholder="14.99"
                  className="w-full bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all hover:border-white/20"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPricingTier}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus size={16} />
                  Add Tier
                </button>
              </div>
            </div>

            {/* Pricing Tiers List */}
            {pricingTiers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-bold text-sm">Current Pricing Tiers ({pricingTiers.length})</h3>
                <div className="space-y-3">
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <input
                            type="text"
                            value={tier.weight || ''}
                            onChange={(e) => updatePricingTier(index, 'weight', e.target.value)}
                            placeholder="Weight"
                            className="w-full bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={tier.qty}
                            onChange={(e) => updatePricingTier(index, 'qty', e.target.value)}
                            placeholder="Qty"
                            className="w-full bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs font-medium">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-white/30"
                          />
                        </div>
                      </div>
                      <div className="text-white/70 text-sm font-medium min-w-[100px]">
                        {tier.weight || `${tier.qty} units`} - ${parseFloat(tier.price.toString()).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePricingTier(index)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-500/10 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pricingTiers.length === 0 && (
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
                <p className="text-blue-300 text-sm font-medium">
                  No pricing tiers added yet. Add at least one pricing tier to continue.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Attributes & Variants - Only for Variable Products */}
        {productType === 'variable' && (
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
            <h2 className="text-xl font-black text-white mb-2 tracking-tight flex items-center gap-3" style={{ fontWeight: 900 }}>
              <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
                <Package size={16} className="text-white/80" />
              </div>
              Product Attributes & Variations
            </h2>
            <p className="text-white/50 text-sm mb-4">
              Define attributes (like Flavor, Size, Strength) and their values to create product variations.
            </p>
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
              <p className="text-blue-300/90 text-xs leading-relaxed">
                <strong className="font-bold">How it works:</strong> 1) Add attribute (e.g., "Strength"), 2) Add values (e.g., "5MG", "10MG", "30MG"), 3) Click "Generate Variants", 4) Fill prices for each variant
              </p>
            </div>

            {/* Add Attribute */}
            <div className="mb-6">
              <label className="block text-white/90 text-sm font-medium mb-3">Add Attribute</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  placeholder="e.g., Flavor, Size, Strength"
                  className="flex-1 bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl text-white font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* Attributes List */}
            {attributes.length > 0 && (
              <div className="space-y-4 mb-6">
                {attributes.map((attr) => (
                  <div key={attr.name} className="bg-black/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-base">{attr.name}</h3>
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr.name)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-500/10 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Add Value */}
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newAttributeValue}
                        onChange={(e) => setNewAttributeValue(e.target.value)}
                        placeholder={`Add ${attr.name} value...`}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-sm hover:border-white/20"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttributeValue(attr.name))}
                      />
                      <button
                        type="button"
                        onClick={() => addAttributeValue(attr.name)}
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Values */}
                    {attr.values.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((value) => (
                          <div
                            key={value}
                            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-white font-medium"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeAttributeValue(attr.name, value)}
                              className="text-white/60 hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Generate Variants Button */}
            {attributes.length > 0 && (
              <div className="mt-4">
                {attributes.every(a => a.values.length > 0) ? (
                  <button
                    type="button"
                    onClick={generateVariants}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl text-white font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <Plus size={20} />
                    Generate Variants ({attributes.reduce((acc, a) => acc * a.values.length, 1)} combinations)
                  </button>
                ) : (
                  <div className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl text-blue-300 text-center text-sm font-medium">
                    Add values to all attributes above, then generate variants
                  </div>
                )}
              </div>
            )}

            {/* Variants Table */}
            {variants.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-bold text-base mb-4">Manage Variants ({variants.length})</h3>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-5 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                              Variant
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                              Price ($)
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                              SKU
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                              Stock
                            </th>
                            <th className="px-5 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {variants.map((variant, index) => (
                            <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-4 text-sm text-white font-medium whitespace-nowrap">
                                {variant.name}
                              </td>
                              <td className="px-5 py-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                  placeholder="Required"
                                  className={`w-28 bg-black/50 border rounded-xl text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-all ${
                                    !variant.price ? 'border-red-400/50' : 'border-white/10'
                                  }`}
                                />
                              </td>
                              <td className="px-5 py-4">
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                  placeholder="SKU-001"
                                  className="w-32 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-all"
                                />
                              </td>
                              <td className="px-5 py-4">
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                  placeholder="0"
                                  className="w-24 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-all"
                                />
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-500/10 transition-all"
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Images */}
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
          <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-3" style={{ fontWeight: 900 }}>
            <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
              <Upload size={16} className="text-white/80" />
            </div>
            Product Images
          </h2>
          
          <div className="space-y-4">
            {/* Image Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-black/30 border border-white/10 rounded-3xl overflow-hidden group">
                    <img src={preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    {uploadedImageUrls[index] ? (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
                        <CheckCircle size={14} />
                        Uploaded
                      </div>
                    ) : uploadingImages ? (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
                        <Loader size={14} className="animate-spin" />
                        Uploading...
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="block">
              <div className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-white/40 hover:bg-white/[0.02] transition-all cursor-pointer bg-black/30 group">
                <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} className="text-white/60 group-hover:text-white transition-colors" />
                </div>
                <div className="text-white/90 font-medium mb-2">Click to upload images</div>
                <div className="text-white/40 text-sm">PNG, JPG up to 10MB (min 3 images recommended)</div>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Certificate of Analysis */}
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3" style={{ fontWeight: 900 }}>
              <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
                <FileText size={16} className="text-white/80" />
              </div>
              Certificate of Analysis (COA)
            </h2>
            <span className="text-red-400 text-xs uppercase tracking-wider font-bold bg-red-500/10 px-3 py-1 rounded-full">Required</span>
          </div>

          {coaFile ? (
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
                  <FileText size={24} className="text-white/70" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium flex items-center gap-2 mb-1">
                    {coaFile.name}
                    {uploadedCoaUrl && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle size={12} />
                        Uploaded
                      </span>
                    )}
                    {uploadingCOA && (
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Loader size={12} className="animate-spin" />
                        Uploading...
                      </span>
                    )}
                  </div>
                  <div className="text-white/50 text-xs">{(coaFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCoAFile(null);
                  setUploadedCoaUrl(null);
                }}
                className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-500/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="block">
              <div className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-white/40 hover:bg-white/[0.02] transition-all cursor-pointer bg-black/30 group">
                <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={32} className="text-white/60 group-hover:text-white transition-colors" />
                </div>
                <div className="text-white/90 font-medium mb-2">Upload Certificate of Analysis</div>
                <div className="text-white/40 text-sm">PDF format, max 5MB - Required for approval</div>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCOAUpload}
                className="hidden"
              />
            </label>
          )}

          <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex gap-3">
              <FileText size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-blue-300/90 text-sm leading-relaxed">
                All products must include a Certificate of Analysis from an accredited laboratory. COAs must be less than 90 days old.
              </div>
            </div>
          </div>
        </div>

        {/* Strain Details */}
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8">
          <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-3" style={{ fontWeight: 900 }}>
            <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
              <Package size={16} className="text-white/80" />
            </div>
            Strain Details
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* THC % */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                THC Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.thc_percentage}
                  onChange={(e) => setFormData({...formData, thc_percentage: e.target.value})}
                  placeholder="24.5"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 font-medium">%</span>
              </div>
            </div>

            {/* CBD % */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                CBD Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.cbd_percentage}
                  onChange={(e) => setFormData({...formData, cbd_percentage: e.target.value})}
                  placeholder="0.5"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 font-medium">%</span>
              </div>
            </div>

            {/* Strain Type */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                Strain Type
              </label>
              <select
                value={formData.strain_type}
                onChange={(e) => setFormData({...formData, strain_type: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20 cursor-pointer"
              >
                <option value="">Select type</option>
                <option value="indica">Indica</option>
                <option value="sativa">Sativa</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Initial Quantity - Only for Simple Products */}
            {productType === 'simple' && (
              <div>
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Initial Quantity (grams)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({...formData, initial_quantity: e.target.value})}
                  placeholder="100"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
                />
              </div>
            )}

            {/* Lineage */}
            <div className="lg:col-span-2">
              <label className="block text-white/90 text-sm font-medium mb-3">
                Lineage / Genetics
              </label>
              <input
                type="text"
                value={formData.lineage}
                onChange={(e) => setFormData({...formData, lineage: e.target.value})}
                placeholder="e.g., Blueberry × Haze"
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
              />
            </div>

            {/* Terpenes */}
            <div className="lg:col-span-2">
              <label className="block text-white/90 text-sm font-medium mb-3">
                Dominant Terpenes
              </label>
              <input
                type="text"
                value={formData.terpenes}
                onChange={(e) => setFormData({...formData, terpenes: e.target.value})}
                placeholder="e.g., Myrcene, Pinene, Caryophyllene"
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
              />
            </div>

            {/* Effects */}
            <div className="lg:col-span-2">
              <label className="block text-white/90 text-sm font-medium mb-3">
                Effects
              </label>
              <input
                type="text"
                value={formData.effects}
                onChange={(e) => setFormData({...formData, effects: e.target.value})}
                placeholder="e.g., Relaxed, Creative, Euphoric"
                className="w-full bg-black/50 border border-white/10 rounded-2xl text-white placeholder-white/30 px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-base hover:border-white/20"
              />
            </div>
          </div>
        </div>

        {/* Submit - Fixed at bottom */}
        <div className="sticky bottom-0 z-10 bg-black/80 backdrop-blur-xl border-t border-white/10 -mx-6 lg:-mx-12 px-6 lg:px-12 py-6">
          <div className="max-w-5xl mx-auto flex flex-col-reverse lg:flex-row justify-end gap-3 lg:gap-4">
            <Link
              href="/vendor/products"
              className="w-full lg:w-auto text-center px-8 py-4 bg-black/50 text-white/80 border border-white/20 rounded-2xl hover:bg-white/10 hover:text-white hover:border-white/30 font-medium transition-all duration-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for Review
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}

