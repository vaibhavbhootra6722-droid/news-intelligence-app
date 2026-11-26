// Shared by rss.mjs and ingest.mjs: allowlisted fetch + Netlify Blobs read-through cache (free tier).
import { getStore } from "@netlify/blobs";
export const ALLOW = ["news.google.com", "www.rbi.org.in", "www.sebi.gov.in", "pib.gov.in"];
export const FRESH_MS = 10 * 60e3;
const store = () => { try { return getStore("feeds"); } catch (e) { return null; } };
const key = (href) => { let h = 5381; for (let i = 0; i < href.length; i++) h = ((h << 5) + h + href.charCodeAt(i)) >>> 0; return "f" + h.toString(36); };
export async function live(href) {
  let u; try { u = new URL(href); } catch (e) { return null; }
  if (u.protocol !== "https:" || !ALLOW.includes(u.hostname)) return null;
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000);
    const r = await fetch(u.href, { headers: { "User-Agent": "Mozilla/5.0" }, signal: c.signal }); clearTimeout(t);
    const body = await r.text();
    return r.ok && body.length < 2000000 ? body : null;
  } catch (e) { return null; }
}
// Returns { url, ok, body, age } — serves a stored copy if fresh, else fetches live and stores it; falls back to a stale copy if live fails.
export async function feed(href, maxAge = FRESH_MS) {
  const s = store(); let hit = null;
  try { hit = s ? await s.get(key(href), { type: "json" }) : null; } catch (e) {}
  if (hit && Date.now() - hit.t < maxAge) return { url: href, ok: true, body: hit.body, age: Date.now() - hit.t };
  const body = await live(href);
  if (body) { try { s && await s.setJSON(key(href), { t: Date.now(), body }); } catch (e) {} return { url: href, ok: true, body, age: 0 }; }
  if (hit) return { url: href, ok: true, body: hit.body, age: Date.now() - hit.t, stale: true };
  return { url: href, ok: false };
}
export async function remember(urls) {
  const s = store(); if (!s) return;
  try { const cur = (await s.get("hot", { type: "json" })) || {}; const now = Date.now();
    urls.forEach(u => { if (ALLOW.includes(new URL(u).hostname)) cur[u] = now; });
    Object.keys(cur).filter(u => now - cur[u] > 36 * 3600e3).forEach(u => delete cur[u]);
    const ks = Object.keys(cur); if (ks.length > 60) ks.sort((a, b) => cur[a] - cur[b]).slice(0, ks.length - 60).forEach(u => delete cur[u]);
    await s.setJSON("hot", cur); } catch (e) {}
}
export async function hotUrls() { const s = store(); try { return Object.keys((s && await s.get("hot", { type: "json" })) || {}); } catch (e) { return []; } }
