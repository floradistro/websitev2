"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Star, Download, Trash2 } from "lucide-react";
import { logger } from "@/lib/logger";

interface VendorMedia {
  id: string;
  file_url: string;
  file_name: string;
  title: string | null;
  alt_text: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  featured_image_storage: string | null;
}

interface ProductGalleryProps {
  product: Product;
  vendorId: string;
  onBack: () => void;
  onImageUpdate?: () => void;
}

export default function ProductGallery({
  product,
  vendorId,
  onBack,
  onImageUpdate,
}: ProductGalleryProps) {
  logger.debug("🖼️ ProductGallery rendered", { productName: product?.name });
  const [images, setImages] = useState<VendorMedia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Track mount/unmount lifecycle
  useEffect(() => {
    logger.debug("🎬 ProductGallery MOUNTED", {
      productName: product?.name,
      productId: product?.id,
      timestamp: new Date().toISOString()
    });

    return () => {
      logger.debug("💀 ProductGallery UNMOUNTING", {
        productName: product?.name,
        productId: product?.id,
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  useEffect(() => {
    loadImages();
    setCurrentIndex(0); // Reset to first image when product changes
  }, [product.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length]);

  const loadImages = async () => {
    if (!product) return;

    setLoading(true);
    try {
      logger.debug("📸 Loading images for product", { productName: product.name, productId: product.id });
      const response = await fetch(
        `/api/vendor/media?category=product_photos&productId=${product.id}`,
        {
          headers: { "x-vendor-id": vendorId },
        },
      );

      if (!response.ok) throw new Error("Failed to load images");

      const data = await response.json();
      logger.debug("📸 Received images:", data.files?.length || 0);
      setImages(data.files || []);
    } catch (error) {
      logger.error("Error loading product images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleSetFeatured = async () => {
    if (!product || !images[currentIndex]) return;

    try {
      const response = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          featured_image_storage: images[currentIndex].file_url,
        }),
      });

      if (!response.ok) throw new Error("Failed to set featured image");

      onImageUpdate?.();
    } catch (error) {
      logger.error("Error setting featured image:", error);
      alert("Failed to set featured image");
    }
  };

  const handleDownload = () => {
    const image = images[currentIndex];
    if (!image) return;

    const link = document.createElement("a");
    link.href = image.file_url;
    link.download = image.file_name;
    link.click();
  };

  const handleDelete = async () => {
    const image = images[currentIndex];
    if (!image) return;

    if (!confirm(`Delete "${image.file_name}"?`)) return;

    try {
      const filePath = new URL(image.file_url).pathname.split("/").slice(-2).join("/");

      const response = await fetch(`/api/vendor/media?file=${filePath}`, {
        method: "DELETE",
        headers: { "x-vendor-id": vendorId },
      });

      if (!response.ok) throw new Error("Failed to delete image");

      // Remove from local state
      const newImages = images.filter((_, i) => i !== currentIndex);
      setImages(newImages);

      if (newImages.length === 0) {
        onBack();
      } else if (currentIndex >= newImages.length) {
        setCurrentIndex(newImages.length - 1);
      }

      onImageUpdate?.();
    } catch (error) {
      logger.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  const currentImage = images[currentIndex];
  const isFeatured = currentImage?.file_url === product.featured_image_storage;

  logger.debug("🎨 Render state:", { loading, imageCount: images.length, currentIndex, currentImage: currentImage?.file_name });

  return (
    <div className="absolute inset-0 flex flex-col bg-black/95 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-light text-white">{product.name}</h2>
              <p className="text-xs text-white/40">
                {loading ? "Loading..." : `${images.length} image${images.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!loading && images.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSetFeatured}
                disabled={isFeatured}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isFeatured
                    ? "bg-white/20 text-white cursor-not-allowed"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-current" : ""}`} />
                {isFeatured ? "Featured" : "Set Featured"}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {loading ? (
          <div className="text-white/40 text-sm">Loading images...</div>
        ) : images.length === 0 ? (
          <div className="text-center">
            <p className="text-white/40 text-sm mb-2">No images for this product</p>
            <button
              onClick={onBack}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <img
              key={currentImage.id}
              src={currentImage.file_url}
              alt={currentImage.alt_text || currentImage.file_name}
              className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-300"
              style={{ imageRendering: "-webkit-optimize-contrast" }}
              onLoad={() => logger.debug("✅ Image loaded successfully")}
              onError={(e) => logger.error("❌ Image failed to load:", e)}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 p-2.5 bg-black/30 backdrop-blur-sm text-white/80 rounded-full hover:bg-black/50 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 p-2.5 bg-black/30 backdrop-blur-sm text-white/80 rounded-full hover:bg-black/50 hover:text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom: Thumbnails & Counter */}
      {!loading && images.length > 0 && (
        <div className="flex-shrink-0 border-t border-white/10">
          {/* Counter */}
          <div className="px-6 py-2 text-center text-xs text-white/40">
            {currentIndex + 1} of {images.length}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="px-6 pb-4 overflow-x-auto">
              <div className="flex gap-2 justify-center">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                      index === currentIndex
                        ? "ring-2 ring-white scale-110"
                        : "opacity-40 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img
                      src={image.file_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
