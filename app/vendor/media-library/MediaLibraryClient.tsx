"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import Image from 'next/image';
import {
  Upload,
  Trash2,
  Download,
  Search,
  Grid3x3,
  List,
  CheckSquare,
  Square,
  Sparkles,
  Wand2,
  ZoomIn,
  Edit3,
  Loader2,
  X,
  ImagePlus,
  FolderOpen,
  AlertCircle,
  Eye,
  Package,
  Megaphone,
  Menu as MenuIcon,
  Layers,
  Tag,
  Clock,
  TrendingUp,
  AlertTriangle,
  Archive,
  Filter
} from 'lucide-react';
import AIActivityMonitor from '@/components/AIActivityMonitor';
import AIImageGenerator from '@/components/vendor/AIImageGenerator';
import AIReimaginModal from '@/components/vendor/AIReimaginModal';

interface MediaFile {
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

interface SmartCollections {
  vendor_id: string;
  category: string;
  recent_count: number;
  ai_generated_count: number;
  needs_editing_count: number;
  unused_count: number;
  high_performing_count: number;
  total_count: number;
}

type ViewMode = 'grid' | 'list';
type AIOperation = 'remove-bg' | 'enhance' | 'upscale' | 'reimagine' | null;
type MediaCategory = 'product_photos' | 'marketing' | 'menus' | 'brand' | null;

// Supabase image transformation helper - uses render API for proper thumbnails
const getOptimizedImageUrl = (url: string, width?: number, height?: number) => {
  if (!url) return url;

  // If it's already a full URL, check if it's from Supabase
  if (url.startsWith('http')) {
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      // Extract the bucket and path from the URL
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?|$)/);
      if (match) {
        const bucket = match[1];
        const path = match[2];
        const supabaseUrl = url.split('/storage/v1/object')[0];
        // Use the render endpoint with transformation
        const w = width || 400;
        const h = height || 400;
        return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?width=${w}&height=${h}&resize=cover&quality=80`;
      }
    }
    return url;
  }

  // If it's a relative path like "vendor-product-images/abc123.jpg"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) return url;

  // Parse bucket and path
  const parts = url.split('/');
  if (parts.length >= 2) {
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    const w = width || 400;
    const h = height || 400;
    return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?width=${w}&height=${h}&resize=cover&quality=80`;
  }

  // Fallback to object URL
  return `${supabaseUrl}/storage/v1/object/public/${url}`;
};

