// v2: fixes a critical bug where authenticated, frequently-redeployed pages
// (/dashboard, /quizzes) were precached at install time and served
// cache-first forever, causing hard failures after every redeploy and for
// any user whose first install happened while logged out. Bumping the cache
// name invalidates every previously installed service worker's cache.
const CACHE_NAME = "mdcat-xpert-cache-v2";

// Only precache truly static, unauthenticated, rarely-changing assets.
// NEVER precache app routes that render per-user or per-deploy content
// (e.g. /dashboard, /quizzes, /) — those must always be fetched fresh.
const ASSETS_TO_CACHE = ["/manifest.json"];

// Navigation (HTML document) requests must never be served cache-first:
// a stale cached document can reference JS chunk hashes that no longer
// exist after the next deploy, breaking the page entirely.
function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

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
  const { request } = event;

  if (!request.url.startsWith("http")) {
    return;
  }

  // Only handle GET requests and bypass api endpoints, Next internals, or sockets.
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/_next/") ||
    request.url.includes("ws://")
  ) {
    return;
  }

  // Network-first for HTML/navigation requests: always try the live page
  // first (so redeploys and auth state are always reflected), and only
  // fall back to a cached copy or an offline message if the network fails.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(
              "You're offline. Reconnect and refresh to keep studying.",
              { status: 503, headers: { "Content-Type": "text/plain" } }
            )
          );
        })
    );
    return;
  }

  // Cache-first for everything else (static assets: images, fonts, icons).
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => new Response("", { status: 504 }));
    })
  );
});
