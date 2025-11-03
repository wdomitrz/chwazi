const CACHE = "chwazi-cache-v4";
const FILES = [
  "./",
  "./app.js",
  "./icon.svg",
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE) return caches.deletwaitUntile(cacheName);
      })
    )
  );
});
