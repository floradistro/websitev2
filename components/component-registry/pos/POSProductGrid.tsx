"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { ShoppingBag, Eye, Package, ArrowDownAZ, PackageCheck } from "lucide-react";
import Link from "next/link";
import { POSQuickView } from "./POSQuickView";
import { POSVendorDropdown } from "./POSVendorDropdown";
import { useAppAuth } from "@/context/AppAuthContext";

import { logger } from "@/lib/logger";
interface PricingTier {
  break_id: string;
  label: string;
  qty: number;
  unit: string;
  price?: number;
  sort_order?: number;
}

interface ProductField {
  label: string;
  value: string;
  type: string;
}

interface Vendor {
  id: string;
  store_name: string;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  description?: string | null;
  short_description?: string | null;
  fields?: ProductField[];
  inventory_quantity: number;
  inventory_id: string;
  pricing_tiers?: PricingTier[];
  vendor?: Vendor | null;
}

interface POSProductGridProps {
  locationId: string;
  locationName?: string;
  vendorId?: string;
  userId?: string;
  userName?: string;
  registerId?: string;
  onAddToCart: (product: Product, quantity: number) => void;
  onProductClick?: (productSlug: string) => void;
  displayMode?: "cards" | "list" | "compact";
  showInventory?: boolean;
  skuInput?: string;
  onSkuInputChange?: (value: string) => void;
  onSkuSubmit?: (e: React.FormEvent) => void;
  skuInputRef?: React.RefObject<HTMLInputElement | null>;
  onSessionClosed?: () => void;
}

// Category hierarchy - subcategories grouped under parent categories
const CATEGORY_HIERARCHY: Record<string, string[]> = {
  Beverages: ["Day Drinker (5mg)", "Golden Hour (10mg)", "Darkside (30mg)", "Riptide (60mg)"],
};

