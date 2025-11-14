/**
 * Force Fullscreen - Aggressively hide Safari UI bars
 *
 * Safari's address bar appears/disappears dynamically.
 * We need to force it to hide and stay hidden.
 */

(function() {
  'use strict';

  // Check if we're in PWA mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: fullscreen)').matches ||
                window.navigator.standalone === true;

  // Run on ALL pages (both regular web and PWA) to ensure consistency
  console.log('[Fullscreen] ' + (isPWA ? 'PWA mode' : 'Web mode') + ' - forcing minimal UI');

  // Force scroll to hide Safari UI immediately on load
  function hideAddressBar() {
    // Scroll down 1px to trigger Safari's "hide on scroll" behavior
    window.scrollTo(0, 1);

    // Then scroll back to top
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
  }

  // Hide immediately on load
  hideAddressBar();

  // Hide again after a short delay (for slow devices)
  setTimeout(hideAddressBar, 100);
  setTimeout(hideAddressBar, 500);

  // Monitor scroll events and maintain fullscreen
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);

    // If we're near the top, trigger hide behavior
    if (window.scrollY < 10) {
      scrollTimeout = setTimeout(() => {
        hideAddressBar();
      }, 150);
    }
  }, { passive: true });

  // Force fullscreen on page visibility change
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      setTimeout(hideAddressBar, 100);
    }
  });

  // Force fullscreen on page show (back/forward cache)
  window.addEventListener('pageshow', function(event) {
    setTimeout(hideAddressBar, 100);
  });

  // Force fullscreen on orientation change
  window.addEventListener('orientationchange', function() {
    setTimeout(hideAddressBar, 100);
  });

  // Set fixed viewport meta to prevent zooming/bouncing
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute('content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content'
    );
  }

  console.log('[Fullscreen] Fullscreen mode activated');
})();
