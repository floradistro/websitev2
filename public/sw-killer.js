// Kill any service workers in development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('🧹 Unregistered service worker');
    }
  });
}

// Clear all caches in development
if ('caches' in window) {
  caches.keys().then(names => {
    for (let name of names) {
      caches.delete(name);
      console.log('🧹 Deleted cache:', name);
    }
  });
}