export default function VendorMediaLibrary() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [aiOperation, setAIOperation] = useState<AIOperation>(null);
  const [operationProgress, setOperationProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quickViewFile, setQuickViewFile] = useState<MediaFile | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showReimaginModal, setShowReimaginModal] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [smartCollections, setSmartCollections] = useState<SmartCollections | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load media files
  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor) {
      loadMedia();
    }
  }, [authLoading, isAuthenticated, vendor, selectedCategory]);

  // Debug: Track quickViewFile changes
  useEffect(() => {
    console.log('🔍 quickViewFile state changed:', quickViewFile ? quickViewFile.file_name : 'null');
  }, [quickViewFile]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const url = `/api/vendor/media${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'x-vendor-id': vendor?.id || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load media');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setSmartCollections(data.smart_collections || null);
    } catch (err: any) {
      console.error('❌ Error loading media:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const uploadedFiles: MediaFile[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/vendor/media', {
          method: 'POST',
          headers: {
            'x-vendor-id': vendor?.id || '',
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push(data.file);
        }
      }

      // Reload media library
      await loadMedia();
      setSelectedFiles(new Set());
    } catch (err) {
      console.error('❌ Error uploading files:', err);
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Delete files
  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;

    if (!confirm(`Delete ${selectedFiles.size} file(s)?`)) return;

    try {
      for (const fileName of selectedFiles) {
        await fetch(`/api/vendor/media?file=${encodeURIComponent(fileName)}`, {
          method: 'DELETE',
          headers: {
            'x-vendor-id': vendor?.id || '',
          },
        });
      }

      await loadMedia();
      setSelectedFiles(new Set());
    } catch (err) {
      console.error('❌ Error deleting files:', err);
      setError('Failed to delete files');
    }
  };

  // Download file
  const handleDownload = (file: MediaFile) => {
    const a = document.createElement('a');
    a.href = file.file_url;
    a.download = file.file_name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // AI Operations
  const handleAIOperation = async (operation: 'remove-bg' | 'enhance' | 'upscale' | 'reimagine') => {
    if (selectedFiles.size === 0) {
      alert('Please select files first');
      return;
    }

    // For reimagine, show modal instead of direct processing
    if (operation === 'reimagine') {
      setShowReimaginModal(true);
      return;
    }

    setAIOperation(operation);
    setOperationProgress(`Starting ${operation}...`);

    // Dispatch AI start event for monitor
    window.dispatchEvent(new CustomEvent('ai-autofill-start'));

    try {
      const fileNames = Array.from(selectedFiles);

      // Get file objects with URLs
      const selectedFileObjects = files.filter(f => selectedFiles.has(f.file_name));
      const filesData = selectedFileObjects.map(f => ({
        url: f.file_url,
        name: f.file_name
      }));

      let endpoint = '';
      let body: any = {};

      switch (operation) {
        case 'remove-bg':
          endpoint = '/api/vendor/media/remove-bg';
          body = { files: filesData };
          break;
        case 'enhance':
          endpoint = '/api/vendor/media/bulk-enhance';
          body = { files: filesData };
          break;
        case 'upscale':
          endpoint = '/api/vendor/media/upscale';
          body = { files: filesData };
          break;
      }

      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: { message: `# ${operation.toUpperCase()}\n\nProcessing ${fileNames.length} file(s)...` }
      }));

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor?.id || '',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${operation}`);
      }

      const result = await response.json();

      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: {
          message: `\n## ✅ Complete\n\n- Processed: ${result.processed || result.successful?.length || 0}\n- Failed: ${result.failed || result.errors?.length || 0}`
        }
      }));

      // Reload media
      await loadMedia();
      setSelectedFiles(new Set());
      setOperationProgress('');

    } catch (err: any) {
      console.error('❌ Error in AI operation:', err);
      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: { message: `\n## ❌ Error\n\n${err.message}` }
      }));
    } finally {
      setAIOperation(null);
      window.dispatchEvent(new CustomEvent('ai-autofill-complete'));
    }
  };

  // Selection handlers
  const toggleFileSelection = (fileName: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileName)) {
      newSelection.delete(fileName);
    } else {
      newSelection.add(fileName);
    }
    setSelectedFiles(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.file_name)));
    }
  };

  // Extract all available tags
  const availableTags = Array.from(
    new Set(
      files.flatMap(file => [
        ...(file.ai_tags || []),
        ...(file.custom_tags || [])
      ])
    )
  ).sort();

  // Filter files by search and tags
  const filteredFiles = files.filter(file => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = file.file_name.toLowerCase().includes(query);
      const matchesDescription = file.ai_description?.toLowerCase().includes(query);
      const matchesTags = file.ai_tags?.some(tag => tag.toLowerCase().includes(query)) ||
                          file.custom_tags?.some(tag => tag.toLowerCase().includes(query));

      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const fileTags = [...(file.ai_tags || []), ...(file.custom_tags || [])];
      const hasAllTags = selectedTags.every(tag =>
        fileTags.some(fileTag => fileTag.toLowerCase() === tag.toLowerCase())
      );
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  });

  // Handle quick view with logging
  const handleOpenQuickView = useCallback((file: MediaFile) => {
    console.log('🖼️ Opening Quick View for:', file.file_name);
    console.log('📋 Current quickViewFile:', quickViewFile);
    setQuickViewFile(file);
  }, [quickViewFile]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm uppercase tracking-wider">Loading Media...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Please log in to access the media library.</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen bg-black -mx-4 md:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-16 -mt-4 md:-mt-6"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-[1920px] mx-auto">
          {/* Header - Responsive padding */}
          <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 lg:px-8 lg:pt-8 lg:pb-6 xl:px-10 xl:pt-10 xl:pb-8 2xl:px-16 border-b border-white/5">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xs md:text-sm uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>
                Media Library
              </h1>
              <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-[0.15em]">
                <ImagePlus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{files.length} Files</span>
                <span className="sm:hidden">{files.length}</span>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 hidden sm:block">
              Manage Images · AI-Powered Editing
            </p>
          </div>

          {/* Main Content - FULL WIDTH, no sidebar */}
          <div className="w-full">
            <div className="px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-16">

          {/* Error Display */}
          {error && (
            <div className="mb-4 md:mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 md:p-4 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-xs md:text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toolbar - Mobile optimized */}
          <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
            {/* Top Row: Search + Filter/View Toggle */}
            <div className="flex gap-2">
              {/* Filter Button - Shows category selector (all screen sizes) */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`flex-shrink-0 p-2.5 rounded-2xl border-2 transition-all touch-manipulation ${
                  selectedCategory !== null || showMobileFilters
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 active:bg-white/10 active:border-white/20 md:hover:bg-white/10 md:hover:border-white/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-white/5 border border-white/10 text-white pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-white/20 placeholder-white/40 hover:bg-white/10 transition-all"
                />
              </div>

              {/* View Mode Toggle - Tablet+ only */}
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 md:p-3 rounded-2xl border-2 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 md:p-3 rounded-2xl border-2 transition-all ${
                    viewMode === 'list'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <List className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter - Collapsible horizontal scroll (all screen sizes) */}
            {showMobileFilters && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    selectedCategory === null
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/5 text-white/60 border-white/10 active:bg-white/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('product_photos');
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    selectedCategory === 'product_photos'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/5 text-white/60 border-white/10 active:bg-white/10'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('marketing');
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    selectedCategory === 'marketing'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/5 text-white/60 border-white/10 active:bg-white/10'
                  }`}
                >
                  Marketing
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('menus');
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    selectedCategory === 'menus'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/5 text-white/60 border-white/10 active:bg-white/10'
                  }`}
                >
                  Menus
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('brand');
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    selectedCategory === 'brand'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/5 text-white/60 border-white/10 active:bg-white/10'
                  }`}
                >
                  Brand
                </button>
              </div>
            )}

            {/* Bottom Row: Action Buttons */}
            <div className="flex gap-2">
              {/* Generate with AI Button */}
              <button
                onClick={() => setShowAIGenerator(true)}
                className="flex-1 md:flex-initial bg-white text-black border-2 border-white rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/90 font-black transition-all flex items-center justify-center gap-2"
                style={{ fontWeight: 900 }}
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Generate with AI</span>
                <span className="sm:hidden">AI Generate</span>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 md:flex-initial bg-white/10 text-white border-2 border-white/20 rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontWeight: 900 }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Upload</span>
                    <span className="sm:hidden">Upload</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          {/* Selection & AI Toolbar - Mobile optimized */}
          {files.length > 0 && (
            <div className="mb-4 md:mb-6 bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 md:p-4">
              <div className="flex flex-col gap-3 md:gap-4">
                {/* Selection Controls */}
                <div className="flex items-center gap-3 md:gap-4 justify-between">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    {selectedFiles.size === filteredFiles.length ? (
                      <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <Square className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.15em]">
                      {selectedFiles.size === 0
                        ? 'Select All'
                        : `${selectedFiles.size} Selected`}
                    </span>
                  </button>

                  {selectedFiles.size > 0 && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs uppercase tracking-[0.15em]">Delete</span>
                    </button>
                  )}
                </div>

                {/* AI Operations - Horizontal scroll on mobile */}
                {selectedFiles.size > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                    <button
                      onClick={() => handleAIOperation('remove-bg')}
                      disabled={aiOperation !== null}
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-3 md:px-4 py-2 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold whitespace-nowrap flex-shrink-0"
                    >
                      {aiOperation === 'remove-bg' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">Remove BG</span>
                      <span className="sm:hidden">BG</span>
                    </button>

                    <button
                      onClick={() => handleAIOperation('enhance')}
                      disabled={aiOperation !== null}
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-3 md:px-4 py-2 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold whitespace-nowrap flex-shrink-0"
                    >
                      {aiOperation === 'enhance' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      Enhance
                    </button>

                    <button
                      onClick={() => handleAIOperation('upscale')}
                      disabled={aiOperation !== null}
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-3 md:px-4 py-2 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold whitespace-nowrap flex-shrink-0"
                    >
                      {aiOperation === 'upscale' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ZoomIn className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">Upscale 4x</span>
                      <span className="sm:hidden">Upscale</span>
                    </button>

                    <button
                      onClick={() => handleAIOperation('reimagine')}
                      disabled={aiOperation !== null}
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-3 md:px-4 py-2 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold whitespace-nowrap flex-shrink-0"
                    >
                      {aiOperation === 'reimagine' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Re-imagine
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files Display - Responsive grid */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 md:p-12 text-center">
              <div className="max-w-md mx-auto">
                {files.length === 0 ? (
                  <>
                    <FolderOpen className="w-12 h-12 md:w-16 md:h-16 text-white/20 mx-auto mb-3 md:mb-4" />
                    <h2 className="text-base md:text-xl text-white/60 mb-2 font-bold uppercase tracking-tight">
                      No Media Yet
                    </h2>
                    <p className="text-white/40 mb-4 md:mb-6 text-xs md:text-sm">
                      Upload your first product images to get started with AI-powered editing
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 text-white border-2 border-white/20 rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-[10px] md:text-xs uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all inline-flex items-center gap-2"
                      style={{ fontWeight: 900 }}
                    >
                      <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Upload Images
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 md:w-16 md:h-16 text-white/20 mx-auto mb-3 md:mb-4" />
                    <h2 className="text-base md:text-xl text-white/60 mb-2 font-bold uppercase tracking-tight">
                      No Results
                    </h2>
                    <p className="text-white/40 text-xs md:text-sm">
                      No files match &quot;{searchQuery}&quot;
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-6">
              {filteredFiles.map((file) => (
                <MediaCard
                  key={file.id}
                  file={file}
                  selected={selectedFiles.has(file.file_name)}
                  onToggleSelect={() => toggleFileSelection(file.file_name)}
                  onDownload={() => handleDownload(file)}
                  onQuickView={() => handleOpenQuickView(file)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {filteredFiles.map((file) => (
                <MediaListItem
                  key={file.id}
                  file={file}
                  selected={selectedFiles.has(file.file_name)}
                  onToggleSelect={() => toggleFileSelection(file.file_name)}
                  onDownload={() => handleDownload(file)}
                  onQuickView={() => handleOpenQuickView(file)}
                />
              ))}
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-white/40">
            <div className="text-center">
              <Upload className="w-20 h-20 text-white mx-auto mb-4 animate-bounce" />
              <p className="text-2xl text-white font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                Drop Files Here
              </p>
              <p className="text-white/60 text-sm mt-2">Release to upload</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewFile && (
        <QuickViewModal
          file={quickViewFile}
          onClose={() => setQuickViewFile(null)}
          onDownload={() => handleDownload(quickViewFile)}
          onDelete={async () => {
            if (confirm(`Delete "${quickViewFile.file_name}"?`)) {
              await fetch(`/api/vendor/media?file=${encodeURIComponent(quickViewFile.file_name)}`, {
                method: 'DELETE',
                headers: { 'x-vendor-id': vendor?.id || '' },
              });
              await loadMedia();
              setQuickViewFile(null);
            }
          }}
          vendorId={vendor?.id || ''}
          onUpdate={loadMedia}
        />
      )}

      {/* AI Image Generator Modal */}
      {showAIGenerator && (
        <AIImageGenerator
          vendorId={vendor?.id || ''}
          onClose={() => setShowAIGenerator(false)}
          onImageGenerated={() => {
            loadMedia();
            setShowAIGenerator(false);
          }}
        />
      )}

      {/* AI Reimagine Modal */}
      {showReimaginModal && (
        <AIReimaginModal
          vendorId={vendor?.id || ''}
          files={files.filter(f => selectedFiles.has(f.file_name)).map(f => ({ url: f.file_url, name: f.file_name }))}
          onClose={() => setShowReimaginModal(false)}
          onComplete={() => {
            loadMedia();
            setSelectedFiles(new Set());
          }}
        />
      )}

      {/* AI Activity Monitor */}
      <AIActivityMonitor />
    </>
  );
}

// Media Card Component (Grid View)
interface MediaCardProps {
  file: MediaFile;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: () => void;
  onQuickView: () => void;
}

function MediaCard({ file, selected, onToggleSelect, onDownload, onQuickView }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = getOptimizedImageUrl(file.file_url, 400, 400);

  const handleQuickView = () => {
    console.log('📸 Quick View clicked for:', file.file_name);
    onQuickView();
  };

  return (
    <div
      className={`group relative bg-[#0a0a0a] active:bg-[#141414] md:hover:bg-[#141414] border rounded-xl md:rounded-2xl overflow-hidden transition-all duration-200 md:duration-300 active:scale-[0.98] md:hover:-translate-y-1 md:active:scale-100 ${
        selected ? 'border-white/30 ring-1 md:ring-2 ring-white/20' : 'border-white/5 md:hover:border-white/10'
      }`}
    >
      {/* Selection Checkbox - Larger touch target on mobile */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="absolute top-2 left-2 md:top-3 md:left-3 z-10 w-7 h-7 md:w-6 md:h-6 rounded-lg bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center active:bg-black/90 md:hover:bg-black/80 transition-all touch-manipulation"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 md:w-4 md:h-4 text-white" />
        ) : (
          <Square className="w-4 h-4 md:w-4 md:h-4 text-white/60" />
        )}
      </button>

      {/* Download Button - Always visible on touch devices */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className="absolute top-2 right-2 md:top-3 md:right-3 z-10 w-7 h-7 md:w-6 md:h-6 rounded-lg bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center active:bg-black/90 md:hover:bg-black/80 transition-all md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
      >
        <Download className="w-3.5 h-3.5 md:w-3 md:h-3 text-white" />
      </button>

      {/* Image - Click to Quick View */}
      <div
        onClick={handleQuickView}
        className="aspect-square bg-black relative cursor-pointer touch-manipulation"
      >
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={file.file_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain p-3 md:p-4"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus className="w-10 h-10 md:w-12 md:h-12 text-white/20" />
          </div>
        )}

        {/* Quick View Hint - Desktop only */}
        <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all items-center justify-center">
          <div className="text-white text-xs uppercase tracking-[0.15em] flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Quick View
          </div>
        </div>
      </div>

      {/* File Info */}
      <div className="p-2.5 md:p-3 border-t border-white/5">
        <p className="text-white text-[10px] md:text-xs font-medium truncate mb-0.5 md:mb-1">{file.file_name}</p>
        <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">
          {(file.file_size / 1024).toFixed(0)} KB
        </p>
      </div>
    </div>
  );
}

// Media List Item Component (List View)
interface MediaListItemProps {
  file: MediaFile;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: () => void;
  onQuickView: () => void;
}

function MediaListItem({ file, selected, onToggleSelect, onDownload, onQuickView }: MediaListItemProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = getOptimizedImageUrl(file.file_url, 100, 100);

  const handleQuickView = () => {
    console.log('📸 Quick View clicked (list) for:', file.file_name);
    onQuickView();
  };

  return (
    <div
      className={`flex items-center gap-3 md:gap-4 bg-[#0a0a0a] active:bg-[#141414] md:hover:bg-[#141414] border rounded-xl md:rounded-2xl p-3 md:p-4 transition-all touch-manipulation ${
        selected ? 'border-white/30 ring-1 md:ring-2 ring-white/20' : 'border-white/5 md:hover:border-white/10'
      }`}
    >
      {/* Checkbox - Larger on mobile */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 md:hover:bg-white/10 transition-all touch-manipulation"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-white" />
        ) : (
          <Square className="w-4 h-4 text-white/60" />
        )}
      </button>

      {/* Thumbnail - Click to Quick View */}
      <div
        onClick={handleQuickView}
        className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-black rounded-lg md:rounded-xl overflow-hidden relative cursor-pointer active:ring-2 md:hover:ring-2 ring-white/20 transition-all group touch-manipulation"
      >
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={file.file_name}
            fill
            sizes="64px"
            className="object-contain p-1.5 md:p-2"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus className="w-5 h-5 md:w-6 md:h-6 text-white/20" />
          </div>
        )}
        <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all items-center justify-center">
          <Eye className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs md:text-sm font-medium truncate">{file.file_name}</p>
        <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
          <span className="text-white/40 text-[10px] md:text-xs uppercase tracking-wider">
            {(file.file_size / 1024).toFixed(0)} KB
          </span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-white/40 text-[10px] md:text-xs hidden sm:inline">
            {new Date(file.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 md:hover:bg-white/10 md:hover:border-white/20 transition-all touch-manipulation"
      >
        <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
      </button>
    </div>
  );
}

// Quick View Modal Component
interface QuickViewModalProps {
  file: MediaFile;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  vendorId: string;
  onUpdate: () => void;
}

interface Product {
  id: string;
  name: string;
  featured_image?: string;
}

function QuickViewModal({ file, onClose, onDownload, onDelete, vendorId, onUpdate }: QuickViewModalProps) {
  const [imageError, setImageError] = useState(false);
  const fullSizeUrl = getOptimizedImageUrl(file.file_url, 1200);
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showLinkProducts, setShowLinkProducts] = useState(false);

  // Load linked products
  useEffect(() => {
    const loadProducts = async () => {
      if (!file.linked_product_ids || file.linked_product_ids.length === 0) {
        setLinkedProducts([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const response = await fetch('/api/vendor/products', {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.ok) {
          const data = await response.json();
          const linked = data.products.filter((p: Product) =>
            file.linked_product_ids?.includes(p.id)
          );
          setLinkedProducts(linked);
          setAllProducts(data.products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [file.linked_product_ids, vendorId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLinkProducts) {
          setShowLinkProducts(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, showLinkProducts]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${file.file_name}"?`)) {
      onDelete();
    }
  };

  const handleLinkProduct = async (productId: string) => {
    try {
      const updatedLinks = [...(file.linked_product_ids || []), productId];

      const response = await fetch('/api/vendor/media', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId
        },
        body: JSON.stringify({
          id: file.id,
          linked_product_ids: updatedLinks
        })
      });

      if (response.ok) {
        // Refresh products list
        const data = await response.json();
        const linked = allProducts.filter(p => updatedLinks.includes(p.id));
        setLinkedProducts(linked);
        onUpdate();
      }
    } catch (error) {
      console.error('Error linking product:', error);
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    try {
      const updatedLinks = (file.linked_product_ids || []).filter(id => id !== productId);

      const response = await fetch('/api/vendor/media', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId
        },
        body: JSON.stringify({
          id: file.id,
          linked_product_ids: updatedLinks
        })
      });

      if (response.ok) {
        const linked = allProducts.filter(p => updatedLinks.includes(p.id));
        setLinkedProducts(linked);
        onUpdate();
      }
    } catch (error) {
      console.error('Error unlinking product:', error);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/95 md:bg-black/90 md:backdrop-blur-md z-[250] flex items-center justify-center p-0 md:p-4"
    >
      <div className="bg-black md:bg-[#0a0a0a] md:border md:border-white/10 md:rounded-2xl w-full h-full md:max-w-6xl md:w-full md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Responsive */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/10 bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black uppercase tracking-tight text-sm md:text-lg truncate" style={{ fontWeight: 900 }}>
              {file.file_name}
            </h2>
            <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
              <span className="text-white/40 text-[10px] md:text-xs uppercase tracking-wider">
                {(file.file_size / 1024).toFixed(0)} KB
              </span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="text-white/40 text-[10px] md:text-xs hidden sm:inline">
                {new Date(file.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/10 md:bg-white/5 border border-white/20 md:border-white/10 flex items-center justify-center active:bg-white/20 md:hover:bg-white/10 md:hover:border-white/20 transition-all ml-3 md:ml-4 touch-manipulation"
          >
            <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>

        {/* Image - Full screen on mobile */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-black flex items-center justify-center min-h-0">
          {!imageError ? (
            <div className="relative w-full h-full md:h-[600px] md:max-w-4xl">
              <Image
                src={fullSizeUrl}
                alt={file.file_name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                onError={() => setImageError(true)}
                unoptimized
                quality={100}
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-white/40">
              <ImagePlus className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4" />
              <p className="text-xs md:text-sm">Failed to load image</p>
            </div>
          )}
        </div>

        {/* Product Links Section - Responsive */}
        <div className="border-t border-white/10 p-3 md:p-4 bg-black/40">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60" />
              <h3 className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/80 font-bold">
                Linked Products
              </h3>
              {linkedProducts.length > 0 && (
                <span className="text-[9px] md:text-[10px] text-white/40">({linkedProducts.length})</span>
              )}
            </div>
            <button
              onClick={() => setShowLinkProducts(!showLinkProducts)}
              className="text-[10px] md:text-xs text-white/60 active:text-white md:hover:text-white transition-colors uppercase tracking-wider touch-manipulation px-2 py-1 -mr-2"
            >
              {showLinkProducts ? 'Done' : 'Link Product'}
            </button>
          </div>

          {showLinkProducts ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allProducts
                .filter(p => !file.linked_product_ids?.includes(p.id))
                .map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleLinkProduct(product.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left"
                  >
                    <span className="text-xs text-white">{product.name}</span>
                    <span className="text-[10px] text-white/40">+ Link</span>
                  </button>
                ))}
            </div>
          ) : (
            <div className="space-y-2">
              {loadingProducts ? (
                <div className="text-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-white/40 mx-auto" />
                </div>
              ) : linkedProducts.length > 0 ? (
                linkedProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-xs text-white">{product.name}</span>
                    <button
                      onClick={() => handleUnlinkProduct(product.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      Unlink
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40 text-center py-2">
                  No products linked to this image
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions - Responsive */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0 p-3 md:p-4 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex-1 md:flex-initial bg-white/10 text-white border-2 border-white/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-2 text-[10px] md:text-xs uppercase tracking-[0.15em] active:bg-white/20 md:hover:bg-white/20 md:hover:border-white/30 font-black transition-all flex items-center justify-center gap-2 touch-manipulation"
              style={{ fontWeight: 900 }}
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Download
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 md:flex-initial bg-red-500/10 text-red-500 border-2 border-red-500/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-2 text-[10px] md:text-xs uppercase tracking-[0.15em] active:bg-red-500/20 md:hover:bg-red-500/20 md:hover:border-red-500/30 font-black transition-all flex items-center justify-center gap-2 touch-manipulation"
              style={{ fontWeight: 900 }}
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Delete
            </button>
          </div>
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 active:text-white md:hover:text-white text-[10px] md:text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center md:justify-start gap-2 touch-manipulation py-2 md:py-0"
          >
            <Edit3 className="w-3 h-3" />
            Open Original
          </a>
        </div>
      </div>
    </div>
  );
}
