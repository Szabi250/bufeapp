// BüféApp offline gyorsítótár: csak az app saját fájljait tárolja, az adatbázist soha.
const CACHE = 'bufeapp-202609251151';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Telefonos értesítés: a szerver küldi, itt jelenítjük meg
self.addEventListener('push', e => {
  let d = { cim: 'BüféApp', szoveg: '' };
  try { d = Object.assign(d, e.data ? e.data.json() : {}); } catch (x) { if (e.data) d.szoveg = e.data.text(); }
  e.waitUntil(self.registration.showNotification(d.cim || 'BüféApp', {
    body: d.szoveg || '', icon: './icon-192.png', badge: './icon-192.png',
    tag: d.tipus || 'bufeapp', renotify: true, lang: 'hu',
    data: { url: './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    for (const c of list){ if (c.url.includes(self.registration.scope) && 'focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // adatbázis-hívások: mindig élőben
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
