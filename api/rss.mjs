// /api/rss — batch: ?url=<a>&url=<b>...  single: ?u=<url>. Served from the stored copy kept fresh by ingest.mjs; falls back to a live fetch.
import { feed, remember } from "./_feeds.mjs";
const handler = async (req) => {
  const p = new URL(req.url).searchParams;
  const h = { "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=60", "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" };
  const single = p.get("u");
  if (single) {
    const r = await feed(single);
    return r.ok ? new Response(r.body, { headers: { ...h, "Content-Type": "application/rss+xml; charset=utf-8" } }) : new Response("Upstream error", { status: 502 });
  }
  const urls = p.getAll("url").slice(0, 30);
  if (!urls.length) return new Response("Bad request", { status: 400 });
  const items = await Promise.all(urls.map(u => feed(u)));
  if (!items.some(i => i.ok)) return new Response("Upstream error", { status: 502 });
  remember(urls.filter(u => { try { return !!new URL(u); } catch (e) { return false; } })).catch(() => {});
  return new Response(JSON.stringify({ items: items.map(({ url, ok, body }) => ({ url, ok, body })) }), { headers: { ...h, "Content-Type": "application/json" } });
};
export const GET = handler, POST = handler;
