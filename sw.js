// Keeps the page (and the downloaded sound) available without a signal.
// The page stores the sound itself in the cache "tpm-audio-v<VERSION>".
const PAGE_CACHE = "tpm-page";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(PAGE_CACHE).then(c => c.addAll(["./", "./index.html"])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // the sound: from the cache if it is there, otherwise from the network
  if (url.pathname.endsWith(".mp3")) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }
  // the page: network first (so updates arrive), cache when there is no signal
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(PAGE_CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return r;
      }).catch(() => caches.match("./index.html"))
    );
  }
});
