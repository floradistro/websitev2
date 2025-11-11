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
  Folder,
  FolderOpen,
  FolderPlus,
} from "lucide-react";
import ProductBrowser from "./ProductBrowser";
import GenerationInterface from "./GenerationInterface";
import ProductGallery from "./ProductGallery";
import ImageEditor from "./ImageEditor";
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
  file?: MediaFile;
  folder?: {
    id: string;
    name: string;
    parent_folder_id: string | null;
  };
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
    onDoubleClick,
  }: {
    file: MediaFile;
    isSelected: boolean;
    onSelect: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onQuickView: () => void;
    onDragStart?: (file: MediaFile) => void;
    onDoubleClick?: () => void;
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
            e.dataTransfer.setData("mediaFileId", file.id);
            e.dataTransfer.setData("mediaFileUrl", file.file_url);
            onDragStart(file);
          }
        }}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
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

  // DEBUG: Log vendor info on mount
  useEffect(() => {
    logger.debug("🏢 MediaLibraryClient: Vendor info", {
      hasVendor: !!vendor,
      vendorId: vendor?.id || "NO VENDOR ID",
      vendorName: vendor?.store_name || "NO VENDOR NAME",
    });
  }, [vendor]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = root, uuid = inside a folder
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  interface MediaFolder {
    id: string;
    vendor_id: string;
    name: string;
    parent_folder_id: string | null;
    color: string;
    icon: string;
    created_at: string;
  }
  const [quickViewFile, setQuickViewFile] = useState<MediaFile | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<MediaCategory>(null);
  const [draggingFile, setDraggingFile] = useState<MediaFile | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
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
  const [splitViewMode, setSplitViewMode] = useState(true);
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

  // Image editor state
  const [editingImage, setEditingImage] = useState<MediaFile | null>(null);

  // DEBUG: Track gallery product changes
  useEffect(() => {
    logger.debug("🎭 GALLERY PRODUCT CHANGED", {
      productName: galleryProduct?.name || "NULL",
      productId: galleryProduct?.id || "NULL",
      hasProduct: !!galleryProduct,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(0, 5).join('\n')
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

  // MISSION CRITICAL: Load folders on mount AND whenever vendor changes
  useEffect(() => {
    if (vendor?.id) {
      console.log("🔴 LOADING FOLDERS FOR VENDOR:", vendor.id);
      loadFolders();
    }
  }, [vendor?.id]);

  // EXTRA SAFETY: Reload folders if they disappear
  useEffect(() => {
    if (vendor?.id && folders.length === 0) {
      console.log("🔴 NO FOLDERS DETECTED - EMERGENCY RELOAD");
      const timer = setTimeout(() => loadFolders(), 100);
      return () => clearTimeout(timer);
    }
  }, [vendor?.id, folders.length]);

  const loadFolders = async () => {
    if (!vendor) return;
    try {
      const response = await fetch("/api/vendor/media/folders", {
        headers: { "x-vendor-id": vendor.id },
      });
      const data = await response.json();
      logger.debug("📁 Folders loaded:", { success: data.success, count: data.folders?.length, folders: data.folders });
      if (data.success && data.folders) {
        setFolders(data.folders);
      }
    } catch (error) {
      logger.error("Error loading folders:", error);
    }
  };

  const createFolder = async () => {
    if (!vendor || !newFolderName.trim()) return;

    try {
      const response = await fetch("/api/vendor/media/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_folder_id: currentFolderId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadFolders();
        setNewFolderName("");
        setCreatingFolder(false);
      }
    } catch (error) {
      logger.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  const moveFileToFolder = async (fileId: string, folderId: string | null) => {
    if (!vendor) return;

    try {
      const response = await fetch("/api/vendor/media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          id: fileId,
          folder_id: folderId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadMedia();
      }
    } catch (error) {
      logger.error("Error moving file:", error);
      alert("Failed to move file");
    }
  };

  const moveMultipleFilesToFolder = async (fileIds: string[], folderId: string | null) => {
    if (!vendor) return;

    try {
      // Move all files in parallel
      await Promise.all(
        fileIds.map((fileId) =>
          fetch("/api/vendor/media", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-vendor-id": vendor.id,
            },
            body: JSON.stringify({
              id: fileId,
              folder_id: folderId,
            }),
          })
        )
      );

      await loadMedia();
      setSelectedFiles(new Set()); // Clear selection after move
    } catch (error) {
      logger.error("Error moving files:", error);
      alert("Failed to move files");
    }
  };

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

  // Get folders in current directory
  // MISSION CRITICAL: Ensure null comparison works correctly
  // ROOT FOLDERS: parent_folder_id is null/undefined AND we're at root (currentFolderId is null/undefined)
  const currentFolders = folders.filter((f) => {
    // Both null/undefined should match
    if (!currentFolderId) { // More forgiving: any falsy value means root
      return !f.parent_folder_id; // Any falsy value means root folder
    }
    return f.parent_folder_id === currentFolderId;
  });

  // BULLETPROOF: Always have root folders available
  const rootFolders = folders.filter((f) => !f.parent_folder_id);

  // SUPER AGGRESSIVE Debug logging
  useEffect(() => {
    console.log("🔴 FOLDER RENDER CHECK:", {
      totalFolders: folders.length,
      rootFoldersCount: rootFolders.length,
      rootFolderNames: rootFolders.map(f => f.name),
      currentFolderId,
      currentFolderIdType: typeof currentFolderId,
      currentFolderIdIsFalsy: !currentFolderId,
      selectedCategory,
      generationMode,
      willRenderFolders: !currentFolderId && rootFolders.length > 0,
    });
  }, [folders.length, rootFolders.length, currentFolderId, selectedCategory, generationMode]);

  // Get files in current directory (filter by folder_id or null for root)
  const currentFiles = files.filter((f: any) => {
    const fileFolderId = f.folder_id || null;
    return fileFolderId === currentFolderId;
  });

  // Build breadcrumb trail
  const getBreadcrumbs = (): MediaFolder[] => {
    if (!currentFolderId) return [];

    const breadcrumbs: MediaFolder[] = [];
    let folderId: string | null = currentFolderId;

    while (folderId) {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) break;
      breadcrumbs.unshift(folder);
      folderId = folder.parent_folder_id;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

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
      {/* ✨ Magical Toolbar - Effortless & Beautiful */}
      <div className="h-14 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/[0.08] flex items-center px-3 flex-shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* View Mode - Compact pill */}
          <div className="flex items-center gap-0.5 bg-black/40 rounded-full p-1 border border-white/[0.08] flex-shrink-0">
            <button
              onClick={() => setSplitViewMode(!splitViewMode)}
              className={`p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                splitViewMode
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/10"
              }`}
              title="Split View"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                viewMode === "grid"
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/10"
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                viewMode === "list"
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/10"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Search - Glassmorphic */}
          <div className="relative w-56 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-full pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-black/60 focus:border-white/20 transition-all duration-200 focus:shadow-lg focus:shadow-white/5"
            />
          </div>

          {/* Selection Actions - Smooth slide-in */}
          {selectedFiles.size > 0 && (
            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              style={{
                animation: "slideInRight 0.3s ease-out",
              }}
            >
              <div className="h-5 w-px bg-white/10 mx-1" />

              {/* Selection count badge */}
              <div className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                <span className="text-xs text-purple-300 font-semibold tabular-nums">
                  {selectedFiles.size}
                </span>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] rounded-full p-1">
                <button
                  onClick={handleBulkRetag}
                  disabled={retagging || removingBg}
                  className="px-3 py-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  title="Re-tag with AI"
                >
                  {retagging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  {retagging && bulkProgress?.operation === "retag" ? (
                    <span className="tabular-nums">{bulkProgress.completed}/{bulkProgress.total}</span>
                  ) : (
                    <span>Tag</span>
                  )}
                </button>

                <div className="h-5 w-px bg-white/10" />

                <button
                  onClick={handleRemoveBackground}
                  disabled={retagging || removingBg}
                  className="px-3 py-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  title="Remove background"
                >
                  {removingBg ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4" />
                  )}
                  {removingBg && bulkProgress?.operation === "remove-bg" ? (
                    <span className="tabular-nums">{bulkProgress.completed}/{bulkProgress.total}</span>
                  ) : (
                    <span>BG</span>
                  )}
                </button>

                <div className="h-5 w-px bg-white/10" />

                <button
                  onClick={handleAutoMatch}
                  disabled={autoMatching}
                  className="px-3 py-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  title="Link to products"
                >
                  {autoMatching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  <span>Link</span>
                </button>

                <div className="h-5 w-px bg-white/10" />

                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 hover:bg-red-500/20 text-red-400/70 hover:text-red-300 rounded-full text-xs font-medium transition-all flex items-center justify-center"
                  title="Delete selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setSelectedFiles(new Set())}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1" />

          {/* Right Actions - Premium feel */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {splitViewMode && (
              <button
                onClick={handleAutoMatch}
                disabled={autoMatching}
                className="px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-lg shadow-purple-500/10"
              >
                {autoMatching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Matching...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Auto-Match</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-2 bg-white text-black rounded-full text-xs font-semibold hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-white/20"
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
                logger.debug("🎬 ProductBrowser CLICK ->setGalleryProduct", {
                  productName: product.name,
                  productId: product.id,
                  timestamp: new Date().toISOString()
                });
                setGalleryProduct(product);
                logger.debug("✅ setGalleryProduct called successfully");
              }}
              onLinkMedia={handleLinkProductToMedia}
              selectionMode={generationMode}
              selectedProducts={selectedProductsForGeneration}
              onSelectionChange={setSelectedProductsForGeneration}
            />
            )}
          </div>


          {/* Center/Main Panel - Media Grid OR Generation Interface */}
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

            {/* Breadcrumb Navigation - Show when inside a folder, regardless of category */}
            {(currentFolderId !== null || breadcrumbs.length > 0) && (
              <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  Root
                </button>
                {breadcrumbs.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <span className="text-white/30">/</span>
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`text-xs transition-colors ${
                        index === breadcrumbs.length - 1
                          ? "text-white font-medium"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Grid with Drop Zone OR Generation Interface OR Gallery */}
            <div className="flex-1 overflow-hidden">
              {(() => {
                const decision = galleryProduct && vendor ? "GALLERY" :
                                 generationMode && selectedCategory === "product_photos" ? "GENERATION" :
                                 generationMode ? "COMING_SOON" :
                                 filteredFiles.length === 0 ? "EMPTY" : "GRID";

                logger.debug("🎬 RENDER DECISION:", {
                  decision,
                  hasGalleryProduct: !!galleryProduct,
                  productName: galleryProduct?.name || "null",
                  productId: galleryProduct?.id || "null",
                  hasVendor: !!vendor,
                  generationMode,
                  selectedCategory,
                  splitViewMode,
                  timestamp: new Date().toISOString()
                });
                return null;
              })()}
              {galleryProduct && vendor ? (
                /* GALLERY MODE - Replaces grid */
                <div className="relative flex-1 w-full h-full">
                  <ProductGallery
                    product={galleryProduct}
                    vendorId={vendor.id}
                    onBack={() => {
                      logger.debug("🔙 onBack called - CLEARING galleryProduct", {
                        fromProduct: galleryProduct?.name,
                        timestamp: new Date().toISOString(),
                        stack: new Error().stack?.split('\n').slice(0, 8).join('\n')
                      });
                      setGalleryProduct(null);
                    }}
                    onImageUpdate={() => {
                      loadMedia();
                    }}
                    onEdit={(image) => {
                      setEditingImage({
                        id: image.id,
                        file_name: image.file_name,
                        file_url: image.file_url,
                        file_size: 0,
                        file_path: "",
                        file_type: "image",
                        category: "product_photos",
                        title: image.title || undefined,
                        alt_text: image.alt_text || undefined,
                        created_at: image.created_at,
                      });
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
                    {/* New Folder Tile - Always show at root level, regardless of category */}
                    {currentFolderId === null && (
                      <button
                        onClick={() => setCreatingFolder(true)}
                        className="aspect-square rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border-2 border-dashed border-white/[0.12] hover:border-white/[0.24] transition-all p-4 flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.12] flex items-center justify-center transition-colors">
                          <FolderPlus className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-white/80">New Folder</p>
                        </div>
                      </button>
                    )}

                    {/* Existing Folders - BULLETPROOF: Always show root folders when not in a subfolder */}
                    {!currentFolderId && rootFolders.map((folder) => (
                      <button
                        key={folder.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("folderId", folder.id);
                          e.dataTransfer.setData("folderName", folder.name);
                        }}
                        onClick={() => setCurrentFolderId(folder.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            folder
                          });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverFolder(folder.id);
                        }}
                        onDragLeave={() => setDragOverFolder(null)}
                        onDrop={(e) => {
                          e.preventDefault();

                          // Check if we have selected files to move
                          if (selectedFiles.size > 0) {
                            // Move all selected files
                            const fileIds = files
                              .filter(f => selectedFiles.has(f.file_name))
                              .map(f => f.id);
                            moveMultipleFilesToFolder(fileIds, folder.id);
                          } else if (draggingFile) {
                            // Move single dragged file
                            moveFileToFolder(draggingFile.id, folder.id);
                          }

                          setDraggingFile(null);
                          setDragOverFolder(null);
                        }}
                        className={`aspect-square rounded-2xl border transition-all p-4 flex flex-col items-center justify-center gap-2 group ${
                          dragOverFolder === folder.id
                            ? "bg-purple-500/20 border-purple-500/50 scale-105"
                            : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/[0.12]"
                        }`}
                      >
                        <Folder className="w-12 h-12 text-white/40 group-hover:text-white/60 transition-colors" />
                        <div className="text-center">
                          <p className="text-xs font-medium text-white truncate w-full">{folder.name}</p>
                          {selectedFiles.size > 0 && dragOverFolder === folder.id && (
                            <p className="text-[10px] text-purple-400 mt-1">Move {selectedFiles.size} files</p>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Files - Apply folder filtering when in "All Media" view */}
                    {(selectedCategory === null ? currentFiles : filteredFiles)
                      .filter((file) => {
                        // Apply search filter
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          file.file_name.toLowerCase().includes(query) ||
                          file.ai_description?.toLowerCase().includes(query) ||
                          file.ai_tags?.some((tag) => tag.toLowerCase().includes(query))
                        );
                      })
                      .map((file) => (
                        <GridItem
                          key={file.id}
                          file={file}
                          isSelected={selectedFiles.has(file.file_name)}
                          onSelect={() => toggleFileSelection(file.file_name)}
                          onDoubleClick={() => setEditingImage(file)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, file });
                          }}
                          onQuickView={() => setQuickViewFile(file)}
                          onDragStart={(file) => {
                            setDraggedMedia(file);
                            setDraggingFile(file);
                          }}
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
            <div className="relative flex-1 w-full">
              <ProductGallery
                product={galleryProduct}
                vendorId={vendor.id}
                onBack={() => setGalleryProduct(null)}
                onImageUpdate={() => {
                  loadMedia();
                }}
                onEdit={(image) => {
                  setEditingImage({
                    id: image.id,
                    file_name: image.file_name,
                    file_url: image.file_url,
                    file_size: 0,
                    file_path: "",
                    file_type: "image",
                    category: "product_photos",
                    title: image.title || undefined,
                    alt_text: image.alt_text || undefined,
                    created_at: image.created_at,
                  });
                }}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Breadcrumb Navigation & Toolbar */}
              <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.06] px-6 py-3 z-20">
                <div className="flex items-center justify-between">
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setCurrentFolderId(null)}
                      onDragOver={(e) => {
                        if (currentFolderId !== null) {
                          e.preventDefault();
                          setDragOverFolder("root");
                        }
                      }}
                      onDragLeave={() => setDragOverFolder(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingFile && currentFolderId !== null) {
                          moveFileToFolder(draggingFile.id, null);
                          setDraggingFile(null);
                        }
                        setDragOverFolder(null);
                      }}
                      className={`transition-colors px-2 py-1 rounded ${
                        dragOverFolder === "root"
                          ? "bg-purple-500/20 text-white font-medium"
                          : currentFolderId === null
                            ? "text-white font-medium"
                            : "text-white/60 hover:text-white"
                      }`}
                    >
                      All Media
                    </button>
                    {breadcrumbs.map((folder, index) => (
                      <div key={folder.id} className="flex items-center gap-2">
                        <span className="text-white/40">/</span>
                        <button
                          onClick={() => setCurrentFolderId(folder.id)}
                          className={
                            index === breadcrumbs.length - 1
                              ? "text-white font-medium"
                              : "text-white/60 hover:text-white transition-colors"
                          }
                        >
                          {folder.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* New Folder Button */}
                  <button
                    onClick={() => setCreatingFolder(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] rounded-lg text-xs text-white transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    New Folder
                  </button>
                </div>
              </div>

              <div className="p-6">
                {currentFolders.length === 0 && currentFiles.length === 0 ? (
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
                // Folder and File Grid View
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {/* New Folder Tile */}
                  <button
                    onClick={() => setCreatingFolder(true)}
                    className="aspect-square rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border-2 border-dashed border-white/[0.12] hover:border-white/[0.24] transition-all p-4 flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.12] flex items-center justify-center transition-colors">
                      <FolderPlus className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-white/80">New Folder</p>
                    </div>
                  </button>

                  {/* Render Folders */}
                  {currentFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverFolder(folder.id);
                      }}
                      onDragLeave={() => setDragOverFolder(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingFile) {
                          moveFileToFolder(draggingFile.id, folder.id);
                          setDraggingFile(null);
                        }
                        setDragOverFolder(null);
                      }}
                      className={`aspect-square rounded-2xl border transition-all p-4 flex flex-col items-center justify-center gap-2 group ${
                        dragOverFolder === folder.id
                          ? "bg-purple-500/20 border-purple-500/50 scale-105"
                          : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/[0.12]"
                      }`}
                    >
                      <Folder className="w-12 h-12 text-white/40 group-hover:text-white/60 transition-colors" />
                      <div className="text-center">
                        <p className="text-xs font-medium text-white truncate w-full">{folder.name}</p>
                        {(folder as any).count !== undefined && (
                          <p className="text-[10px] text-white/40 mt-1">{(folder as any).count} items</p>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Render Files */}
                  {currentFiles.map((file) => (
                    <GridItem
                      key={file.id}
                      file={file}
                      isSelected={selectedFiles.has(file.file_name)}
                      onSelect={() => toggleFileSelection(file.file_name)}
                      onDoubleClick={() => setEditingImage(file)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, file });
                      }}
                      onQuickView={() => setQuickViewFile(file)}
                      onDragStart={(file) => setDraggingFile(file)}
                    />
                  ))}
                </div>
              )}
              </div>
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
          {/* FOLDER MENU */}
          {contextMenu.folder && (
            <>
              <button
                onClick={() => {
                  setCurrentFolderId(contextMenu.folder!.id);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
              >
                <FolderOpen className="w-4 h-4" />
                Open Folder
              </button>

              <button
                onClick={async () => {
                  const newName = prompt("Rename folder:", contextMenu.folder!.name);
                  setContextMenu(null);
                  if (newName && newName.trim() && newName.trim() !== contextMenu.folder!.name) {
                    setLoading(true);
                    try {
                      const response = await fetch(`/api/vendor/media/folders/${contextMenu.folder!.id}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-vendor-id": vendor!.id,
                        },
                        body: JSON.stringify({ name: newName.trim() }),
                      });
                      if (response.ok) {
                        await loadFolders();
                      } else {
                        const data = await response.json();
                        alert(`Failed to rename folder: ${data.error}`);
                      }
                    } catch (error) {
                      logger.error("Error renaming folder:", error);
                      alert("Failed to rename folder");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" />
                Rename
              </button>

              <div className="h-px bg-white/[0.06] my-2" />

              <button
                onClick={async () => {
                  if (confirm(`Delete folder "${contextMenu.folder!.name}"? Files inside will be moved to root.`)) {
                    try {
                      const response = await fetch(`/api/vendor/media/folders/${contextMenu.folder!.id}`, {
                        method: "DELETE",
                        headers: { "x-vendor-id": vendor!.id },
                      });
                      if (response.ok) {
                        await loadFolders();
                        await loadMedia();
                      }
                    } catch (error) {
                      logger.error("Error deleting folder:", error);
                    }
                  }
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete Folder
              </button>
            </>
          )}

          {/* FILE MENU */}
          {contextMenu.file && (
            <>
              <button
                onClick={() => {
                  setQuickViewFile(contextMenu.file!);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Quick View
              </button>

          <button
            onClick={() => {
              setEditingFile(contextMenu.file || null);
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
                    if (cat.value && contextMenu.file) handleChangeCategory(contextMenu.file, cat.value);
                    setContextMenu(null);
                  }}
                  className={`w-full px-2 py-1.5 text-left rounded-lg transition-colors flex items-center gap-2 text-xs ${
                    contextMenu.file?.category === cat.value
                      ? "bg-white/[0.08] text-white"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {contextMenu.file?.category === cat.value && <Check className="w-3 h-3" />}
                  {cat.label}
                </button>
              ))}
          </div>

          <div className="h-px bg-white/[0.06] my-2" />

          <button
            onClick={() => {
              if (contextMenu.file) handleCopyUrl(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            Copy URL
          </button>

          <button
            onClick={() => {
              if (contextMenu.file) handleDownload(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <div className="h-px bg-white/[0.06] my-2" />

          <button
            onClick={async () => {
              if (contextMenu.file && confirm(`Delete ${contextMenu.file.file_name}?`)) {
                const file = contextMenu.file;
                setContextMenu(null);
                setLoading(true);
                try {
                  const response = await fetch(`/api/vendor/media?file=${encodeURIComponent(file.file_name)}`, {
                    method: "DELETE",
                    headers: { "x-vendor-id": vendor!.id },
                  });
                  if (response.ok) {
                    await loadMedia();
                  } else {
                    const data = await response.json();
                    alert(`Failed to delete: ${data.error}`);
                  }
                } catch (error) {
                  alert("Failed to delete file");
                } finally {
                  setLoading(false);
                }
              } else {
                setContextMenu(null);
              }
            }}
            className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
            </>
          )}
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

      {/* New Folder Modal */}
      {creatingFolder && (
        <div
          onClick={() => {
            setCreatingFolder(false);
            setNewFolderName("");
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
          >
            <button
              onClick={() => {
                setCreatingFolder(false);
                setNewFolderName("");
              }}
              className="absolute -top-3 -right-3 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <h3 className="text-white text-lg font-semibold mb-4">Create New Folder</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim()) {
                    createFolder();
                  } else if (e.key === "Escape") {
                    setCreatingFolder(false);
                    setNewFolderName("");
                  }
                }}
                placeholder="Enter folder name..."
                autoFocus
                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName("");
                }}
                className="flex-1 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.12] rounded-xl text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Folder
              </button>
            </div>
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

      {/* Image Editor */}
      {editingImage && vendor && (
        <ImageEditor
          image={{
            id: editingImage.id,
            file_url: editingImage.file_url,
            file_name: editingImage.file_name,
            title: editingImage.title,
            alt_text: editingImage.alt_text,
          }}
          vendorId={vendor.id}
          onClose={() => setEditingImage(null)}
          onSave={async (editedImageUrl) => {
            // TODO: Save the edited image back to the database
            await loadMedia();
            setEditingImage(null);
          }}
        />
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
