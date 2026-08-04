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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== SCHEDULE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => loadSchedule())
      .then(() => { armWaterTimer(); return fireIfDue(); }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  event.waitUntil(fireIfDue());
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
const SCHEDULE_CACHE = "nirogi-water-schedule-v1";
const SCHEDULE_KEY = "https://nirogi.local/water-schedule";
let waterSchedule = null; // { intervalMin, startHour, endHour, enabled, nextFireAt }
let waterTimer = null;

async function loadSchedule() {
  if (waterSchedule) return waterSchedule;
  try {
    const cache = await caches.open(SCHEDULE_CACHE);
    const res = await cache.match(SCHEDULE_KEY);
    if (res) waterSchedule = await res.json();
  } catch {
    /* ignore */
  }
  return waterSchedule;
}

async function saveSchedule(schedule) {
  waterSchedule = schedule;
  try {
    const cache = await caches.open(SCHEDULE_CACHE);
    if (schedule) {
      await cache.put(SCHEDULE_KEY, new Response(JSON.stringify(schedule)));
    } else {
      await cache.delete(SCHEDULE_KEY);
    }
  } catch {
    /* ignore */
  }
}

async function fireIfDue() {
  const schedule = await loadSchedule();
  if (!schedule || !schedule.enabled) return;
  const now = Date.now();
  const intervalMs = Math.max(5, schedule.intervalMin) * 60 * 1000;
  if (!schedule.nextFireAt) {
    schedule.nextFireAt = now + intervalMs;
    await saveSchedule(schedule);
    return;
  }
  if (now < schedule.nextFireAt) return;

  const hour = new Date().getHours();
  const { startHour = 7, endHour = 22 } = schedule;
  if (hour >= startHour && hour < endHour) {
    await self.registration.showNotification("Time for water \ud83d\udca7", {
      body: "A glass now keeps you on track for today's hydration goal.",
      icon: "/icons/nirogi-512.png",
      badge: "/icons/nirogi-512.png",
      tag: "nirogi-water",
      renotify: true,
      requireInteraction: false,
      actions: [{ action: "open-water-tracker", title: "Log water" }],
      data: { url: "/water-tracker" },
    });
  }
  // Re-arm for the next interval regardless, so a missed active-hours window doesn't stall future reminders.
  schedule.nextFireAt = now + intervalMs;
  await saveSchedule(schedule);
}

/** setTimeout inside a service worker is unreliable once the tab closes and the worker is
 * suspended, so we also re-check on every activate/fetch/push wake-up via fireIfDue(). The
 * timer is a best-effort nudge while the worker happens to be alive. */
function armWaterTimer() {
  if (waterTimer) clearTimeout(waterTimer);
  waterTimer = null;
  if (!waterSchedule || !waterSchedule.enabled) return;
  const ms = Math.max(5, waterSchedule.intervalMin) * 60 * 1000;
  waterTimer = setTimeout(async () => {
    await fireIfDue();
    armWaterTimer();
  }, Math.min(ms, 60 * 1000));
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "WATER_SCHEDULE") {
    event.waitUntil(
      (async () => {
        const existing = await loadSchedule();
        const next = { ...data.schedule, nextFireAt: existing && existing.enabled ? existing.nextFireAt : Date.now() + Math.max(5, data.schedule.intervalMin) * 60 * 1000 };
        await saveSchedule(next);
        armWaterTimer();
      })(),
    );
  }
  if (data.type === "WATER_STOP") {
    event.waitUntil(saveSchedule(null).then(() => armWaterTimer()));
  }
});

self.addEventListener("push", (event) => {
  event.waitUntil(fireIfDue());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.action === "open-water-tracker" ? "/water-tracker" : (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
