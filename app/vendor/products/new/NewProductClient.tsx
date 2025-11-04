'use client';

/**
 * NewProductClient - Steve Jobs-worthy product creation
 * Polished, intuitive, beautiful
 * Single & Bulk modes with AI enrichment
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, Package, Upload, X, ChevronLeft, ChevronRight, Layers, Image as ImageIcon, DollarSign, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import { Button, Input, Textarea, ds, cn } from '@/components/ds';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DynamicField {
  name: string;
  slug?: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  groupName?: string;
}

interface BulkProduct {
  name: string;
  price: string;
  cost_price: string;
  pricing_mode: 'single' | 'tiered';
  pricing_tiers: Array<{weight: string, qty: number, price: string}>;
  custom_fields: Record<string, any>;
}

export default function NewProductClient() {
  const router = useRouter();
  const { vendor } = useAppAuth();

  // Mode toggle
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');

  // Core state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost_price: '',
    initial_quantity: '',
  });

  // Categories and fields
  const [categories, setCategories] = useState<Category[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Pricing
  const [pricingMode, setPricingMode] = useState<'single' | 'tiered'>('single');
  const [pricingTiers, setPricingTiers] = useState<{ weight: string; qty: number; price: string }[]>([]);

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  // Bulk state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [bulkImages, setBulkImages] = useState<Array<{file: File, url: string, matchedTo: string | null}>>([]);
  const [bulkEnrichedData, setBulkEnrichedData] = useState<Record<string, any>>({});

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/supabase/categories?parent=null&active=true');
        if (response.data.success) {
          setCategories(response.data.categories || []);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load dynamic fields when category changes
  useEffect(() => {
    const loadFields = async () => {
      const categoryId = inputMode === 'single' ? formData.category_id : bulkCategory;
      if (!categoryId || !vendor?.id) {
        setDynamicFields([]);
        return;
      }

      try {
        setLoadingFields(true);
        const response = await axios.get(`/api/vendor/product-fields?category_id=${categoryId}`, {
          headers: { 'x-vendor-id': vendor.id }
        });

        if (response.data.success) {
          const fields = (response.data.merged || []).map((field: any) => ({
            ...field,
            label: field.label || field.name,
            name: field.slug || field.name
          }));
          setDynamicFields(fields);
        }
      } catch (error) {
        console.error('Failed to load product fields:', error);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [formData.category_id, bulkCategory, vendor?.id, inputMode]);

  // AI Autofill for single product
  const handleAIAutofill = async () => {
    if (!formData.name.trim()) {
      showNotification({
        type: 'warning',
        title: 'Product Name Required',
        message: 'Enter a product name to autofill data',
      });
      return;
    }

    if (!formData.category_id) {
      showNotification({
        type: 'warning',
        title: 'Category Required',
        message: 'Select a category first',
      });
      return;
    }

    try {
      setLoadingAI(true);
      const category = categories.find(c => c.id === formData.category_id);
      const response = await axios.post('/api/ai/quick-autofill', {
        productName: formData.name,
        category: category?.name,
        selectedFields: ['strain_type', 'lineage', 'nose', 'effects', 'terpene_profile', 'description']
      });

      if (response.data.success && response.data.suggestions) {
        const suggestions = response.data.suggestions;
        const updates: Record<string, any> = {};

        if (suggestions.strain_type) updates.strain_type = suggestions.strain_type;
        if (suggestions.lineage) updates.lineage = suggestions.lineage;
        if (suggestions.nose && Array.isArray(suggestions.nose)) {
          updates.nose = suggestions.nose.join(', ');
        }
        if (suggestions.effects && Array.isArray(suggestions.effects)) {
          updates.effects = suggestions.effects;
        }
        if (suggestions.terpene_profile && Array.isArray(suggestions.terpene_profile)) {
          updates.terpene_profile = suggestions.terpene_profile;
        }
        if (suggestions.description) {
          setFormData(prev => ({ ...prev, description: suggestions.description }));
        }

        setCustomFieldValues(prev => ({ ...prev, ...updates }));

        showNotification({
          type: 'success',
          title: 'AI Data Applied',
          message: `${Object.keys(updates).length} fields populated`,
        });
      }
    } catch (error: any) {
      console.error('AI autofill error:', error);
      showNotification({
        type: 'error',
        title: 'Autofill Failed',
        message: 'Could not fetch product data',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // Bulk AI Enrichment
  const handleBulkAIEnrich = async () => {
    if (!bulkInput.trim()) {
      showNotification({
        type: 'warning',
        title: 'No Data',
        message: 'Enter product data first',
      });
      return;
    }

    if (!bulkCategory) {
      showNotification({
        type: 'warning',
        title: 'Category Required',
        message: 'Select a category for this bulk batch',
      });
      return;
    }

    setLoadingAI(true);
    const enrichedData: Record<string, any> = {};
    const parsedProducts: BulkProduct[] = [];

    try {
      const lines = bulkInput.split('\n').filter(line => line.trim());
      const productsToEnrich: Array<{name: string, price: string, cost: string}> = [];

      // Parse products
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 1) continue;

        const [name, price, cost] = parts;
        productsToEnrich.push({ name, price: price || '', cost: cost || price || '' });

        parsedProducts.push({
          name,
          price: price || '',
          cost_price: cost || price || '',
          pricing_mode: 'single',
          pricing_tiers: [],
          custom_fields: {}
        });
      }

      // Call streaming AI API
      const categoryName = categories.find(c => c.id === bulkCategory)?.name || '';
      const response = await fetch('/api/ai/bulk-autofill-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsToEnrich,
          category: categoryName,
          selectedFields: ['strain_type', 'lineage', 'nose', 'effects', 'terpene_profile', 'description'],
        }),
      });

      if (!response.ok) throw new Error('Failed to start bulk enrichment');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream available');

      let buffer = '';
      let allResults: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'complete') {
              allResults = data.results ? Object.values(data.results) : [];
            }
          }
        }
      }

      // Process results
      for (const result of allResults) {
        const hasData = result.lineage || (result.terpene_profile && result.terpene_profile.length > 0);
        if (hasData) {
          enrichedData[result.product_name] = {
            strain_type: result.strain_type,
            lineage: result.lineage,
            nose: result.nose,
            effects: result.effects,
            terpene_profile: result.terpene_profile,
            description: result.description
          };
        }
      }

      // Map enriched data to products
      for (const product of parsedProducts) {
        const aiData = enrichedData[product.name];
        if (aiData) {
          product.custom_fields = {
            strain_type: aiData.strain_type || '',
            lineage: aiData.lineage || '',
            nose: Array.isArray(aiData.nose) ? aiData.nose.join(', ') : '',
            effects: aiData.effects || [],
            terpene_profile: aiData.terpene_profile || []
          };
        }
      }

      setBulkEnrichedData(enrichedData);
      setBulkProducts(parsedProducts);
      setCurrentReviewIndex(0);

      showNotification({
        type: 'success',
        title: 'AI Enrichment Complete',
        message: `Enriched ${Object.keys(enrichedData).length}/${lines.length} products`,
      });
    } catch (error: any) {
      console.error('Bulk AI error:', error);
      showNotification({
        type: 'error',
        title: 'AI Processing Failed',
        message: error.message || 'Failed to enrich products',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // Image upload (single mode)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setImageFiles(prev => [...prev, ...fileArray]);

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    try {
      setUploadingImages(true);
      const vendorId = vendor?.id;
      if (!vendorId) {
        showNotification({ type: 'error', title: 'Upload Failed', message: 'Not authenticated' });
        return;
      }

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
      setUploadedImageUrls(prev => [...prev, ...urls]);

      showNotification({
        type: 'success',
        title: 'Images Uploaded',
        message: `${urls.length} image(s) uploaded`,
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
  };

  // Pricing tier management
  const addPricingTier = () => {
    setPricingTiers([...pricingTiers, { weight: '', qty: 1, price: '' }]);
  };

  const updatePricingTier = (index: number, field: string, value: string) => {
    setPricingTiers(pricingTiers.map((tier, i) => {
      if (i === index) {
        if (field === 'qty') return { ...tier, qty: parseInt(value) || 1 };
        return { ...tier, [field]: value };
      }
      return tier;
    }));
  };

  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  // Bulk product submission
  const handleBulkSubmit = async () => {
    if (bulkProducts.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Products',
        message: 'Add products first',
      });
      return;
    }

    setBulkProcessing(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const product of bulkProducts) {
        try {
          const enrichedData = bulkEnrichedData[product.name] || {};
          const description = enrichedData.description || `Bulk imported product: ${product.name}`;

          const productData: any = {
            name: product.name,
            category_id: bulkCategory,
            product_type: 'simple',
            product_visibility: 'internal',
            pricing_mode: product.pricing_mode,
            custom_fields: product.custom_fields || {},
            description
          };

          if (product.pricing_mode === 'single') {
            // Only add price fields if they have values
            if (product.price) {
              productData.price = parseFloat(product.price);
            }
            if (product.cost_price) {
              productData.cost_price = parseFloat(product.cost_price);
            }
          } else {
            productData.pricing_tiers = product.pricing_tiers;
          }

          console.log('📦 Submitting product:', product.name);
          console.log('📦 Product data:', JSON.stringify(productData, null, 2));
          console.log('📦 Vendor ID:', vendor?.id);

          const response = await axios.post('/api/vendor/products', productData, {
            headers: {
              'x-vendor-id': vendor?.id || '',
              'Content-Type': 'application/json'
            },
            withCredentials: true // Send HTTP-only auth cookie
          });

          if (response.data.success) {
            successCount++;
            console.log(`✅ Created: ${product.name}`);
          } else {
            failCount++;
            console.error(`❌ Failed: ${product.name}`, response.data);
          }
        } catch (err: any) {
          failCount++;
          console.error(`❌ Failed to create product: ${product.name}`);
          console.error('Full error object:', err);
          console.error('Error response:', err.response);
          console.error('Error response data:', err.response?.data);

          // Show specific error for first failed product
          if (failCount === 1) {
            const errorData = err.response?.data;
            let errorMessage = 'Unknown error';

            if (errorData?.details && Array.isArray(errorData.details)) {
              errorMessage = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
            } else if (errorData?.error) {
              errorMessage = errorData.error;
            }

            console.error('📛 Detailed error for notification:', errorMessage);

            showNotification({
              type: 'error',
              title: `Validation Failed: ${product.name}`,
              message: errorMessage,
            });
          }
        }
      }

      showNotification({
        type: 'success',
        title: 'Bulk Import Complete',
        message: `Success: ${successCount} | Failed: ${failCount}`,
      });

      if (successCount > 0) {
        setTimeout(() => router.push('/vendor/products'), 1500);
      }
    } catch (err: any) {
      console.error('Bulk import error:', err);
      showNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Could not process bulk products',
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Single product submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification({ type: 'warning', title: 'Name Required', message: 'Enter a product name' });
      return;
    }

    if (!formData.category_id) {
      showNotification({ type: 'warning', title: 'Category Required', message: 'Select a category' });
      return;
    }

    if (pricingMode === 'single' && !formData.price) {
      showNotification({ type: 'warning', title: 'Price Required', message: 'Enter a price' });
      return;
    }

    if (pricingMode === 'tiered' && pricingTiers.length === 0) {
      showNotification({ type: 'warning', title: 'Pricing Tiers Required', message: 'Add at least one pricing tier' });
      return;
    }

    setLoading(true);

    try {
      const productData: any = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        product_type: 'simple',
        product_visibility: 'internal',
        pricing_mode: pricingMode,
        image_urls: uploadedImageUrls,
        custom_fields: customFieldValues,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        initial_quantity: formData.initial_quantity ? parseFloat(formData.initial_quantity) : null,
      };

      if (pricingMode === 'single') {
        productData.price = parseFloat(formData.price);
      } else {
        productData.pricing_tiers = pricingTiers;
      }

      const response = await axios.post('/api/vendor/products', productData, {
        headers: {
          'x-vendor-id': vendor?.id || '',
          'Content-Type': 'application/json'
        },
        withCredentials: true // Send HTTP-only auth cookie
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Product Created',
          message: 'Product created successfully',
        });
        setTimeout(() => router.push('/vendor/products'), 1500);
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      showNotification({
        type: 'error',
        title: 'Submission Error',
        message: err.response?.data?.error || 'Failed to create product',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render dynamic field
  const renderField = (field: DynamicField) => {
    const value = customFieldValues[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              ds.typography.size.xs,
              ds.colors.bg.primary,
              ds.colors.border.default,
              "border text-white/90",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const newValues = selectedValues.includes(opt)
                    ? selectedValues.filter(v => v !== opt)
                    : [...selectedValues, opt];
                  setCustomFieldValues({ ...customFieldValues, [field.name]: newValues });
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg border transition-colors",
                  ds.typography.size.micro,
                  selectedValues.includes(opt)
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : cn(ds.colors.bg.elevated, ds.colors.border.default, "text-white/60 hover:text-white/80")
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Group fields
  const groupedFields = dynamicFields.reduce((acc, field) => {
    const group = field.groupName || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, DynamicField[]>);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/vendor/products"
            className={cn(
              "inline-flex items-center gap-2 mb-4 transition-colors",
              ds.typography.size.xs,
              ds.colors.text.tertiary,
              "hover:text-white/80"
            )}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Products
          </Link>
          <h1 className={cn(ds.typography.size.xl, ds.typography.weight.medium, "text-white")}>
            Add New Product
          </h1>
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mt-1")}>
            Create products individually or in bulk
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setInputMode('single')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
              ds.typography.size.xs,
              inputMode === 'single'
                ? 'bg-white/10 border-white/30 text-white'
                : cn(ds.colors.bg.elevated, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
            )}
          >
            <Package className="w-4 h-4" strokeWidth={1.5} />
            Single Product
          </button>
          <button
            onClick={() => setInputMode('bulk')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
              ds.typography.size.xs,
              inputMode === 'bulk'
                ? 'bg-white/10 border-white/30 text-white'
                : cn(ds.colors.bg.elevated, ds.colors.border.default, ds.colors.text.tertiary, "hover:border-white/20")
            )}
          >
            <Layers className="w-4 h-4" strokeWidth={1.5} />
            Bulk Import
          </button>
        </div>

        {/* Single Product Mode */}
        {inputMode === 'single' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
              <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-4")}>
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Product Name *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Blue Dream, Wedding Cake"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAIAutofill}
                      disabled={loadingAI || !formData.name}
                      variant="secondary"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                      {loadingAI ? 'Loading...' : 'AI Fill'}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      ds.typography.size.xs,
                      ds.colors.bg.primary,
                      ds.colors.border.default,
                      "border text-white/90",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    )}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this product..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90")}>
                  Pricing
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingMode('single')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border transition-colors",
                      ds.typography.size.micro,
                      pricingMode === 'single'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : cn(ds.colors.bg.primary, ds.colors.border.default, "text-white/60 hover:text-white/80")
                    )}
                  >
                    <DollarSign className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('tiered')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border transition-colors",
                      ds.typography.size.micro,
                      pricingMode === 'tiered'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : cn(ds.colors.bg.primary, ds.colors.border.default, "text-white/60 hover:text-white/80")
                    )}
                  >
                    <Layers className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                    Tiered Pricing
                  </button>
                </div>
              </div>

              {pricingMode === 'single' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                      Price *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                      Cost Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className={cn("flex gap-2 p-3 rounded-lg", ds.colors.bg.primary)}>
                      <Input
                        placeholder="Weight (e.g., 1g)"
                        value={tier.weight}
                        onChange={(e) => updatePricingTier(index, 'weight', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removePricingTier(index)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          "text-red-400/70 hover:bg-red-500/10"
                        )}
                      >
                        <Minus className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <Button type="button" onClick={addPricingTier} variant="secondary" size="sm">
                    <Plus className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    Add Tier
                  </Button>
                </div>
              )}
            </div>

            {/* Images */}
            <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
              <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-4")}>
                Product Images
              </h2>

              <div className="space-y-3">
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-red-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className={cn(
                  "block w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center",
                  ds.colors.border.default,
                  "hover:border-white/20"
                )}>
                  <ImageIcon className={cn("w-8 h-8 mx-auto mb-2", ds.colors.text.quaternary)} strokeWidth={1.5} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                  <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                    {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                  </p>
                </label>
              </div>
            </div>

            {/* Dynamic Fields */}
            {loadingFields ? (
              <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>Loading fields...</p>
              </div>
            ) : Object.keys(groupedFields).length > 0 && (
              <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-4")}>
                  Product Details
                </h2>

                {Object.entries(groupedFields).map(([groupName, fields]) => (
                  <div key={groupName} className="mb-6 last:mb-0">
                    {groupName !== 'Other' && (
                      <h3 className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mb-3")}>{groupName}</h3>
                    )}
                    <div className="space-y-4">
                      {fields.map(field => (
                        <div key={field.name}>
                          <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                            {field.label}
                            {field.required && <span className="text-red-400/70 ml-1">*</span>}
                          </label>
                          {renderField(field)}
                          {field.description && (
                            <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-1")}>
                              {field.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inventory */}
            {formData.category_id && (
              <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-4")}>
                  Inventory
                </h2>
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                    Initial Quantity (grams)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.initial_quantity}
                    onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: ds.colors.border.default }}>
              <Link href="/vendor/products">
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors",
                    ds.typography.size.xs,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    ds.colors.text.tertiary,
                    "hover:text-white/80"
                  )}
                >
                  Cancel
                </button>
              </Link>

              <Button type="submit" disabled={loading}>
                <Save className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                {loading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        )}

        {/* Bulk Import Mode */}
        {inputMode === 'bulk' && (
          <div className="space-y-6">
            {/* Bulk Input */}
            {bulkProducts.length === 0 && (
              <>
                <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                  <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-4")}>
                    Category Selection
                  </h2>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      ds.typography.size.xs,
                      ds.colors.bg.primary,
                      ds.colors.border.default,
                      "border text-white/90",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    )}
                  >
                    <option value="">Select category for all products</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                  <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-2")}>
                    Product List
                  </h2>
                  <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-4")}>
                    Enter one product per line: Name, Price, Cost (optional)
                  </p>
                  <Textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Blue Dream, 45, 20&#10;Wedding Cake, 50, 25&#10;Gelato, 55, 30"
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBulkAIEnrich}
                    disabled={loadingAI || !bulkInput.trim() || !bulkCategory}
                    className="flex-1"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    {loadingAI ? 'Enriching with AI...' : 'Enrich with AI'}
                  </Button>
                </div>
              </>
            )}

            {/* Bulk Review */}
            {bulkProducts.length > 0 && (
              <>
                <div className={cn("p-6 rounded-lg border", ds.colors.bg.elevated, ds.colors.border.default)}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90")}>
                      Review Products ({currentReviewIndex + 1} / {bulkProducts.length})
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1))}
                        disabled={currentReviewIndex === 0}
                        className={cn(
                          "p-2 rounded-lg border transition-colors",
                          ds.colors.bg.elevated,
                          ds.colors.border.default,
                          "disabled:opacity-50"
                        )}
                      >
                        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setCurrentReviewIndex(Math.min(bulkProducts.length - 1, currentReviewIndex + 1))}
                        disabled={currentReviewIndex === bulkProducts.length - 1}
                        className={cn(
                          "p-2 rounded-lg border transition-colors",
                          ds.colors.bg.elevated,
                          ds.colors.border.default,
                          "disabled:opacity-50"
                        )}
                      >
                        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                        Product Name
                      </label>
                      <Input
                        value={bulkProducts[currentReviewIndex]?.name || ''}
                        onChange={(e) => {
                          const updated = [...bulkProducts];
                          updated[currentReviewIndex].name = e.target.value;
                          setBulkProducts(updated);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                          Price
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bulkProducts[currentReviewIndex]?.price || ''}
                          onChange={(e) => {
                            const updated = [...bulkProducts];
                            updated[currentReviewIndex].price = e.target.value;
                            setBulkProducts(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                          Cost Price
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bulkProducts[currentReviewIndex]?.cost_price || ''}
                          onChange={(e) => {
                            const updated = [...bulkProducts];
                            updated[currentReviewIndex].cost_price = e.target.value;
                            setBulkProducts(updated);
                          }}
                        />
                      </div>
                    </div>

                    {/* Show AI-enriched fields if available */}
                    {bulkEnrichedData[bulkProducts[currentReviewIndex]?.name] && (
                      <div className={cn("p-4 rounded-lg", ds.colors.bg.primary, "border border-blue-500/20")}>
                        <p className={cn(ds.typography.size.micro, "text-blue-300/80 mb-2")}>
                          ✨ AI-enriched data
                        </p>
                        <div className="space-y-2 text-xs text-white/60">
                          {Object.entries(bulkProducts[currentReviewIndex].custom_fields).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-white/40">{key}:</span> {Array.isArray(value) ? value.join(', ') : value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setBulkProducts([]);
                      setBulkEnrichedData({});
                      setCurrentReviewIndex(0);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg transition-colors",
                      ds.typography.size.xs,
                      ds.typography.transform.uppercase,
                      ds.typography.tracking.wide,
                      ds.colors.text.tertiary,
                      "hover:text-white/80"
                    )}
                  >
                    Cancel
                  </button>

                  <Button
                    onClick={handleBulkSubmit}
                    disabled={bulkProcessing}
                    className="flex-1"
                  >
                    <Upload className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    {bulkProcessing ? 'Creating Products...' : `Create ${bulkProducts.length} Products`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
