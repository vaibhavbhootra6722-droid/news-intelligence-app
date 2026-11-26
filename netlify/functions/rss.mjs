// Netlify Function (free tier): /api/rss  — one shared, CDN-cached fetch per feed set.
// Batch: /api/rss?url=<a>&url=<b>...   Single: /api/rss?u=<url>
const ALLOW = ["news.google.com", "www.rbi.org.in", "www.sebi.gov.in", "pib.gov.in"];
async function one(href) {
  let u; try { u = new URL(href); } catch (e) { return { url: href, ok: false }; }
  if (u.protocol !== "https:" || !ALLOW.includes(u.hostname)) return { url: href, ok: false };
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000);
    const r = await fetch(u.href, { headers: { "User-Agent": "Mozilla/5.0" }, signal: c.signal }); clearTimeout(t);
    const body = await r.text();
    return { url: href, ok: r.ok && body.length < 2000000, body };
  } catch (e) { return { url: href, ok: false }; }
}
export default async (req) => {
  const p = new URL(req.url).searchParams;
  const h = { "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=60", "Netlify-CDN-Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800, durable" };
  const single = p.get("u");
  if (single) {
    const r = await one(single);
    return r.ok ? new Response(r.body, { headers: { ...h, "Content-Type": "application/rss+xml; charset=utf-8" } }) : new Response("Upstream error", { status: 502 });
  }
  const urls = p.getAll("url").slice(0, 30);
  if (!urls.length) return new Response("Bad request", { status: 400 });
  const items = await Promise.all(urls.map(one));
  if (!items.some(i => i.ok)) return new Response("Upstream error", { status: 502 });
  return new Response(JSON.stringify({ items }), { headers: { ...h, "Content-Type": "application/json" } });
};
export const config = { path: "/api/rss" };