export function POSProductGrid({
  locationId,
  locationName = "Location",
  vendorId,
  userId,
  userName = "Staff",
  registerId,
  onAddToCart,
  onProductClick,
  displayMode = "cards",
  showInventory = true,
  skuInput,
  onSkuInputChange,
  onSkuSubmit,
  skuInputRef,
  onSessionClosed,
}: POSProductGridProps) {
  const { vendor } = useAppAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedStrainType, setSelectedStrainType] = useState<string | null>(null);
  const [selectedConsistency, setSelectedConsistency] = useState<string | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Alphabetical scroll indicator
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string>("");
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const productRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load location inventory
  useEffect(() => {
    loadInventory();
  }, [locationId]);

  // Clear product refs when switching sort modes
  useEffect(() => {
    if (!sortAlphabetically) {
      productRefsMap.current.clear();
      setShowScrollIndicator(false);
      setCurrentLetter("");
    }
  }, [sortAlphabetically]);

  const loadInventory = async () => {
    try {
      const response = await fetch(`/api/pos/inventory?locationId=${locationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load inventory");
      }

      const { products: inventoryProducts } = await response.json();
      setProducts(inventoryProducts || []);
      setError(null);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading inventory:", err);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll to track current letter
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const isScrolling = scrollTop > 50;

    setShowScrollIndicator(isScrolling);

    // Find which letter section we're in
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;

    let closestLetter = "";
    let closestDistance = Infinity;

    productRefsMap.current.forEach((element, letter) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top - centerY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestLetter = letter;
      }
    });

    if (closestLetter) {
      setCurrentLetter(closestLetter);
    }
  }, []);

  // Jump to letter section
  const jumpToLetter = useCallback((letter: string) => {
    const element = productRefsMap.current.get(letter);
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop + container.scrollTop - 20;

      container.scrollTo({
        top: offset,
        behavior: "smooth",
      });
    }
  }, []);

  // Get unique parent categories (excluding subcategories)
  const categories = useMemo(() => {
    const allCategories = new Set(
      products.map((p) => p.category).filter((cat): cat is string => typeof cat === "string"),
    );
    const parents = new Set<string>();

    allCategories.forEach((cat) => {
      // Check if this category is a subcategory
      let isSubcategory = false;
      for (const [parent, subs] of Object.entries(CATEGORY_HIERARCHY)) {
        if (subs.includes(cat)) {
          isSubcategory = true;
          parents.add(parent);
          break;
        }
      }
      if (!isSubcategory) {
        parents.add(cat);
      }
    });

    return ["all", ...Array.from(parents).sort()];
  }, [products]);

  // Get subcategories for the selected parent category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "all") return [];

    const subcats = CATEGORY_HIERARCHY[selectedCategory];
    if (!subcats) return [];

    // Only show subcategories that have products
    return subcats.filter((subcat) => products.some((p) => p.category === subcat));
  }, [selectedCategory, products]);

  // Get available strain types for current category
  const availableStrainTypes = useMemo(() => {
    const relevantCategories = ["Flower", "Concentrates", "Vape"];

    const strainTypes = new Set<string>();
    products.forEach((product) => {
      // When "all" is selected, show strain types from all relevant categories
      if (selectedCategory === "all") {
        if (relevantCategories.includes(product.category || "")) {
          const strainType = product.fields?.find((f) => f.label === "strain_type")?.value;
          if (strainType) strainTypes.add(strainType);
        }
      } else if (product.category === selectedCategory) {
        // When specific category selected, only show for that category
        const strainType = product.fields?.find((f) => f.label === "strain_type")?.value;
        if (strainType) strainTypes.add(strainType);
      }
    });
    return Array.from(strainTypes).sort();
  }, [selectedCategory, products]);

  // Get available consistencies for concentrates
  const availableConsistencies = useMemo(() => {
    const consistencies = new Set<string>();
    products.forEach((product) => {
      if (selectedCategory === "all" || product.category === "Concentrates") {
        if (product.category === "Concentrates") {
          const consistency = product.fields?.find((f) => f.label === "consistency")?.value;
          if (consistency) consistencies.add(consistency);
        }
      }
    });
    return Array.from(consistencies).sort();
  }, [selectedCategory, products]);

  // Get available flavors for beverages
  const availableFlavors = useMemo(() => {
    const beverageCategories = [
      "Day Drinker (5mg)",
      "Golden Hour (10mg)",
      "Darkside (30mg)",
      "Riptide (60mg)",
    ];

    const flavors = new Set<string>();
    products.forEach((product) => {
      if (beverageCategories.includes(product.category || "")) {
        const flavor = product.fields?.find((f) => f.label === "flavor")?.value;
        if (flavor) flavors.add(flavor);
      }
    });
    return Array.from(flavors).sort();
  }, [selectedCategory, selectedSubcategory, products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter - handle both parent categories and subcategories
      if (selectedCategory !== "all") {
        // If a subcategory is selected, filter by that
        if (selectedSubcategory) {
          if (product.category !== selectedSubcategory) {
            return false;
          }
        } else {
          // If only parent category selected, show all products in that parent or its subcategories
          const subcats = CATEGORY_HIERARCHY[selectedCategory];
          if (subcats) {
            // Parent has subcategories - show products matching any subcategory
            if (!subcats.includes(product.category || "")) {
              return false;
            }
          } else {
            // Parent has no subcategories - direct match
            if (product.category !== selectedCategory) {
              return false;
            }
          }
        }
      }

      // Strain type filter
      if (selectedStrainType) {
        const strainType = product.fields?.find((f) => f.label === "strain_type")?.value;
        if (strainType !== selectedStrainType) {
          return false;
        }
      }

      // Consistency filter
      if (selectedConsistency) {
        const consistency = product.fields?.find((f) => f.label === "consistency")?.value;
        if (consistency !== selectedConsistency) {
          return false;
        }
      }

      // Flavor filter
      if (selectedFlavor) {
        const flavor = product.fields?.find((f) => f.label === "flavor")?.value;
        if (flavor !== selectedFlavor) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedStrainType,
    selectedConsistency,
    selectedFlavor,
  ]);

  // Group products by first letter for alphabetical indicator
  const productsByLetter = useMemo(() => {
    const grouped = new Map<string, Product[]>();

    filteredProducts.forEach((product) => {
      const firstLetter = product.name[0]?.toUpperCase() || "#";
      if (!grouped.has(firstLetter)) {
        grouped.set(firstLetter, []);
      }
      grouped.get(firstLetter)!.push(product);
    });

    return new Map([...grouped.entries()].sort());
  }, [filteredProducts]);

  // Get all available letters
  const availableLetters = useMemo(() => {
    return Array.from(productsByLetter.keys());
  }, [productsByLetter]);

  const handleAddProduct = (product: Product, priceTier?: PricingTier) => {
    // If pricing tier provided, use its qty, otherwise prompt
    let quantity: number;
    let price: number;

    if (priceTier) {
      quantity = priceTier.qty;
      // Tier price is the TOTAL for this quantity, so calculate unit price
      // e.g., "2g - $40" means $40 total, so unit price = $40 / 2 = $20
      price = priceTier.price ? priceTier.price / priceTier.qty : product.price;
    } else {
      quantity = parseFloat(prompt(`Enter quantity for ${product.name}:`, "1") || "0");
      price = product.price;
    }

    if (quantity > 0) {
      if (quantity > product.inventory_quantity) {
        // Just use the max available
        onAddToCart({ ...product, price }, product.inventory_quantity);
        return;
      }
      onAddToCart({ ...product, price }, quantity);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        {/* Loading Toolbar */}
        <div className="flex-shrink-0 p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            {/* Vendor Logo Skeleton */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse flex-shrink-0" />
              <div className="w-3 h-3 bg-white/10 rounded animate-pulse" />
            </div>

            {/* Search Bar Skeleton */}
            <div className="flex-1 h-10 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />

            {/* Category Dropdown Skeleton */}
            <div className="w-40 h-10 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Loading Products Grid */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-4 pt-4"
          style={{
            minHeight: 0,
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden"
                style={{
                  animationDelay: `${i * 100}ms`,
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Product Image Skeleton */}
                <div className="aspect-square bg-white/10 rounded-xl mb-3 flex items-center justify-center">
                  <Package size={48} className="text-white/20 animate-pulse" />
                </div>

                {/* Product Name Skeleton */}
                <div className="h-5 bg-white/10 rounded-lg mb-2 animate-pulse" />
                <div className="h-4 bg-white/10 rounded-lg w-2/3 mb-3 animate-pulse" />

                {/* Price Skeleton */}
                <div className="h-6 bg-white/10 rounded-lg w-1/2 mb-3 animate-pulse" />

                {/* Button Skeleton */}
                <div className="h-10 bg-white/10 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator with text */}
        <div className="flex-shrink-0 p-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-3 text-white/40">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs uppercase tracking-[0.15em]">Loading products</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="text-red-500 font-bold mb-2">Error Loading Inventory</div>
        <div className="text-white/60">{error}</div>
        <button
          onClick={loadInventory}
          className="mt-4 px-4 py-2 bg-white text-black font-black uppercase rounded-xl text-sm hover:bg-white/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search & Filters - Fixed at top */}
      <div className="flex-shrink-0 p-4 border-b border-white/5 relative z-20">
        <div className="flex gap-2">
          {/* Vendor Logo Dropdown */}
          <POSVendorDropdown
            locationId={locationId}
            locationName={locationName}
            vendorId={vendorId}
            userId={userId}
            userName={userName}
            registerId={registerId}
            onSessionClosed={onSessionClosed}
          />

          {/* Search Bar - filters as you type, Enter/double-click/button to lookup SKU */}
          <div className="flex-1 relative flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={skuInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (onSkuInputChange) {
                    onSkuInputChange(value.toUpperCase());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && onSkuSubmit) {
                    e.preventDefault();
                    onSkuSubmit(e as any);
                  }
                }}
                onDoubleClick={(e) => {
                  if (onSkuSubmit && searchQuery) {
                    e.preventDefault();
                    onSkuSubmit(e as any);
                  }
                }}
                placeholder={`Search ${filteredProducts.length} products...`}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 placeholder-white/40 hover:bg-white/10 transition-all"
                autoComplete="off"
              />
            </div>
            {onSkuSubmit && searchQuery && (
              <button
                type="button"
                onClick={(e) => onSkuSubmit(e as any)}
                className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-[10px] uppercase tracking-[0.15em] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all font-light"
              >
                Scan
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                // Reset all filters when category changes
                setSelectedSubcategory(null);
                setSelectedStrainType(null);
                setSelectedConsistency(null);
                setSelectedFlavor(null);
              }}
              className="bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all min-w-[140px] cursor-pointer appearance-none pr-8"
              style={{
                colorScheme: "dark",
              }}
            >
              {categories.map((cat) => (
                <option
                  key={cat}
                  value={cat || "all"}
                  style={{ backgroundColor: "#000", color: "#fff" }}
                >
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
            {/* Dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-3 h-3 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Alphabetical Sort Toggle */}
          <button
            onClick={() => setSortAlphabetically(!sortAlphabetically)}
            className={`px-4 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] transition-all font-light border flex items-center gap-2 ${
              sortAlphabetically
                ? "bg-white/[0.1] border-white/[0.15] text-white/80"
                : "bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:text-white/80"
            }`}
          >
            <ArrowDownAZ size={14} strokeWidth={1.5} />
            A-Z
          </button>
        </div>

        {/* Dynamic Filter Pills - Single horizontal row, Apple-style */}
        {(availableSubcategories.length > 0 ||
          availableStrainTypes.length > 0 ||
          availableConsistencies.length > 0 ||
          availableFlavors.length > 0) && (
          <div
            className="flex items-center gap-2 pt-2 overflow-x-auto hide-scrollbar"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* All filters in one seamless row */}
            {availableSubcategories.map((subcat) => (
              <button
                key={`subcat-${subcat}`}
                onClick={() => {
                  setSelectedSubcategory(subcat === selectedSubcategory ? null : subcat);
                  if (subcat !== selectedSubcategory) {
                    setSelectedFlavor(null);
                  }
                }}
                className={`px-4 py-2 rounded-full text-[10px] font-semibold tracking-tight transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedSubcategory === subcat
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/[0.08] text-white/80 hover:bg-white/[0.12] backdrop-blur-sm"
                }`}
              >
                {subcat}
              </button>
            ))}

            {availableStrainTypes.map((strain) => (
              <button
                key={`strain-${strain}`}
                onClick={() => setSelectedStrainType(strain === selectedStrainType ? null : strain)}
                className={`px-4 py-2 rounded-full text-[10px] font-semibold tracking-tight transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedStrainType === strain
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/[0.08] text-white/80 hover:bg-white/[0.12] backdrop-blur-sm"
                }`}
              >
                {strain}
              </button>
            ))}

            {availableConsistencies.map((consistency) => (
              <button
                key={`consistency-${consistency}`}
                onClick={() =>
                  setSelectedConsistency(consistency === selectedConsistency ? null : consistency)
                }
                className={`px-4 py-2 rounded-full text-[10px] font-semibold tracking-tight transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedConsistency === consistency
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/[0.08] text-white/80 hover:bg-white/[0.12] backdrop-blur-sm"
                }`}
              >
                {consistency}
              </button>
            ))}

            {availableFlavors.map((flavor) => (
              <button
                key={`flavor-${flavor}`}
                onClick={() => setSelectedFlavor(flavor === selectedFlavor ? null : flavor)}
                className={`px-4 py-2 rounded-full text-[10px] font-semibold tracking-tight transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedFlavor === flavor
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/[0.08] text-white/80 hover:bg-white/[0.12] backdrop-blur-sm"
                }`}
              >
                {flavor}
              </button>
            ))}

            {/* Clear All - Only show if any filter is active */}
            {(selectedSubcategory ||
              selectedStrainType ||
              selectedConsistency ||
              selectedFlavor) && (
              <>
                {/* Subtle divider */}
                <div className="w-px h-5 bg-white/10 flex-shrink-0 mx-1" />
                <button
                  onClick={() => {
                    setSelectedSubcategory(null);
                    setSelectedStrainType(null);
                    setSelectedConsistency(null);
                    setSelectedFlavor(null);
                  }}
                  className="px-4 py-2 rounded-full text-[10px] font-semibold tracking-tight transition-all whitespace-nowrap flex-shrink-0 bg-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white/80 backdrop-blur-sm"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Products Grid - Scrollable */}
      <div className="relative flex-1">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-1"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {filteredProducts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-white/40">No products found</div>
            </div>
          ) : displayMode === "cards" ? (
            sortAlphabetically ? (
              <>
                {Array.from(productsByLetter.entries()).map(([letter, products]) => (
                  <div
                    key={letter}
                    ref={(el) => {
                      if (el) productRefsMap.current.set(letter, el);
                    }}
                  >
                    {/* Letter Header */}
                    <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm py-2 mb-3">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-light">
                        {letter}
                      </h3>
                    </div>

                    {/* Products Grid for this letter */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddProduct}
                          onProductClick={onProductClick}
                          onQuickView={setQuickViewProduct}
                          showInventory={showInventory}
                          vendorLogo={vendor?.logo_url || null}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4 pt-1">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddProduct}
                    onProductClick={onProductClick}
                    onQuickView={setQuickViewProduct}
                    showInventory={showInventory}
                    vendorLogo={vendor?.logo_url || null}
                  />
                ))}
              </div>
            )
          ) : (
            // List view
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {product.image_url && (
                      <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 text-left">
                      <div className="text-white font-bold">{product.name}</div>
                      {product.category && (
                        <div className="text-white/40 text-xs">{product.category}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {showInventory && (
                      <div
                        className={`text-sm font-bold ${
                          product.inventory_quantity > 10
                            ? "text-green-500"
                            : product.inventory_quantity > 0
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {product.inventory_quantity} in stock
                      </div>
                    )}

                    <div className="text-white font-black text-xl" style={{ fontWeight: 900 }}>
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alphabetical Scroll Indicator */}
        {sortAlphabetically && showScrollIndicator && availableLetters.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-0.5 py-2">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => jumpToLetter(letter)}
                className={`
                  w-5 h-5 flex items-center justify-center text-[9px] font-light tracking-wide
                  transition-all duration-200 rounded-full
                  ${
                    currentLetter === letter
                      ? "bg-white/20 text-white scale-125"
                      : "bg-white/[0.05] text-white/40 hover:bg-white/[0.1] hover:text-white/60"
                  }
                `}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <POSQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}

