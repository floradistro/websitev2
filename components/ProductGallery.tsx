"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductGalleryProps {
  images: Array<{ src: string; alt?: string }>;
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
        <p className="text-white/40">No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full aspect-square bg-white/5 rounded-lg overflow-hidden">
        <Image
          src={images[selectedIndex]?.src || ""}
          alt={images[selectedIndex]?.alt || productName}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square bg-white/5 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedIndex === index
                  ? "border-white"
                  : "border-transparent hover:border-white/40"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt || `${productName} ${index + 1}`}
                fill
                className="object-contain"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
