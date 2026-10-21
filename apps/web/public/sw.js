const CACHE_VERSION = "estatedesk-pwa-v0.2.4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_FALLBACKS = ["/offline", "/offline-shell.html"];
const CARETAKER_OFFLINE_SYNC_TAG = "caretaker-offline-queue-sync";

const PRECACHE_URLS = [
  ...OFFLINE_FALLBACKS,
  "/manifest.webmanifest",
  "/icons/icon-144.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => precacheUrls(cache, PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({
      type: "VERSION",
      version: CACHE_VERSION.replace("estatedesk-pwa-v", ""),
    });
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Existing tabs can still request the previous build's hashed chunks.
        const retained = cacheNames
          .filter(name => name.startsWith("estatedesk-pwa-") && name.endsWith("-static") && name !== STATIC_CACHE)
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
          .slice(0, 2);
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("estatedesk-pwa-") && cacheName !== STATIC_CACHE && !retained.includes(cacheName))
            .map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => matchOfflineFallback()),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/")
  ) {
    // Build hashes change whenever code changes, so cached bundles stay valid.
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline-shell.html"
  ) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

/**
 * Background Sync: flush caretaker meter/issue queue when connectivity returns
 * (basement readings, offline inspections). Clients handle the actual POST.
 */
self.addEventListener("sync", (event) => {
  if (event.tag !== CARETAKER_OFFLINE_SYNC_TAG) {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) =>
        Promise.allSettled(
          clientList.map((client) =>
            client.postMessage({
              type: "SYNC_CARETAKER_OFFLINE_QUEUE",
              tag: CARETAKER_OFFLINE_SYNC_TAG,
            }),
          ),
        ),
      ),
  );
});

async function precacheUrls(cache, urls) {
  await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: "reload" });

      if (response.ok) {
        await cache.put(url, response);
      }
    }),
  );
}

async function matchOfflineFallback() {
  for (const url of OFFLINE_FALLBACKS) {
    const cachedResponse = await caches.match(url);

    if (cachedResponse) {
      return cachedResponse;
    }
  }

  return new Response("You are offline.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && !response.redirected && !/no-store|private/i.test(response.headers.get("Cache-Control") || "")) {
    try {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
    } catch {
      // Storage quota or browser policy must not prevent asset delivery.
    }
  }
  return response;
}

async function cacheFirst(request) {
  return (await caches.match(request)) || fetchAndCache(request);
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetchAndCache(request);
  event.waitUntil(refresh.then(() => undefined).catch(() => undefined));
  return cached || refresh;
}
