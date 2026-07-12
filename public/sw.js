const CACHE_NAME = "mdcat-xpert-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/quizzes",
  "/manifest.json",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("PWA service worker: Caching static shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("PWA service worker: Clearing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Only cache GET requests and bypass api endpoints or hot reload streams
  if (
    event.request.method !== "GET" || 
    event.request.url.includes("/api/") || 
    event.request.url.includes("/_next/") || 
    event.request.url.includes("ws://")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Cache the newly fetched page/asset for future offline requests
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback when network is down
        return caches.match("/dashboard") || new Response("Offline mode active.");
      });
    })
  );
});
