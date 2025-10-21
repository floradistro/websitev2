"use client";

import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import { ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  images: any[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const formattedImages = images?.map((img: any) => ({
    src: img.src,
    alt: productName,
  })) || [];

  return (
    <>
      <div className="space-y-3 lg:p-0">
        {/* Main Image */}
        <div className="relative group">
          <div
            className="aspect-[4/5] bg-black overflow-hidden animate-fadeIn cursor-zoom-in"
            onClick={() => openLightbox(mainImageIndex)}
          >
            {images?.[mainImageIndex] ? (
              <img
                src={images[mainImageIndex].src}
                alt={productName}
                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <img
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  className="w-1/2 h-1/2 object-contain opacity-10"
                />
              </div>
            )}
            
            {/* Zoom indicator */}
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomIn size={16} strokeWidth={1.5} />
            </div>

            {/* Image counter */}
            {images?.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 text-xs uppercase tracking-wider border border-white/10">
                {mainImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images?.length > 1 && (
          <div className="grid grid-cols-4 gap-px lg:px-0">
            {images.map((image: any, idx: number) => (
              <div
                key={idx}
                className={`aspect-[4/5] bg-black overflow-hidden cursor-pointer transition-all duration-300 border ${
                  mainImageIndex === idx
                    ? "border-white/40"
                    : "border-white/10 hover:border-white/30"
                }`}
                onClick={() => setMainImageIndex(idx)}
              >
                <img
                  src={image.src}
                  alt={productName}
                  className="w-full h-full object-contain transition-transform duration-500 hover:scale-110"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {formattedImages.length > 0 && (
        <ImageLightbox
          images={formattedImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