// Product Card Component with Pricing Tiers
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, priceTier?: PricingTier) => void;
  onProductClick?: (productSlug: string) => void;
  onQuickView?: (product: Product) => void;
  showInventory: boolean;
  vendorLogo: string | null;
}

function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  onQuickView,
  showInventory,
  vendorLogo,
}: ProductCardProps) {
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [showAddButton, setShowAddButton] = useState(false);

  const tiers = product.pricing_tiers || [];

  const handleTierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    if (value === "") {
      setSelectedTierIndex(null);
      setShowAddButton(false);
    } else {
      const index = parseInt(value);
      if (!isNaN(index)) {
        setSelectedTierIndex(index);
        setShowAddButton(true);
      }
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedTierIndex !== null && tiers[selectedTierIndex]) {
      onAddToCart(product, tiers[selectedTierIndex]);
    } else {
      onAddToCart(product);
    }

    // Reset selection
    setSelectedTierIndex(null);
    setShowAddButton(false);
  };

  const handleProductClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on image or name, not on buttons
    if (onProductClick && product.name) {
      const productSlug = product.name.toLowerCase().replace(/\s+/g, "-");
      onProductClick(productSlug);
    }
  };

  return (
    <div className="group flex flex-col bg-[#0a0a0a] hover:bg-[#141414] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
      {/* Product Image - Clickable (single click navigates, double-click opens quick view) */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-black cursor-pointer"
        onClick={handleProductClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onQuickView) {
            onQuickView(product);
          }
        }}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="33vw"
            className="object-contain transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            quality={85}
          />
        ) : vendorLogo ? (
          <div className="w-full h-full flex items-center justify-center bg-white/5 p-8">
            <Image
              src={vendorLogo}
              alt="Vendor Logo"
              fill
              sizes="33vw"
              className="object-contain opacity-20"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <Package size={48} className="text-white/20" />
          </div>
        )}

        {/* Quick View Button */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-black/80 backdrop-blur-sm hover:bg-white hover:text-black rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20"
          >
            <Eye size={14} />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4">
        {/* Product Name - Clickable */}
        <h3
          className="text-white font-black uppercase text-xs tracking-tight leading-tight line-clamp-2 mb-2 cursor-pointer hover:text-white/80 transition-colors"
          style={{ fontWeight: 900 }}
          onClick={handleProductClick}
        >
          {product.name}
        </h3>

        {/* Category Badge */}
        {product.category && (
          <div className="mb-3">
            <span className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] uppercase tracking-[0.15em] text-white/70 font-bold">
              {product.category}
            </span>
          </div>
        )}

        {/* Stock Status */}
        {showInventory && (
          <div className="flex items-center gap-1.5 mb-3">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                product.inventory_quantity > 0 ? "bg-green-500" : "bg-red-500/60"
              }`}
            />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/60">
              {product.inventory_quantity > 0
                ? `${product.inventory_quantity} in stock`
                : "Out of Stock"}
            </span>
          </div>
        )}

        {/* Pricing Tier Selector */}
        {tiers.length > 0 && product.inventory_quantity > 0 ? (
          <div className="space-y-2 pt-3 mt-auto border-t border-white/5">
            <div className="relative">
              <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={(e) => e.stopPropagation()}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-3 py-3 pr-8 text-[10px] uppercase tracking-[0.15em] text-white hover:border-white/20 focus:border-white/20 focus:outline-none transition-all"
                style={{
                  colorScheme: "dark",
                }}
              >
                <option value="" style={{ backgroundColor: "#000", color: "#fff" }}>
                  Select Quantity
                </option>
                {tiers.map((tier, index) => {
                  const price = tier.price || product.price * tier.qty;
                  return (
                    <option
                      key={index}
                      value={index}
                      style={{ backgroundColor: "#000", color: "#fff" }}
                    >
                      {tier.label} - ${price.toFixed(0)}
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-3 h-3 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {showAddButton && (
              <button
                onClick={handleAddClick}
                className="w-full bg-white/10 text-white border-2 border-white/20 rounded-2xl py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all duration-300 flex items-center justify-center gap-2"
                style={{ fontWeight: 900 }}
              >
                <ShoppingBag size={12} strokeWidth={2.5} />
                Add to Cart
              </button>
            )}
          </div>
        ) : product.inventory_quantity > 0 ? (
          <button
            onClick={handleAddClick}
            className="w-full bg-white/10 text-white border-2 border-white/20 rounded-2xl py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all duration-300 flex items-center justify-center gap-2 mt-auto"
            style={{ fontWeight: 900 }}
          >
            <ShoppingBag size={12} strokeWidth={2.5} />
            Add to Cart
          </button>
        ) : null}
      </div>
    </div>
  );
}
