"use client";

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import {
  ImagePlus, Search, Grid3x3, List, Download, Trash2, Eye,
  Link2, X, Check, Loader2, Upload, Image as ImageIcon,
  Edit3, Copy, Sparkles, Wand2, Scissors, Brain
} from 'lucide-react';

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
  custom_tags?: string[];
  title?: string;
  alt_text?: string;
  linked_product_ids?: string[];
  dominant_colors?: string[];
  detected_content?: any;
  quality_score?: number;
  created_at: string;
  updated_at?: string;
}

type MediaCategory = 'product_photos' | 'marketing' | 'menus' | 'brand' | null;

interface ContextMenu {
  x: number;
  y: number;
  file: MediaFile;
}

// Memoized grid item for better performance
const GridItem = memo(({
  file,
  isSelected,
  onSelect,
  onContextMenu,
  onQuickView
}: {
  file: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onQuickView: () => void;
}) => {
  // Use Supabase render API for thumbnails
  const thumbnailUrl = file.file_url.includes('supabase.co')
    ? file.file_url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=400&height=400&quality=75'
    : file.file_url;

  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-white' : ''
      }`}
      style={{ willChange: 'transform' }}
    >
      <img
        src={thumbnailUrl}
        alt={file.file_name}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-white text-xs font-medium truncate">{file.file_name}</p>
        </div>
      </div>

      {/* Selection indicator */}
      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
        isSelected
          ? 'bg-white border-white'
          : 'bg-black/40 border-white/60 backdrop-blur-sm'
      }`}>
        {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </div>
    </div>
  );
});

GridItem.displayName = 'GridItem';

