"use client";

import { useEffect, useState, useRef } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import {
  Upload,
  Trash2,
  Download,
  Search,
  Grid3x3,
  List,
  CheckSquare,
  Square,
  FileText,
  X,
  AlertCircle,
  Eye,
  Package,
  Loader2,
  Calendar,
  Beaker,
  ExternalLink,
  AlertTriangle,
  Filter,
} from "lucide-react";
import Image from "next/image";

import { logger } from "@/lib/logger";
interface COA {
  id: string;
  productId: string | null;
  productName: string | null;
  productNameOnCoa?: string | null;
  productSku?: string | null;
  productImage?: string | null;
  productCategory?: string | null;
  coaNumber: string;
  testDate: string;
  uploadDate: string;
  expiryDate?: string;
  isExpired?: boolean;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  testingLab: string;
  batchNumber: string;
  thc: string;
  cbd: string;
  thca?: string | null;
  cbda?: string | null;
  cbg?: string | null;
  cbn?: string | null;
  totalCannabinoids?: string | null;
  terpenes?: any;
  totalTerpenes?: string | null;
  pesticides?: boolean | null;
  heavyMetals?: boolean | null;
  microbials?: boolean | null;
  mycotoxins?: boolean | null;
  solvents?: boolean | null;
  metadata?: any;
  rawTestResults?: any;
}

type ViewMode = "grid" | "list";
type LinkFilter = "all" | "linked" | "unlinked";

