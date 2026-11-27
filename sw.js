const C = "ni-shell-10", IMG = "ni-img-1", DATA = "ni-data-1";
self.addEventListener("push", e => { let d = {}; try { d = e.data.json(); } catch (x) {} e.waitUntil(self.registration.showNotification(d.title || "Daily News Intelligence", { body: d.body || "", icon: "icon.svg", badge: "icon.svg", data: { url: d.url || "/" } })); });
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(clients.matchAll({ type: "window" }).then(l => { for (const c of l) { if ("focus" in c) return c.focus(); } return clients.openWindow(e.notification.data && e.notification.data.url || "/"); })); });
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(["./", "icon.svg"]))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![C, IMG, DATA].includes(k)).map(k => caches.delete(k)))).then(() => clients.claim())));
// stale-while-revalidate: answer instantly from cache, refresh in the background
const swr = (req, name) => caches.open(name).then(c => c.match(req).then(hit => {
  const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}));
// network-first with a short timeout: fresh when the network is quick, instant from cache when it is not
const netFirst = (req, name, ms) => caches.open(name).then(c => c.match(req).then(hit => new Promise(res => {
  let done = false; const fin = r => { if (!done) { done = true; res(r); } };
  const t = setTimeout(() => hit && fin(hit), ms);
  fetch(req).then(r => { clearTimeout(t); if (r && r.ok) c.put(req, r.clone()); fin(r); }).catch(() => { clearTimeout(t); fin(hit || Response.error()); });
})));
// images: cache-first (they never change for a given URL), keep the newest ~250
const imgFirst = req => caches.open(IMG).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
  if (r && (r.ok || r.type === "opaque")) { c.put(req, r.clone()); c.keys().then(ks => { if (ks.length > 250) ks.slice(0, ks.length - 250).forEach(k => c.delete(k)); }); } return r; })));
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return; const u = new URL(r.url);
  if (/(^|\.)wikimedia\.org$/.test(u.hostname) && /\.(jpe?g|png|webp)/i.test(u.pathname)) return e.respondWith(imgFirst(r));
  if (u.hostname === "raw.githubusercontent.com" && /\/data\/(bundle|photos|events)\.json$/.test(u.pathname)) return e.respondWith(/bundle/.test(u.pathname) ? netFirst(r, DATA, 1500) : swr(r, DATA));
  if (u.origin !== location.origin || u.pathname.startsWith("/gnews/") || u.pathname.startsWith("/api/")) return;
  e.respondWith(netFirst(r, C, 1500).then(m => (m && m.type !== "error") ? m : caches.match("./")));
});
