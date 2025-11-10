"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package, ShoppingCart, Users, Tag, BarChart3, TrendingUp } from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";

import { logger } from "@/lib/logger";
interface SearchResult {
  id: string;
  type: "product" | "order" | "customer" | "app";
  title: string;
  subtitle?: string;
  route: string;
  icon?: string;
}

export function UniversalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { vendor } = useAppAuth();

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&vendorId=${vendor?.id}`,
        );
        const data = await response.json();
        if (data.success) {
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Search error:", error);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [query, vendor?.id]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.route);
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package size={16} className="text-cyan-400/70" strokeWidth={1.5} />;
      case "order":
        return <ShoppingCart size={16} className="text-purple-400/70" strokeWidth={1.5} />;
      case "customer":
        return <Users size={16} className="text-teal-400/70" strokeWidth={1.5} />;
      case "app":
        return <Tag size={16} className="text-blue-400/70" strokeWidth={1.5} />;
      default:
        return <Search size={16} className="text-white/40" strokeWidth={1.5} />;
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-all duration-200"
      >
        <Search size={14} className="text-white/40" strokeWidth={2} />
        <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Search</span>
        <span className="hidden md:inline text-white/20 text-[9px] ml-1">⌘K</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
              <Search size={18} className="text-white/30" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, orders, customers, apps..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-white/[0.06] rounded-md transition-colors"
                >
                  <X size={16} className="text-white/40" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && (
                <div className="py-8 text-center text-white/30 text-sm">Searching...</div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="py-8 text-center text-white/30 text-sm">No results found</div>
              )}

              {!loading && results.length > 0 && (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        index === selectedIndex ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex-shrink-0">{getIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-white/40 text-xs truncate">{result.subtitle}</div>
                        )}
                      </div>
                      <div className="text-white/20 text-[10px] uppercase tracking-wider">
                        {result.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase tracking-wider">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
