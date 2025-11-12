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
} from "lucide-react";
import Link from "next/link";

function PrintInterface() {
  const { vendor, isLoading } = useAppAuth();
  const searchParams = useSearchParams();
  const isBulkMode = searchParams.get("bulk") === "true";

  const [selectedTemplate, setSelectedTemplate] = useState("avery_5160");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.6);

  // Customization options
  const [showBorders, setShowBorders] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [productNameSize, setProductNameSize] = useState(10);
  const [detailsSize, setDetailsSize] = useState(8);

  const template = LABEL_TEMPLATES[selectedTemplate];
  const templateList = getTemplateList();

  useEffect(() => {
    // Generate sample labels for preview
    const sampleLabels: LabelData[] = [
      {
        productName: "Blue Dream",
        sku: "BD-001",
        price: "$35",
        category: "Flower",
        strainType: "hybrid",
        thc: "22%",
        effect: "Relaxed, Happy",
      },
      {
        productName: "OG Kush",
        sku: "OG-002",
        price: "$40",
        category: "Flower",
        strainType: "indica",
        thc: "24%",
        effect: "Sleepy, Euphoric",
      },
    ];
    setLabels(sampleLabels);
  }, []);

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
        }}
      >
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
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top center",
              }}
            >
              {renderSheet()}
            </div>
          </div>
        </div>
      </div>
    </div>
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
