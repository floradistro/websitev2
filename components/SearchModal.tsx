"use client";

import { useState, useEffect } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-start justify-center pt-16 sm:pt-20 px-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 max-w-2xl w-full rounded-none animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3 sm:gap-4">
            <SearchIcon size={20} className="text-white/40" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-white text-base sm:text-lg placeholder:text-white/40 focus:outline-none input-elegant"
            />
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-smooth p-2 click-feedback"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching && (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin-smooth mx-auto"></div>
              <p className="text-sm sm:text-base text-white/40 mt-2">Searching...</p>
            </div>
          )}

          {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm sm:text-base text-white/40">No results found for "{searchQuery}"</p>
            </div>
          )}

          {!isSearching && searchQuery.trim().length < 2 && (
            <div className="p-6 text-center">
              <p className="text-sm sm:text-base text-white/40">Type at least 2 characters to search</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="py-2">
              {searchResults.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 hover:bg-white/10 transition-smooth text-left click-feedback"
                  style={{
                    animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`,
                  }}
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 rounded relative overflow-hidden">
                    {product.images && product.images[0] ? (
                      <Image
                        src={product.images[0].src}
                        alt={product.name}
                        fill
                        sizes="72px"
                        className="object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src="/logoprint.png"
                        alt="Flora Distro"
                        fill
                        className="object-contain opacity-20"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base text-white truncate">{product.name}</p>
                    <p className="text-xs sm:text-sm text-white/40 mt-1">
                      {product.categories && product.categories[0]?.name}
                    </p>
                  </div>
                  <div className="text-sm sm:text-base text-white/60 whitespace-nowrap flex-shrink-0">
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
          <div className="p-4 sm:p-6 border-t border-white/10">
            <p className="text-xs sm:text-sm uppercase tracking-wider text-white/40 mb-4">Quick Links</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  router.push("/products?category=flower");
                  onClose();
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-sm sm:text-base text-white/80 transition-smooth rounded-sm click-feedback hover-lift"
              >
                Flower
              </button>
              <button
                onClick={() => {
                  router.push("/products?category=concentrate");
                  onClose();
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-sm sm:text-base text-white/80 transition-smooth rounded-sm click-feedback hover-lift"
              >
                Concentrate
              </button>
              <button
                onClick={() => {
                  router.push("/products?category=edibles");
                  onClose();
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-sm sm:text-base text-white/80 transition-smooth rounded-sm click-feedback hover-lift"
              >
                Edibles
              </button>
              <button
                onClick={() => {
                  router.push("/products?category=vape");
                  onClose();
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-sm sm:text-base text-white/80 transition-smooth rounded-sm click-feedback hover-lift"
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

