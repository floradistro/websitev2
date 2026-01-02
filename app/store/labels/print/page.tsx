"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts } from "@/lib/design-system";
import { LABEL_TEMPLATES, getTemplateList } from "@/lib/label-templates";
import { LabelTemplate, LabelData } from "@/lib/types/labels";
import {
  Printer,
  Settings,
  Eye,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  ChevronLeft,
  Save,
  Package,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function PrintInterface() {
  const { vendor, isLoading } = useAppAuth();
  const searchParams = useSearchParams();
  const isBulkMode = searchParams.get("bulk") === "true";

  const [selectedTemplate, setSelectedTemplate] = useState("avery_5160");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.6);

  // Product selection
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Customization options
  const [showBorders, setShowBorders] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [productNameSize, setProductNameSize] = useState(10);
  const [detailsSize, setDetailsSize] = useState(8);

  const template = LABEL_TEMPLATES[selectedTemplate];
  const templateList = getTemplateList();

  // Fetch vendor products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!vendor?.id) return;

      setLoadingProducts(true);
      try {
        const response = await fetch(`/api/products?vendor_id=${vendor.id}&limit=100`);
        const data = await response.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [vendor?.id]);

  // Generate labels based on selected product or generic placeholders
  useEffect(() => {
    const totalLabels = template.grid.rows * template.grid.columns;

    if (selectedProduct) {
      // Use selected product data
      const productLabel: LabelData = {
        productName: selectedProduct.name,
        sku: selectedProduct.sku || "",
        price: selectedProduct.regular_price ? `$${selectedProduct.regular_price}` : "",
        category: selectedProduct.category_name || "",
        strainType: selectedProduct.custom_fields?.strain_type || "",
        thc: selectedProduct.custom_fields?.thca_percentage
          ? `${selectedProduct.custom_fields.thca_percentage}%`
          : "",
        effect: selectedProduct.custom_fields?.effects || "",
      };

      // Fill all positions with the same product
      const allLabels: LabelData[] = Array(totalLabels).fill(productLabel);
      setLabels(allLabels);
    } else {
      // Use generic placeholder data
      const genericLabel: LabelData = {
        productName: "Product Name",
        sku: "SKU-000",
        price: "$0.00",
        category: "Category",
        strainType: "Type",
        thc: "0%",
        effect: "Effects",
      };

      const allLabels: LabelData[] = Array(totalLabels).fill(genericLabel);
      setLabels(allLabels);
    }
  }, [template, selectedProduct]);

  const handlePrint = () => {
    window.print();
  };

  const renderLabel = (labelData: LabelData, index: number) => {
    const gridPos = {
      row: Math.floor(index / template.grid.columns),
      col: index % template.grid.columns,
    };

    const left = template.page.margin_left + gridPos.col * template.grid.horizontal_pitch;
    const top = template.page.margin_top + gridPos.row * template.grid.vertical_pitch;

    return (
      <div
        key={index}
        className="absolute"
        style={{
          left: `${left}in`,
          top: `${top}in`,
          width: `${template.grid.label_width}in`,
          height: `${template.grid.label_height}in`,
          padding: `${template.label_style.safe_padding.top}in ${template.label_style.safe_padding.right}in ${template.label_style.safe_padding.bottom}in ${template.label_style.safe_padding.left}in`,
          borderRadius: `${template.label_style.corner_radius}in`,
          border: showBorders ? "1px solid #000000" : "none",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          fontFamily: "Helvetica, sans-serif",
        }}
      >
        <div className="h-full flex flex-col">
          {/* Vendor Logo */}
          {showLogo && vendor?.logo_url && (
            <div className="flex justify-center mb-1">
              <Image
                src={vendor.logo_url}
                alt={vendor.name || "Logo"}
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
                className="print:block"
              />
            </div>
          )}

          {/* Product Name */}
          <div
            style={{
              fontSize: `${productNameSize}pt`,
              lineHeight: "1.2",
              fontWeight: "bold",
              color: "#000000",
            }}
          >
            {labelData.productName}
          </div>

          {/* Strain Type & THC */}
          {labelData.strainType && labelData.thc && (
            <div
              style={{
                fontSize: `${detailsSize}pt`,
                color: "#000000",
                marginTop: "2px",
              }}
            >
              {labelData.strainType} • {labelData.thc}
            </div>
          )}

          {/* Price */}
          {showPrice && labelData.price && (
            <div
              style={{
                fontSize: `${productNameSize + 2}pt`,
                fontWeight: "bold",
                color: "#000000",
                marginTop: "auto",
              }}
            >
              {labelData.price}
            </div>
          )}

          {/* SKU */}
          {showSKU && labelData.sku && (
            <div
              style={{
                fontSize: "6pt",
                color: "#666666",
                marginTop: "2px",
              }}
            >
              {labelData.sku}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSheet = () => {
    return (
      <div
        className="print-page relative bg-white shadow-xl mx-auto"
        style={{
          width: `${template.page.width}in`,
          height: `${template.page.height}in`,
          outline: showBorders ? "1px dashed #999" : "none",
        }}
      >
        {/* Page margin guide when borders are shown */}
        {showBorders && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${template.page.margin_top}in`,
              left: `${template.page.margin_left}in`,
              right: `${template.page.margin_right}in`,
              bottom: `${template.page.margin_bottom}in`,
              border: "1px dashed #ccc",
            }}
          />
        )}
        {labels.map((label, index) => renderLabel(label, index))}
      </div>
    );
  };

  if (isLoading) {
    return <PageLoader message="Loading print interface..." />;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: ${template.page.size};
            margin: 0;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            width: ${template.page.width}in;
            height: ${template.page.height}in;
            position: relative;
            page-break-after: always;
          }
        }

        @media screen {
          .print-page {
            transform-origin: top center;
          }
        }
      `}</style>

      <div className={pageLayouts.page}>
        <div className="flex h-screen">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-black border-r border-white/[0.06] overflow-y-auto no-print">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <Link
                href="/vendor/labels"
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Labels
              </Link>
              <h1 className="text-xl font-light text-white">Print Labels</h1>
              <p className="text-sm text-white/40 mt-1">
                {isBulkMode ? "Bulk print mode" : "Quick print"}
              </p>
            </div>

            {/* Product Selection */}
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">
                Product
              </label>
              <button
                onClick={() => setShowProductSelector(true)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm hover:bg-white/[0.06] transition-colors text-left flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedProduct ? selectedProduct.name : "Select product..."}
                </span>
                <Package className="w-4 h-4 text-white/40 flex-shrink-0 ml-2" />
              </button>
              {selectedProduct && (
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs text-white/40 hover:text-white mt-1 transition-colors"
                >
                  Clear selection (use sample data)
                </button>
              )}
            </div>

            {/* Template Selection */}
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">
                Label Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-white/[0.16]"
              >
                {templateList.map((t) => (
                  <option key={t.id} value={t.id} className="bg-black">
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-white/30 mt-1">{template.description}</p>
            </div>

            {/* Display Options */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Display Options</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Show Borders</span>
                  <input
                    type="checkbox"
                    checked={showBorders}
                    onChange={(e) => setShowBorders(e.target.checked)}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Show Logo</span>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Show Price</span>
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Show SKU</span>
                  <input
                    type="checkbox"
                    checked={showSKU}
                    onChange={(e) => setShowSKU(e.target.checked)}
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Typography</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/40 block mb-1">
                    Product Name Size
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={productNameSize}
                    onChange={(e) => setProductNameSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-white/30 text-right">{productNameSize}pt</div>
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">
                    Details Size
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="12"
                    value={detailsSize}
                    onChange={(e) => setDetailsSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-white/30 text-right">{detailsSize}pt</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Labels
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.06] text-white rounded-lg font-medium hover:bg-white/[0.08] transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Template
              </button>
            </div>

            {/* Product Selection (Bulk Mode) */}
            {isBulkMode && (
              <div className="pt-4 border-t border-white/[0.06]">
                <h3 className="text-sm font-medium text-white mb-3">
                  Selected Products ({selectedProducts.size})
                </h3>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.04] text-white rounded-lg text-sm hover:bg-white/[0.06] transition-colors">
                  <Package className="w-4 h-4" />
                  Select Products
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 bg-[#1a1a1a] overflow-hidden flex flex-col">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] no-print">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))}
                className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-white/60" />
              </button>
              <span className="text-xs text-white/40 min-w-[4ch] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
                className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-8">
            <div
              className="flex justify-center items-start min-h-full"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top center",
                paddingBottom: "2rem",
              }}
            >
              {renderSheet()}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Product Selector Modal */}
    {showProductSelector && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 no-print">
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-xl font-light text-white">Select Product</h2>
              <p className="text-sm text-white/40 mt-1">
                Choose a product to print labels for
              </p>
            </div>
            <button
              onClick={() => setShowProductSelector(false)}
              className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/[0.16]"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingProducts ? (
              <div className="text-center py-12">
                <div className="text-white/40">Loading products...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <div className="text-white/40">No products found</div>
              </div>
            ) : (
              <div className="space-y-2">
                {products
                  .filter((product) =>
                    product.name.toLowerCase().includes(productSearch.toLowerCase())
                  )
                  .map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductSelector(false);
                        setProductSearch("");
                      }}
                      className="w-full p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium">{product.name}</div>
                          <div className="text-sm text-white/40 mt-1">
                            {product.sku && <span>SKU: {product.sku}</span>}
                            {product.category_name && (
                              <span className="ml-3">{product.category_name}</span>
                            )}
                          </div>
                        </div>
                        {product.regular_price && (
                          <div className="text-white font-medium ml-4">
                            ${product.regular_price}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading print interface..." />}>
      <PrintInterface />
    </Suspense>
  );
}
