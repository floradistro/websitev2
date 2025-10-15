"use client";

import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

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
      <div className="space-y-2 md:space-y-3">
        {/* Main Image */}
        <div
          className="aspect-[4/5] bg-[#9a9a97] md:rounded-2xl overflow-hidden shadow-sm animate-fadeIn cursor-zoom-in group -mx-3 md:mx-0"
          onClick={() => openLightbox(0)}
        >
          {images?.[0] ? (
            <img
              src={images[0].src}
              alt={productName}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[#9a9a97]" />
          )}
        </div>

        {/* Thumbnails */}
        {images?.length > 1 && (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {images.slice(1, 4).map((image: any, idx: number) => (
              <div
                key={idx}
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                className="aspect-[4/5] bg-[#9a9a97] md:rounded-xl overflow-hidden cursor-zoom-in hover:opacity-80 hover:shadow-md transition-all duration-300 animate-fadeIn"
                onClick={() => openLightbox(idx + 1)}
              >
                <img
                  src={image.src}
                  alt={productName}
                  className="w-full h-full object-contain transition-transform duration-300 hover:scale-110"
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

