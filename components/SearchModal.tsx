"use client";

import { useState, useEffect } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Focus on search input when modal opens
      setTimeout(() => {
        const input = document.getElementById("search-input");
        if (input) input.focus();
      }, 100);
    } else {
      document.body.style.overflow = "unset";
      setSearchQuery("");
      setSearchResults([]);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[200] flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 max-w-2xl w-full rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <SearchIcon size={20} className="text-white/40" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-white text-lg placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching && (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-white/40 mt-2">Searching...</p>
            </div>
          )}

          {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-white/40">No results found for "{searchQuery}"</p>
            </div>
          )}

          {!isSearching && searchQuery.trim().length < 2 && (
            <div className="p-6 text-center">
              <p className="text-sm text-white/40">Type at least 2 characters to search</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="py-2">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-16 h-16 bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].src}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src="/logoprint.png"
                        alt="Flora Distro"
                        className="w-full h-full object-contain opacity-20"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{product.name}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {product.categories && product.categories[0]?.name}
                    </p>
                  </div>
                  <div className="text-sm text-white/60 whitespace-nowrap">
                    {product.price && product.price !== "0" ? (
                      product.price.includes("-") ? (
                        <span>${product.price.split("-")[0]} - ${product.price.split("-")[1]}</span>
                      ) : (
                        <span>${product.price}</span>
                      )
                    ) : (
                      <span className="text-xs">Contact</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        {searchQuery.trim().length === 0 && (
          <div className="p-6 border-t border-white/10">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-4">Quick Links</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  router.push("/products?category=flower");
                  onClose();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
              >
                Flower
              </button>
              <button
                onClick={() => {
                  router.push("/products?category=concentrate");
                  onClose();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
              >
                Concentrate
              </button>
              <button
                onClick={() => {
                  router.push("/products?category=edibles");
                  onClose();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
              >
                Edibles
              </button>
              <button
                onClick={() => {
                  router.push("/products?category=vape");
                  onClose();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
              >
                Vape
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

