"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { ShoppingBag, Eye, Package, ArrowDownAZ, PackageCheck, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { POSQuickView } from "./POSQuickView";
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
  onResetRequest?: () => void; // Callback when reset is triggered
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
  onResetRequest,
}: POSProductGridProps) {
  const { vendor } = useAppAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedStrainTypes, setSelectedStrainTypes] = useState<string[]>([]);
  const [selectedConsistencies, setSelectedConsistencies] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Alphabetical scroll indicator
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string>("");
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const productRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Filter dropdown state
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Seamless POS Reset - Steve Jobs Style: Invisible, Automatic, Perfect
  const resetPOSState = useCallback(() => {
    // Clear all filters
    setSelectedCategory("all");
    setSelectedSubcategory(null);
    setSelectedStrainTypes([]);
    setSelectedConsistencies([]);
    setSelectedFlavors([]);
    
    // Clear search
    setSearchQuery("");
    if (onSkuInputChange) {
      onSkuInputChange("");
    }
    
    // Reset sort
    setSortAlphabetically(false);
    
    // Close filter dropdown
    setShowFilters(false);
    
    // Scroll to top smoothly
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Focus search input for next sale
    if (skuInputRef?.current) {
      setTimeout(() => {
        skuInputRef.current?.focus();
      }, 100);
    }
  }, [onSkuInputChange, skuInputRef]);

  // Expose reset function to parent via callback
  useEffect(() => {
    if (onResetRequest) {
      (window as any).__posResetFunction = resetPOSState;
    }
    return () => {
      delete (window as any).__posResetFunction;
    };
  }, [resetPOSState, onResetRequest]);

  // Load location inventory
  useEffect(() => {
    loadInventory();
  }, [locationId]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      // Strain type filter - multiple selection
      if (selectedStrainTypes.length > 0) {
        const strainType = product.fields?.find((f) => f.label === "strain_type")?.value;
        if (!strainType || !selectedStrainTypes.includes(strainType)) {
          return false;
        }
      }

      // Consistency filter - multiple selection
      if (selectedConsistencies.length > 0) {
        const consistency = product.fields?.find((f) => f.label === "consistency")?.value;
        if (!consistency || !selectedConsistencies.includes(consistency)) {
          return false;
        }
      }

      // Flavor filter - multiple selection
      if (selectedFlavors.length > 0) {
        const flavor = product.fields?.find((f) => f.label === "flavor")?.value;
        if (!flavor || !selectedFlavors.includes(flavor)) {
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
    selectedStrainTypes,
    selectedConsistencies,
    selectedFlavors,
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

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== "all",
    selectedSubcategory,
    selectedStrainTypes.length > 0,
    selectedConsistencies.length > 0,
    selectedFlavors.length > 0
  ].filter(Boolean).length;

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Search & Filters - Fixed at top - Steve Jobs Minimalist Design */}
      <div className="flex-shrink-0 p-4 border-b border-white/5 relative z-20">
        <div className="flex gap-2">
          {/* Filters Button - Steve Jobs Design: Clean, Minimal, Perfect */}
          <div className="relative" ref={filterRef}>
            {activeFilterCount > 0 ? (
              /* Active State: Split Button with Clear Action */
              <div className="flex items-center border border-white/[0.15] rounded-2xl overflow-hidden bg-white/[0.1]">
                {/* Left: Filter Count & Icon */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 text-white/80 hover:text-white transition-colors"
                >
                  <SlidersHorizontal size={14} strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-[0.15em] font-light">{activeFilterCount}</span>
                </button>
                
                {/* Divider */}
                <div className="w-px h-6 bg-white/[0.15]"></div>
                
                {/* Right: Clear X */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory("all");
                    setSelectedSubcategory(null);
                    setSelectedStrainTypes([]);
                    setSelectedConsistencies([]);
                    setSelectedFlavors([]);
                    setShowFilters(false);
                  }}
                  className="flex items-center justify-center w-10 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              /* Default State: Simple Filter Button */
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all text-[10px] uppercase tracking-[0.15em] font-light"
              >
                <SlidersHorizontal size={14} strokeWidth={1.5} />
                Filters
              </button>
            )}

            {/* Filters Dropdown Menu - Elegant & Organized */}
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-light">Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedSubcategory(null);
                        setSelectedStrainTypes([]);
                        setSelectedConsistencies([]);
                        setSelectedFlavors([]);
                      }}
                      className="text-[9px] uppercase tracking-[0.15em] text-white/40 hover:text-white/80 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Filter Sections - Scrollable */}
                <div className="max-h-[480px] overflow-y-auto">
                  {/* Category */}
                  <div className="p-4 border-b border-white/5">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-light">Category</div>
                    <div className="space-y-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedSubcategory(null);
                            setSelectedStrainTypes([]);
                            setSelectedConsistencies([]);
                            setSelectedFlavors([]);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-all ${
                            selectedCategory === cat
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white/80"
                          }`}
                        >
                          {cat === "all" ? "All Categories" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategories - Only if available */}
                  {availableSubcategories.length > 0 && (
                    <div className="p-4 border-b border-white/5">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-light">Type</div>
                      <div className="space-y-1">
                        {availableSubcategories.map((subcat) => (
                          <button
                            key={subcat}
                            onClick={() => {
                              setSelectedSubcategory(subcat === selectedSubcategory ? null : subcat);
                              if (subcat !== selectedSubcategory) {
                                setSelectedFlavors([]);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-all ${
                              selectedSubcategory === subcat
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                            }`}
                          >
                            {subcat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strain Types - Only if available - Multiple selection */}
                  {availableStrainTypes.length > 0 && (
                    <div className="p-4 border-b border-white/5">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-light">Strain</div>
                      <div className="space-y-1">
                        {availableStrainTypes.map((strain) => {
                          const isSelected = selectedStrainTypes.includes(strain);
                          return (
                            <button
                              key={strain}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStrainTypes(selectedStrainTypes.filter(s => s !== strain));
                                } else {
                                  setSelectedStrainTypes([...selectedStrainTypes, strain]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-all flex items-center justify-between ${
                                isSelected
                                  ? "bg-white/10 text-white"
                                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
                              }`}
                            >
                              <span>{strain}</span>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Consistencies - Only if available - Multiple selection */}
                  {availableConsistencies.length > 0 && (
                    <div className="p-4 border-b border-white/5">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-light">Consistency</div>
                      <div className="space-y-1">
                        {availableConsistencies.map((consistency) => {
                          const isSelected = selectedConsistencies.includes(consistency);
                          return (
                            <button
                              key={consistency}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedConsistencies(selectedConsistencies.filter(c => c !== consistency));
                                } else {
                                  setSelectedConsistencies([...selectedConsistencies, consistency]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-all flex items-center justify-between ${
                                isSelected
                                  ? "bg-white/10 text-white"
                                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
                              }`}
                            >
                              <span>{consistency}</span>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Flavors - Only if available - Multiple selection */}
                  {availableFlavors.length > 0 && (
                    <div className="p-4">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-light">Flavor</div>
                      <div className="space-y-1">
                        {availableFlavors.map((flavor) => {
                          const isSelected = selectedFlavors.includes(flavor);
                          return (
                            <button
                              key={flavor}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
                                } else {
                                  setSelectedFlavors([...selectedFlavors, flavor]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-all flex items-center justify-between ${
                                isSelected
                                  ? "bg-white/10 text-white"
                                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
                              }`}
                            >
                              <span>{flavor}</span>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar - Center, takes remaining space */}
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
                placeholder={searchQuery ? `Search ${filteredProducts.length} products...` : "POS"}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 placeholder-white/40 hover:bg-white/10 transition-all text-center placeholder:text-center"
                autoComplete="off"
              />
            </div>
            {onSkuSubmit && searchQuery && (
              <button
                type="button"
                onClick={(e) => onSkuSubmit(e as any)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] uppercase tracking-[0.15em] text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
              >
                Scan
              </button>
            )}
          </div>

          {/* Alphabetical Sort Toggle - Right Side */}
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
                    <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm py-2 mb-3">
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
                          activeFilters={{
                            strainTypes: selectedStrainTypes,
                            consistencies: selectedConsistencies,
                            flavors: selectedFlavors,
                          }}
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
                    activeFilters={{
                      strainTypes: selectedStrainTypes,
                      consistencies: selectedConsistencies,
                      flavors: selectedFlavors,
                    }}
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
  activeFilters?: {
    strainTypes?: string[];
    consistencies?: string[];
    flavors?: string[];
  };
}

function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  onQuickView,
  showInventory,
  vendorLogo,
  activeFilters,
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
    <div className="group flex flex-col bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
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
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] uppercase tracking-[0.15em] text-white/70 font-bold">
              {product.category}
            </span>
          </div>
        )}

        {/* Filter Attributes - Only show when filters are active */}
        {activeFilters && ((activeFilters.strainTypes?.length || 0) > 0 || (activeFilters.consistencies?.length || 0) > 0 || (activeFilters.flavors?.length || 0) > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* Show strain type if product matches any selected strains */}
            {activeFilters.strainTypes && activeFilters.strainTypes.length > 0 && (
              (() => {
                const strainType = product.fields?.find((f) => f.label === "strain_type")?.value;
                return strainType && activeFilters.strainTypes.includes(strainType) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-green-500/30 rounded-md text-[8px] uppercase tracking-[0.15em] text-green-400 font-bold">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    {strainType}
                  </span>
                ) : null;
              })()
            )}
            
            {/* Show consistency if product matches any selected consistencies */}
            {activeFilters.consistencies && activeFilters.consistencies.length > 0 && (
              (() => {
                const consistency = product.fields?.find((f) => f.label === "consistency")?.value;
                return consistency && activeFilters.consistencies.includes(consistency) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-purple-500/30 rounded-md text-[8px] uppercase tracking-[0.15em] text-purple-400 font-bold">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    {consistency}
                  </span>
                ) : null;
              })()
            )}
            
            {/* Show flavor if product matches any selected flavors */}
            {activeFilters.flavors && activeFilters.flavors.length > 0 && (
              (() => {
                const flavor = product.fields?.find((f) => f.label === "flavor")?.value;
                return flavor && activeFilters.flavors.includes(flavor) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-orange-500/30 rounded-md text-[8px] uppercase tracking-[0.15em] text-orange-400 font-bold">
                    <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                    {flavor}
                  </span>
                ) : null;
              })()
            )}
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
