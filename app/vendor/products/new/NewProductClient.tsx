"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, FileText, CheckCircle, AlertCircle, Loader, Package, DollarSign, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import ProductFormHeader from './components/ProductFormHeader';
import InputModeToggle from './components/InputModeToggle';
import ProductBasicInfo from './components/ProductBasicInfo';
import DynamicFieldsPanel from './components/DynamicFieldsPanel';
import PricingPanel from './components/PricingPanel';
import ImageUploadPanel from './components/ImageUploadPanel';
import COAUploadPanel from './components/COAUploadPanel';
import BulkImportPanel from './components/BulkImportPanel';

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
  min?: number;
  max?: number;
  suffix?: string;
  source?: string;
  groupName?: string;
  isRequired?: boolean;
  readonly?: boolean;
}

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

  // Category and dynamic fields state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>({});
  const [loadingFields, setLoadingFields] = useState(false);

  // Bulk input state
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkCategory, setBulkCategory] = useState(''); // Category for entire bulk batch
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkEnrichedData, setBulkEnrichedData] = useState<Record<string, any>>({}); // Store AI data by product name
  const [bulkAIProgress, setBulkAIProgress] = useState({ current: 0, total: 0 });
  const [bulkProducts, setBulkProducts] = useState<Array<{
    name: string,
    price: string,
    cost_price: string,
    pricing_mode: 'single' | 'tiered',
    pricing_tiers: Array<{weight: string, qty: number, price: string}>,
    custom_fields: Record<string, any> // ONLY source of truth for product fields
  }>>([]);
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [pricingConfigs, setPricingConfigs] = useState<any[]>([]); // Full configs with blueprints + pricing values
  const [bulkImages, setBulkImages] = useState<Array<{file: File, url: string, matchedTo: string | null}>>([]);
  const [lastSelectedPricingMode, setLastSelectedPricingMode] = useState<'single' | 'tiered'>('single'); // Track last pricing mode selection
  const [explicitlySetPricingModes, setExplicitlySetPricingModes] = useState<Set<number>>(new Set()); // Track which products had pricing mode explicitly set
  const [lastSelectedTierTemplate, setLastSelectedTierTemplate] = useState<any | null>(null); // Track last tier template selection
  const [explicitlySetTierTemplates, setExplicitlySetTierTemplates] = useState<Set<number>>(new Set()); // Track which products had tier template explicitly set

  // AI Autofill state
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiAbortController, setAiAbortController] = useState<AbortController | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost_price: '',
    initial_quantity: '',
    product_visibility: 'internal' as 'internal' | 'marketplace', // TRUE MULTI-TENANT: Default to internal (auto-publish)
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Only load parent categories for dropdown (keeps it clean)
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

  // Load pricing blueprints for vendor
  useEffect(() => {
    const loadPricingBlueprints = async () => {
      if (!vendor?.id) return;

      try {
        const response = await axios.get(`/api/vendor/pricing-config?vendor_id=${vendor.id}`);
        if (response.data.success) {
          // Store full configs (with both blueprint structure and pricing values)
          const configs = (response.data.configs || []).filter((config: any) => config.blueprint);
          setPricingConfigs(configs);
          console.log('📊 Loaded pricing configs:', configs.length);
        }
      } catch (error) {
        console.error('Failed to load pricing configs:', error);
      }
    };
    loadPricingBlueprints();
  }, [vendor?.id]);

  // Load dynamic fields when category changes
  useEffect(() => {
    const loadFields = async () => {
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
          console.log('Raw API response:', response.data);
          console.log('Admin fields:', response.data.adminFields);
          console.log('Merged fields:', response.data.merged);

          const fields = (response.data.merged || []).map((field: any) => ({
            ...field,
            label: field.label || field.name, // Map name to label if label doesn't exist
            name: field.slug || field.name // Use slug as the field name/key
          }));
          console.log('Processed dynamic fields:', fields);
          setDynamicFields(fields);
        }
      } catch (error) {
        console.error('Failed to load product fields:', error);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [categoryId, vendor?.id]);

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

  // Cancel AI autofill
  const cancelAIAutofill = () => {
    if (aiAbortController) {
      aiAbortController.abort();
      setAiAbortController(null);
      setLoadingAI(false);
      setBulkAIProgress({ current: 0, total: 0 });
      showNotification({
        type: 'info',
        title: 'AI Cancelled',
        message: 'Autofill operation cancelled',
      });
    }
  };

  // Bulk AI enrichment - OPTIMIZED with batch processing
  const handleBulkAIEnrich = async (selectedFields: string[], customPrompt: string) => {
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

    if (selectedFields.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Fields Selected',
        message: 'Select at least one field to autofill',
      });
      return;
    }

    const abortController = new AbortController();
    setAiAbortController(abortController);
    setLoadingAI(true);

    const enrichedData: Record<string, any> = {};
    const parsedProducts: Array<{name: string, price: string, cost_price: string, pricing_mode: 'single' | 'tiered', pricing_tiers: any[], custom_fields: Record<string, any>}> = [];

    try {
      const lines = bulkInput.split('\n').filter(line => line.trim());
      setBulkAIProgress({ current: 0, total: lines.length });

      // Parse all products first
      const productsToEnrich: Array<{name: string, price: string, cost: string}> = [];
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 1) continue;

        const [name, price, cost] = parts;
        productsToEnrich.push({ name, price: price || '', cost: cost || price || '' });

        parsedProducts.push({
          name,
          price: price || '',
          cost_price: cost || price || '',
          pricing_mode: lastSelectedPricingMode,
          pricing_tiers: [],
          custom_fields: {} // ONLY source of truth for product fields
        });
      }

      // Dispatch AI start event for monitor
      window.dispatchEvent(new CustomEvent('ai-autofill-start'));

      // Show initial progress with time estimate
      const estimatedSeconds = Math.ceil(productsToEnrich.length / 5) * 15; // ~15 sec per batch of 5
      const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: {
          message: `# Bulk AI Enrichment\n\n📦 Processing ${productsToEnrich.length} products...\n\n⏱️ Estimated time: ${estimatedMinutes} ${estimatedMinutes === 1 ? 'minute' : 'minutes'}\n\n`
        }
      }));

      // Call STREAMING API for real-time progress
      const categoryName = categories.find(c => c.id === bulkCategory)?.name || '';
      console.log('🚀 Starting bulk autofill stream:', {
        productsCount: productsToEnrich.length,
        category: categoryName
      });

      const response = await fetch('/api/ai/bulk-autofill-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsToEnrich,
          category: categoryName,
          selectedFields: selectedFields,
          customPrompt: customPrompt || undefined
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start bulk enrichment');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

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

            console.log('📥 Stream event:', data.type, data);

            switch (data.type) {
              case 'start':
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: { message: `\n${data.message}\n` }
                }));
                break;

              case 'batch_start':
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: { message: `\n${data.message}` }
                }));
                break;

              case 'progress':
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: { message: `\n${data.message}` }
                }));
                break;

              case 'batch_complete':
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: {
                    message: `\n${data.message}\n**Progress: ${data.completed}/${data.total} products processed**\n`
                  }
                }));
                break;

              case 'batch_error':
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: { message: `\n⚠️ ${data.message}` }
                }));
                break;

              case 'complete':
                allResults = data.results || [];
                window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
                  detail: {
                    message: `\n\n## ${data.message}\n\n${data.failed > 0 ? `⚠️ ${data.failed} products failed (will use default values)\n` : '✨ All products enriched successfully!'}`
                  }
                }));
                break;

              case 'error':
                throw new Error(data.message);
            }
          }
        }
      }

      // Process final results
      let successCount = 0;
      for (const result of allResults) {
        if (result.success && result.suggestions) {
          const suggestions = result.suggestions;
          enrichedData[result.product_name] = {
            strain_type: suggestions.strain_type,
            lineage: suggestions.lineage,
            nose: suggestions.nose,
            effects: suggestions.effects,
            terpene_profile: suggestions.terpene_profile,
            description: suggestions.description
          };
          successCount++;
        }
      }

      console.log(`✅ Stream complete: ${successCount} products enriched`);

      // Populate custom_fields from AI data (STRAIN DATA ONLY - no lab test percentages)
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
      const enrichedCount = Object.keys(enrichedData).length;

      // Show review interface
      setShowBulkReview(true);
      setCurrentReviewIndex(0);
      setExplicitlySetPricingModes(new Set()); // Reset for new batch
      setExplicitlySetTierTemplates(new Set()); // Reset tier template tracking
      setLastSelectedTierTemplate(null); // Reset last selected template

      // Dispatch complete event
      window.dispatchEvent(new CustomEvent('ai-autofill-complete'));

      showNotification({
        type: 'success',
        title: 'AI Enrichment Complete',
        message: `Enriched ${enrichedCount}/${lines.length} products - Review pricing`,
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Bulk AI enrichment cancelled');
        window.dispatchEvent(new CustomEvent('ai-autofill-complete'));
        return;
      }
      console.error('❌ Bulk AI error:', error);
      console.error('❌ Error message:', error.message);

      const errorMsg = error.message || 'Unknown error occurred';

      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: { message: `\n## ❌ Error\n\n${errorMsg}\n\nPlease try again or contact support if the issue persists.` }
      }));
      window.dispatchEvent(new CustomEvent('ai-autofill-complete'));

      showNotification({
        type: 'error',
        title: 'AI Processing Failed',
        message: errorMsg,
      });
    } finally {
      setLoadingAI(false);
      setBulkAIProgress({ current: 0, total: 0 });
      setAiAbortController(null);
    }
  };

  // AI Autofill - Quick product data extraction
  const handleAIAutofill = async (selectedFields: string[], customPrompt: string) => {
    if (!formData.name.trim()) {
      showNotification({
        type: 'warning',
        title: 'Product Name Required',
        message: 'Enter a product name to autofill data',
      });
      return;
    }

    if (!categoryId || !formData.category) {
      showNotification({
        type: 'warning',
        title: 'Category Required',
        message: 'Select a category first to load fields',
      });
      return;
    }

    if (dynamicFields.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Loading Fields',
        message: 'Wait for category fields to load',
      });
      return;
    }

    const abortController = new AbortController();
    setAiAbortController(abortController);

    try {
      setLoadingAI(true);
      const response = await axios.post('/api/ai/quick-autofill', {
        productName: formData.name,
        category: formData.category,
        selectedFields: selectedFields, // NEW: pass selected fields
        customPrompt: customPrompt || undefined // NEW: pass custom prompt if provided
      }, {
        signal: abortController.signal
      });

      if (response.data.success && response.data.suggestions) {
        console.log('🤖 AI SUGGESTIONS RECEIVED:', response.data.suggestions);
        console.log('📊 Lineage:', response.data.suggestions.lineage);
        console.log('👃 Nose:', response.data.suggestions.nose);
        setAiSuggestions(response.data.suggestions);
        setShowSuggestions(true);
        showNotification({
          type: 'success',
          title: 'AI Suggestions Ready',
          message: 'Review and apply suggestions below',
        });
      } else {
        showNotification({
          type: 'info',
          title: 'No Data Found',
          message: 'Try a different product name',
        });
      }
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('AI autofill cancelled');
        return;
      }
      console.error('AI autofill error:', error);
      showNotification({
        type: 'error',
        title: 'Autofill Failed',
        message: 'Could not fetch product data',
      });
    } finally {
      setLoadingAI(false);
      setAiAbortController(null);
    }
  };

  // Apply AI suggestions to form - with field selection support
  const applyAISuggestions = (selectedFields: string[]) => {
    if (!aiSuggestions) {
      console.error('❌ No AI suggestions to apply');
      return;
    }

    console.log('🎯 Starting AI autofill...');
    console.log('📦 AI Suggestions:', aiSuggestions);
    console.log('✅ Selected Fields:', selectedFields);
    console.log('📋 Available Fields:', dynamicFields.map(f => ({
      name: f.name,
      label: f.label,
      type: f.type
    })));

    const updates: Record<string, any> = {};
    let appliedCount = 0;

    // Helper: Find field by exact slug or name match
    const findField = (slugs: string[]) => {
      for (const slug of slugs) {
        const field = dynamicFields.find(f =>
          f.name === slug ||
          f.slug === slug ||
          (f.name || '').toLowerCase() === slug.toLowerCase() ||
          (f.slug || '').toLowerCase() === slug.toLowerCase()
        );
        if (field) {
          console.log(`✅ Found field for "${slug}":`, field.name, `(${field.type})`);
          return field;
        }
      }
      console.warn(`❌ No field found for any of: ${slugs.join(', ')}`);
      return null;
    };

    // 1. STRAIN TYPE
    if (selectedFields.includes('strain_type') && aiSuggestions.strain_type) {
      const field = findField(['strain_type', 'straintype', 'strain type']);
      if (field) {
        updates[field.name] = aiSuggestions.strain_type;
        appliedCount++;
        console.log(`  → ${field.name} = "${aiSuggestions.strain_type}"`);
      }
    }

    // 2. TERPENE PROFILE (multiselect array)
    if (selectedFields.includes('terpene_profile') && aiSuggestions.terpenes && Array.isArray(aiSuggestions.terpenes) && aiSuggestions.terpenes.length > 0) {
      const field = findField(['terpene_profile', 'terpenes', 'terpene profile']);
      if (field) {
        // Always store as array for multiselect
        updates[field.name] = aiSuggestions.terpenes;
        appliedCount++;
        console.log(`  → ${field.name} = [${aiSuggestions.terpenes.join(', ')}] (${aiSuggestions.terpenes.length} items)`);
      }
    }

    // 3. EFFECTS (multiselect array)
    if (selectedFields.includes('effects') && aiSuggestions.effects && Array.isArray(aiSuggestions.effects) && aiSuggestions.effects.length > 0) {
      const field = findField(['effects', 'effect']);
      if (field) {
        // Always store as array for multiselect
        updates[field.name] = aiSuggestions.effects;
        appliedCount++;
        console.log(`  → ${field.name} = [${aiSuggestions.effects.join(', ')}] (${aiSuggestions.effects.length} items)`);
      }
    }

    // 4. LINEAGE
    if (selectedFields.includes('lineage') && aiSuggestions.lineage) {
      const field = findField(['lineage', 'genetics', 'parentage']);
      if (field) {
        updates[field.name] = aiSuggestions.lineage;
        appliedCount++;
        console.log(`  → ${field.name} = "${aiSuggestions.lineage}"`);
      }
    }

    // 5. NOSE / AROMA (now expects array like ["Candy", "Cake", "Glue"])
    if (selectedFields.includes('nose') && aiSuggestions.nose && Array.isArray(aiSuggestions.nose) && aiSuggestions.nose.length > 0) {
      const field = findField(['nose', 'aroma', 'scent']);
      if (field) {
        // Store as comma-separated string
        const noseString = aiSuggestions.nose.join(', ');
        updates[field.name] = noseString;
        appliedCount++;
        console.log(`  → ${field.name} = "${noseString}"`);
      }
    }

    // 6. DESCRIPTION
    if (selectedFields.includes('description') && aiSuggestions.description) {
      setFormData({ ...formData, description: aiSuggestions.description });
      appliedCount++;
      console.log(`  → description = "${aiSuggestions.description.substring(0, 50)}..."`);
    }

    // Apply all updates at once
    console.log('💾 Final updates object:', updates);
    console.log(`✨ Applying ${appliedCount} field updates...`);

    setCustomFieldValues({ ...customFieldValues, ...updates });
    setShowSuggestions(false);

    showNotification({
      type: 'success',
      title: 'AI Applied',
      message: `${appliedCount} fields populated`,
      duration: 3000
    });

    console.log('✅ AI autofill complete!');
  };

  // Quick pricing templates for common cannabis weights
  const applyPricingTemplate = (template: 'budget' | 'mid' | 'premium' | 'exotic') => {
    const templates = {
      budget: [
        { weight: '1g', qty: 1, price: '8.00' },
        { weight: '3.5g', qty: 1, price: '25.00' },
        { weight: '7g', qty: 1, price: '45.00' },
        { weight: '14g', qty: 1, price: '80.00' },
        { weight: '28g', qty: 1, price: '140.00' }
      ],
      mid: [
        { weight: '1g', qty: 1, price: '12.00' },
        { weight: '3.5g', qty: 1, price: '35.00' },
        { weight: '7g', qty: 1, price: '65.00' },
        { weight: '14g', qty: 1, price: '120.00' },
        { weight: '28g', qty: 1, price: '200.00' }
      ],
      premium: [
        { weight: '1g', qty: 1, price: '15.00' },
        { weight: '3.5g', qty: 1, price: '45.00' },
        { weight: '7g', qty: 1, price: '85.00' },
        { weight: '14g', qty: 1, price: '160.00' },
        { weight: '28g', qty: 1, price: '280.00' }
      ],
      exotic: [
        { weight: '1g', qty: 1, price: '20.00' },
        { weight: '3.5g', qty: 1, price: '60.00' },
        { weight: '7g', qty: 1, price: '110.00' },
        { weight: '14g', qty: 1, price: '200.00' },
        { weight: '28g', qty: 1, price: '350.00' }
      ]
    };

    setPricingTiers(templates[template]);
    setPricingMode('tiered');

    showNotification({
      type: 'success',
      title: 'Template Applied',
      message: `${template.charAt(0).toUpperCase() + template.slice(1)} pricing tier loaded`,
    });
  };

  // Match image filename to product name using fuzzy matching
  const matchImageToProduct = (filename: string, productNames: string[]): string | null => {
    // Remove file extension and clean filename
    const cleanFilename = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .trim();

    console.log(`🔍 Matching image: "${filename}" → cleaned: "${cleanFilename}"`);

    // Try exact match first
    for (const productName of productNames) {
      const cleanProductName = productName.toLowerCase().trim();
      if (cleanFilename === cleanProductName) {
        console.log(`✅ Exact match: "${filename}" → "${productName}"`);
        return productName;
      }
    }

    // Try partial match (filename contains product name or vice versa)
    for (const productName of productNames) {
      const cleanProductName = productName.toLowerCase().replace(/[-_]/g, ' ').trim();
      if (cleanFilename.includes(cleanProductName) || cleanProductName.includes(cleanFilename)) {
        console.log(`✅ Partial match: "${filename}" → "${productName}"`);
        return productName;
      }
    }

    // Try word-based matching
    const filenameWords = cleanFilename.split(' ').filter(Boolean);
    for (const productName of productNames) {
      const productWords = productName.toLowerCase().split(' ').filter(Boolean);
      const matchingWords = filenameWords.filter(word => productWords.includes(word));
      if (matchingWords.length >= 2 || (matchingWords.length === 1 && productWords.length === 1)) {
        console.log(`✅ Word match: "${filename}" → "${productName}"`);
        return productName;
      }
    }

    console.log(`❌ No match found for: "${filename}"`);
    return null;
  };

  // Handle image uploads
  const handleBulkImageUpload = async (files: FileList | File[]) => {
    if (!bulkProducts.length) {
      showNotification({
        type: 'warning',
        title: 'No Products',
        message: 'Add products first, then upload images',
      });
      return;
    }

    setUploadingImages(true);
    const productNames = bulkProducts.map(p => p.name);
    const newImages: Array<{file: File, url: string, matchedTo: string | null}> = [];

    try {
      // Convert to array if FileList
      const filesArray = Array.from(files);

      for (const file of filesArray) {
        // Create preview URL
        const url = URL.createObjectURL(file);

        // Match to product
        const matchedProduct = matchImageToProduct(file.name, productNames);

        newImages.push({
          file,
          url,
          matchedTo: matchedProduct
        });
      }

      setBulkImages([...bulkImages, ...newImages]);

      const matchedCount = newImages.filter(img => img.matchedTo).length;
      showNotification({
        type: 'success',
        title: 'Images Uploaded',
        message: `${matchedCount}/${newImages.length} images auto-matched to products`,
      });

      console.log('📸 Images uploaded:', newImages);
    } catch (error) {
      console.error('Image upload error:', error);
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Could not process images',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleApplyPricingTemplate = (config: any) => {
    const updated = [...bulkProducts];
    const blueprint = config.blueprint;
    const pricingValues = config.pricing_values || {};

    // Merge price_breaks structure with pricing_values prices
    updated[currentReviewIndex].pricing_tiers = (blueprint.price_breaks || [])
      .filter((pb: any) => {
        // Only include enabled tiers
        const priceData = pricingValues[pb.break_id];
        return priceData && priceData.enabled !== false;
      })
      .map((pb: any) => {
        const priceData = pricingValues[pb.break_id] || {};
        return {
          weight: pb.label || `${pb.qty}${pb.unit}`,
          qty: 1,
          price: priceData.price || ''
        };
      });

    setBulkProducts(updated);

    showNotification({
      type: 'success',
      title: 'Template Applied',
      message: `Applied ${blueprint.name} pricing`,
    });
  };

  const handleBulkSubmit = async () => {
    // If products have been reviewed, use bulkProducts array
    if (bulkProducts.length > 0) {
      if (!bulkCategory) {
        showNotification({
          type: 'warning',
          title: 'Category Required',
          message: 'Select a category for this bulk batch',
        });
        return;
      }

      setBulkProcessing(true);
      setError('');

      try {
        let successCount = 0;
        let failCount = 0;

        for (const product of bulkProducts) {
          const { name, price, cost_price, pricing_mode, pricing_tiers, custom_fields } = product;

          try {
            // Get description from enriched data if available
            const enrichedData = bulkEnrichedData[name] || {};
            const description = enrichedData.description || `Bulk imported product: ${name}`;

            // Upload matched images for this product
            const matchedImages = bulkImages.filter(img => img.matchedTo === name);
            const imageUrls: string[] = [];

            for (const img of matchedImages) {
              try {
                const formData = new FormData();
                formData.append('file', img.file);
                formData.append('type', 'product');

                const uploadResponse = await axios.post('/api/supabase/vendor/upload', formData, {
                  headers: {
                    'x-vendor-id': vendor?.id,
                    'Content-Type': 'multipart/form-data'
                  }
                });

                if (uploadResponse.data.success && uploadResponse.data.url) {
                  imageUrls.push(uploadResponse.data.url);
                  console.log(`📸 Uploaded image for ${name}:`, uploadResponse.data.url);
                }
              } catch (imgError) {
                console.error(`Failed to upload image for ${name}:`, imgError);
              }
            }

            const productData: any = {
              name,
              category_id: bulkCategory, // Use category ID instead of name
              product_type: 'simple',
              product_visibility: 'internal', // TRUE MULTI-TENANT: Bulk uploads default to internal (auto-publish)
              pricing_mode,
              image_urls: imageUrls,
              custom_fields, // ONLY source of truth for product fields
              description
            };

            // Add pricing based on mode
            if (pricing_mode === 'single') {
              productData.price = price ? parseFloat(price) : null;
              productData.cost_price = cost_price ? parseFloat(cost_price) : null;
            } else if (pricing_mode === 'tiered') {
              productData.pricing_tiers = pricing_tiers;
            }

            const hasEnrichedData = Object.keys(custom_fields).length > 0;
            console.log(`📦 Submitting ${name}${hasEnrichedData ? ' with AI data' : ''}:`, productData);

            const response = await axios.post('/api/vendor/products', productData, {
              headers: { 'x-vendor-id': vendor?.id },
            });

            if (response.data.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (err) {
            failCount++;
            console.error(`Failed to create product: ${name}`, err);
          }
        }

        setBulkProcessing(false);
        setShowBulkReview(false);
        setBulkProducts([]);
        setBulkEnrichedData({});
        setBulkInput('');
        setBulkCategory('');

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
        setBulkProcessing(false);
        setError('Bulk import failed');
        showNotification({
          type: 'error',
          title: 'Import Failed',
          message: 'Could not process bulk products',
        });
      }
      return;
    }

    // Fallback: Old direct submission flow (if no review used)
    if (!bulkInput.trim()) {
      showNotification({
        type: 'warning',
        title: 'No Data',
        message: 'Please enter product data',
      });
      return;
    }

    showNotification({
      type: 'info',
      title: 'Use AI Enrich',
      message: 'Click "AI Enrich" to review products before submitting',
    });
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
        cost_price: formData.cost_price || null,
        product_visibility: formData.product_visibility, // TRUE MULTI-TENANT: Internal (auto-publish) or Marketplace (pending)
        image_urls: uploadedImageUrls,
        coa_url: uploadedCoaUrl,
        product_type: productType,
        // Add dynamic blueprint fields - ONLY source of truth for product fields
        custom_fields: customFieldValues,
        field_visibility: fieldVisibility // Controls which fields show on storefront product cards
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
      <ProductFormHeader inputMode={inputMode} />

      {/* Form Container */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <InputModeToggle
          inputMode={inputMode}
          onModeChange={setInputMode}
        />

        {/* Bulk Input Mode */}
        {inputMode === 'bulk' ? (
          <BulkImportPanel
            bulkCategory={bulkCategory}
            onBulkCategoryChange={setBulkCategory}
            categories={categories}
            bulkInput={bulkInput}
            onBulkInputChange={setBulkInput}
            onBulkAIEnrich={handleBulkAIEnrich}
            bulkAIProgress={bulkAIProgress}
            bulkProducts={bulkProducts}
            onBulkProductsChange={setBulkProducts}
            currentReviewIndex={currentReviewIndex}
            onCurrentReviewIndexChange={setCurrentReviewIndex}
            bulkImages={bulkImages}
            onBulkImageUpload={handleBulkImageUpload}
            uploadingImages={uploadingImages}
            pricingConfigs={pricingConfigs}
            onApplyPricingTemplate={handleApplyPricingTemplate}
            bulkProcessing={bulkProcessing}
            onBulkSubmit={handleBulkSubmit}
            onCancel={() => setInputMode('single')}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-[#141414] border border-green-500/20 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-black text-[10px] uppercase tracking-[0.15em] mb-1" style={{ fontWeight: 900 }}>Submitted</p>
                <p className="text-green-400/70 text-[10px] text-white/60">Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-[#141414] border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-black text-[10px] uppercase tracking-[0.15em] mb-1" style={{ fontWeight: 900 }}>Failed</p>
                <p className="text-red-400/70 text-[10px]">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <ProductBasicInfo
            formData={formData}
            categoryId={categoryId}
            productType={productType}
            categories={categories}
            loadingFields={loadingFields}
            dynamicFields={dynamicFields}
            loadingAI={loadingAI}
            aiSuggestions={aiSuggestions}
            showSuggestions={showSuggestions}
            onFormDataChange={setFormData}
            onCategoryChange={(id) => {
              const selectedCategory = categories.find(c => c.id === id);
              setCategoryId(id);
              setFormData({...formData, category: selectedCategory?.name || ''});
            }}
            onProductTypeChange={setProductType}
            onAIAutofill={handleAIAutofill}
            onApplySuggestions={applyAISuggestions}
            onCloseSuggestions={() => setShowSuggestions(false)}
          />

          {/* Pricing */}
          <PricingPanel
            productType={productType}
            pricingMode={pricingMode}
            formData={formData}
            pricingTiers={pricingTiers}
            newTierWeight={newTierWeight}
            newTierQty={newTierQty}
            newTierPrice={newTierPrice}
            onPricingModeChange={setPricingMode}
            onFormDataChange={setFormData}
            onNewTierChange={(field, value) => {
              if (field === 'weight') setNewTierWeight(value);
              else if (field === 'qty') setNewTierQty(value);
              else if (field === 'price') setNewTierPrice(value);
            }}
            onAddTier={addPricingTier}
            onUpdateTier={updatePricingTier}
            onRemoveTier={removePricingTier}
            onApplyTemplate={applyPricingTemplate}
          />

        {/* Attributes & Variants - Only for Variable Products */}
        {productType === 'variable' && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
            <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 font-black" style={{ fontWeight: 900 }}>
              Product Attributes & Variations
            </h2>
            <p className="text-white/40 text-[10px] mb-4 uppercase tracking-[0.15em]">
              Define attributes (like Flavor, Size, Strength) and their values to create product variations.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
              <p className="text-blue-300/90 text-[9px] leading-relaxed">
                <strong className="font-black" style={{ fontWeight: 900 }}>How it works:</strong> 1) Add attribute (e.g., "Strength"), 2) Add values (e.g., "5MG", "10MG", "30MG"), 3) Click "Generate Variants", 4) Fill prices for each variant
              </p>
            </div>

            {/* Add Attribute */}
            <div className="mb-4">
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Add Attribute</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  placeholder="e.g., Flavor, Size, Strength"
                  className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em]"
                  style={{ fontWeight: 900 }}
                >
                  <Plus size={11} strokeWidth={2.5} />
                  Add
                </button>
              </div>
            </div>

            {/* Attributes List */}
            {attributes.length > 0 && (
              <div className="space-y-3 mb-4">
                {attributes.map((attr) => (
                  <div key={attr.name} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>{attr.name}</h3>
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr.name)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Add Value */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newAttributeValue}
                        onChange={(e) => setNewAttributeValue(e.target.value)}
                        placeholder={`Add ${attr.name} value...`}
                        className="flex-1 bg-black border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2 focus:outline-none focus:border-white/20 transition-all text-xs"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttributeValue(attr.name))}
                      />
                      <button
                        type="button"
                        onClick={() => addAttributeValue(attr.name)}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Values */}
                    {attr.values.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {attr.values.map((value) => (
                          <div
                            key={value}
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 text-[10px] text-white font-black uppercase tracking-tight"
                            style={{ fontWeight: 900 }}
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeAttributeValue(attr.name, value)}
                              className="text-white/60 hover:text-red-400 transition-colors"
                            >
                              <X size={10} strokeWidth={2.5} />
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
                    className="w-full px-3 py-2.5 bg-white/10 border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.15em]"
                    style={{ fontWeight: 900 }}
                  >
                    <Plus size={11} strokeWidth={2.5} />
                    Generate Variants ({attributes.reduce((acc, a) => acc * a.values.length, 1)} combinations)
                  </button>
                ) : (
                  <div className="w-full px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-center text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                    Add values to all attributes above, then generate variants
                  </div>
                )}
              </div>
            )}

            {/* Variants Table */}
            {variants.length > 0 && (
              <div className="mt-4">
                <h3 className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-3 font-black" style={{ fontWeight: 900 }}>Manage Variants ({variants.length})</h3>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-3 py-2.5 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                              Variant
                            </th>
                            <th className="px-3 py-2.5 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                              Price ($)
                            </th>
                            <th className="px-3 py-2.5 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                              SKU
                            </th>
                            <th className="px-3 py-2.5 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                              Stock
                            </th>
                            <th className="px-3 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {variants.map((variant, index) => (
                            <tr key={index} className="hover:bg-white/5 transition-colors">
                              <td className="px-3 py-2.5 text-[10px] text-white font-black uppercase tracking-tight whitespace-nowrap" style={{ fontWeight: 900 }}>
                                {variant.name}
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                  placeholder="Required"
                                  className={`w-28 bg-[#0a0a0a] border rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20 transition-all ${
                                    !variant.price ? 'border-red-400/50' : 'border-white/10'
                                  }`}
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                  placeholder="SKU-001"
                                  className="w-32 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20 transition-all"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                  placeholder="0"
                                  className="w-24 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20 transition-all"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                                >
                                  <X size={14} strokeWidth={2.5} />
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
        <ImageUploadPanel
          imagePreviews={imagePreviews}
          uploadedImageUrls={uploadedImageUrls}
          uploadingImages={uploadingImages}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
        />

        {/* Certificate of Analysis */}
        <COAUploadPanel
          coaFile={coaFile}
          uploadedCoaUrl={uploadedCoaUrl}
          uploadingCOA={uploadingCOA}
          onCOAUpload={handleCOAUpload}
          onRemoveCOA={() => {
            setCoAFile(null);
            setUploadedCoaUrl(null);
          }}
        />

        {/* Category-Specific Fields */}
        {/* Dynamic Fields */}
        {categoryId && dynamicFields.length > 0 && (
          <DynamicFieldsPanel
            dynamicFields={dynamicFields}
            customFieldValues={customFieldValues}
            onFieldChange={(fieldName, value) => {
              setCustomFieldValues(prev => ({
                ...prev,
                [fieldName]: value
              }));
            }}
            fieldVisibility={fieldVisibility}
            onFieldVisibilityChange={(fieldName, visible) => {
              setFieldVisibility(prev => ({
                ...prev,
                [fieldName]: visible
              }));
            }}
          />
        )}

        {/* Initial Quantity - Always show for Simple Products */}
        {categoryId && productType === 'simple' && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
            <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 font-black" style={{ fontWeight: 900 }}>
              Inventory
            </h2>
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Initial Quantity (grams)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.initial_quantity}
                onChange={(e) => setFormData({...formData, initial_quantity: e.target.value})}
                placeholder="100"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
              />
            </div>
          </div>
        )}

        {/* Submit - POS Style */}
        <div className="sticky bottom-0 z-10 bg-[#0a0a0a] border-t border-white/5 -mx-4 px-4 py-3">
          <div className="max-w-5xl mx-auto flex gap-2">
            <Link
              href="/vendor/products"
              className="flex-1 lg:flex-none text-center px-4 py-2.5 bg-[#141414] text-white/60 border border-white/10 rounded-xl hover:bg-white/5 hover:text-white hover:border-white/20 font-black transition-all text-[10px] uppercase tracking-[0.15em]"
              style={{ fontWeight: 900 }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 lg:flex-none px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 font-black transition-all text-[10px] uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 900 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader size={10} className="animate-spin" strokeWidth={3} />
                  Submitting...
                </span>
              ) : (
                'Submit for Review'
              )}
            </button>
          </div>
        </div>
      </form>
        )}
      </div>
    </div>
  );
}

