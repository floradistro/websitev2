/**
 * useSingleProductForm Hook
 *
 * Comprehensive custom hook that encapsulates ALL single product form logic from NewProductClient.
 * Extracted to promote separation of concerns, testability, and reusability.
 *
 * @module useSingleProductForm
 * @category Hooks
 *
 * @description
 * This hook manages the complete lifecycle of single product creation including:
 * - Form state management (basic info, pricing, custom fields)
 * - Image handling (upload, preview, removal)
 * - Pricing tier management (add, update, remove)
 * - AI-powered autofill functionality
 * - Form validation and submission
 * - Loading state coordination
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   handleSubmit,
 *   handleAIAutofill,
 *   loading,
 *   uploadingImages,
 *   handleImageUpload,
 *   removeImage,
 *   imagePreviews,
 * } = useSingleProductForm();
 * ```
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { showNotification } from '@/components/NotificationToast';
import type {
  PricingMode,
  PricingTier,
  CustomFields,
  ProductSubmissionData,
  APIErrorResponse,
  PricingTemplate
} from '@/lib/types/product';

/**
 * Form data structure for single product creation
 */
interface FormData {
  name: string;
  description: string;
  category_id: string;
  price: string;
  cost_price: string;
  initial_quantity: string;
}

/**
 * Category object structure from API
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Hook parameters interface
 */
interface UseSingleProductFormParams {
  /** Current vendor ID for authentication */
  vendorId?: string;
  /** Available categories for selection */
  categories: Category[];
}

/**
 * Hook return interface
 */
interface UseSingleProductFormReturn {
  // Form State
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  customFieldValues: Record<string, any>;
  setCustomFieldValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  // Pricing State
  pricingMode: PricingMode;
  setPricingMode: React.Dispatch<React.SetStateAction<PricingMode>>;
  pricingTiers: PricingTier[];
  setPricingTiers: React.Dispatch<React.SetStateAction<PricingTier[]>>;

  // Image State
  imageFiles: File[];
  imagePreviews: string[];
  uploadedImageUrls: string[];

  // Image Handlers
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeImage: (index: number) => void;

  // Pricing Handlers
  addPricingTier: () => void;
  updatePricingTier: (index: number, field: string, value: string) => void;
  removePricingTier: (index: number) => void;

  // Pricing Template
  availableTemplates: PricingTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<string>>;
  handleApplyTemplate: () => void;

  // AI & Submission
  handleAIAutofill: () => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;

  // Loading States
  loading: boolean;
  uploadingImages: boolean;
  loadingAI: boolean;
  loadingTemplates: boolean;
}

/**
 * Custom hook for single product form management
 *
 * @param {UseSingleProductFormParams} params - Hook configuration
 * @param {string} [params.vendorId] - Vendor ID for API authentication
 * @param {Category[]} params.categories - Available product categories
 *
 * @returns {UseSingleProductFormReturn} Complete form management interface
 *
 * @remarks
 * This hook manages complex state including:
 * - Basic product information (name, description, category, pricing)
 * - Custom category-specific fields (strain info, effects, etc.)
 * - Multiple pricing modes (single price vs. tiered pricing)
 * - Image uploads with preview and cloud storage
 * - AI-powered data enrichment
 * - Form validation and error handling
 *
 * All state updates are immutable and follow React best practices.
 * Error handling includes user-friendly notifications and console logging for debugging.
 */
