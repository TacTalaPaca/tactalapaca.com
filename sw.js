// Version: 1.0.1
// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE = 'pwabuilder-offline-page';
const BACKGROUND_SYNC_TAG = 'background-sync';
const PERIODIC_SYNC_TAG = 'periodic-content-sync';

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const offlineFallbackPage = '/offline.html';

self.addEventListener('message', (event) => {
  console.log('SW: Message received:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Skip waiting requested - activating new service worker');
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  console.log('SW: Install event triggered');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage)),
      self.registration.periodicSync
        ?.register(PERIODIC_SYNC_TAG, {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        })
        .catch(() => console.log('Periodic sync not supported')),
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activate event triggered');
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches if needed
    ])
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE,
  })
);

// Background Sync - Handle failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(doBackgroundSync());
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(doPeriodicSync());
  }
});

// Enhanced fetch handler with background sync
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;

          if (preloadResp) {
            return preloadResp;
          }

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          const cache = await caches.open(CACHE);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  } else if (event.request.method === 'POST') {
    // Handle POST requests with background sync
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Store failed request for background sync
        const cache = await caches.open('failed-requests');
        await cache.put(event.request.url + Date.now(), event.request.clone());

        // Register background sync - Fixed: removed navigator check
        try {
          await self.registration.sync.register(BACKGROUND_SYNC_TAG);
          return new Response('Request queued for sync', { status: 200 });
        } catch (error) {
          throw new Error('Network unavailable and sync not supported');
        }
      })
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  const cache = await caches.open('failed-requests');
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    } catch (error) {
      console.log('Background sync failed for:', request.url);
    }
  }
}

// Periodic sync function
async function doPeriodicSync() {
  try {
    // Update critical content
    const cache = await caches.open(CACHE);
    const criticalUrls = ['/', '/offline.html'];

    for (const url of criticalUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.log('Failed to update:', url);
      }
    }
  } catch (error) {
    console.log('Periodic sync failed:', error);
  }
}
