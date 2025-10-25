"use client";

import { useState } from "react";
import ImageLightbox from "../ImageLightbox";
import { ZoomIn } from "lucide-react";

interface ConfigurableProductGalleryProps {
  images: any[];
  productName: string;
  config?: {
    gallery_aspect?: string;
    gallery_bg?: string;
    gallery_fit?: string;
    gallery_radius?: string;
    gallery_border_width?: string;
    gallery_border_color?: string;
    gallery_padding?: string;
    gallery_zoom?: boolean;
    gallery_thumbnails?: boolean;
    gallery_columns?: number;
    thumbnail_gap?: string;
    thumbnail_border_width?: string;
    thumbnail_border_color?: string;
    thumbnail_active_color?: string;
  };
}

export default function ConfigurableProductGallery({
  images,
  productName,
  config = {}
}: ConfigurableProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    if (config.gallery_zoom !== false) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const formattedImages = images?.map((img: any) => ({
    src: img.src,
    alt: productName,
  })) || [];

  // Apply config settings - Main Gallery
  const aspectClass = config.gallery_aspect === 'square' ? 'aspect-square' :
                      config.gallery_aspect === 'landscape' ? 'aspect-[16/9]' :
                      'aspect-[4/5]'; // default portrait
  
  const fitClass = config.gallery_fit === 'cover' ? 'object-cover' :
                   config.gallery_fit === 'fill' ? 'object-fill' :
                   'object-contain';
  
  const galleryRadius = config.gallery_radius || 'none';
  const galleryRadiusClass = galleryRadius === 'none' ? 'rounded-none' :
                             galleryRadius === 'sm' ? 'rounded' :
                             galleryRadius === 'md' ? 'rounded-lg' :
                             galleryRadius === 'lg' ? 'rounded-xl' :
                             'rounded-2xl';
  
  const galleryBorderWidth = config.gallery_border_width || '0';
  const galleryBorderClass = galleryBorderWidth === '0' ? '' :
                             galleryBorderWidth === '1' ? 'border' :
                             galleryBorderWidth === '2' ? 'border-2' :
                             galleryBorderWidth === '4' ? 'border-4' :
                             'border-8';
  
  const galleryPadding = config.gallery_padding || 'none';
  const galleryPaddingClass = galleryPadding === 'none' ? '' :
                              galleryPadding === 'sm' ? 'p-1' :
                              galleryPadding === 'md' ? 'p-2' :
                              galleryPadding === 'lg' ? 'p-3' :
                              'p-4';
  
  const thumbColumns = config.gallery_columns || 4;
  const thumbColClass = thumbColumns === 3 ? 'grid-cols-3' :
                        thumbColumns === 5 ? 'grid-cols-5' :
                        thumbColumns === 6 ? 'grid-cols-6' :
                        'grid-cols-4';
  
  const thumbGap = config.thumbnail_gap || 'sm';
  const thumbGapClass = thumbGap === 'none' ? 'gap-0' :
                        thumbGap === 'sm' ? 'gap-px' :
                        thumbGap === 'md' ? 'gap-0.5' :
                        'gap-1';
  
  const thumbBorder = config.thumbnail_border_width || '1';
  const thumbBorderClass = thumbBorder === '0' ? 'border-0' :
                           thumbBorder === '1' ? 'border' :
                           thumbBorder === '2' ? 'border-2' :
                           'border-4';
  
  const galleryBg = config.gallery_bg || '#000000';
  const thumbBorderColor = config.thumbnail_border_color || '#ffffff';
  const thumbActiveColor = config.thumbnail_active_color || '#ffffff';

  return (
    <>
      <div className="space-y-3 lg:p-0">
        {/* Main Image */}
        <div className="relative group">
          <div
            className={`${aspectClass} overflow-hidden animate-fadeIn ${config.gallery_zoom !== false ? 'cursor-zoom-in' : ''} ${galleryRadiusClass} ${galleryBorderClass} ${galleryPaddingClass}`}
            onClick={() => openLightbox(mainImageIndex)}
            style={{ 
              backgroundColor: galleryBg,
              borderColor: config.gallery_border_color || '#ffffff'
            }}
          >
            {images?.[mainImageIndex] ? (
              <img
                src={images[mainImageIndex].src}
                alt={productName}
                className={`w-full h-full ${fitClass} transition-all duration-700 group-hover:scale-105`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  className="w-1/2 h-1/2 object-contain opacity-10"
                />
              </div>
            )}
            
            {/* Zoom indicator */}
            {config.gallery_zoom !== false && (
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn size={16} strokeWidth={1.5} />
              </div>
            )}

            {/* Image counter */}
            {images?.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 text-xs uppercase tracking-wider border border-white/10">
                {mainImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {config.gallery_thumbnails !== false && images?.length > 1 && (
          <div className={`grid ${thumbColClass} ${thumbGapClass} lg:px-0`}>
            {images.map((image: any, idx: number) => (
              <div
                key={idx}
                className={`${aspectClass} overflow-hidden cursor-pointer transition-all duration-300 ${thumbBorderClass}`}
                style={{
                  backgroundColor: galleryBg,
                  borderColor: mainImageIndex === idx 
                    ? thumbActiveColor
                    : `${thumbBorderColor}1A` // 10% opacity
                }}
                onClick={() => setMainImageIndex(idx)}
              >
                <img
                  src={image.src}
                  alt={productName}
                  className={`w-full h-full ${fitClass} transition-transform duration-500 hover:scale-110`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {config.gallery_zoom !== false && formattedImages.length > 0 && (
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

