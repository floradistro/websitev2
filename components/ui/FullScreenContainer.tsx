/**
 * FullScreenContainer - Standardized component for full-screen overlays/modals
 *
 * USE THIS COMPONENT to prevent the "flash then disappear" bug that occurs when:
 * - Using `fixed` or `absolute` positioning
 * - Wrapping positioned elements in containers with `overflow-hidden` or `h-full`
 * - Using Tailwind animate-in classes (which hide elements after animation)
 *
 * RULES:
 * 1. For full-screen overlays (modals), use mode="overlay" - renders with fixed positioning
 * 2. For in-place replacements (galleries), use mode="replace" - renders with absolute positioning
 * 3. NEVER wrap this component in a div with overflow-hidden
 * 4. ALWAYS ensure parent has position: relative if using mode="replace"
 * 5. DO NOT use Tailwind animate-in classes - use standard CSS transitions instead
 */

"use client";

import { ReactNode } from "react";

interface FullScreenContainerProps {
  children: ReactNode;
  /**
   * overlay: Fixed positioning for modals/popups that overlay everything
   * replace: Absolute positioning to replace content in parent container
   */
  mode: "overlay" | "replace";
  /**
   * Background styling
   */
  background?: string;
  /**
   * Z-index (only applies to overlay mode)
   */
  zIndex?: number;
  /**
   * Additional className (use sparingly - avoid positioning/overflow classes!)
   */
  className?: string;
  /**
   * Click handler for overlay backdrop (overlay mode only)
   */
  onBackdropClick?: () => void;
}

export function FullScreenContainer({
  children,
  mode,
  background = "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
  zIndex = 9999,
  className = "",
  onBackdropClick,
}: FullScreenContainerProps) {
  const baseClasses = "inset-0 flex flex-col";
  const positionClass = mode === "overlay" ? "fixed" : "absolute";
  const zIndexStyle = mode === "overlay" ? { zIndex } : undefined;

  return (
    <div
      className={`${positionClass} ${baseClasses} ${className}`}
      style={{
        background,
        ...zIndexStyle,
      }}
      onClick={mode === "overlay" ? onBackdropClick : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Example usage:
 *
 * // Modal overlay:
 * <FullScreenContainer mode="overlay" onBackdropClick={onClose}>
 *   <YourModalContent />
 * </FullScreenContainer>
 *
 * // In-place replacement (parent must have position: relative):
 * <div className="relative flex-1">
 *   {showGallery ? (
 *     <FullScreenContainer mode="replace">
 *       <YourGalleryContent />
 *     </FullScreenContainer>
 *   ) : (
 *     <YourGridContent />
 *   )}
 * </div>
 */