export default function MediaLibraryClient() {
  const { vendor } = useAppAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewFile, setQuickViewFile] = useState<MediaFile | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<MediaCategory>(null);
  const [draggingFile, setDraggingFile] = useState<MediaFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media files
  const loadMedia = useCallback(async () => {
    if (!vendor?.id) return;

    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/vendor/media?${params}`, {
        headers: { 'x-vendor-id': vendor.id }
      });

      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  }, [vendor?.id, selectedCategory]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Filter files
  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.file_name.toLowerCase().includes(query) ||
      file.ai_description?.toLowerCase().includes(query) ||
      file.ai_tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Handlers
  const toggleFileSelection = useCallback((fileName: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  }, []);

  const handleFileUpload = async (files: FileList) => {
    if (!vendor?.id || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        if (selectedCategory) formData.append('category', selectedCategory);

        await fetch('/api/vendor/media', {
          method: 'POST',
          headers: { 'x-vendor-id': vendor.id },
          body: formData
        });
      }

      await loadMedia();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangeCategory = async (file: MediaFile, newCategory: MediaCategory) => {
    if (!newCategory || file.category === newCategory || !vendor?.id) return;

    try {
      const response = await fetch('/api/vendor/media', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          id: file.id,
          category: newCategory
        })
      });

      if (response.ok) {
        await loadMedia();
      }
    } catch (error) {
      console.error('Error changing category:', error);
    }
  };

  const handleUpdateMetadata = async (file: MediaFile, updates: Partial<MediaFile>) => {
    if (!vendor?.id) return;

    try {
      const response = await fetch('/api/vendor/media', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          id: file.id,
          ...updates
        })
      });

      if (response.ok) {
        await loadMedia();
        setEditingFile(null);
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  const handleDelete = async () => {
    if (!vendor?.id || selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} file(s)?`)) return;

    try {
      for (const fileName of selectedFiles) {
        await fetch(`/api/vendor/media?file=${fileName}`, {
          method: 'DELETE',
          headers: { 'x-vendor-id': vendor.id }
        });
      }

      setSelectedFiles(new Set());
      await loadMedia();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDownload = (file: MediaFile) => {
    window.open(file.file_url, '_blank');
  };

  const handleCopyUrl = (file: MediaFile) => {
    navigator.clipboard.writeText(file.file_url);
  };

  const handleAutoMatch = async () => {
    if (!vendor?.id) return;
    setAutoMatching(true);

    try {
      await fetch('/api/vendor/media/auto-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id
        }
      });

      await loadMedia();
    } catch (error) {
      console.error('Auto-match error:', error);
    } finally {
      setAutoMatching(false);
    }
  };

  // AI Operations
  const handleBulkRetag = async () => {
    if (!vendor?.id || selectedFiles.size === 0) return;
    setAiProcessing(true);

    try {
      const selectedFileObjs = files.filter(f => selectedFiles.has(f.file_name));

      for (const file of selectedFileObjs) {
        await fetch('/api/vendor/media/ai-retag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-vendor-id': vendor.id
          },
          body: JSON.stringify({ fileId: file.id })
        });
      }

      await loadMedia();
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Bulk retag error:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!vendor?.id || selectedFiles.size === 0) return;
    setAiProcessing(true);

    try {
      const selectedFileObjs = files.filter(f => selectedFiles.has(f.file_name));

      for (const file of selectedFileObjs) {
        await fetch('/api/vendor/media/remove-bg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-vendor-id': vendor.id
          },
          body: JSON.stringify({ fileId: file.id })
        });
      }

      await loadMedia();
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Remove background error:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!vendor?.id || !generatePrompt.trim()) return;
    setAiProcessing(true);

    try {
      const response = await fetch('/api/vendor/media/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id
        },
        body: JSON.stringify({
          prompt: generatePrompt,
          category: selectedCategory || 'product_photos'
        })
      });

      if (response.ok) {
        await loadMedia();
        setGeneratePrompt('');
        setShowGeneratePanel(false);
      }
    } catch (error) {
      console.error('Generate image error:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const categories = [
    { value: null, label: 'All Media' },
    { value: 'product_photos' as MediaCategory, label: 'Products' },
    { value: 'marketing' as MediaCategory, label: 'Marketing' },
    { value: 'menus' as MediaCategory, label: 'Menus' },
    { value: 'brand' as MediaCategory, label: 'Brand' }
  ];

  if (loading) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin mx-auto mb-2" />
          <p className="text-white/40 text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-black overflow-hidden flex flex-col"
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
      }}
    >
      {/* Top Toolbar */}
      <div className="h-14 bg-white/[0.02] border-b border-white/[0.06] flex items-center px-6 flex-shrink-0">
        <div className="flex items-center gap-4 flex-1">
          {/* View Controls */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-white/[0.06]" />

          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
            />
          </div>

          <div className="flex-1" />

          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGeneratePanel(!showGeneratePanel)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                showGeneratePanel
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
              }`}
            >
              Generate
            </button>

            <div className="w-px h-6 bg-white/[0.06]" />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Generate Panel */}
      {showGeneratePanel && (
        <div className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && generatePrompt.trim() && !aiProcessing) {
                  handleGenerateImage();
                }
              }}
              placeholder="Describe image to generate..."
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
            />
            <button
              onClick={handleGenerateImage}
              disabled={aiProcessing || !generatePrompt.trim()}
              className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {aiProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate</span>
              )}
            </button>
            <button
              onClick={() => setShowGeneratePanel(false)}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Category Toolbar */}
      <div className="h-12 bg-white/[0.01] border-b border-white/[0.06] flex items-center px-6 gap-3 overflow-x-auto flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.value)}
            onDragOver={(e) => {
              if (!draggingFile) return;
              e.preventDefault();
              setDragOverCategory(cat.value);
            }}
            onDragLeave={() => setDragOverCategory(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingFile && cat.value) {
                handleChangeCategory(draggingFile, cat.value);
              }
              setDragOverCategory(null);
              setDraggingFile(null);
            }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-white/[0.12] text-white'
                : dragOverCategory === cat.value
                ? 'bg-white/[0.08] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-white/40">{filteredFiles.length} items</span>
      </div>

      {/* Selection Toolbar - Shows when files are selected */}
      {selectedFiles.size > 0 && (
        <div className="h-14 bg-white/[0.08] border-b border-white/[0.12] flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-sm text-white font-medium">{selectedFiles.size} selected</span>

            <div className="h-6 w-px bg-white/[0.12]" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkRetag}
                disabled={aiProcessing}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {aiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                AI Re-tag
              </button>
              <button
                onClick={handleRemoveBackground}
                disabled={aiProcessing}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {aiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                Remove BG
              </button>
              <button
                onClick={handleAutoMatch}
                disabled={autoMatching}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {autoMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Link to Products
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => setSelectedFiles(new Set())}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredFiles.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-white text-base font-medium mb-2">No images yet</h3>
              <p className="text-white/40 text-sm mb-6">Upload or drag files to get started</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Images
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredFiles.map((file) => (
              <GridItem
                key={file.id}
                file={file}
                isSelected={selectedFiles.has(file.file_name)}
                onSelect={() => toggleFileSelection(file.file_name)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, file });
                }}
                onQuickView={() => setQuickViewFile(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl z-[200] py-2 min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setQuickViewFile(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Quick View
          </button>

          <button
            onClick={() => {
              setEditingFile(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Edit3 className="w-4 h-4" />
            Edit Details
          </button>

          <div className="h-px bg-white/[0.06] my-2" />

          <div className="px-4 py-1.5">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-2">Change Category</p>
            {categories.filter(c => c.value).map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  if (cat.value) handleChangeCategory(contextMenu.file, cat.value);
                  setContextMenu(null);
                }}
                className={`w-full px-2 py-1.5 text-left rounded-lg transition-colors flex items-center gap-2 text-xs ${
                  contextMenu.file.category === cat.value
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {contextMenu.file.category === cat.value && <Check className="w-3 h-3" />}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="h-px bg-white/[0.06] my-2" />

          <button
            onClick={() => {
              handleCopyUrl(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            Copy URL
          </button>

          <button
            onClick={() => {
              handleDownload(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <div className="h-px bg-white/[0.06] my-2" />

          <button
            onClick={() => {
              if (confirm(`Delete ${contextMenu.file.file_name}?`)) {
                setSelectedFiles(new Set([contextMenu.file.file_name]));
                handleDelete();
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Metadata Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-black/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-medium">Edit Details</h2>
              <button
                onClick={() => setEditingFile(null)}
                className="p-2 hover:bg-white/[0.08] text-white/60 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">Title</label>
                <input
                  type="text"
                  defaultValue={editingFile.title || ''}
                  placeholder="Enter title..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
                  onBlur={(e) => {
                    if (e.target.value !== editingFile.title) {
                      handleUpdateMetadata(editingFile, { title: e.target.value });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">Alt Text</label>
                <input
                  type="text"
                  defaultValue={editingFile.alt_text || ''}
                  placeholder="Describe the image..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
                  onBlur={(e) => {
                    if (e.target.value !== editingFile.alt_text) {
                      handleUpdateMetadata(editingFile, { alt_text: e.target.value });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">Custom Tags</label>
                <input
                  type="text"
                  defaultValue={editingFile.custom_tags?.join(', ') || ''}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
                  onBlur={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                    handleUpdateMetadata(editingFile, { custom_tags: tags });
                  }}
                />
              </div>

              {editingFile.ai_tags && editingFile.ai_tags.length > 0 && (
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">AI Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {editingFile.ai_tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => setEditingFile(null)}
                className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center mx-auto mb-4">
              <Upload className="w-12 h-12 text-white/60" />
            </div>
            <p className="text-white text-lg font-medium">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Quick View */}
      {quickViewFile && (
        <div
          onClick={() => setQuickViewFile(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-5xl w-full max-h-full flex flex-col items-center">
            <button
              onClick={() => setQuickViewFile(null)}
              className="absolute -top-4 -right-4 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="relative rounded-3xl overflow-hidden shadow-2xl max-h-[calc(100vh-16rem)]">
              <img
                src={quickViewFile.file_url}
                alt={quickViewFile.file_name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="w-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium mb-1 truncate">{quickViewFile.file_name}</p>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span>{formatFileSize(quickViewFile.file_size)}</span>
                    <span>•</span>
                    <span>{quickViewFile.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(quickViewFile)}
                  className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 ml-4"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
