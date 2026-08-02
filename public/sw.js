/* Nirogi service worker — network-first with offline fallback.
 * Intentionally conservative: never caches server-function (POST) requests or
 * API routes so live data and auth always stay fresh. */
const CACHE = "nirogi-static-v3";
const OFFLINE_URL = "/";
const PRECACHE = ["/", "/icons/nirogi-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept server functions / API / auth callbacks.
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api") || url.pathname.includes("/auth")) {
    return;
  }

  // Navigations: network-first, fall back to cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});

/* ---------------------------------------------------------------------------
 * Water reminders. The page posts a schedule and the service worker fires
 * notifications on its own timer, so reminders keep coming with the tab closed.
 * ------------------------------------------------------------------------- */
let waterSchedule = null; // { intervalMin, startHour, endHour, enabled }
let waterTimer = null;

function armWaterTimer() {
  if (waterTimer) clearTimeout(waterTimer);
  waterTimer = null;
  if (!waterSchedule || !waterSchedule.enabled) return;
  const ms = Math.max(5, waterSchedule.intervalMin) * 60 * 1000;
  waterTimer = setTimeout(async () => {
    const hour = new Date().getHours();
    const { startHour = 7, endHour = 22 } = waterSchedule;
    if (hour >= startHour && hour < endHour) {
      await self.registration.showNotification("Time for water 💧", {
        body: "A glass now keeps you on track for today's hydration goal.",
        icon: "/icons/nirogi-512.png",
        badge: "/icons/nirogi-512.png",
        tag: "nirogi-water",
        renotify: true,
        data: { url: "/water-tracker" },
      });
    }
    armWaterTimer();
  }, ms);
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "WATER_SCHEDULE") {
    waterSchedule = data.schedule;
    armWaterTimer();
  }
  if (data.type === "WATER_STOP") {
    waterSchedule = null;
    armWaterTimer();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
