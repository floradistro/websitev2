"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Square,
  CheckSquare,
} from "lucide-react";

import { logger } from "@/lib/logger";
interface Product {
  id: string;
  name: string;
  sku: string | null;
  featured_image_storage: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  has_image: boolean;
}

interface ProductBrowserProps {
  vendorId: string;
  onDragStart?: (product: Product) => void;
  onProductSelect?: (product: Product) => void;
  onLinkMedia?: (productId: string, mediaFilePath: string) => void;
  selectionMode?: boolean;
  selectedProducts?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export default function ProductBrowser({
  vendorId,
  onDragStart,
  onProductSelect,
  onLinkMedia,
  selectionMode = false,
  selectedProducts = new Set(),
  onSelectionChange,
}: ProductBrowserProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"needs_images" | "has_images" | "all">("needs_images");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ needsImages: 0, hasImages: 0, total: 0 });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (search.trim()) params.append("search", search.trim());

      const response = await fetch(`/api/vendor/products/list?${params}`, {
        headers: { "x-vendor-id": vendorId },
      });

      if (!response.ok) throw new Error("Failed to load products");

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      logger.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [needsImagesRes, hasImagesRes, allRes] = await Promise.all([
        fetch(`/api/vendor/products/list?filter=needs_images`, {
          headers: { "x-vendor-id": vendorId },
        }),
        fetch(`/api/vendor/products/list?filter=has_images`, {
          headers: { "x-vendor-id": vendorId },
        }),
        fetch(`/api/vendor/products/list?filter=all`, {
          headers: { "x-vendor-id": vendorId },
        }),
      ]);

      const [needsImages, hasImages, all] = await Promise.all([
        needsImagesRes.json(),
        hasImagesRes.json(),
        allRes.json(),
      ]);

      setStats({
        needsImages: needsImages.total || 0,
        hasImages: hasImages.total || 0,
        total: all.total || 0,
      });
    } catch (error) {
      logger.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    if (vendorId) {
      loadProducts();
      loadStats();
    }
  }, [vendorId, filter, search]);

  const handleToggleSelection = (productId: string) => {
    if (!selectionMode || !onSelectionChange) return;

    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="h-full flex flex-col bg-black border-r border-white/[0.08]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.08]">
        <h2 className="text-sm font-semibold text-white mb-3">Products</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => setFilter("needs_images")}
            className={`flex-1 px-2 py-1.5 rounded transition-all text-[10px] font-medium flex items-center justify-center gap-1 ${
              filter === "needs_images"
                ? "bg-white/[0.12] text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>{stats.needsImages}</span>
          </button>
          <button
            onClick={() => setFilter("has_images")}
            className={`flex-1 px-2 py-1.5 rounded transition-all text-[10px] font-medium flex items-center justify-center gap-1 ${
              filter === "has_images"
                ? "bg-white/[0.12] text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{stats.hasImages}</span>
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-2 py-1.5 rounded transition-all text-[10px] font-medium ${
              filter === "all" ? "bg-white/[0.12] text-white" : "text-white/60 hover:text-white/80"
            }`}
          >
            All {stats.total}
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/40">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-xs">No products found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {products.map((product) => (
              <div
                key={product.id}
                draggable={!product.has_image}
                onDragStart={(e) => {
                  if (!product.has_image && onDragStart) {
                    e.dataTransfer.setData("productId", product.id);
                    e.dataTransfer.setData("productName", product.name);
                    onDragStart(product);
                  }
                }}
                onDragOver={(e) => {
                  if (!product.has_image) {
                    e.preventDefault();
                    setDragOver(product.id);
                  }
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const mediaFilePath = e.dataTransfer.getData("mediaFilePath");
                  if (mediaFilePath && onLinkMedia) {
                    onLinkMedia(product.id, mediaFilePath);
                  }
                  setDragOver(null);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectionMode) {
                    handleToggleSelection(product.id);
                  } else {
                    onProductSelect?.(product);
                  }
                }}
                className={`group p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectionMode && selectedProducts.has(product.id)
                    ? "bg-purple-500/20 border-purple-500/50"
                    : dragOver === product.id
                      ? "bg-purple-500/20 border-purple-500/50 scale-105"
                      : product.has_image
                        ? "bg-white/[0.02] border-white/[0.06] opacity-60"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {selectionMode ? (
                      selectedProducts.has(product.id) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-white/40" />
                      )
                    ) : product.has_image ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-orange-500/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{product.name}</p>
                    {product.sku && (
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{product.sku}</p>
                    )}
                    {product.category && (
                      <p className="text-[10px] text-white/30 mt-0.5">{product.category.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
