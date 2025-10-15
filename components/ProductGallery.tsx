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
      <div className="space-y-3 md:space-y-4 lg:p-8">
        {/* Main Image - Enhanced */}
        <div className="relative group">
          <div
            className="aspect-[4/5] bg-[#9a9a97] overflow-hidden shadow-elevated animate-fadeIn cursor-zoom-in group -mx-3 md:mx-0 lg:rounded-sm"
            onClick={() => openLightbox(mainImageIndex)}
          >
            {images?.[mainImageIndex] ? (
              <img
                src={images[mainImageIndex].src}
                alt={productName}
                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-[#9a9a97] flex items-center justify-center">
                <img
                  src="/logoprint.png"
                  alt="Flora Distro"
                  className="w-1/2 h-1/2 object-contain opacity-20"
                />
              </div>
            )}
            
            {/* Zoom indicator */}
            <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomIn size={18} strokeWidth={1.5} />
            </div>

            {/* Image counter */}
            {images?.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-light">
                {mainImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails - All images */}
        {images?.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2">
            {images.map((image: any, idx: number) => (
              <div
                key={idx}
                style={{ animationDelay: `${(idx + 1) * 50}ms` }}
                className={`aspect-[4/5] bg-[#9a9a97] overflow-hidden cursor-pointer transition-all duration-500 animate-fadeIn ${
                  mainImageIndex === idx
                    ? "ring-2 ring-black shadow-md scale-95"
                    : "hover:opacity-70 hover:shadow-md"
                }`}
                onClick={() => setMainImageIndex(idx)}
              >
                <img
                  src={image.src}
                  alt={productName}
                  className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
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