export default function VendorLabResults() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [coas, setCoas] = useState<COA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCOAs, setSelectedCOAs] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quickViewCOA, setQuickViewCOA] = useState<COA | null>(null);
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load COAs
  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor) {
      loadCOAs();
    }
  }, [authLoading, isAuthenticated, vendor]);

  const loadCOAs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/vendor/coas", {
        headers: {
          "x-vendor-id": vendor?.id || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load COAs");
      }

      const data = await response.json();
      setCoas(data.coas || []);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error loading COAs:", err);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append("file", file);

        // For now, just basic upload - you can add a modal for full COA metadata
        formData.append("lab_name", "TBD");
        formData.append("test_date", new Date().toISOString().split("T")[0]);
        formData.append("batch_number", `BATCH-${Date.now()}`);

        const response = await fetch("/api/vendor/coas", {
          method: "POST",
          headers: {
            "x-vendor-id": vendor?.id || "",
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload COA");
        }
      }

      await loadCOAs();
      setSelectedCOAs(new Set());
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error uploading COAs:", err);
      }
      setError("Failed to upload COAs");
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

  // Delete COAs
  const handleDelete = async () => {
    if (selectedCOAs.size === 0) return;

    if (!confirm(`Delete ${selectedCOAs.size} COA(s)?`)) return;

    try {
      for (const coaId of selectedCOAs) {
        await fetch(`/api/vendor/coas?id=${encodeURIComponent(coaId)}`, {
          method: "DELETE",
          headers: {
            "x-vendor-id": vendor?.id || "",
          },
        });
      }

      await loadCOAs();
      setSelectedCOAs(new Set());
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error deleting COAs:", err);
      }
      setError("Failed to delete COAs");
    }
  };

  // Download COA
  const handleDownload = (coa: COA) => {
    const a = document.createElement("a");
    a.href = coa.fileUrl;
    a.download = coa.fileName || `COA-${coa.coaNumber}.pdf`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Selection handlers
  const toggleCOASelection = (coaId: string) => {
    const newSelection = new Set(selectedCOAs);
    if (newSelection.has(coaId)) {
      newSelection.delete(coaId);
    } else {
      newSelection.add(coaId);
    }
    setSelectedCOAs(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCOAs.size === filteredCOAs.length) {
      setSelectedCOAs(new Set());
    } else {
      setSelectedCOAs(new Set(filteredCOAs.map((c) => c.id)));
    }
  };

  // Filter COAs by search and link status
  const filteredCOAs = coas.filter((coa) => {
    // Link filter
    if (linkFilter === "linked" && !coa.productId) return false;
    if (linkFilter === "unlinked" && coa.productId) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = coa.productName?.toLowerCase().includes(query);
      const matchesCOA = coa.coaNumber.toLowerCase().includes(query);
      const matchesSKU = coa.productSku?.toLowerCase().includes(query);
      const matchesBatch = coa.batchNumber.toLowerCase().includes(query);
      const matchesLab = coa.testingLab.toLowerCase().includes(query);

      if (!matchesName && !matchesCOA && !matchesSKU && !matchesBatch && !matchesLab) {
        return false;
      }
    }

    return true;
  });

  // Stats
  const stats = {
    total: coas.length,
    withProducts: coas.filter((c) => c.productId).length,
    expired: coas.filter((c) => c.isExpired).length,
    recent: coas.filter((c) => {
      const uploadDate = new Date(c.uploadDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return uploadDate >= thirtyDaysAgo;
    }).length,
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
          <p className="text-white/60 text-[10px] uppercase tracking-[0.15em]">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60 text-[10px] uppercase tracking-[0.15em]">Please log in</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen bg-black"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Page Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[10px] uppercase tracking-[0.15em] text-white font-medium flex-1">
              Lab Results & COAs
            </h1>
            <div className="flex items-center gap-1 md:gap-2 text-white/40 text-[10px] uppercase tracking-[0.15em] flex-shrink-0">
              <FileText className="w-3 h-3" />
              <span>{coas.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-3 md:p-4">
              <div className="text-[10px] uppercase tracking-[0.15em] mb-1 text-white/40">
                Total
              </div>
              <div className="text-xl md:text-2xl font-medium text-white">{stats.total}</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-3 md:p-4">
              <div className="text-[10px] uppercase tracking-[0.15em] mb-1 text-white/40">
                Linked
              </div>
              <div className="text-xl md:text-2xl font-medium" style={{ color: "#22c55e" }}>
                {stats.withProducts}
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-3 md:p-4">
              <div className="text-[10px] uppercase tracking-[0.15em] mb-1 text-white/40">
                Recent
              </div>
              <div className="text-xl md:text-2xl font-medium" style={{ color: "#3b82f6" }}>
                {stats.recent}
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-3 md:p-4">
              <div className="text-[10px] uppercase tracking-[0.15em] mb-1 text-white/40">
                Expired
              </div>
              <div className="text-xl md:text-2xl font-medium" style={{ color: "#ef4444" }}>
                {stats.expired}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-[10px] uppercase tracking-[0.15em]">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toolbar - Single Row */}
          <div className="mb-4 mt-6">
            <div className="flex gap-2">
              {/* Left: Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-shrink-0 bg-white/[0.08] text-white border border-white/[0.12] rounded-2xl px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] hover:bg-white/[0.12] hover:border-white/[0.2] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Upload COA</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {/* Select All - Only show when there are COAs */}
              {coas.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
                >
                  {selectedCOAs.size === filteredCOAs.length && filteredCOAs.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.15em]">
                    {selectedCOAs.size === 0 ? "Select All" : `${selectedCOAs.size} Selected`}
                  </span>
                </button>
              )}

              {/* Center: Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH COAS..."
                  className="w-full bg-white/5 border border-white/10 text-white pl-9 pr-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 placeholder-white/40 hover:bg-white/10 transition-all"
                />
              </div>

              {/* Right: Filter + View Toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`flex-shrink-0 p-2.5 rounded-2xl border transition-all ${
                  linkFilter !== "all" || showMobileFilters
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>

              <div className="hidden lg:flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    viewMode === "grid"
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    viewMode === "list"
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Dropdown */}
            {showMobileFilters && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                <button
                  onClick={() => {
                    setLinkFilter("all");
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    linkFilter === "all"
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  }`}
                >
                  All COAs
                </button>
                <button
                  onClick={() => {
                    setLinkFilter("linked");
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    linkFilter === "linked"
                      ? "border-green-500/20"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  }`}
                  style={
                    linkFilter === "linked"
                      ? {
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                          color: "#22c55e",
                        }
                      : {}
                  }
                >
                  Linked
                </button>
                <button
                  onClick={() => {
                    setLinkFilter("unlinked");
                    setShowMobileFilters(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-2xl text-[10px] uppercase tracking-[0.15em] transition-all border ${
                    linkFilter === "unlinked"
                      ? "border-yellow-500/20"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  }`}
                  style={
                    linkFilter === "unlinked"
                      ? {
                          backgroundColor: "rgba(234, 179, 8, 0.1)",
                          color: "#eab308",
                        }
                      : {}
                  }
                >
                  Not Linked
                </button>
              </div>
            )}
          </div>

          {/* COAs Display */}
          {filteredCOAs.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="max-w-md mx-auto">
                {coas.length === 0 ? (
                  <>
                    <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h2 className="text-white/60 mb-2 font-medium uppercase tracking-tight text-xs">
                      No COAs Yet
                    </h2>
                    <p className="text-white/40 mb-4 text-[10px] uppercase tracking-[0.15em]">
                      Upload certificates
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/[0.08] text-white border border-white/[0.12] rounded-2xl px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] hover:bg-white/[0.12] hover:border-white/[0.2] font-medium transition-all inline-flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload First COA
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h2 className="text-white/60 mb-2 font-medium uppercase tracking-tight text-xs">
                      No Results
                    </h2>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                      No COAs match &quot;{searchQuery}&quot;
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredCOAs.map((coa) => (
                <COACard
                  key={coa.id}
                  coa={coa}
                  selected={selectedCOAs.has(coa.id)}
                  onToggleSelect={() => toggleCOASelection(coa.id)}
                  onDownload={() => handleDownload(coa)}
                  onQuickView={() => setQuickViewCOA(coa)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCOAs.map((coa) => (
                <COAListItem
                  key={coa.id}
                  coa={coa}
                  selected={selectedCOAs.has(coa.id)}
                  onToggleSelect={() => toggleCOASelection(coa.id)}
                  onDownload={() => handleDownload(coa)}
                  onQuickView={() => setQuickViewCOA(coa)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-white/40">
            <div className="text-center">
              <Upload className="w-16 h-16 text-white mx-auto mb-4 animate-bounce" />
              <p
                className="text-white font-black uppercase tracking-tight text-xl"
                style={{ fontWeight: 900 }}
              >
                Drop Files
              </p>
              <p className="text-white/60 text-[10px] uppercase tracking-[0.15em] mt-2">
                PDF or images
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewCOA && (
        <COAQuickViewModal
          coa={quickViewCOA}
          onClose={() => setQuickViewCOA(null)}
          onDownload={() => handleDownload(quickViewCOA)}
          onDelete={async () => {
            if (confirm(`Delete COA "${quickViewCOA.coaNumber}"?`)) {
              await fetch(`/api/vendor/coas?id=${encodeURIComponent(quickViewCOA.id)}`, {
                method: "DELETE",
                headers: { "x-vendor-id": vendor?.id || "" },
              });
              await loadCOAs();
              setQuickViewCOA(null);
            }
          }}
          vendorId={vendor?.id || ""}
        />
      )}
    </>
  );
}

// COA Card Component (Grid View)
interface COACardProps {
  coa: COA;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: () => void;
  onQuickView: () => void;
}

function COACard({ coa, selected, onToggleSelect, onDownload, onQuickView }: COACardProps) {
  return (
    <div
      className={`group relative flex flex-col bg-[#0a0a0a] hover:bg-white/[0.02] border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        selected ? "border-white/[0.12]" : "border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      {/* Selection Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="absolute top-2 left-2 z-10 w-7 h-7 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-white" />
        ) : (
          <Square className="w-4 h-4 text-white/60" />
        )}
      </button>

      {/* Expiry Warning */}
      {coa.isExpired && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-red-500">
              Expired
            </span>
          </div>
        </div>
      )}

      {/* Preview Area - Click to Quick View */}
      <div
        onClick={onQuickView}
        className="aspect-[4/3] bg-black relative cursor-pointer overflow-hidden"
      >
        {/* PDF Preview */}
        {coa.fileUrl && coa.fileUrl.toLowerCase().endsWith(".pdf") ? (
          <div className="w-full h-full relative pointer-events-none">
            <iframe
              src={`${coa.fileUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0 scale-110 origin-top-left"
              title={`COA Preview: ${coa.coaNumber}`}
            />
            {/* Dark overlay - dims PDF, reveals on hover */}
            <div className="absolute inset-0 bg-black/70 group-hover:bg-black/40 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          </div>
        ) : coa.productImage ? (
          <Image
            src={coa.productImage}
            alt={coa.productName || "Product"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-4"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Quick View Hint */}
        <div className="hidden lg:flex absolute inset-0 opacity-0 group-hover:opacity-100 transition-all items-center justify-center pointer-events-none z-10">
          <div className="text-white text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 font-medium bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/[0.12]">
            <Eye className="w-3.5 h-3.5" />
            View
          </div>
        </div>
      </div>

      {/* COA Info */}
      <div className="flex-1 p-3 border-t border-white/[0.06]">
        <div className="mb-2">
          <p className="text-white text-xs font-medium uppercase tracking-tight line-clamp-2">
            {coa.productName || "Unassigned"}
          </p>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-mono">
            {coa.coaNumber}
          </p>
        </div>

        {/* Cannabinoid Quick Info */}
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">THC</div>
            <div className="text-white text-xs font-medium">{coa.thc}</div>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">CBD</div>
            <div className="text-white text-xs font-medium">{coa.cbd}</div>
          </div>
          {coa.totalTerpenes && (
            <div>
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">Terps</div>
              <div className="text-white text-xs font-medium">{coa.totalTerpenes}</div>
            </div>
          )}
        </div>

        {/* Lab & Date */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em]">
          <div className="flex items-center gap-1 text-white/40">
            <Beaker className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{coa.testingLab}</span>
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(coa.testDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className="w-full py-2.5 bg-white/[0.04] border-t border-white/[0.06] hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 text-white/40 hover:text-white text-[10px] uppercase tracking-[0.15em] font-medium"
      >
        <Download className="w-3 h-3" />
        Download
      </button>
    </div>
  );
}

// COA List Item Component (List View)
interface COAListItemProps {
  coa: COA;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: () => void;
  onQuickView: () => void;
}

function COAListItem({ coa, selected, onToggleSelect, onDownload, onQuickView }: COAListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 bg-[#0a0a0a] hover:bg-white/[0.02] border rounded-2xl p-3 transition-all ${
        selected ? "border-white/[0.12]" : "border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="flex-shrink-0 w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-white" />
        ) : (
          <Square className="w-4 h-4 text-white/60" />
        )}
      </button>

      {/* Thumbnail */}
      <div
        onClick={onQuickView}
        className="flex-shrink-0 w-16 h-16 bg-black rounded-xl overflow-hidden relative cursor-pointer hover:ring-2 ring-white/[0.12] transition-all"
      >
        {/* PDF Preview */}
        {coa.fileUrl && coa.fileUrl.toLowerCase().endsWith(".pdf") ? (
          <div className="w-full h-full relative pointer-events-none">
            <iframe
              src={`${coa.fileUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0 scale-125 origin-top-left"
              title={`COA Preview: ${coa.coaNumber}`}
            />
            {/* Dark overlay for list view thumbnails */}
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ) : coa.productImage ? (
          <Image
            src={coa.productImage}
            alt={coa.productName || ""}
            fill
            sizes="64px"
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-white/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <p className="text-white text-xs font-medium uppercase tracking-tight truncate flex-1">
            {coa.productName || "Unassigned"}
          </p>
          {coa.isExpired && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-red-500">
                Expired
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/40">
          <span className="font-mono">{coa.coaNumber}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">THC: {coa.thc}</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">{coa.testingLab}</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <Download className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}

// Quick View Modal Component
interface COAQuickViewModalProps {
  coa: COA;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  vendorId: string;
}

function COAQuickViewModal({ coa, onClose, onDownload, onDelete }: COAQuickViewModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/95 z-[250] flex items-end lg:items-center justify-center p-0 lg:p-4 overflow-hidden"
    >
      <div className="bg-black lg:bg-[#0a0a0a] lg:border lg:border-white/10 lg:rounded-2xl w-full h-[95vh] lg:h-auto lg:max-w-4xl lg:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-medium uppercase tracking-tight text-[10px]">
                Certificate of Analysis
              </h2>
              {coa.isExpired && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-red-500">
                    Expired
                  </span>
                </div>
              )}
            </div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-mono">
              {coa.coaNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* PDF Preview */}
          {coa.fileUrl && coa.fileUrl.toLowerCase().endsWith(".pdf") && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white/60" />
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-medium">
                    Certificate Preview
                  </h3>
                </div>
                <a
                  href={coa.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden md:inline">Open</span>
                </a>
              </div>
              <div className="w-full aspect-[8.5/11] bg-black rounded-xl overflow-hidden border border-white/10">
                <iframe
                  src={`${coa.fileUrl}#page=1&view=FitH&toolbar=1&navpanes=1`}
                  className="w-full h-full border-0"
                  title={`Full COA: ${coa.coaNumber}`}
                />
              </div>
            </div>
          )}

          {/* Product Info */}
          {coa.productName && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-white/60" />
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-medium">
                  Product
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {coa.productImage && (
                  <div className="w-16 h-16 bg-black rounded-xl overflow-hidden relative flex-shrink-0">
                    <Image
                      src={coa.productImage}
                      alt={coa.productName}
                      fill
                      sizes="64px"
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium uppercase tracking-tight">
                    {coa.productName}
                  </p>
                  {coa.productSku && (
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                      SKU: {coa.productSku}
                    </p>
                  )}
                  {coa.productCategory && (
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                      {coa.productCategory}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Test Information */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Beaker className="w-4 h-4 text-white/60" />
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-medium">
                Test Info
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.15em]">
              <div>
                <div className="text-white/40 mb-1">Lab</div>
                <div className="text-white font-medium">{coa.testingLab}</div>
              </div>
              <div>
                <div className="text-white/40 mb-1">Batch</div>
                <div className="text-white font-medium font-mono">{coa.batchNumber}</div>
              </div>
              <div>
                <div className="text-white/40 mb-1">Test Date</div>
                <div className="text-white font-medium">
                  {new Date(coa.testDate).toLocaleDateString()}
                </div>
              </div>
              {coa.expiryDate && (
                <div>
                  <div className="text-white/40 mb-1">Expiry</div>
                  <div className={`font-medium ${coa.isExpired ? "text-red-500" : "text-white"}`}>
                    {new Date(coa.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cannabinoid Profile */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-medium mb-3">
              Cannabinoids
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-black/40 border border-white/[0.08] rounded-xl p-3">
                <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">
                  THC
                </div>
                <div className="text-white text-xl font-medium">{coa.thc}</div>
              </div>
              <div className="bg-black/40 border border-white/[0.08] rounded-xl p-3">
                <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">
                  CBD
                </div>
                <div className="text-white text-xl font-medium">{coa.cbd}</div>
              </div>
            </div>
            {(coa.thca || coa.cbda || coa.cbg || coa.cbn || coa.totalCannabinoids) && (
              <div className="grid grid-cols-3 gap-2">
                {coa.thca && (
                  <div className="bg-black/20 rounded-xl p-2">
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">THCa</div>
                    <div className="text-white text-xs font-medium">{coa.thca}</div>
                  </div>
                )}
                {coa.cbda && (
                  <div className="bg-black/20 rounded-xl p-2">
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">CBDa</div>
                    <div className="text-white text-xs font-medium">{coa.cbda}</div>
                  </div>
                )}
                {coa.cbg && (
                  <div className="bg-black/20 rounded-xl p-2">
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">CBG</div>
                    <div className="text-white text-xs font-medium">{coa.cbg}</div>
                  </div>
                )}
                {coa.cbn && (
                  <div className="bg-black/20 rounded-xl p-2">
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">CBN</div>
                    <div className="text-white text-xs font-medium">{coa.cbn}</div>
                  </div>
                )}
                {coa.totalCannabinoids && (
                  <div className="bg-black/20 rounded-xl p-2">
                    <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                      Total
                    </div>
                    <div className="text-white text-xs font-medium">{coa.totalCannabinoids}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terpene Profile */}
          {coa.totalTerpenes && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-medium mb-3">
                Terpenes
              </h3>
              <div className="bg-black/40 border border-white/[0.08] rounded-xl p-3 mb-3">
                <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">
                  Total
                </div>
                <div className="text-white text-xl font-medium">{coa.totalTerpenes}</div>
              </div>
              {coa.terpenes && typeof coa.terpenes === "object" && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(coa.terpenes).map(([name, value]) => (
                    <div key={name} className="bg-black/20 rounded-xl p-2">
                      <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] capitalize">
                        {name}
                      </div>
                      <div className="text-white text-xs font-medium">{String(value)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-white/[0.08] bg-black/40 flex-shrink-0">
          <button
            onClick={onDownload}
            className="flex-1 bg-white/[0.08] text-white border border-white/[0.12] rounded-2xl px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] hover:bg-white/[0.12] hover:border-white/[0.2] font-medium transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] hover:bg-red-500/20 hover:border-red-500/30 font-medium transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          {coa.productId && (
            <a
              href={`/vendor/products/${coa.productId}/edit`}
              className="flex-shrink-0 p-2.5 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
