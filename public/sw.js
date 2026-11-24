/* خدمة عمل بسيطة للنسخة المثبّتة على الشاشة الرئيسية (PWA): تسرّع الفتح وتتيح ما فُتح سابقًا بلا نت. */
const V = 'sn-v1';
const STATIC = /^\/(_next\/static|fonts|images|icons)\//;
const DATA = /^\/(quran|library|fiqh|hadith|sira|tafsir|ulum|adhkar|saadi|lugha|gharib|arkan)\/|^\/(qudsi|tuhfa)\.json$/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.add('/').catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then((res) => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put('/', cp)); }
        return res;
      }).catch(() => caches.match('/').then((m) => m || Response.error())),
    );
    return;
  }
  if (STATIC.test(u.pathname)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })));
    return;
  }
  if (DATA.test(u.pathname)) {
    e.respondWith(
      caches.open(V).then((c) =>
        c.match(r).then((m) => {
          const net = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => m);
          return m || net;
        }),
      ),
    );
  }
});
