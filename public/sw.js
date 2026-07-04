const CACHE_VERSION = "estatedesk-pwa-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_FALLBACKS = ["/offline", "/offline-shell.html"];

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
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("estatedesk-pwa-") && cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
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
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline-shell.html"
  ) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data?.json?.() ?? {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === "string" ? payload.title : "EstateDesk";
  const body =
    typeof payload.body === "string"
      ? payload.body
      : "You have a new EstateDesk notification.";
  const url = typeof payload.url === "string" ? payload.url : "/dashboard";
  const tag = typeof payload.tag === "string" ? payload.tag : undefined;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
      actions: [{ action: "open", title: "Open" }],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action && event.action !== "open") {
    return;
  }

  const targetUrl = new URL(
    event.notification.data?.url || "/dashboard",
    self.location.origin,
  ).href;

  event.waitUntil(openOrFocusClient(targetUrl));
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

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }

  return response;
}

async function openOrFocusClient(targetUrl) {
  const clientList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clientList) {
    if (!client.url.startsWith(self.location.origin) || !("focus" in client)) {
      continue;
    }

    await client.focus();

    if ("navigate" in client) {
      return client.navigate(targetUrl);
    }
  }

  if (self.clients.openWindow) {
    return self.clients.openWindow(targetUrl);
  }

  return undefined;
}