/**
 * useBulkImportForm Hook
 *
 * Comprehensive custom hook that extracts ALL bulk import logic from NewProductClient.
 * Handles bulk input parsing, AI enrichment via streaming, product review navigation,
 * image management, and bulk submission with full validation.
 *
 * @module useBulkImportForm
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { showNotification } from '@/components/NotificationToast';
import type {
  BulkProduct,
  PricingTier,
  ProductSubmissionData,
  APIErrorResponse,
  ValidationErrorDetail,
  BulkAIResult
} from '@/lib/types/product';

/**
 * Interface for bulk image handling with file matching capability
 */
interface BulkImage {
  file: File;
  url: string;
  matchedTo: string | null;
}

/**
 * Interface for AI-enriched product data
 */
interface EnrichedData {
  strain_type?: string;
  lineage?: string;
  nose?: string[];
  effects?: string[];
  terpene_profile?: string[];
  description?: string;
}

/**
 * Category interface for dropdown selection
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Hook parameters
 */
interface UseBulkImportFormParams {
  /** Current vendor ID for API authentication */
  vendorId?: string;
  /** Available categories for selection */
  categories: Category[];
}

/**
 * Hook return interface with all bulk import state and methods
 */
interface UseBulkImportFormReturn {
  // Bulk input state
  bulkInput: string;
  setBulkInput: (value: string) => void;
  bulkCategory: string;
  setBulkCategory: (value: string) => void;
  bulkProducts: BulkProduct[];
  setBulkProducts: (value: BulkProduct[]) => void;

  // Review interface
  currentReviewIndex: number;
  setCurrentReviewIndex: (value: number) => void;
  goToNextProduct: () => void;
  goToPreviousProduct: () => void;
  currentProduct: BulkProduct | null;

  // Images
  bulkImages: BulkImage[];
  setBulkImages: (value: BulkImage[]) => void;

  // AI enrichment
  bulkEnrichedData: Record<string, EnrichedData>;
  setBulkEnrichedData: (value: Record<string, EnrichedData>) => void;
  handleBulkAIEnrich: () => Promise<void>;

  // Submission
  handleBulkSubmit: () => Promise<void>;

  // Loading states
  bulkProcessing: boolean;
  bulkProgress: {
    current: number;
    total: number;
    currentProduct: string;
    successCount: number;
    failCount: number;
  };
  loadingAI: boolean;

  // Reset function
  resetBulkForm: () => void;
}

/**
 * Custom hook for managing bulk product import functionality
 *
 * Features:
 * - CSV-style bulk input parsing (Name, Price, Cost)
 * - AI enrichment via streaming API for product data
 * - Product-by-product review interface with navigation
 * - Image handling with product matching
 * - Bulk submission with validation and error tracking
 * - Comprehensive loading states
 *
 * @example
 * ```tsx
 * const bulkForm = useBulkImportForm({
 *   vendorId: vendor.id,
 *   categories: availableCategories
 * });
 *
 * // User pastes bulk data
 * bulkForm.setBulkInput("Blue Dream, 45, 20\nWedding Cake, 50, 25");
 * bulkForm.setBulkCategory(categoryId);
 *
 * // Enrich with AI
 * await bulkForm.handleBulkAIEnrich();
 *
 * // Review and edit
 * bulkForm.goToNextProduct();
 *
 * // Submit all products
 * await bulkForm.handleBulkSubmit();
 * ```
 */