export function useSingleProductForm({
  vendorId,
  categories,
}: UseSingleProductFormParams): UseSingleProductFormReturn {
  const router = useRouter();

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  /**
   * Core form data state
   * Manages basic product information fields
   */
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost_price: '',
    initial_quantity: '',
  });

  /**
   * Custom field values state
   * Stores category-specific dynamic field values
   * Keys correspond to field slugs/names
   */
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  /**
   * Pricing mode state
   * Controls whether product uses single pricing or tiered pricing structure
   */
  const [pricingMode, setPricingMode] = useState<PricingMode>('single');

  /**
   * Pricing tiers state
   * Array of weight/quantity-based price points
   * Only used when pricingMode is 'tiered'
   */
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

  /**
   * Image files state
   * Raw File objects from file input
   */
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  /**
   * Image previews state
   * Base64 data URLs for client-side preview display
   */
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  /**
   * Uploaded image URLs state
   * Cloud storage URLs returned after successful upload
   * These URLs are included in product creation API call
   */
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  // ===========================
  // LOADING STATES
  // ===========================

  /**
   * Main form submission loading state
   */
  const [loading, setLoading] = useState(false);

  /**
   * Image upload in progress state
   */
  const [uploadingImages, setUploadingImages] = useState(false);

  /**
   * AI autofill processing state
   */
  const [loadingAI, setLoadingAI] = useState(false);

  /**
   * Templates loading state
   */
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  /**
   * Available pricing templates for vendor
   */
  const [availableTemplates, setAvailableTemplates] = useState<PricingTemplate[]>([]);

  /**
   * Selected pricing template ID
   */
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // ===========================
  // NOTE: PRICING TEMPLATES
  // ===========================

  /**
   * Pricing templates are now loaded directly when needed via the product APIs.
   * They are fetched from the pricing_tier_templates table.
   *
   * The old /api/vendor/pricing-blueprints endpoint has been removed.
   * Templates are not pre-loaded in this form hook anymore.
   */

  // ===========================
  // IMAGE HANDLERS
  // ===========================

  /**
   * Handles image file selection, preview generation, and cloud upload
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   *
   * @remarks
   * Process:
   * 1. Converts FileList to array
   * 2. Updates imageFiles state
   * 3. Generates base64 previews via FileReader for each file
   * 4. Uploads files to cloud storage in parallel
   * 5. Stores returned URLs in uploadedImageUrls state
   *
   * Uses Promise.all for parallel uploads to improve performance.
   * Shows success notification with upload count.
   * Handles authentication via vendor ID header.
   *
   * @throws {Error} If upload fails, shows error notification
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setImageFiles(prev => [...prev, ...fileArray]);

    // Generate previews for each file
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    try {
      setUploadingImages(true);

      if (!vendorId) {
        showNotification({
          type: 'error',
          title: 'Upload Failed',
          message: 'Not authenticated'
        });
        return;
      }

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
      setUploadedImageUrls(prev => [...prev, ...urls]);

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

  /**
   * Removes image from all image-related state arrays
   *
   * @param {number} index - Index of image to remove
   *
   * @remarks
   * Removes image from:
   * - imageFiles (raw File objects)
   * - imagePreviews (base64 preview URLs)
   * - uploadedImageUrls (cloud storage URLs)
   *
   * Note: Does not delete file from cloud storage - file remains accessible via URL.
   * Consider implementing cloud deletion if needed for data management.
   */
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ===========================
  // PRICING HANDLERS
  // ===========================

  /**
   * Adds new empty pricing tier to the tiers array
   *
   * @remarks
   * Creates tier with default values:
   * - weight: '' (empty, to be filled by user)
   * - qty: 1 (minimum quantity)
   * - price: '' (empty, to be filled by user)
   *
   * Used when pricingMode is 'tiered'
   */
  const addPricingTier = () => {
    setPricingTiers([...pricingTiers, { weight: '', qty: 1, price: '' }]);
  };

  /**
   * Updates specific field in a pricing tier
   *
   * @param {number} index - Index of tier to update
   * @param {string} field - Field name to update ('weight', 'qty', or 'price')
   * @param {string} value - New value for the field
   *
   * @remarks
   * Special handling:
   * - 'qty' field: Parsed as integer, defaults to 1 if parse fails
   * - Other fields: Updated as strings
   *
   * Maintains immutability by mapping over array and creating new objects
   */
  const updatePricingTier = (index: number, field: string, value: string) => {
    setPricingTiers(pricingTiers.map((tier, i) => {
      if (i === index) {
        if (field === 'qty') return { ...tier, qty: parseInt(value) || 1 };
        return { ...tier, [field]: value };
      }
      return tier;
    }));
  };

  /**
   * Removes pricing tier at specified index
   *
   * @param {number} index - Index of tier to remove
   *
   * @remarks
   * Filters out the tier at the given index while maintaining order of remaining tiers
   */
  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  // ===========================
  // PRICING TEMPLATE HANDLERS
  // ===========================

  /**
   * Applies selected pricing template to pricing tiers
   *
   * @remarks
   * Converts template's price_breaks to pricing tiers format
   * Sets pricing mode to 'tiered' automatically
   * Shows success notification
   */
  const handleApplyTemplate = () => {
    if (!selectedTemplateId) {
      showNotification({
        type: 'warning',
        title: 'No Template Selected',
        message: 'Please select a pricing template first'
      });
      return;
    }

    const template = availableTemplates.find(t => t.id === selectedTemplateId);
    if (!template) {
      showNotification({
        type: 'error',
        title: 'Template Not Found',
        message: 'Selected template could not be found'
      });
      return;
    }

    // Convert price_breaks to pricing tiers
    const tiers: PricingTier[] = template.price_breaks
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(priceBreak => ({
        weight: priceBreak.label,
        qty: priceBreak.qty,
        price: priceBreak.price?.toString() || ''
      }));

    setPricingTiers(tiers);
    setPricingMode('tiered');

    showNotification({
      type: 'success',
      title: 'Template Applied',
      message: `${template.name} pricing tiers loaded`
    });
  };

  // ===========================
  // AI AUTOFILL
  // ===========================

  /**
   * AI-powered autofill for single product data enrichment
   *
   * @remarks
   * Validation Requirements:
   * - Product name must be non-empty
   * - Category must be selected
   *
   * Process:
   * 1. Validates product name and category selection
   * 2. Finds category name from categories array
   * 3. Calls AI API with product name and category
   * 4. Parses suggestions for specific cannabis fields:
   *    - strain_type (Indica/Sativa/Hybrid)
   *    - lineage (genetic background)
   *    - nose (aroma descriptors)
   *    - effects (consumer experience)
   *    - terpene_profile (chemical compounds)
   *    - description (product narrative)
   * 5. Transforms arrays (nose) to comma-separated strings for storage
   * 6. Updates customFieldValues and formData.description
   *
   * API Endpoint: POST /api/ai/quick-autofill
   *
   * Success: Shows notification with count of populated fields
   * Error: Shows error notification, logs to console for debugging
   *
   * @async
   * @throws {Error} If API call fails
   */
  const handleAIAutofill = async () => {
    // Validate product name
    if (!formData.name.trim()) {
      showNotification({
        type: 'warning',
        title: 'Product Name Required',
        message: 'Enter a product name to autofill data',
      });
      return;
    }

    // Validate category selection
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

      // Find category name for AI context
      const category = categories.find(c => c.id === formData.category_id);

      const response = await axios.post('/api/ai/quick-autofill', {
        productName: formData.name,
        category: category?.name,
        selectedFields: ['strain_type', 'lineage', 'nose', 'effects', 'terpene_profile', 'description']
      });

      if (response.data.success && response.data.suggestions) {
        const suggestions = response.data.suggestions;
        const updates: Record<string, any> = {};

        // Map AI suggestions to custom field values
        if (suggestions.strain_type) updates.strain_type = suggestions.strain_type;
        if (suggestions.lineage) updates.lineage = suggestions.lineage;

        // Transform array fields
        if (suggestions.nose && Array.isArray(suggestions.nose)) {
          updates.nose = suggestions.nose.join(', ');
        }
        if (suggestions.effects && Array.isArray(suggestions.effects)) {
          updates.effects = suggestions.effects;
        }
        if (suggestions.terpene_profile && Array.isArray(suggestions.terpene_profile)) {
          updates.terpene_profile = suggestions.terpene_profile;
        }

        // Update description separately in form data
        if (suggestions.description) {
          setFormData(prev => ({ ...prev, description: suggestions.description }));
        }

        // Update custom fields
        setCustomFieldValues(prev => ({ ...prev, ...updates }));

        showNotification({
          type: 'success',
          title: 'AI Data Applied',
          message: `${Object.keys(updates).length} fields populated`,
        });
      }
    } catch (error) {
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

  // ===========================
  // FORM SUBMISSION
  // ===========================

  /**
   * Handles single product form submission
   *
   * @param {React.FormEvent} e - Form submit event
   *
   * @remarks
   * Validation Rules:
   * - Product name required
   * - Category required
   * - Price required (if single pricing mode)
   * - At least one pricing tier required (if tiered pricing mode)
   *
   * Process:
   * 1. Prevents default form submission
   * 2. Validates required fields based on pricing mode
   * 3. Builds product data object with:
   *    - Basic info (name, description, category)
   *    - Product type and visibility (hardcoded to 'simple' and 'internal')
   *    - Pricing data (conditional based on mode)
   *    - Image URLs from cloud storage
   *    - Custom field values
   *    - Cost price and initial quantity (nullable)
   * 4. Submits to API with vendor authentication
   * 5. Shows success notification
   * 6. Redirects to products list after 1.5s
   *
   * API Endpoint: POST /api/vendor/products
   *
   * Authentication:
   * - Header: x-vendor-id
   * - Cookie: HTTP-only session cookie (withCredentials: true)
   *
   * Success: Shows notification, redirects to /vendor/products
   * Error: Shows error notification with API error message
   *
   * @async
   * @throws {Error} If API call fails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate product name
    if (!formData.name.trim()) {
      showNotification({
        type: 'warning',
        title: 'Name Required',
        message: 'Enter a product name'
      });
      return;
    }

    // Validate category
    if (!formData.category_id) {
      showNotification({
        type: 'warning',
        title: 'Category Required',
        message: 'Select a category'
      });
      return;
    }

    // Validate pricing based on mode
    if (pricingMode === 'single' && !formData.price) {
      showNotification({
        type: 'warning',
        title: 'Price Required',
        message: 'Enter a price'
      });
      return;
    }

    if (pricingMode === 'tiered' && pricingTiers.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Pricing Tiers Required',
        message: 'Add at least one pricing tier'
      });
      return;
    }

    setLoading(true);

    try {
      // Build product data object
      const productData: ProductSubmissionData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        product_type: 'simple',
        product_visibility: 'internal',
        pricing_mode: pricingMode,
        image_urls: uploadedImageUrls,
        custom_fields: customFieldValues,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        initial_quantity: formData.initial_quantity ? parseFloat(formData.initial_quantity) : undefined,
        pricing_template_id: selectedTemplateId || undefined,
      };

      // Add pricing data based on mode
      if (pricingMode === 'single') {
        productData.price = parseFloat(formData.price);
      } else {
        productData.pricing_tiers = pricingTiers;
      }

      // Submit to API
      const response = await axios.post('/api/vendor/products', productData, {
        headers: {
          'x-vendor-id': vendorId || '',
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

        // Redirect after short delay
        setTimeout(() => router.push('/vendor/products'), 1500);
      }
    } catch (err) {
      console.error('Error submitting product:', err);
      const axiosError = err as AxiosError<APIErrorResponse>;
      showNotification({
        type: 'error',
        title: 'Submission Error',
        message: axiosError.response?.data?.error || 'Failed to create product',
      });
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Form State
    formData,
    setFormData,
    customFieldValues,
    setCustomFieldValues,

    // Pricing State
    pricingMode,
    setPricingMode,
    pricingTiers,
    setPricingTiers,

    // Image State
    imageFiles,
    imagePreviews,
    uploadedImageUrls,

    // Image Handlers
    handleImageUpload,
    removeImage,

    // Pricing Handlers
    addPricingTier,
    updatePricingTier,
    removePricingTier,

    // Pricing Template
    availableTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    handleApplyTemplate,

    // AI & Submission
    handleAIAutofill,
    handleSubmit,

    // Loading States
    loading,
    uploadingImages,
    loadingAI,
    loadingTemplates,
  };
}
