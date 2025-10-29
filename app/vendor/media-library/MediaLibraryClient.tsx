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
  AlertCircle
} from 'lucide-react';
import AIActivityMonitor from '@/components/AIActivityMonitor';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

type ViewMode = 'grid' | 'list';
type AIOperation = 'remove-bg' | 'enhance' | 'upscale' | null;

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

  // Load media files
  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor) {
      loadMedia();
    }
  }, [authLoading, isAuthenticated, vendor]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/vendor/media', {
        headers: {
          'x-vendor-id': vendor?.id || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load media');
      }

      const data = await response.json();
      setFiles(data.files || []);
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
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // AI Operations
  const handleAIOperation = async (operation: 'remove-bg' | 'enhance' | 'upscale') => {
    if (selectedFiles.size === 0) {
      alert('Please select files first');
      return;
    }

    setAIOperation(operation);
    setOperationProgress(`Starting ${operation}...`);

    // Dispatch AI start event for monitor
    window.dispatchEvent(new CustomEvent('ai-autofill-start'));

    try {
      const fileNames = Array.from(selectedFiles);
      let endpoint = '';

      switch (operation) {
        case 'remove-bg':
          endpoint = '/api/vendor/media/remove-bg';
          break;
        case 'enhance':
          endpoint = '/api/vendor/media/bulk-enhance';
          break;
        case 'upscale':
          endpoint = '/api/vendor/media/upscale';
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
        body: JSON.stringify({ fileNames }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${operation}`);
      }

      const result = await response.json();

      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: {
          message: `\n## ✅ Complete\n\n- Processed: ${result.successful?.length || 0}\n- Failed: ${result.failed?.length || 0}`
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
      setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
    }
  };

  // Filter files by search
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className="min-h-screen bg-black p-4 lg:p-8"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight" style={{ fontWeight: 900 }}>
                Media Library
              </h1>
              <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-[0.15em]">
                <ImagePlus className="w-4 h-4" />
                {files.length} Files
              </div>
            </div>
            <p className="text-white/40 text-sm">
              Manage your product images with AI-powered editing tools
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 placeholder-white/40 hover:bg-white/10 transition-all"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-2xl border-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-2xl border-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-white/10 text-white border-2 border-white/20 rounded-2xl px-6 py-3 text-xs uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ fontWeight: 900 }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
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

          {/* Selection & AI Toolbar */}
          {files.length > 0 && (
            <div className="mb-6 bg-[#0a0a0a] border border-white/10 rounded-2xl p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Selection Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    {selectedFiles.size === filteredFiles.length ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span className="text-xs uppercase tracking-[0.15em]">
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
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-[0.15em]">Delete</span>
                    </button>
                  )}
                </div>

                {/* AI Operations */}
                {selectedFiles.size > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAIOperation('remove-bg')}
                      disabled={aiOperation !== null}
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold"
                    >
                      {aiOperation === 'remove-bg' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Remove BG
                    </button>

                    <button
                      onClick={() => handleAIOperation('enhance')}
                      disabled={aiOperation !== null}
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold"
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
                      className="bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold"
                    >
                      {aiOperation === 'upscale' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ZoomIn className="w-3 h-3" />
                      )}
                      Upscale 4x
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files Display */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center">
              <div className="max-w-md mx-auto">
                {files.length === 0 ? (
                  <>
                    <FolderOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h2 className="text-xl text-white/60 mb-2 font-bold uppercase tracking-tight">
                      No Media Yet
                    </h2>
                    <p className="text-white/40 mb-6 text-sm">
                      Upload your first product images to get started with AI-powered editing
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 text-white border-2 border-white/20 rounded-2xl px-6 py-3 text-xs uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all inline-flex items-center gap-2"
                      style={{ fontWeight: 900 }}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Images
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h2 className="text-xl text-white/60 mb-2 font-bold uppercase tracking-tight">
                      No Results
                    </h2>
                    <p className="text-white/40 text-sm">
                      No files match &quot;{searchQuery}&quot;
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <MediaCard
                  key={file.id}
                  file={file}
                  selected={selectedFiles.has(file.name)}
                  onToggleSelect={() => toggleFileSelection(file.name)}
                  onDownload={() => handleDownload(file)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <MediaListItem
                  key={file.id}
                  file={file}
                  selected={selectedFiles.has(file.name)}
                  onToggleSelect={() => toggleFileSelection(file.name)}
                  onDownload={() => handleDownload(file)}
                />
              ))}
            </div>
          )}
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
}

function MediaCard({ file, selected, onToggleSelect, onDownload }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative bg-[#0a0a0a] hover:bg-[#141414] border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        selected ? 'border-white/30 ring-2 ring-white/20' : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onToggleSelect}
        className="absolute top-3 left-3 z-10 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-white" />
        ) : (
          <Square className="w-4 h-4 text-white/60" />
        )}
      </button>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="absolute top-3 right-3 z-10 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
      >
        <Download className="w-3 h-3 text-white" />
      </button>

      {/* Image */}
      <div className="aspect-square bg-black relative">
        {!imageError ? (
          <Image
            src={file.url}
            alt={file.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-4"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus className="w-12 h-12 text-white/20" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3 border-t border-white/5">
        <p className="text-white text-xs font-medium truncate mb-1">{file.name}</p>
        <p className="text-white/40 text-[10px] uppercase tracking-wider">
          {(file.size / 1024).toFixed(0)} KB
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
}

function MediaListItem({ file, selected, onToggleSelect, onDownload }: MediaListItemProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`flex items-center gap-4 bg-[#0a0a0a] hover:bg-[#141414] border rounded-2xl p-4 transition-all ${
        selected ? 'border-white/30 ring-2 ring-white/20' : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-white" />
        ) : (
          <Square className="w-4 h-4 text-white/60" />
        )}
      </button>

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 bg-black rounded-xl overflow-hidden relative">
        {!imageError ? (
          <Image
            src={file.url}
            alt={file.name}
            fill
            sizes="64px"
            className="object-contain p-2"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus className="w-6 h-6 text-white/20" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/40 text-xs uppercase tracking-wider">
            {(file.size / 1024).toFixed(0)} KB
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/40 text-xs">
            {new Date(file.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <Download className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
