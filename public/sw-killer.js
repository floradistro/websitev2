// Kill service workers and disable all caching in development
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Disable browser cache in development
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  // Clear all caches
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // Add no-cache meta tags dynamically
  const meta = document.createElement("meta");
  meta.httpEquiv = "Cache-Control";
  meta.content = "no-cache, no-store, must-revalidate";
  document.head.appendChild(meta);

  const meta2 = document.createElement("meta");
  meta2.httpEquiv = "Pragma";
  meta2.content = "no-cache";
  document.head.appendChild(meta2);

  const meta3 = document.createElement("meta");
  meta3.httpEquiv = "Expires";
  meta3.content = "0";
  document.head.appendChild(meta3);
}
