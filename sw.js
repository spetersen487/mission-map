// Family site service worker. Its only job is photo alerts: the Mission
// Tracker Mac sends an encrypted web-push message, this shows it as a normal
// system notification, and tapping it opens the site's photo gallery.
// Nothing is cached here, so the site always loads fresh.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Mission Tracker', {
    body: d.body || '',
    tag: d.tag || 'mission-tracker',
    renotify: true,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    requireInteraction: true,   // stays on screen until dismissed where the browser allows it
    data: { url: d.url || '' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || '', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) {
        await w.focus();
        w.postMessage({ type: 'open-photos' });
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
