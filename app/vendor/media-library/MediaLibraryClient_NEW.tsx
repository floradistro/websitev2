// THIS IS A REDESIGNED VERSION FOLLOWING POS PATTERN
// Will replace MediaLibraryClient.tsx after review

"use client";

import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/context/AppAuthContext";
import {
  Search,
  Grid3x3,
  List,
  Trash2,
  X,
  Check,
  Loader2,
  Upload,
  Brain,
  Scissors,
  Link2,
  Zap,
  ChevronDown,
  Package,
  Sparkles,
  Folder,
  FolderOpen,
} from "lucide-react";
import ProductBrowser from "./ProductBrowser";
import GenerationInterface from "./GenerationInterface";
import ProductGallery from "./ProductGallery";
import ImageEditor from "./ImageEditor";

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

// Memoized grid item
const GridItem = memo(
  ({
    file,
    isSelected,
    onSelect,
    onContextMenu,
  }: {
    file: MediaFile;
    isSelected: boolean;
    onSelect: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  }) => {
    const thumbnailUrl = file.file_url.includes("supabase.co")
      ? file.file_url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
        `?width=400&height=400&quality=75&t=${file.updated_at || file.created_at}`
      : file.file_url;

    return (
      <div
        onClick={onSelect}
        onContextMenu={onContextMenu}
        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
          isSelected ? "ring-2 ring-white" : ""
        }`}
      >
        <img
          src={thumbnailUrl}
          alt={file.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-white text-xs font-medium truncate">{file.file_name}</p>
          </div>
        </div>

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

  // State
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [retagging, setRetagging] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);

  // Product selection state (for generation)
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductsForGeneration, setSelectedProductsForGeneration] = useState<Set<string>>(new Set());
  const [generationMode, setGenerationMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const categories = [
    { label: "All Media", value: null },
    { label: "Products", value: "product_photos" as const },
    { label: "Marketing", value: "marketing" as const },
    { label: "Menus", value: "menus" as const },
    { label: "Brand", value: "brand" as const },
  ];

  // Load media
  const loadMedia = useCallback(async () => {
    if (!vendor) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (currentFolderId) params.append("folder_id", currentFolderId);

      const response = await fetch(`/api/vendor/media?${params}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      logger.error("Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  }, [vendor, selectedCategory, currentFolderId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Filtered files based on search
  const filteredFiles = files.filter((file) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.file_name.toLowerCase().includes(query) ||
      file.ai_tags?.some((tag) => tag.toLowerCase().includes(query)) ||
      file.ai_description?.toLowerCase().includes(query)
    );
  });

  // Handlers
  const handleFileUpload = async (fileList: FileList) => {
    // Upload logic
  };

  const handleBulkRetag = async () => {
    // Retag logic
  };

  const handleRemoveBackground = async () => {
    // Remove BG logic
  };

  const handleAutoMatch = async () => {
    // Auto-match logic
  };

  const handleDelete = async () => {
    // Delete logic
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      {/* SINGLE COMPREHENSIVE TOOLBAR - POS Style */}
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 h-14 border-b border-white/10 flex items-center px-4 gap-3">
          {/* Product Selector (Collapsible) */}
          {selectedCategory === "product_photos" && (
            <div className="relative">
              <button
                onClick={() => setShowProductSelector(!showProductSelector)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedProductsForGeneration.size > 0
                    ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                    : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Package className="w-4 h-4" />
                {selectedProductsForGeneration.size > 0
                  ? `${selectedProductsForGeneration.size} Products`
                  : "Select Products"}
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Dropdown Product Selector */}
              {showProductSelector && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-96 bg-black border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-sm text-white font-medium">Select Products</h3>
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {vendor && (
                      <ProductBrowser
                        vendorId={vendor.id}
                        selectionMode={true}
                        selectedProducts={selectedProductsForGeneration}
                        onSelectionChange={setSelectedProductsForGeneration}
                        onProductSelect={() => {}}
                        onDragStart={() => {}}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unified Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  if (cat.value === "product_photos") {
                    setGenerationMode(true);
                  } else {
                    setGenerationMode(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Breadcrumbs (only if in folder) */}
          {breadcrumbs.length > 0 && (
            <>
              <div className="h-5 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-white/60">
                <button onClick={() => setCurrentFolderId(null)} className="hover:text-white">
                  Root
                </button>
                {breadcrumbs.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <span>/</span>
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={index === breadcrumbs.length - 1 ? "text-white font-medium" : "hover:text-white"}
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex-1" />

          {/* Selection Actions */}
          {selectedFiles.size > 0 && (
            <>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <span className="text-xs text-white/60 font-medium">{selectedFiles.size} selected</span>
                <div className="h-4 w-px bg-white/10" />
                <button
                  onClick={handleBulkRetag}
                  disabled={retagging}
                  className="p-1 text-white/60 hover:text-white transition-colors disabled:opacity-40"
                  title="AI Tag"
                >
                  {retagging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleRemoveBackground}
                  disabled={removingBg}
                  className="p-1 text-white/60 hover:text-white transition-colors disabled:opacity-40"
                  title="Remove BG"
                >
                  {removingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleAutoMatch}
                  disabled={autoMatching}
                  className="p-1 text-white/60 hover:text-white transition-colors disabled:opacity-40"
                  title="Link Products"
                >
                  {autoMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button
                  onClick={handleDelete}
                  className="p-1 text-red-400/70 hover:text-red-300 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Auto-Match (if products selected) */}
          {selectedProductsForGeneration.size > 0 && (
            <button
              onClick={handleAutoMatch}
              disabled={autoMatching}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-40"
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

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "grid" ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "list" ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload (drag-drop ONLY shown in hint) */}
        </div>

        {/* FULL HEIGHT CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          {generationMode && selectedProductsForGeneration.size > 0 ? (
            /* Generation Interface */
            <GenerationInterface
              vendorId={vendor?.id || ""}
              selectedProducts={selectedProductsForGeneration}
              products={[]} // Pass products from somewhere
              onGenerated={loadMedia}
            />
          ) : (
            /* Media Grid */
            <div className="p-6">
              {/* Drag-drop hint */}
              <div className="mb-6 p-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                <p className="text-xs text-white/40">
                  Drag and drop files anywhere to upload
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <Sparkles className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/40 text-sm">No media found</p>
                </div>
              ) : (
                <div className={`grid ${viewMode === "grid" ? "grid-cols-6" : "grid-cols-1"} gap-4`}>
                  {filteredFiles.map((file) => (
                    <GridItem
                      key={file.id}
                      file={file}
                      isSelected={selectedFiles.has(file.id)}
                      onSelect={() => {
                        const newSelection = new Set(selectedFiles);
                        if (newSelection.has(file.id)) {
                          newSelection.delete(file.id);
                        } else {
                          newSelection.add(file.id);
                        }
                        setSelectedFiles(newSelection);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        // Context menu logic
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