export function useBulkImportForm({
  vendorId,
  categories
}: UseBulkImportFormParams): UseBulkImportFormReturn {
  const router = useRouter();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  /**
   * Raw CSV-style text input for bulk products
   * Format: "Name, Price, Cost\nName2, Price2, Cost2"
   */
  const [bulkInput, setBulkInput] = useState('');

  /**
   * Category ID applied to all bulk imported products
   */
  const [bulkCategory, setBulkCategory] = useState('');

  /**
   * Parsed and enriched product objects ready for submission
   */
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);

  /**
   * Current product index being reviewed/edited (0-based)
   */
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  /**
   * Images for bulk import with optional product matching
   * Note: Currently defined but not fully implemented in UI
   */
  const [bulkImages, setBulkImages] = useState<BulkImage[]>([]);

  /**
   * AI-generated product data indexed by product name
   * Example: { "Blue Dream": { strain_type: "Hybrid", lineage: "...", ... } }
   */
  const [bulkEnrichedData, setBulkEnrichedData] = useState<Record<string, EnrichedData>>({});

  /**
   * Loading state for AI enrichment process
   */
  const [loadingAI, setLoadingAI] = useState(false);

  /**
   * Loading state for bulk product submission
   */
  const [bulkProcessing, setBulkProcessing] = useState(false);

  /**
   * Progress tracking for bulk submission
   * Tracks current product being processed and counts
   */
  const [bulkProgress, setBulkProgress] = useState({
    current: 0,
    total: 0,
    currentProduct: '',
    successCount: 0,
    failCount: 0,
  });

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  /**
   * Get the current product being reviewed
   * Returns null if no products or invalid index
   */
  const currentProduct = bulkProducts.length > 0 &&
                         currentReviewIndex >= 0 &&
                         currentReviewIndex < bulkProducts.length
    ? bulkProducts[currentReviewIndex]
    : null;

  // ==========================================
  // NAVIGATION METHODS
  // ==========================================

  /**
   * Navigate to the next product in review queue
   * Stays on last product if already at end
   */
  const goToNextProduct = () => {
    setCurrentReviewIndex(prev =>
      Math.min(bulkProducts.length - 1, prev + 1)
    );
  };

  /**
   * Navigate to the previous product in review queue
   * Stays on first product if already at beginning
   */
  const goToPreviousProduct = () => {
    setCurrentReviewIndex(prev => Math.max(0, prev - 1));
  };

  // ==========================================
  // AI ENRICHMENT
  // ==========================================

  /**
   * Handles bulk AI enrichment via streaming API
   *
   * Process:
   * 1. Validates bulk input and category selection
   * 2. Parses CSV-style input into product list
   * 3. Calls streaming AI API for batch enrichment
   * 4. Processes SSE (Server-Sent Events) stream
   * 5. Maps AI data to product custom_fields
   * 6. Updates bulkProducts and bulkEnrichedData states
   *
   * Streaming Protocol:
   * - Uses fetch API with ReadableStream
   * - Parses SSE format: "data: {JSON}\n"
   * - Accumulates results until 'complete' event
   *
   * Enriched Fields:
   * - strain_type: Product strain classification
   * - lineage: Genetic lineage information
   * - nose: Aroma descriptors (array)
   * - effects: Expected effects (array)
   * - terpene_profile: Terpene information (array)
   * - description: Generated product description
   *
   * @throws {Error} If streaming API fails or response is invalid
   */
  const handleBulkAIEnrich = async () => {
    // Validation: Check for input data
    if (!bulkInput.trim()) {
      showNotification({
        type: 'warning',
        title: 'No Data',
        message: 'Enter product data first',
      });
      return;
    }

    // Validation: Check for category selection
    if (!bulkCategory) {
      showNotification({
        type: 'warning',
        title: 'Category Required',
        message: 'Select a category for this bulk batch',
      });
      return;
    }

    setLoadingAI(true);
    const enrichedData: Record<string, EnrichedData> = {};
    const parsedProducts: BulkProduct[] = [];

    try {
      // Parse CSV-style input
      const lines = bulkInput.split('\n').filter(line => line.trim());
      const productsToEnrich: Array<{name: string, price: string, cost: string}> = [];

      // Parse each line: Name, Price, Cost (optional)
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 1) continue;

        const [name, price, cost] = parts;
        productsToEnrich.push({
          name,
          price: price || '',
          cost: cost || price || ''
        });

        // Create initial product object
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI enrichment failed (${response.status}): ${errorText || 'Server error'}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Could not establish streaming connection. Please try again.');

      let buffer = '';
      let allResults: BulkAIResult[] = [];

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        // Parse SSE messages
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'complete') {
              allResults = data.results ? Object.values(data.results) : [];
            }
          }
        }
      }

      // Process AI results
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
            effects: Array.isArray(aiData.effects) ? aiData.effects.join(', ') : '',
            terpene_profile: Array.isArray(aiData.terpene_profile) ? aiData.terpene_profile.join(', ') : ''
          };
        }
      }

      // Update state
      setBulkEnrichedData(enrichedData);
      setBulkProducts(parsedProducts);
      setCurrentReviewIndex(0);

      const enrichedCount = Object.keys(enrichedData).length;
      const totalProducts = lines.length;

      if (enrichedCount === 0) {
        showNotification({
          type: 'warning',
          title: '⚠️ No Data Enriched',
          message: `Could not find AI data for any of the ${totalProducts} product${totalProducts > 1 ? 's' : ''}. Try checking product names or try again.`,
          duration: 6000,
        });
      } else if (enrichedCount < totalProducts) {
        showNotification({
          type: 'success',
          title: '✅ Enrichment Partially Complete',
          message: `Enhanced ${enrichedCount} of ${totalProducts} product${totalProducts > 1 ? 's' : ''} with AI data.`,
        });
      } else {
        showNotification({
          type: 'success',
          title: '✅ AI Enrichment Complete!',
          message: `All ${enrichedCount} product${enrichedCount > 1 ? 's' : ''} enhanced with strain data, terpenes, and descriptions.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showNotification({
        type: 'error',
        title: '❌ AI Enrichment Failed',
        message: errorMessage,
        duration: 6000,
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // ==========================================
  // BULK SUBMISSION
  // ==========================================

  /**
   * Submits all bulk products to backend with full validation
   *
   * Process:
   * 1. Validates products exist
   * 2. Iterates through products sequentially
   * 3. Builds product data object with enriched fields
   * 4. Handles conditional pricing fields (single vs tiered)
   * 5. Submits via authenticated API call
   * 6. Tracks success/fail counts
   * 7. Shows detailed errors for first failure
   * 8. Displays final summary
   * 9. Redirects to products page on success
   *
   * Product Data Structure:
   * - name: Product name
   * - category_id: Selected category UUID
   * - product_type: Always 'simple'
   * - product_visibility: Always 'internal'
   * - pricing_mode: 'single' or 'tiered'
   * - custom_fields: AI-enriched data
   * - description: AI-generated or fallback
   * - price/cost_price: For single pricing (if present)
   * - pricing_tiers: For tiered pricing
   *
   * Error Handling:
   * - First failure shows detailed validation errors
   * - Subsequent failures are counted silently
   * - Partial success is allowed (some products may succeed)
   * - Final notification shows success/fail ratio
   *
   * @throws {Error} If bulk submission completely fails
   */
  const handleBulkSubmit = async () => {
    // Validation: Check for products
    if (bulkProducts.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Products',
        message: 'Add products first',
      });
      return;
    }

    setBulkProcessing(true);

    // Initialize progress
    setBulkProgress({
      current: 0,
      total: bulkProducts.length,
      currentProduct: '',
      successCount: 0,
      failCount: 0,
    });

    try {
      let successCount = 0;
      let failCount = 0;

      // Submit each product sequentially
      for (let i = 0; i < bulkProducts.length; i++) {
        const product = bulkProducts[i];

        // Update progress
        setBulkProgress({
          current: i + 1,
          total: bulkProducts.length,
          currentProduct: product.name,
          successCount,
          failCount,
        });
        try {
          const enrichedData = bulkEnrichedData[product.name] || {};
          const description = enrichedData.description || `Bulk imported product: ${product.name}`;

          // Build product data object
          const productData: ProductSubmissionData = {
            name: product.name,
            category_id: bulkCategory,
            product_type: 'simple',
            product_visibility: 'internal',
            pricing_mode: product.pricing_mode,
            custom_fields: product.custom_fields || {},
            description
          };

          // Add pricing fields based on mode
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

          // Submit product to API
          const response = await axios.post('/api/vendor/products', productData, {
            headers: {
              'x-vendor-id': vendorId || '',
              'Content-Type': 'application/json'
            },
            withCredentials: true // Send HTTP-only auth cookie
          });

          if (response.data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;

          // Show specific error for first failed product only
          if (failCount === 1) {
            const axiosError = err as AxiosError<APIErrorResponse>;
            const errorData = axiosError.response?.data;
            let errorMessage = 'Validation failed. Please check product data and try again.';

            if (errorData?.details && Array.isArray(errorData.details)) {
              // Format validation errors with better structure
              const fieldErrors = errorData.details.map((d: ValidationErrorDetail) =>
                `• ${d.field.replace(/_/g, ' ').toUpperCase()}: ${d.message}`
              ).join('\n');
              errorMessage = `Please fix the following issues:\n\n${fieldErrors}`;
            } else if (errorData?.error) {
              errorMessage = errorData.error;
            } else if (axiosError.message) {
              errorMessage = `Network error: ${axiosError.message}`;
            }

            showNotification({
              type: 'error',
              title: `❌ Failed to create "${product.name}"`,
              message: errorMessage,
              duration: 8000, // Longer duration for detailed errors
            });
          }
        }
      }

      // Show final summary with appropriate type and message
      const totalProcessed = successCount + failCount;

      if (successCount === 0) {
        // All failed
        showNotification({
          type: 'error',
          title: '❌ Bulk Import Failed',
          message: `All ${failCount} product${failCount > 1 ? 's' : ''} failed to import. Please check the error above and try again.`,
          duration: 6000,
        });
      } else if (failCount === 0) {
        // All succeeded
        showNotification({
          type: 'success',
          title: '✅ Import Successful!',
          message: `All ${successCount} product${successCount > 1 ? 's' : ''} created successfully.`,
        });
      } else {
        // Partial success
        showNotification({
          type: 'warning',
          title: '⚠️ Import Partially Complete',
          message: `${successCount} product${successCount > 1 ? 's' : ''} created, ${failCount} failed. Check errors above.`,
          duration: 6000,
        });
      }

      // Redirect on success
      if (successCount > 0) {
        setTimeout(() => router.push('/vendor/products'), 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showNotification({
        type: 'error',
        title: '❌ Import Failed',
        message: `Could not process bulk products: ${errorMessage}`,
        duration: 6000,
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Resets all bulk form state to initial values
   * Useful for clearing form after submission or cancellation
   */
  const resetBulkForm = () => {
    setBulkInput('');
    setBulkCategory('');
    setBulkProducts([]);
    setCurrentReviewIndex(0);
    setBulkImages([]);
    setBulkEnrichedData({});
    setLoadingAI(false);
    setBulkProcessing(false);
  };

  // ==========================================
  // RETURN INTERFACE
  // ==========================================

  return {
    // Bulk input state
    bulkInput,
    setBulkInput,
    bulkCategory,
    setBulkCategory,
    bulkProducts,
    setBulkProducts,

    // Review interface
    currentReviewIndex,
    setCurrentReviewIndex,
    goToNextProduct,
    goToPreviousProduct,
    currentProduct,

    // Images
    bulkImages,
    setBulkImages,

    // AI enrichment
    bulkEnrichedData,
    setBulkEnrichedData,
    handleBulkAIEnrich,

    // Submission
    handleBulkSubmit,

    // Loading states
    bulkProcessing,
    bulkProgress,
    loadingAI,

    // Utility
    resetBulkForm,
  };
}
