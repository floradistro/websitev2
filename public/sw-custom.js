/**
 * Custom Service Worker Extension
 *
 * This file extends the auto-generated service worker to handle manual update triggers.
 * It listens for SKIP_WAITING messages from the client and immediately activates.
 */

// Listen for SKIP_WAITING messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message - activating immediately');
    self.skipWaiting();
  }
});

// Immediately take control of all clients when activated
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[SW] Claimed all clients');
    })
  );
});

// Log when new service worker is installing
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing');
  // Skip waiting immediately on install
  self.skipWaiting();
});

console.log('[SW] Custom service worker extension loaded');
