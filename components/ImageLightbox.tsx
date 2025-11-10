"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  images: { src: string; alt: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  // Pinch zoom for mobile
  useEffect(() => {
    if (!isOpen || !imageRef.current) return;

    let lastDistance = 0;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        if (lastDistance > 0) {
          const delta = distance - lastDistance;
          const newZoom = Math.max(1, Math.min(3, zoom + delta * 0.01));
          setZoom(newZoom);
        }
        lastDistance = distance;
      }
    };

    const handleTouchEnd = () => {
      lastDistance = 0;
    };

    const element = imageRef.current;
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, zoom]);

  if (!isOpen || !mounted) return null;

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.5, 3));
  };

  const handleZoomOut = () => {
    if (zoom <= 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(Math.max(zoom - 0.5, 1));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const currentImage = images[currentIndex];

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-[10000] p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 text-white"
      >
        <X size={isMobile ? 20 : 24} strokeWidth={1.5} />
      </button>

      {/* Zoom Controls - Desktop Only */}
      {!isMobile && (
        <div className="absolute bottom-6 right-6 z-[10000] flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 text-white"
          >
            <ZoomOut size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 text-white"
          >
            <ZoomIn size={20} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[10000] px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs md:text-sm font-light">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main Image */}
      <div
        ref={imageRef}
        className="relative w-full h-full flex items-center justify-center p-4 md:p-16"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: zoom > 1 ? "none" : "auto" }}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 select-none ${
            zoom > 1 ? "cursor-grab active:cursor-grabbing" : isMobile ? "" : "cursor-zoom-in"
          }`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isMobile && zoom === 1) handleZoomIn();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (isMobile) {
              if (zoom === 1) {
                setZoom(2);
              } else {
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }
            }
          }}
          draggable={false}
        />
      </div>

      {/* Navigation Arrows - Desktop Only */}
      {!isMobile && images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(currentIndex - 1);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {currentIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(currentIndex + 1);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Thumbnail Strip - Desktop Only */}
      {!isMobile && images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className={`w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                idx === currentIndex
                  ? "ring-2 ring-white scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Mobile: Zoom Indicator */}
      {isMobile && zoom > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-light">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
