// Scheduled every 10 min: new RBI / SEBI official releases → push to subscribers. First run only records what exists (no blast).
import { store, vapid, webpush } from "./_push.mjs";
import { live } from "./_feeds.mjs";
const FEEDS = [["RBI", "https://www.rbi.org.in/pressreleases_rss.xml"], ["SEBI", "https://www.sebi.gov.in/sebirss.xml"]];
const dec = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
export const parse = (xml) => [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].slice(0, 15).map(m => { const t = (m[0].match(/<title>([\s\S]*?)<\/title>/i) || [])[1], l = (m[0].match(/<link>([\s\S]*?)<\/link>/i) || [])[1]; return t && l ? { title: dec(t).slice(0, 160), link: dec(l) } : null; }).filter(Boolean);
export default async () => {
  const s = store(); await vapid();
  const seenAll = await s.get("seen", { type: "json" }); const first = !seenAll; const seen = new Set(seenAll || []); const fresh = [];
  for (const [src, u] of FEEDS) { const x = await live(u); if (!x) continue; parse(x).forEach(it => { if (!seen.has(it.link)) { seen.add(it.link); fresh.push({ ...it, src }); } }); }
  await s.setJSON("seen", [...seen].slice(-400));
  if (first || !fresh.length) { console.log("alerts", first ? "baseline" : "none"); return; }
  const subs = (await s.get("subs", { type: "json" })) || {}; const ids = Object.keys(subs); if (!ids.length) return;
  const send = fresh.slice(0, 3); let dead = 0;
  for (const it of send) { const payload = JSON.stringify({ title: it.src + " · new release", body: it.title, url: "/" });
    await Promise.all(ids.map(async id => { if (!subs[id]) return; try { await webpush.sendNotification(subs[id], payload, { TTL: 3600 }); } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { delete subs[id]; dead++; } } })); }
  if (dead) await s.setJSON("subs", subs); console.log("alerts sent", send.length, "to", ids.length);
};
export const config = { schedule: "*/10 * * * *" };
