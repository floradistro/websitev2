'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_path: string;
  file_type: string;
  category: 'product_photos' | 'marketing' | 'menus' | 'brand';
  ai_tags?: string[];
  ai_description?: string;
  dominant_colors?: string[];
  quality_score?: number;
  custom_tags?: string[];
  title?: string;
  linked_product_ids?: string[];
  usage_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface MediaLibraryOptions {
  category?: 'product_photos' | 'marketing' | 'menus' | 'brand';
  tag?: string;
  search?: string;
  productId?: string;
  autoFetch?: boolean;
}

export interface MediaLibraryResult {
  files: MediaFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getRandomFile: (category?: string) => MediaFile | null;
  getFilesByCategory: (category: string) => MediaFile[];
  getFilesByTag: (tag: string) => MediaFile[];
  getTotalCount: () => number;
}

/**
 * Hook to access vendor media library
 * Provides filtered access to vendor's uploaded and AI-generated media
 *
 * @example
 * // Get all marketing materials
 * const { files, loading } = useMediaLibrary({ category: 'marketing' });
 *
 * @example
 * // Get random product photo for hero section
 * const { getRandomFile } = useMediaLibrary({ category: 'product_photos' });
 * const heroImage = getRandomFile();
 */
export function useMediaLibrary(
  vendorId: string | undefined,
  options: MediaLibraryOptions = {}
): MediaLibraryResult {
  const {
    category,
    tag,
    search,
    productId,
    autoFetch = true
  } = options;

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    if (!vendorId) {
      setError('Vendor ID required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tag) params.append('tag', tag);
      if (search) params.append('search', search);
      if (productId) params.append('productId', productId);

      const url = `/api/vendor/media${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'x-vendor-id': vendorId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('❌ useMediaLibrary error:', err);
      setError(err.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId, category, tag, search, productId]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && vendorId) {
      fetchMedia();
    }
  }, [autoFetch, vendorId, fetchMedia]);

  // Get random file from current results
  const getRandomFile = useCallback((filterCategory?: string): MediaFile | null => {
    const filteredFiles = filterCategory
      ? files.filter(f => f.category === filterCategory)
      : files;

    if (filteredFiles.length === 0) return null;
    return filteredFiles[Math.floor(Math.random() * filteredFiles.length)];
  }, [files]);

  // Get files by category
  const getFilesByCategory = useCallback((filterCategory: string): MediaFile[] => {
    return files.filter(f => f.category === filterCategory);
  }, [files]);

  // Get files by tag
  const getFilesByTag = useCallback((filterTag: string): MediaFile[] => {
    return files.filter(f =>
      f.ai_tags?.includes(filterTag) || f.custom_tags?.includes(filterTag)
    );
  }, [files]);

  // Get total count
  const getTotalCount = useCallback((): number => {
    return files.length;
  }, [files]);

  return {
    files,
    loading,
    error,
    refetch: fetchMedia,
    getRandomFile,
    getFilesByCategory,
    getFilesByTag,
    getTotalCount,
  };
}

/**
 * Helper to get media library summary for Claude AI
 * Provides context about available media for component generation
 */
export function getMediaLibrarySummary(files: MediaFile[]): string {
  if (files.length === 0) {
    return 'No media files available in library.';
  }

  const categories = {
    product_photos: files.filter(f => f.category === 'product_photos').length,
    marketing: files.filter(f => f.category === 'marketing').length,
    menus: files.filter(f => f.category === 'menus').length,
    brand: files.filter(f => f.category === 'brand').length,
  };

  const allTags = Array.from(
    new Set(files.flatMap(f => [...(f.ai_tags || []), ...(f.custom_tags || [])]))
  ).slice(0, 10);

  return `
Media Library Available:
- Total Files: ${files.length}
- Product Photos: ${categories.product_photos}
- Marketing Materials: ${categories.marketing}
- Menu Graphics: ${categories.menus}
- Brand Assets: ${categories.brand}
- Common Tags: ${allTags.join(', ')}

You can use these images in components by calling useMediaLibrary() hook with filters.
Example: useMediaLibrary(vendorId, { category: 'product_photos' })
  `.trim();
}

/**
 * Helper to suggest appropriate media for a component type
 */
export function suggestMediaForComponent(
  componentType: string,
  files: MediaFile[]
): MediaFile[] {
  const suggestions: { [key: string]: string } = {
    'hero': 'product_photos',
    'gallery': 'product_photos',
    'banner': 'marketing',
    'promo': 'marketing',
    'menu': 'menus',
    'logo': 'brand',
    'header': 'brand',
  };

  const category = suggestions[componentType.toLowerCase()];
  if (!category) return files.slice(0, 5); // Return first 5 if no match

  return files.filter(f => f.category === category).slice(0, 10);
}
