/**
 * Auto-hide header on scroll
 * Shared hook for admin and vendor layouts
 * Fixes memory leak from event listener accumulation
 */

import { useState, useEffect } from "react";

export function useAutoHideHeader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;
    let lastScrollY = 0; // ✅ Internal ref - no state dependency

    const controlHeader = () => {
      const currentScrollY = window.scrollY;

      // Show header when at top
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      // Show when scrolling up
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        rafId = window.requestAnimationFrame(controlHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []); // ✅ Empty deps - listener created once, no memory leak

  return isVisible;
}
