"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, FileText, CheckCircle, AlertCircle, Loader, Package, DollarSign, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DynamicField {
  name: string;
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
    custom_fields: Record<string, any>
  }>>([]);
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [pricingConfigs, setPricingConfigs] = useState<any[]>([]); // Full configs with blueprints + pricing values
  const [bulkImages, setBulkImages] = useState<Array<{file: File, url: string, matchedTo: string | null}>>([]);

  // AI Autofill state
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost_price: '',
    initial_quantity: '',
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/supabase/categories');
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

  // AI Autofill - Quick product data extraction
  const handleAIAutofill = async () => {
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

    try {
      setLoadingAI(true);
      const response = await axios.post('/api/ai/quick-autofill', {
        productName: formData.name,
        category: formData.category
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

  // Apply AI suggestions to form - COMPLETELY REWRITTEN
  const applyAISuggestions = () => {
    if (!aiSuggestions) {
      console.error('❌ No AI suggestions to apply');
      return;
    }

    console.log('🎯 Starting AI autofill...');
    console.log('📦 AI Suggestions:', aiSuggestions);
    console.log('📋 Available Fields:', dynamicFields.map(f => ({
      name: f.name,
      slug: f.slug,
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
    if (aiSuggestions.strain_type) {
      const field = findField(['strain_type', 'straintype', 'strain type']);
      if (field) {
        updates[field.name] = aiSuggestions.strain_type;
        appliedCount++;
        console.log(`  → ${field.name} = "${aiSuggestions.strain_type}"`);
      }
    }

    // 2. TERPENE PROFILE (multiselect array)
    if (aiSuggestions.terpenes && Array.isArray(aiSuggestions.terpenes) && aiSuggestions.terpenes.length > 0) {
      const field = findField(['terpene_profile', 'terpenes', 'terpene profile']);
      if (field) {
        // Always store as array for multiselect
        updates[field.name] = aiSuggestions.terpenes;
        appliedCount++;
        console.log(`  → ${field.name} = [${aiSuggestions.terpenes.join(', ')}] (${aiSuggestions.terpenes.length} items)`);
      }
    }

    // 3. EFFECTS (multiselect array)
    if (aiSuggestions.effects && Array.isArray(aiSuggestions.effects) && aiSuggestions.effects.length > 0) {
      const field = findField(['effects', 'effect']);
      if (field) {
        // Always store as array for multiselect
        updates[field.name] = aiSuggestions.effects;
        appliedCount++;
        console.log(`  → ${field.name} = [${aiSuggestions.effects.join(', ')}] (${aiSuggestions.effects.length} items)`);
      }
    }

    // 4. LINEAGE
    if (aiSuggestions.lineage) {
      const field = findField(['lineage', 'genetics', 'parentage']);
      if (field) {
        updates[field.name] = aiSuggestions.lineage;
        appliedCount++;
        console.log(`  → ${field.name} = "${aiSuggestions.lineage}"`);
      }
    }

    // 5. NOSE / AROMA (now expects array like ["Candy", "Cake", "Glue"])
    if (aiSuggestions.nose && Array.isArray(aiSuggestions.nose) && aiSuggestions.nose.length > 0) {
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
    if (aiSuggestions.description) {
      setFormData({ ...formData, description: aiSuggestions.description });
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
              category: bulkCategory,
              product_type: 'simple',
              pricing_mode,
              image_urls: imageUrls,
              custom_fields,
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
        image_urls: uploadedImageUrls,
        coa_url: uploadedCoaUrl,
        product_type: productType,
        // Add dynamic blueprint fields
        custom_fields: customFieldValues
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

  // Render dynamic field based on type (POS-style)
  const renderDynamicField = (field: DynamicField, index: number) => {
    const fieldValue = customFieldValues[field.name] || '';
    const handleChange = (value: any) => {
      setCustomFieldValues({ ...customFieldValues, [field.name]: value });
    };

    // Ensure we have a display label
    const displayLabel = field.label || field.name || 'Field';
    const isRequired = field.required || field.isRequired;

    const labelClasses = "block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black";
    const inputClasses = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs";
    const descClasses = "text-white/40 text-[10px] mt-1.5";

    switch (field.type) {
      case 'text':
      case 'url':
        return (
          <div key={index}>
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <input
              type={field.type}
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
            />
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={index} className="lg:col-span-2">
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <textarea
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${inputClasses} resize-none`}
            />
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={index}>
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                required={isRequired}
                value={fieldValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step="0.1"
                className={inputClasses}
              />
              {field.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                  {field.suffix}
                </span>
              )}
            </div>
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={index}>
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <select
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              className={`${inputClasses} cursor-pointer`}
            >
              <option value="">Select...</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={index}>
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <div className="space-y-2">
              {/* Selected items */}
              {fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fieldValue.map((item: string, idx: number) => (
                    <div key={idx} className="bg-white/10 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 text-[10px] text-white">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = fieldValue.filter((_: string, i: number) => i !== idx);
                          handleChange(newValue);
                        }}
                        className="text-white/60 hover:text-red-400 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Dropdown to add more */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                    if (!currentValues.includes(e.target.value)) {
                      handleChange([...currentValues, e.target.value]);
                    }
                  }
                }}
                className={`${inputClasses} cursor-pointer`}
              >
                <option value="">Add {displayLabel}...</option>
                {field.options?.map((option, idx) => (
                  <option key={idx} value={option} disabled={Array.isArray(fieldValue) && fieldValue.includes(option)}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={index} className="lg:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldValue === true || fieldValue === 'true'}
                onChange={(e) => handleChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a0a0a]"
              />
              <div>
                <span className="text-white text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>{displayLabel}</span>
                {field.description && <p className={descClasses}>{field.description}</p>}
              </div>
            </label>
          </div>
        );

      default:
        return (
          <div key={index}>
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
            />
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* POS-Style Header */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[9px] uppercase tracking-[0.15em] mb-3 transition-all font-black"
            style={{ fontWeight: 900 }}
          >
            <ArrowLeft size={10} strokeWidth={3} />
            Back
          </Link>

          <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
            Add New Product
          </h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
            Submit for approval
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Input Mode Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode('single')}
              className={`px-3 py-2 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                inputMode === 'single'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setInputMode('bulk')}
              className={`px-3 py-2 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                inputMode === 'bulk'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Bulk
            </button>
          </div>
        </div>

        {/* Bulk Input Mode */}
        {inputMode === 'bulk' ? (
          <div className="space-y-4">
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
              <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 font-black" style={{ fontWeight: 900 }}>
                Bulk Product Import
              </h2>

              {/* Category Selector for entire batch */}
              <div className="mb-4">
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                  Category for All Products <span className="text-red-400">*</span>
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-white/30 text-[9px] mt-1">All products in this batch will use this category</p>
              </div>

              <p className="text-white/40 text-[10px] mb-2 font-black" style={{ fontWeight: 900 }}>
                Product List
              </p>
              <p className="text-white/40 text-[9px] mb-3">
                Format: Name, Price (optional), Cost (optional) - One per line
              </p>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Blue Dream, 45&#10;OG Kush, 50, 35&#10;Wedding Cake, 55, 40&#10;White Widow&#10;Gelato, 60"
                rows={10}
                disabled={!bulkCategory}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all resize-none text-xs font-mono disabled:opacity-30"
              />

              {/* Image Upload Zone */}
              <div className="mt-4">
                <label className="block text-white/40 text-[10px] mb-2 font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                  Product Images (Optional)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-white/30', 'bg-white/5');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-white/30', 'bg-white/5');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-white/30', 'bg-white/5');
                    if (e.dataTransfer.files.length > 0) {
                      handleBulkImageUpload(e.dataTransfer.files);
                    }
                  }}
                  className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center transition-all"
                >
                  <input
                    type="file"
                    id="bulk-image-upload"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBulkImageUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="bulk-image-upload"
                    className="cursor-pointer"
                  >
                    {uploadingImages ? (
                      <div className="text-white/60 text-[10px]">
                        <Loader size={16} className="animate-spin mx-auto mb-2" />
                        Uploading...
                      </div>
                    ) : (
                      <>
                        <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">
                          Drag & drop images or click to browse
                        </div>
                        <div className="text-white/30 text-[9px]">
                          Images auto-match to products by filename
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Uploaded Images Preview */}
                {bulkImages.length > 0 && (
                  <div className="mt-3 bg-[#0a0a0a] border border-white/5 rounded-xl p-3">
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                      Uploaded Images ({bulkImages.length})
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {bulkImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.url}
                            alt={img.file.name}
                            className="w-full h-20 object-cover rounded-xl border border-white/10"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center p-1">
                            <div className="text-white text-[8px] text-center truncate w-full px-1">
                              {img.file.name}
                            </div>
                            {img.matchedTo && (
                              <div className="text-green-400 text-[8px] font-black mt-1">
                                → {img.matchedTo}
                              </div>
                            )}
                            {!img.matchedTo && (
                              <div className="text-white/40 text-[8px] mt-1">
                                No match
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(img.url);
                              setBulkImages(bulkImages.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={bulkProcessing || loadingAI}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 font-black transition-all text-[10px] uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontWeight: 900 }}
                >
                  {bulkProcessing ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader size={10} className="animate-spin" strokeWidth={3} />
                      Processing...
                    </span>
                  ) : (
                    'Import Products'
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
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
                    const parsedProducts: Array<{name: string, price: string, cost_price: string}> = [];

                    try {
                      const lines = bulkInput.split('\n').filter(line => line.trim());
                      setBulkAIProgress({ current: 0, total: lines.length });

                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const parts = line.split(',').map(p => p.trim());
                        if (parts.length < 1) continue;

                        // New format: Name, Price (optional), Cost (optional)
                        const [name, price, cost] = parts;

                        // Add to parsed products with default values
                        parsedProducts.push({
                          name,
                          price: price || '',
                          cost_price: cost || price || '',
                          pricing_mode: 'single',
                          pricing_tiers: [],
                          custom_fields: {}
                        });

                        setBulkAIProgress({ current: i + 1, total: lines.length });

                        try {
                          // Get AI suggestions using bulkCategory
                          const response = await axios.post('/api/ai/quick-autofill', {
                            productName: name,
                            category: bulkCategory
                          });

                          if (response.data.success && response.data.suggestions) {
                            const suggestions = response.data.suggestions;

                            // Store enriched data by product name
                            enrichedData[name] = {
                              strain_type: suggestions.strain_type,
                              lineage: suggestions.lineage,
                              nose: suggestions.nose,
                              effects: suggestions.effects,
                              terpenes: suggestions.terpenes,
                              description: suggestions.description
                            };

                            console.log(`✅ Enriched: ${name}`, enrichedData[name]);
                          }
                        } catch (err) {
                          console.error(`❌ Failed to enrich ${name}:`, err);
                        }
                      }

                      // Populate custom_fields from AI data
                      for (const product of parsedProducts) {
                        const aiData = enrichedData[product.name];
                        if (aiData) {
                          product.custom_fields = {
                            strain_type: aiData.strain_type || '',
                            lineage: aiData.lineage || '',
                            nose: Array.isArray(aiData.nose) ? aiData.nose.join(', ') : '',
                            effects: aiData.effects || [],
                            terpene_profile: aiData.terpenes || []
                          };
                        }
                      }

                      setBulkEnrichedData(enrichedData);
                      setBulkProducts(parsedProducts);
                      const enrichedCount = Object.keys(enrichedData).length;

                      // Show review interface
                      setShowBulkReview(true);
                      setCurrentReviewIndex(0);

                      showNotification({
                        type: 'success',
                        title: 'AI Enrichment Complete',
                        message: `Enriched ${enrichedCount}/${lines.length} products - Review pricing`,
                      });
                    } catch (error) {
                      console.error('Bulk AI error:', error);
                      showNotification({
                        type: 'error',
                        title: 'AI Processing Failed',
                        message: 'Could not process all products',
                      });
                    } finally {
                      setLoadingAI(false);
                      setBulkAIProgress({ current: 0, total: 0 });
                    }
                  }}
                  disabled={bulkProcessing || loadingAI}
                  className="px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 font-black transition-all text-[10px] uppercase tracking-[0.15em] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                  style={{ fontWeight: 900 }}
                >
                  {loadingAI ? (
                    <>
                      <Loader size={10} className="animate-spin" strokeWidth={3} />
                      {bulkAIProgress.total > 0 ? `${bulkAIProgress.current}/${bulkAIProgress.total}` : 'AI...'}
                    </>
                  ) : (
                    <>
                      <Sparkles size={10} strokeWidth={3} />
                      {Object.keys(bulkEnrichedData).length > 0 ? `AI Enriched (${Object.keys(bulkEnrichedData).length})` : 'AI Enrich'}
                    </>
                  )}
                </button>
              </div>

              {/* AI Enrichment Status */}
              {Object.keys(bulkEnrichedData).length > 0 && (
                <div className="mt-3 bg-[#141414] border border-white/10 rounded-2xl p-3">
                  <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                    AI Enriched Products ({Object.keys(bulkEnrichedData).length})
                  </div>
                  <div className="space-y-1">
                    {Object.entries(bulkEnrichedData).slice(0, 5).map(([name, data]: [string, any]) => (
                      <div key={name} className="flex items-center gap-2 text-[10px]">
                        <CheckCircle size={10} className="text-green-400" strokeWidth={2.5} />
                        <span className="text-white font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>{name}</span>
                        <span className="text-white/40">-</span>
                        <span className="text-white/60 text-[9px]">
                          {[
                            data.strain_type,
                            data.lineage && 'lineage',
                            data.nose?.length && `${data.nose.length} aromas`,
                            data.effects?.length && `${data.effects.length} effects`,
                            data.terpenes?.length && `${data.terpenes.length} terpenes`
                          ].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    ))}
                    {Object.keys(bulkEnrichedData).length > 5 && (
                      <div className="text-white/40 text-[9px] mt-1">
                        +{Object.keys(bulkEnrichedData).length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bulk Review Interface - Flip through products */}
              {showBulkReview && bulkProducts.length > 0 && (
                <div className="mt-4 bg-[#141414] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                      Review & Price Products
                    </h3>
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                      {currentReviewIndex + 1} / {bulkProducts.length}
                    </div>
                  </div>

                  {/* Current Product Card */}
                  {bulkProducts[currentReviewIndex] && (
                    <div className="space-y-4">
                      {/* Product Name */}
                      <div className="text-white text-sm font-black uppercase tracking-tight mb-4" style={{ fontWeight: 900 }}>
                        {bulkProducts[currentReviewIndex].name}
                      </div>

                      {/* Matched Images */}
                      {bulkImages.filter(img => img.matchedTo === bulkProducts[currentReviewIndex].name).length > 0 && (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3">
                          <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                            Product Images ({bulkImages.filter(img => img.matchedTo === bulkProducts[currentReviewIndex].name).length})
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {bulkImages
                              .filter(img => img.matchedTo === bulkProducts[currentReviewIndex].name)
                              .map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={img.url}
                                    alt={img.file.name}
                                    className="w-full h-20 object-cover rounded-xl border border-white/10"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                    <div className="text-white text-[8px] text-center px-1">
                                      {img.file.name}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Editable Custom Fields */}
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 space-y-3">
                        <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                          Product Fields
                        </div>

                        {/* Strain Type */}
                        <div>
                          <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Strain Type</label>
                          <select
                            value={bulkProducts[currentReviewIndex].custom_fields.strain_type || ''}
                            onChange={(e) => {
                              const updated = [...bulkProducts];
                              updated[currentReviewIndex].custom_fields.strain_type = e.target.value;
                              setBulkProducts(updated);
                            }}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                          >
                            <option value="">Select...</option>
                            <option value="Sativa">Sativa</option>
                            <option value="Indica">Indica</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>

                        {/* Lineage */}
                        <div>
                          <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Lineage</label>
                          <input
                            type="text"
                            value={bulkProducts[currentReviewIndex].custom_fields.lineage || ''}
                            onChange={(e) => {
                              const updated = [...bulkProducts];
                              updated[currentReviewIndex].custom_fields.lineage = e.target.value;
                              setBulkProducts(updated);
                            }}
                            placeholder="Parent1 x Parent2"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                          />
                        </div>

                        {/* Nose */}
                        <div>
                          <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Nose</label>
                          <input
                            type="text"
                            value={bulkProducts[currentReviewIndex].custom_fields.nose || ''}
                            onChange={(e) => {
                              const updated = [...bulkProducts];
                              updated[currentReviewIndex].custom_fields.nose = e.target.value;
                              setBulkProducts(updated);
                            }}
                            placeholder="Candy, Cake, Glue"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                          />
                        </div>

                        {/* Effects */}
                        <div>
                          <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Effects</label>
                          <input
                            type="text"
                            value={Array.isArray(bulkProducts[currentReviewIndex].custom_fields.effects)
                              ? bulkProducts[currentReviewIndex].custom_fields.effects.join(', ')
                              : bulkProducts[currentReviewIndex].custom_fields.effects || ''}
                            onChange={(e) => {
                              const updated = [...bulkProducts];
                              // Store as array
                              updated[currentReviewIndex].custom_fields.effects = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setBulkProducts(updated);
                            }}
                            placeholder="Relaxing, Euphoric, Creative"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                          />
                          <p className="text-white/30 text-[8px] mt-1">Separate with commas</p>
                        </div>

                        {/* Terpenes */}
                        <div>
                          <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Terpenes</label>
                          <input
                            type="text"
                            value={Array.isArray(bulkProducts[currentReviewIndex].custom_fields.terpene_profile)
                              ? bulkProducts[currentReviewIndex].custom_fields.terpene_profile.join(', ')
                              : bulkProducts[currentReviewIndex].custom_fields.terpene_profile || ''}
                            onChange={(e) => {
                              const updated = [...bulkProducts];
                              // Store as array
                              updated[currentReviewIndex].custom_fields.terpene_profile = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setBulkProducts(updated);
                            }}
                            placeholder="Myrcene, Limonene, Caryophyllene"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                          />
                          <p className="text-white/30 text-[8px] mt-1">Separate with commas</p>
                        </div>
                      </div>

                      {/* Pricing Mode */}
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 space-y-3">
                        <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                          Pricing
                        </div>

                        {/* Pricing Mode Selector */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...bulkProducts];
                              updated[currentReviewIndex].pricing_mode = 'single';
                              setBulkProducts(updated);
                            }}
                            className={`flex-1 px-3 py-2 rounded-xl text-[9px] uppercase tracking-[0.15em] font-black transition-all ${
                              bulkProducts[currentReviewIndex].pricing_mode === 'single'
                                ? 'bg-white/10 border-2 border-white/20 text-white'
                                : 'bg-white/5 border border-white/10 text-white/60'
                            }`}
                            style={{ fontWeight: 900 }}
                          >
                            Single
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...bulkProducts];
                              updated[currentReviewIndex].pricing_mode = 'tiered';
                              // Don't auto-initialize - let user add tiers manually or via templates
                              setBulkProducts(updated);
                            }}
                            className={`flex-1 px-3 py-2 rounded-xl text-[9px] uppercase tracking-[0.15em] font-black transition-all ${
                              bulkProducts[currentReviewIndex].pricing_mode === 'tiered'
                                ? 'bg-white/10 border-2 border-white/20 text-white'
                                : 'bg-white/5 border border-white/10 text-white/60'
                            }`}
                            style={{ fontWeight: 900 }}
                          >
                            Tiered
                          </button>
                        </div>

                        {/* Single Pricing */}
                        {bulkProducts[currentReviewIndex].pricing_mode === 'single' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Selling Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={bulkProducts[currentReviewIndex].price}
                                onChange={(e) => {
                                  const updated = [...bulkProducts];
                                  updated[currentReviewIndex].price = e.target.value;
                                  setBulkProducts(updated);
                                }}
                                placeholder="45.00"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                              />
                            </div>
                            <div>
                              <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5">Cost Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={bulkProducts[currentReviewIndex].cost_price}
                                onChange={(e) => {
                                  const updated = [...bulkProducts];
                                  updated[currentReviewIndex].cost_price = e.target.value;
                                  setBulkProducts(updated);
                                }}
                                placeholder="30.00"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2 text-[10px]"
                              />
                            </div>
                          </div>
                        )}

                        {/* Tiered Pricing */}
                        {bulkProducts[currentReviewIndex].pricing_mode === 'tiered' && (
                          <div className="space-y-3">
                            {/* Pricing Templates */}
                            {pricingConfigs.length > 0 && (
                              <div>
                                <label className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2">Quick Apply Template</label>
                                <div className="flex flex-wrap gap-2">
                                  {pricingConfigs.map((config: any) => (
                                    <button
                                      key={config.id}
                                      type="button"
                                      onClick={() => {
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
                                      }}
                                      className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                      {config.blueprint.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tier Inputs */}
                            <div className="space-y-2">
                            {bulkProducts[currentReviewIndex].pricing_tiers.map((tier, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={tier.weight}
                                  onChange={(e) => {
                                    const updated = [...bulkProducts];
                                    updated[currentReviewIndex].pricing_tiers[idx].weight = e.target.value;
                                    setBulkProducts(updated);
                                  }}
                                  placeholder="1g"
                                  className="w-20 bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-2 py-1.5 text-[10px]"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const updated = [...bulkProducts];
                                    updated[currentReviewIndex].pricing_tiers[idx].price = e.target.value;
                                    setBulkProducts(updated);
                                  }}
                                  placeholder="Price"
                                  className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-1.5 text-[10px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...bulkProducts];
                                    updated[currentReviewIndex].pricing_tiers.splice(idx, 1);
                                    setBulkProducts(updated);
                                  }}
                                  className="text-white/40 hover:text-red-400 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...bulkProducts];
                                updated[currentReviewIndex].pricing_tiers.push({
                                  weight: '',
                                  qty: 1,
                                  price: ''
                                });
                                setBulkProducts(updated);
                              }}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                              + Add Tier
                            </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Navigation & Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1))}
                          disabled={currentReviewIndex === 0}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] font-black hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ fontWeight: 900 }}
                        >
                          ← Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentReviewIndex(Math.min(bulkProducts.length - 1, currentReviewIndex + 1))}
                          disabled={currentReviewIndex === bulkProducts.length - 1}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] font-black hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ fontWeight: 900 }}
                        >
                          Next →
                        </button>
                        <div className="flex-1"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBulkReview(false);
                            setCurrentReviewIndex(0);
                          }}
                          className="px-3 py-2 border border-white/10 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] font-black hover:bg-white/5 hover:border-white/20 transition-all"
                          style={{ fontWeight: 900 }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkSubmit}
                          disabled={bulkProcessing}
                          className="px-4 py-2 bg-white/10 border-2 border-white/20 text-white rounded-xl text-[9px] uppercase tracking-[0.15em] font-black hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-30"
                          style={{ fontWeight: 900 }}
                        >
                          {bulkProcessing ? 'Submitting...' : `Submit All (${bulkProducts.length})`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
            <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 font-black" style={{ fontWeight: 900 }}>
              Basic Information
            </h2>
          
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  Product Name <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAIAutofill}
                  disabled={loadingAI || !formData.name.trim() || !categoryId || dynamicFields.length === 0}
                  title={!categoryId ? "Select a category first" : !formData.name.trim() ? "Enter product name" : dynamicFields.length === 0 ? "Loading fields..." : ""}
                  className="bg-white/10 text-white border border-white/20 rounded-xl px-2.5 py-1.5 text-[9px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontWeight: 900 }}
                >
                  {loadingAI ? (
                    <>
                      <Loader size={11} className="animate-spin" strokeWidth={2.5} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} strokeWidth={2.5} />
                      AI Autofill
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Blue Dream"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
              />

              {/* AI Suggestions Panel - POS THEME */}
              {showSuggestions && aiSuggestions && (
                <div className="mt-3 bg-[#141414] border border-white/10 rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-white text-[9px] uppercase tracking-[0.15em] font-black flex items-center gap-1.5" style={{ fontWeight: 900 }}>
                      <Sparkles size={10} strokeWidth={2.5} />
                      AI Data
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>

                  {/* Show ALL data - POS THEME */}
                  <div className="space-y-2.5">
                    {aiSuggestions.strain_type && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[9px] uppercase tracking-[0.15em] w-16">Type</span>
                        <span className="text-white text-[10px] font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>{aiSuggestions.strain_type}</span>
                      </div>
                    )}
                    {aiSuggestions.lineage && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[9px] uppercase tracking-[0.15em] w-16">Lineage</span>
                        <span className="text-white text-[10px] font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>{aiSuggestions.lineage}</span>
                      </div>
                    )}
                    {aiSuggestions.nose && aiSuggestions.nose.length > 0 && (
                      <div>
                        <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Nose</div>
                        <div className="flex flex-wrap gap-1">
                          {aiSuggestions.nose.map((aroma: string, idx: number) => (
                            <span key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white uppercase tracking-wider font-black" style={{ fontWeight: 900 }}>
                              {aroma}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiSuggestions.effects && aiSuggestions.effects.length > 0 && (
                      <div>
                        <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Effects</div>
                        <div className="flex flex-wrap gap-1">
                          {aiSuggestions.effects.map((effect: string, idx: number) => (
                            <span key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider">
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiSuggestions.terpenes && aiSuggestions.terpenes.length > 0 && (
                      <div>
                        <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Terpenes</div>
                        <div className="flex flex-wrap gap-1">
                          {aiSuggestions.terpenes.map((terpene: string, idx: number) => (
                            <span key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider">
                              {terpene}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiSuggestions.description && (
                      <div>
                        <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Description</div>
                        <p className="text-white/60 text-[10px] leading-relaxed">{aiSuggestions.description}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={applyAISuggestions}
                    className="w-full bg-white/10 border-2 border-white/20 text-white rounded-2xl px-3 py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <CheckCircle size={11} strokeWidth={2.5} />
                    Fill All Fields
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your product..."
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all resize-none text-xs"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Category <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  const selectedCategory = categories.find(c => c.id === e.target.value);
                  setCategoryId(e.target.value);
                  setFormData({...formData, category: selectedCategory?.name || ''});
                }}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs cursor-pointer"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {loadingFields && (
                <p className="text-white/40 text-[10px] mt-2 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                  <Loader size={10} className="animate-spin" />
                  Loading fields...
                </p>
              )}
              {categoryId && dynamicFields.length > 0 && (
                <p className="text-green-400/60 text-[9px] mt-2 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                  <Sparkles size={9} strokeWidth={2.5} />
                  AI autofill ready
                </p>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                Product Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('simple')}
                  className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                    productType === 'simple'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('variable')}
                  className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                    productType === 'variable'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  Variable
                </button>
              </div>
            </div>

            {/* Pricing Mode - Only for Simple Products */}
            {productType === 'simple' && (
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                  Pricing Mode <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingMode('single')}
                    className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                      pricingMode === 'single'
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                    style={{ fontWeight: 900 }}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('tiered')}
                    className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                      pricingMode === 'tiered'
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                    style={{ fontWeight: 900 }}
                  >
                    Tiered
                  </button>
                </div>
              </div>
            )}

            {/* Single Price - Only for Simple Products with Single Pricing */}
            {productType === 'simple' && pricingMode === 'single' && (
              <>
              {/* COST PRICE (Private - Vendor Only) */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                  Cost Price
                  <span className="ml-1.5 text-emerald-400 text-[9px]">🔒</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    placeholder="10.00"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
                  />
                </div>
                <p className="text-white/40 text-[10px] mt-1.5">Private</p>
              </div>

              {/* SELLING PRICE */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                  Selling Price <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    required={productType === 'simple' && pricingMode === 'single'}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="14.99"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
                  />
                </div>

                {/* SHOW MARGIN CALCULATION */}
                {formData.cost_price && formData.price && parseFloat(formData.cost_price) > 0 && parseFloat(formData.price) > 0 && (
                  <div className="mt-2 flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2">
                    <div className={`font-black text-[10px] uppercase tracking-[0.15em] ${
                      ((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100) >= 40
                        ? 'text-green-400'
                        : ((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100) >= 25
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`} style={{ fontWeight: 900 }}>
                      {((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100).toFixed(1)}%
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                      ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}
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
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-black" style={{ fontWeight: 900 }}>
                Pricing Tiers
              </h2>
              <div className="flex items-center gap-1.5">
                <Zap size={11} strokeWidth={2.5} className="text-yellow-400" />
                <span className="text-yellow-400 text-[9px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  Quick Pick
                </span>
              </div>
            </div>

            {/* Quick-Pick Pricing Templates */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => applyPricingTemplate('budget')}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                Budget
              </button>
              <button
                type="button"
                onClick={() => applyPricingTemplate('mid')}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                Mid-Shelf
              </button>
              <button
                type="button"
                onClick={() => applyPricingTemplate('premium')}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                Premium
              </button>
              <button
                type="button"
                onClick={() => applyPricingTemplate('exotic')}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                Exotic
              </button>
            </div>

            <p className="text-white/40 text-[10px] mb-4 uppercase tracking-[0.15em]">
              Or add custom tiers below
            </p>

            {/* Add Pricing Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Weight</label>
                <input
                  type="text"
                  value={newTierWeight}
                  onChange={(e) => setNewTierWeight(e.target.value)}
                  placeholder="1g"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 text-xs focus:outline-none focus:border-white/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Qty <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={newTierQty}
                  onChange={(e) => setNewTierQty(e.target.value)}
                  placeholder="1"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 text-xs focus:outline-none focus:border-white/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>Price <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={newTierPrice}
                    onChange={(e) => setNewTierPrice(e.target.value)}
                    placeholder="14.99"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 pl-7 pr-3 py-2.5 text-xs focus:outline-none focus:border-white/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPricingTier}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.15em]"
                  style={{ fontWeight: 900 }}
                >
                  <Plus size={11} strokeWidth={2.5} />
                  Add
                </button>
              </div>
            </div>

            {/* Pricing Tiers List */}
            {pricingTiers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Current ({pricingTiers.length})</h3>
                <div className="space-y-2">
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={tier.weight || ''}
                          onChange={(e) => updatePricingTier(index, 'weight', e.target.value)}
                          placeholder="Weight"
                          className="w-full bg-black border border-white/10 rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20"
                        />
                        <input
                          type="number"
                          value={tier.qty}
                          onChange={(e) => updatePricingTier(index, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full bg-black border border-white/10 rounded-xl text-white placeholder-white/20 px-2.5 py-2 text-xs focus:outline-none focus:border-white/20"
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black" style={{ fontWeight: 900 }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full bg-black border border-white/10 rounded-xl text-white placeholder-white/20 pl-6 pr-2.5 py-2 text-xs focus:outline-none focus:border-white/20"
                          />
                        </div>
                      </div>
                      <div className="text-white text-[10px] font-black uppercase tracking-[0.15em] min-w-[80px]" style={{ fontWeight: 900 }}>
                        {tier.weight || `${tier.qty}x`} ${parseFloat(tier.price.toString()).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePricingTier(index)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-500/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pricingTiers.length === 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <p className="text-blue-300 text-[10px] uppercase tracking-[0.15em]">
                  No tiers added
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

        {/* Category-Specific Fields */}
        {categoryId && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
            <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 font-black" style={{ fontWeight: 900 }}>
              Product Details
            </h2>

            {dynamicFields.length === 0 && !loadingFields && (
              <div className="text-center py-6">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                  No fields configured
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dynamicFields
                .filter(field => {
                  // More lenient filter - just need name and type
                  const isValid = field && (field.name || field.slug) && field.type;
                  if (!isValid) {
                    console.warn('Filtered out invalid field:', field);
                  }
                  return isValid;
                })
                .map((field, index) => renderDynamicField(field, index))}

              {/* Initial Quantity - Always show for Simple Products */}
              {productType === 'simple' && (
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
              )}
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

