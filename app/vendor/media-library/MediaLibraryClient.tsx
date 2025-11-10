"use client";

import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/context/AppAuthContext";
import {
  ImagePlus,
  Search,
  Grid3x3,
  List,
  Download,
  Trash2,
  Eye,
  Link2,
  X,
  Check,
  Loader2,
  Upload,
  Image as ImageIcon,
  Edit3,
  Copy,
  Sparkles,
  Wand2,
  Scissors,
  Brain,
  Columns2,
  Zap,
} from "lucide-react";
import ProductBrowser from "./ProductBrowser";
import GenerationInterface from "./GenerationInterface";
import ProductGallery from "./ProductGallery";
import type { PromptTemplate } from "@/lib/types/prompt-template";

import { logger } from "@/lib/logger";
interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_path: string;
  file_type: string;
  category: "product_photos" | "marketing" | "menus" | "brand";
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

type MediaCategory = "product_photos" | "marketing" | "menus" | "brand" | null;

interface ContextMenu {
  x: number;
  y: number;
  file: MediaFile;
}

// Memoized grid item for better performance
const GridItem = memo(
  ({
    file,
    isSelected,
    onSelect,
    onContextMenu,
    onQuickView,
    onDragStart,
  }: {
    file: MediaFile;
    isSelected: boolean;
    onSelect: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onQuickView: () => void;
    onDragStart?: (file: MediaFile) => void;
  }) => {
    // Use Supabase render API for thumbnails with cache-busting
    const thumbnailUrl = file.file_url.includes("supabase.co")
      ? file.file_url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
        `?width=400&height=400&quality=75&t=${file.updated_at || file.created_at}`
      : file.file_url;

    return (
      <div
        draggable={!!onDragStart}
        onDragStart={(e) => {
          if (onDragStart) {
            e.dataTransfer.setData("mediaFilePath", file.file_path);
            e.dataTransfer.setData("mediaFileName", file.file_name);
            onDragStart(file);
          }
        }}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
          isSelected ? "ring-2 ring-white" : ""
        }`}
        style={{ willChange: "transform" }}
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
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? "bg-white border-white" : "bg-black/40 border-white/60 backdrop-blur-sm"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
        </div>
      </div>
    );
  },
);

GridItem.displayName = "GridItem";

export default function MediaLibraryClient() {
  const router = useRouter();
  const { vendor } = useAppAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickViewFile, setQuickViewFile] = useState<MediaFile | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<MediaCategory>(null);
  const [draggingFile, setDraggingFile] = useState<MediaFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);

  // Generation mode state
  const [generationMode, setGenerationMode] = useState(false);

  // DEBUG: Track generation mode changes
  useEffect(() => {
    logger.debug("⚙️ GenerationMode changed:", {
      value: generationMode,
      selectedCategory,
      splitViewMode,
      stack: new Error().stack
    });
  }, [generationMode]);
  const [selectedProductsForGeneration, setSelectedProductsForGeneration] = useState<Set<string>>(
    new Set(),
  );
  const [productsForGeneration, setProductsForGeneration] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load products for generation when mode is enabled
  useEffect(() => {
    const loadProductsForGen = async () => {
      if (!generationMode || !vendor?.id) return;

      try {
        const response = await fetch(`/api/vendor/products/list?filter=all`, {
          headers: { "x-vendor-id": vendor.id },
        });
        const data = await response.json();
        if (data.success && data.products) {
          setProductsForGeneration(data.products.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (error) {
        logger.error("Error loading products for generation:", error);
      }
    };

    loadProductsForGen();
  }, [generationMode, vendor?.id]);

  // Individual loading states for each AI operation
  const [retagging, setRetagging] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fixingImages, setFixingImages] = useState(false);

  // Dual-pane view states
  const [splitViewMode, setSplitViewMode] = useState(false);
  const [draggedMedia, setDraggedMedia] = useState<MediaFile | null>(null);
  const [dropTargetProduct, setDropTargetProduct] = useState<string | null>(null);
  const [autoMatchResults, setAutoMatchResults] = useState<any>(null);
  const [showingAutoMatch, setShowingAutoMatch] = useState(false);

  // Progress tracking for bulk operations
  const [bulkProgress, setBulkProgress] = useState<{
    operation: "retag" | "remove-bg" | null;
    total: number;
    completed: number;
    failed: number;
  } | null>(null);

  // Product gallery state
  const [galleryProduct, setGalleryProduct] = useState<{
    id: string;
    name: string;
    featured_image_storage: string | null;
  } | null>(null);

  // DEBUG: Track gallery product changes
  useEffect(() => {
    logger.debug("🎭 Gallery product changed", {
      productName: galleryProduct?.name || "null",
      stack: new Error().stack
    });
  }, [galleryProduct]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media files
  const loadMedia = useCallback(async () => {
    if (!vendor?.id) return;

    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/vendor/media?${params}`, {
        headers: { "x-vendor-id": vendor.id },
      });

      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading media:", error);
      }
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
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Filter files
  const filteredFiles = files.filter((file) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.file_name.toLowerCase().includes(query) ||
      file.ai_description?.toLowerCase().includes(query) ||
      file.ai_tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Handlers
  const toggleFileSelection = useCallback((fileName: string) => {
    setSelectedFiles((prev) => {
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
        formData.append("file", file);
        if (selectedCategory) formData.append("category", selectedCategory);

        await fetch("/api/vendor/media", {
          method: "POST",
          headers: { "x-vendor-id": vendor.id },
          body: formData,
        });
      }

      await loadMedia();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Upload error:", error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangeCategory = async (file: MediaFile, newCategory: MediaCategory) => {
    if (!newCategory || file.category === newCategory || !vendor?.id) return;

    try {
      const response = await fetch("/api/vendor/media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          id: file.id,
          category: newCategory,
        }),
      });

      if (response.ok) {
        await loadMedia();
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error changing category:", error);
      }
    }
  };

  const handleUpdateMetadata = async (file: MediaFile, updates: Partial<MediaFile>) => {
    if (!vendor?.id) return;

    try {
      const response = await fetch("/api/vendor/media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          id: file.id,
          ...updates,
        }),
      });

      if (response.ok) {
        await loadMedia();
        setEditingFile(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error updating metadata:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (!vendor?.id || selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} file(s)?`)) return;

    setLoading(true);
    const errors: string[] = [];

    try {
      // Delete files in parallel
      const deletePromises = Array.from(selectedFiles).map(async (fileName) => {
        try {
          const response = await fetch(`/api/vendor/media?file=${encodeURIComponent(fileName)}`, {
            method: "DELETE",
            headers: { "x-vendor-id": vendor.id },
          });

          if (!response.ok) {
            const data = await response.json();
            errors.push(`${fileName}: ${data.error || "Failed to delete"}`);
          }
        } catch (error) {
          errors.push(`${fileName}: Network error`);
        }
      });

      await Promise.all(deletePromises);

      if (errors.length > 0) {
        logger.error("Delete errors:", errors);
        alert(`Failed to delete ${errors.length} file(s). Check console for details.`);
      }

      setSelectedFiles(new Set());
      await loadMedia();
    } catch (error) {
      logger.error("Delete error:", error);
      alert("An error occurred while deleting files");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (file: MediaFile) => {
    window.open(file.file_url, "_blank");
  };

  const handleCopyUrl = (file: MediaFile) => {
    navigator.clipboard.writeText(file.file_url);
  };

  // Product linking handlers
  const handleLinkProductToMedia = async (productId: string, mediaFilePath: string) => {
    if (!vendor?.id) return;

    try {
      const response = await fetch("/api/vendor/media/link-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({ productId, mediaFilePath }),
      });

      if (response.ok) {
        // Success feedback could go here
        logger.debug("✅ Product linked successfully");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Link error:", error);
      }
    }
  };

  const handleAutoMatch = async () => {
    if (!vendor?.id) return;
    setAutoMatching(true);

    try {
      // Get auto-match suggestions
      const response = await fetch("/api/vendor/media/auto-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({ minConfidence: 70 }),
      });

      const data = await response.json();

      if (data.success && data.matches) {
        setAutoMatchResults(data);
        setShowingAutoMatch(true);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Auto-match error:", error);
      }
    } finally {
      setAutoMatching(false);
    }
  };

  const handleApplyAutoMatch = async (confidence: "high" | "medium" | "low" | "all") => {
    if (!vendor?.id || !autoMatchResults) return;

    try {
      let matchesToApply = autoMatchResults.matches;

      if (confidence !== "all") {
        matchesToApply = matchesToApply.filter((m: any) => m.confidence === confidence);
      }

      const response = await fetch("/api/vendor/media/auto-match", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          matches: matchesToApply.map((m: any) => ({
            productId: m.productId,
            filePath: m.filePath,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        logger.debug(`✅ Linked ${data.linked} products`);
        setShowingAutoMatch(false);
        setAutoMatchResults(null);
        await loadMedia();
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Apply auto-match error:", error);
      }
    }
  };

  // AI Operations
  // Bulk AI Re-tag with parallel processing
  const handleBulkRetag = async () => {
    if (!vendor?.id || selectedFiles.size === 0) return;

    const selectedFileObjs = files.filter((f) => selectedFiles.has(f.file_name));
    const total = selectedFileObjs.length;

    setRetagging(true);
    setBulkProgress({ operation: "retag", total, completed: 0, failed: 0 });

    try {
      // Process in parallel batches of 5 (safe concurrency for AI APIs)
      const BATCH_SIZE = 5;
      let completed = 0;
      let failed = 0;

      for (let i = 0; i < selectedFileObjs.length; i += BATCH_SIZE) {
        const batch = selectedFileObjs.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map((file) =>
            fetch("/api/vendor/media/ai-retag", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-vendor-id": vendor.id,
              },
              body: JSON.stringify({ fileId: file.id }),
            }),
          ),
        );

        results.forEach((result) => {
          if (result.status === "fulfilled") completed++;
          else failed++;
        });

        setBulkProgress({ operation: "retag", total, completed, failed });
      }

      await loadMedia();
      setSelectedFiles(new Set());

      // Show success message
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Bulk retag error:", error);
      }
    } finally {
      setRetagging(false);
      setBulkProgress(null);
    }
  };

  // Bulk Background Removal with parallel processing
  const handleRemoveBackground = async () => {
    if (!vendor?.id || selectedFiles.size === 0) return;

    const selectedFileObjs = files.filter((f) => selectedFiles.has(f.file_name));
    const total = selectedFileObjs.length;

    setRemovingBg(true);
    setBulkProgress({ operation: "remove-bg", total, completed: 0, failed: 0 });

    try {
      // Check if we should use bulk endpoint (10+ files)
      if (selectedFileObjs.length >= 10) {
        // Use PUT endpoint for bulk processing
        const filesPayload = selectedFileObjs.map((f) => ({
          url: f.file_url,
          name: f.file_name,
        }));

        const response = await fetch("/api/vendor/media/remove-bg", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-vendor-id": vendor.id,
          },
          body: JSON.stringify({
            files: filesPayload,
            concurrency: 10,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setBulkProgress({
            operation: "remove-bg",
            total,
            completed: data.processed || 0,
            failed: data.failed || 0,
          });
        }
      } else {
        // Process in parallel batches for smaller sets
        const BATCH_SIZE = 3;
        let completed = 0;
        let failed = 0;

        for (let i = 0; i < selectedFileObjs.length; i += BATCH_SIZE) {
          const batch = selectedFileObjs.slice(i, i + BATCH_SIZE);

          const results = await Promise.allSettled(
            batch.map((file) =>
              fetch("/api/vendor/media/remove-bg", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-vendor-id": vendor.id,
                },
                body: JSON.stringify({
                  imageUrl: file.file_url,
                  fileName: file.file_name,
                }),
              }),
            ),
          );

          results.forEach((result) => {
            if (result.status === "fulfilled" && result.value.ok) completed++;
            else failed++;
          });

          setBulkProgress({ operation: "remove-bg", total, completed, failed });
        }
      }

      await loadMedia();
      setSelectedFiles(new Set());
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Remove background error:", error);
      }
    } finally {
      setRemovingBg(false);
      setBulkProgress(null);
    }
  };

  // Generate Image with AI - TODO: Re-implement with proper state
  const handleGenerateImage = async () => {
    // Disabled until generationPrompt state is properly implemented
    return;
  };

  // Fix broken image records (.jpg -> .png)
  const handleFixBrokenImages = async () => {
    if (!vendor?.id) return;
    setFixingImages(true);

    try {
      const response = await fetch("/api/vendor/media/fix-filenames", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
      });

      const data = await response.json();

      if (data.success) {
        logger.debug(`✅ Fixed ${data.fixed}/${data.total} broken image records`);
        await loadMedia(); // Reload to show fixed images
      }
    } catch (error) {
      logger.error("Fix images error:", error);
    } finally {
      setFixingImages(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const categories = [
    { value: null, label: "All Media" },
    { value: "product_photos" as MediaCategory, label: "Products" },
    { value: "marketing" as MediaCategory, label: "Marketing" },
    { value: "menus" as MediaCategory, label: "Menus" },
    { value: "brand" as MediaCategory, label: "Brand" },
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
      onDragOver={(e) => {
        e.preventDefault();
        // Only show upload overlay if NOT in split view and dragging files
        if (!splitViewMode && e.dataTransfer.types.includes("Files")) {
          setIsDraggingOver(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        // Only handle file uploads if NOT in split view
        if (!splitViewMode && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files);
        }
      }}
    >
      {/* Top Toolbar - Professional editing software style */}
      <div className="h-14 bg-white/[0.02] border-b border-white/[0.06] flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* View Controls - Fixed width */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setSplitViewMode(!splitViewMode)}
              className={`p-1.5 rounded transition-colors ${
                splitViewMode ? "bg-white/[0.12] text-white" : "text-white/40 hover:text-white/60"
              }`}
              title="Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white/[0.12] text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-white/[0.12] text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-white/[0.06] flex-shrink-0" />

          {/* Search Bar - Always visible */}
          <div className="relative w-64 flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
            />
          </div>

          {/* Selection Toolbar - Slides in when files selected */}
          {selectedFiles.size > 0 && (
            <>
              <div className="w-px h-5 bg-white/[0.06] flex-shrink-0" />
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-white/60 font-medium tabular-nums whitespace-nowrap">
                  {selectedFiles.size} selected
                </span>
                <div className="w-px h-5 bg-white/[0.06]" />
                <button
                  onClick={handleBulkRetag}
                  disabled={retagging || removingBg}
                  className="px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  {retagging ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Brain className="w-3 h-3" />
                  )}
                  {retagging && bulkProgress?.operation === "retag"
                    ? `${bulkProgress.completed}/${bulkProgress.total}`
                    : "Re-tag"}
                </button>
                <button
                  onClick={handleRemoveBackground}
                  disabled={retagging || removingBg}
                  className="px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  {removingBg ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Scissors className="w-3 h-3" />
                  )}
                  {removingBg && bulkProgress?.operation === "remove-bg"
                    ? `${bulkProgress.completed}/${bulkProgress.total}`
                    : "Remove BG"}
                </button>
                <button
                  onClick={handleAutoMatch}
                  disabled={autoMatching}
                  className="px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  {autoMatching ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Link2 className="w-3 h-3" />
                  )}
                  Link
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="p-1.5 text-white/40 hover:text-white/60 transition-colors flex-shrink-0"
                  title="Clear selection"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          )}

          <div className="flex-1 min-w-0" />

          {/* Tools - Always visible on right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {splitViewMode && (
              <button
                onClick={handleAutoMatch}
                disabled={autoMatching}
                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                title="Auto-match products to images"
              >
                {autoMatching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                Auto-Match
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View or Media-Only */}
      {splitViewMode ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Products Panel */}
          <div className="w-80 flex-shrink-0">
            {vendor && (
              <ProductBrowser
                vendorId={vendor.id}
                onDragStart={(product) => setDropTargetProduct(product.id)}
                onProductSelect={(product) => {
                  logger.debug("🎬 ProductBrowser: Setting gallery product", { productName: product.name });
                  setGalleryProduct(product);
                }}
                onLinkMedia={handleLinkProductToMedia}
                selectionMode={false}
                selectedProducts={selectedProductsForGeneration}
                onSelectionChange={setSelectedProductsForGeneration}
              />
            )}
          </div>

          {/* Media Grid */}
          <div className="flex-1 flex flex-col">
            {/* Category Toolbar */}
            <div className="h-12 bg-white/[0.02] border-b border-white/[0.06] flex items-center px-4 gap-2 flex-shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    // Auto-enable generation mode for non-"All Media" categories
                    if (cat.value !== null) {
                      setGenerationMode(true);
                      if (!splitViewMode) setSplitViewMode(true);
                    } else {
                      setGenerationMode(false);
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? "bg-white/[0.12] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              <div className="flex-1" />
              <span className="text-xs text-white/40 tabular-nums">
                {filteredFiles.length} items
              </span>
            </div>

            {/* Grid with Drop Zone OR Generation Interface OR Gallery */}
            <div className="flex-1 overflow-hidden">
              {(() => {
                logger.debug("🎬 Conditional render check:", {
                  hasGalleryProduct: !!galleryProduct,
                  productName: galleryProduct?.name,
                  hasVendor: !!vendor,
                  generationMode,
                  selectedCategory,
                  willShowGallery: !!(galleryProduct && vendor)
                });
                return null;
              })()}
              {galleryProduct && vendor ? (
                /* GALLERY MODE */
                <div className="h-full">
                  <ProductGallery
                    product={galleryProduct}
                    vendorId={vendor.id}
                    onBack={() => {
                      logger.debug("🔙 onBack called - clearing gallery product");
                      setGalleryProduct(null);
                    }}
                    onImageUpdate={() => {
                      loadMedia();
                    }}
                  />
                </div>
              ) : generationMode && selectedCategory === "product_photos" ? (
                /* GENERATION MODE - Products */
                <GenerationInterface
                  vendorId={vendor?.id || ""}
                  selectedProducts={selectedProductsForGeneration}
                  products={productsForGeneration}
                  onGenerated={() => loadMedia()}
                />
              ) : generationMode ? (
                /* GENERATION MODE - Other categories (Coming Soon) */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" strokeWidth={1} />
                    <h3 className="text-xl text-white font-light mb-2">
                      {selectedCategory === "marketing" && "Marketing Generation"}
                      {selectedCategory === "menus" && "Menu Generation"}
                      {selectedCategory === "brand" && "Brand Generation"}
                    </h3>
                    <p className="text-sm text-white/50 font-light">Coming soon</p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                      <ImageIcon className="w-10 h-10 text-white/20" />
                    </div>
                    <h3 className="text-white text-base font-medium mb-2">No images yet</h3>
                    <p className="text-white/40 text-sm mb-6">
                      Upload or drag files to get started
                    </p>
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
                <div className="p-6 overflow-y-auto h-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
                        onDragStart={(file) => setDraggedMedia(file)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Category Toolbar */}
          <div className="h-12 bg-white/[0.02] border-b border-white/[0.06] flex items-center px-4 gap-2 flex-shrink-0 overflow-x-auto">
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
                    ? "bg-white/[0.12] text-white"
                    : dragOverCategory === cat.value
                      ? "bg-white/[0.08] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {cat.label}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-xs text-white/40 tabular-nums">{filteredFiles.length} items</span>
          </div>

          {/* Gallery or Grid */}
          {galleryProduct && vendor ? (
            <div className="flex-1 overflow-hidden h-full">
              <ProductGallery
                product={galleryProduct}
                vendorId={vendor.id}
                onBack={() => setGalleryProduct(null)}
                onImageUpdate={() => {
                  loadMedia();
                }}
              />
            </div>
          ) : (
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
          )}
        </>
      )}

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
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-2">
              Change Category
            </p>
            {categories
              .filter((c) => c.value)
              .map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    if (cat.value) handleChangeCategory(contextMenu.file, cat.value);
                    setContextMenu(null);
                  }}
                  className={`w-full px-2 py-1.5 text-left rounded-lg transition-colors flex items-center gap-2 text-xs ${
                    contextMenu.file.category === cat.value
                      ? "bg-white/[0.08] text-white"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white"
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
                <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  defaultValue={editingFile.title || ""}
                  placeholder="Enter title..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
                  onBlur={(e) => {
                    if (e.target.value !== editingFile.title) {
                      handleUpdateMetadata(editingFile, {
                        title: e.target.value,
                      });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  defaultValue={editingFile.alt_text || ""}
                  placeholder="Describe the image..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
                  onBlur={(e) => {
                    if (e.target.value !== editingFile.alt_text) {
                      handleUpdateMetadata(editingFile, {
                        alt_text: e.target.value,
                      });
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">
                  Custom Tags
                </label>
                <input
                  type="text"
                  defaultValue={editingFile.custom_tags?.join(", ") || ""}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.12] transition-colors"
                  onBlur={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    handleUpdateMetadata(editingFile, { custom_tags: tags });
                  }}
                />
              </div>

              {editingFile.ai_tags && editingFile.ai_tags.length > 0 && (
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wider font-medium mb-2">
                    AI Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {editingFile.ai_tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs text-white/80"
                      >
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
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-full flex flex-col items-center"
          >
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
                  <p className="text-white text-sm font-medium mb-1 truncate">
                    {quickViewFile.file_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span>{formatFileSize(quickViewFile.file_size)}</span>
                    <span>•</span>
                    <span>{quickViewFile.category.replace("_", " ")}</span>
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
