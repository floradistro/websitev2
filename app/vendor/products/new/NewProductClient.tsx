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
    <div className="lg:max-w-4xl lg:mx-auto animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 lg:mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 tracking-tight">
          Add New Product
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Submit a new product for admin approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0 lg:space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 -mx-4 lg:mx-0">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-medium mb-1">Product Submitted Successfully!</p>
              <p className="text-green-500/80 text-sm">Your product has been submitted for admin approval. Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 -mx-4 lg:mx-0">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium mb-1">Submission Failed</p>
              <p className="text-red-500/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Basic Information</h2>
          
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Blue Dream"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your product..."
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors resize-none text-base"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-black border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
              <label className="block text-white/80 text-sm mb-2">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProductType('simple')}
                  className={`px-4 py-3 border transition-colors ${
                    productType === 'simple'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-black border-white/5 text-white/60 hover:border-white/10'
                  }`}
                >
                  Simple Product
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('variable')}
                  className={`px-4 py-3 border transition-colors ${
                    productType === 'variable'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-black border-white/5 text-white/60 hover:border-white/10'
                  }`}
                >
                  Variable Product
                </button>
              </div>
              <p className="text-white/40 text-xs mt-2">
                {productType === 'simple' 
                  ? 'A single product with one price' 
                  : 'A product with variations (e.g., different flavors, sizes, or strengths)'}
              </p>
            </div>

            {/* Pricing Mode - Only for Simple Products */}
            {productType === 'simple' && (
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Pricing Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPricingMode('single')}
                    className={`px-4 py-3 border transition-colors ${
                      pricingMode === 'single'
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-black border-white/5 text-white/60 hover:border-white/10'
                    }`}
                  >
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('tiered')}
                    className={`px-4 py-3 border transition-colors ${
                      pricingMode === 'tiered'
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-black border-white/5 text-white/60 hover:border-white/10'
                    }`}
                  >
                    Tier Pricing
                  </button>
                </div>
                <p className="text-white/40 text-xs mt-2">
                  {pricingMode === 'single' 
                    ? 'One price for all quantities' 
                    : 'Different prices for different quantities (e.g., 1g, 3.5g, 7g)'}
                </p>
              </div>
            )}

            {/* Single Price - Only for Simple Products with Single Pricing */}
            {productType === 'simple' && pricingMode === 'single' && (
              <>
              {/* COST PRICE (Private - Vendor Only) */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Cost Price (Your Cost)
                  <span className="ml-2 text-white/40 text-xs">🔒 Private</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    placeholder="10.00"
                    className="w-full bg-black border border-white/5 text-white placeholder-white/40 pl-8 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                  />
                </div>
                <p className="text-white/40 text-xs mt-1">
                  Your cost per unit (not visible to customers)
                </p>
              </div>

              {/* SELLING PRICE */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required={productType === 'simple' && pricingMode === 'single'}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="14.99"
                    className="w-full bg-black border border-white/5 text-white placeholder-white/40 pl-8 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                  />
                </div>
                
                {/* SHOW MARGIN CALCULATION */}
                {formData.cost_price && formData.price && parseFloat(formData.cost_price) > 0 && parseFloat(formData.price) > 0 && (
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className={`font-medium ${
                      ((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100) >= 40 
                        ? 'text-green-400' 
                        : ((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100) >= 25 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                    }`}>
                      Margin: {((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100).toFixed(1)}%
                    </span>
                    <span className="text-white/40">|</span>
                    <span className="text-green-400">
                      Profit: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}/unit
                    </span>
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Pricing Tiers - Only for Simple Products with Tiered Pricing */}
        {productType === 'simple' && pricingMode === 'tiered' && (
          <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
            <h2 className="text-white font-medium mb-2">Pricing Tiers</h2>
            <p className="text-white/60 text-sm mb-6">
              Offer different prices for different quantities (e.g., 1g at $15, 3.5g at $45, 7g at $80).
            </p>

            {/* Add Pricing Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
              <div>
                <label className="block text-white/80 text-xs mb-2">Weight/Size (Optional)</label>
                <input
                  type="text"
                  value={newTierWeight}
                  onChange={(e) => setNewTierWeight(e.target.value)}
                  placeholder="e.g., 1g, 3.5g"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/80 text-xs mb-2">Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={newTierQty}
                  onChange={(e) => setNewTierQty(e.target.value)}
                  placeholder="1"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/80 text-xs mb-2">Price ($) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={newTierPrice}
                  onChange={(e) => setNewTierPrice(e.target.value)}
                  placeholder="14.99"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPricingTier}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Add Tier
                </button>
              </div>
            </div>

            {/* Pricing Tiers List */}
            {pricingTiers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white text-sm font-medium">Current Pricing Tiers ({pricingTiers.length})</h3>
                <div className="space-y-2">
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <input
                            type="text"
                            value={tier.weight || ''}
                            onChange={(e) => updatePricingTier(index, 'weight', e.target.value)}
                            placeholder="Weight"
                            className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-1 text-sm focus:outline-none focus:border-white/10"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={tier.qty}
                            onChange={(e) => updatePricingTier(index, 'qty', e.target.value)}
                            placeholder="Qty"
                            className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-1 text-sm focus:outline-none focus:border-white/10"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full bg-black border border-white/5 text-white placeholder-white/40 pl-5 pr-2 py-1 text-sm focus:outline-none focus:border-white/10"
                          />
                        </div>
                      </div>
                      <div className="text-white/60 text-sm min-w-[100px]">
                        {tier.weight || `${tier.qty} units`} - ${parseFloat(tier.price.toString()).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePricingTier(index)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pricingTiers.length === 0 && (
              <div className="bg-blue-500/5 border border-blue-500/10 p-4 text-center">
                <p className="text-blue-500/80 text-sm">
                  No pricing tiers added yet. Add at least one pricing tier to continue.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Attributes & Variants - Only for Variable Products */}
        {productType === 'variable' && (
          <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
            <h2 className="text-white font-medium mb-2">Product Attributes & Variations</h2>
            <p className="text-white/60 text-sm mb-2">
              Define attributes (like Flavor, Size, Strength) and their values to create product variations.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 mb-6">
              <p className="text-blue-500/90 text-xs">
                <strong>How it works:</strong> 1) Add attribute (e.g., "Strength"), 2) Add values (e.g., "5MG", "10MG", "30MG"), 3) Click "Generate Variants", 4) Fill prices for each variant
              </p>
            </div>

            {/* Add Attribute */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">Add Attribute</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  placeholder="e.g., Flavor, Size, Strength"
                  className="flex-1 bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-4 py-3 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-colors flex items-center gap-2"
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
                  <div key={attr.name} className="bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{attr.name}</h3>
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr.name)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Add Value */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newAttributeValue}
                        onChange={(e) => setNewAttributeValue(e.target.value)}
                        placeholder={`Add ${attr.name} value...`}
                        className="flex-1 bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 focus:outline-none focus:border-white/10 transition-colors text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttributeValue(attr.name))}
                      />
                      <button
                        type="button"
                        onClick={() => addAttributeValue(attr.name)}
                        className="px-3 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Values */}
                    {attr.values.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((value) => (
                          <div
                            key={value}
                            className="bg-black border border-white/10 px-3 py-1 flex items-center gap-2 text-sm text-white"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeAttributeValue(attr.name, value)}
                              className="text-white/60 hover:text-red-500"
                            >
                              <X size={12} />
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
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Generate Variants ({attributes.reduce((acc, a) => acc * a.values.length, 1)} combinations)
                  </button>
                ) : (
                  <div className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-center text-sm">
                    Add values to all attributes above, then generate variants
                  </div>
                )}
              </div>
            )}

            {/* Variants Table */}
            {variants.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-medium mb-4">Manage Variants ({variants.length})</h3>
                <div className="overflow-x-auto -mx-4 lg:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                            Variant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                            Price ($)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {variants.map((variant, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                              {variant.name}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                placeholder="Required"
                                className={`w-24 bg-black border text-white placeholder-white/40 px-2 py-1 text-sm focus:outline-none focus:border-white/10 ${
                                  !variant.price ? 'border-red-500/50' : 'border-white/5'
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                placeholder="SKU-001"
                                className="w-32 bg-black border border-white/5 text-white placeholder-white/40 px-2 py-1 text-sm focus:outline-none focus:border-white/10"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                placeholder="0"
                                className="w-20 bg-black border border-white/5 text-white placeholder-white/40 px-2 py-1 text-sm focus:outline-none focus:border-white/10"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Images */}
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Product Images</h2>
          
          <div className="space-y-4">
            {/* Image Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-white/5 rounded-2xl overflow-hidden group">
                    <img src={preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    {uploadedImageUrls[index] ? (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs flex items-center gap-1">
                        <CheckCircle size={12} />
                        Uploaded
                      </div>
                    ) : uploadingImages ? (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs flex items-center gap-1">
                        <Loader size={12} className="animate-spin" />
                        Uploading...
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="block">
              <div className="border-2 border-dashed border-white/10 p-8 text-center hover:border-white/20 transition-colors cursor-pointer bg-black">
                <Upload size={32} className="text-white/40 mx-auto mb-3" />
                <div className="text-white/80 text-sm mb-1">Click to upload images</div>
                <div className="text-white/40 text-xs">PNG, JPG up to 10MB (min 3 images recommended)</div>
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
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-medium">Certificate of Analysis (COA)</h2>
            <span className="text-red-500 text-xs uppercase tracking-wider">Required</span>
          </div>

          {coaFile ? (
            <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-white/60" />
                <div>
                  <div className="text-white text-sm flex items-center gap-2">
                    {coaFile.name}
                    {uploadedCoaUrl && (
                      <span className="text-green-500 text-xs flex items-center gap-1">
                        <CheckCircle size={12} />
                        Uploaded
                      </span>
                    )}
                    {uploadingCOA && (
                      <span className="text-blue-500 text-xs flex items-center gap-1">
                        <Loader size={12} className="animate-spin" />
                        Uploading...
                      </span>
                    )}
                  </div>
                  <div className="text-white/60 text-xs">{(coaFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCoAFile(null);
                  setUploadedCoaUrl(null);
                }}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="block">
              <div className="border-2 border-dashed border-white/10 p-8 text-center hover:border-white/20 transition-colors cursor-pointer bg-black">
                <Upload size={32} className="text-white/40 mx-auto mb-3" />
                <div className="text-white/80 text-sm mb-1">Upload Certificate of Analysis</div>
                <div className="text-white/40 text-xs">PDF format, max 5MB - Required for approval</div>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCOAUpload}
                className="hidden"
              />
            </label>
          )}

          <div className="mt-4 bg-blue-500/5 border border-blue-500/10 p-3">
            <div className="flex gap-2">
              <FileText size={16} className="text-blue-500/80 flex-shrink-0 mt-0.5" />
              <div className="text-blue-500/80 text-xs leading-relaxed">
                All products must include a Certificate of Analysis from an accredited laboratory. COAs must be less than 90 days old.
              </div>
            </div>
          </div>
        </div>

        {/* Strain Details */}
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Strain Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* THC % */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                THC Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.thc_percentage}
                  onChange={(e) => setFormData({...formData, thc_percentage: e.target.value})}
                  placeholder="24.5"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            {/* CBD % */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                CBD Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.cbd_percentage}
                  onChange={(e) => setFormData({...formData, cbd_percentage: e.target.value})}
                  placeholder="0.5"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            {/* Strain Type */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Strain Type
              </label>
              <select
                value={formData.strain_type}
                onChange={(e) => setFormData({...formData, strain_type: e.target.value})}
                className="w-full bg-black border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                <label className="block text-white/80 text-sm mb-2">
                  Initial Quantity (grams)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({...formData, initial_quantity: e.target.value})}
                  placeholder="100"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                />
              </div>
            )}

            {/* Lineage */}
            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Lineage / Genetics
              </label>
              <input
                type="text"
                value={formData.lineage}
                onChange={(e) => setFormData({...formData, lineage: e.target.value})}
                placeholder="e.g., Blueberry × Haze"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            {/* Terpenes */}
            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Dominant Terpenes
              </label>
              <input
                type="text"
                value={formData.terpenes}
                onChange={(e) => setFormData({...formData, terpenes: e.target.value})}
                placeholder="e.g., Myrcene, Pinene, Caryophyllene"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            {/* Effects */}
            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Effects
              </label>
              <input
                type="text"
                value={formData.effects}
                onChange={(e) => setFormData({...formData, effects: e.target.value})}
                placeholder="e.g., Relaxed, Creative, Euphoric"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse lg:flex-row justify-end gap-3 lg:gap-4 px-4 lg:px-0 py-6 lg:py-0 border-t lg:border-t-0 border-white/5 -mx-4 lg:mx-0">
          <Link
            href="/vendor/products"
            className="w-full lg:w-auto text-center px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="group w-full lg:w-auto px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {loading ? 'Submitting...' : 'Submit for Review'}
              {!loading && (
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

