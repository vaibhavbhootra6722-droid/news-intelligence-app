// Builds data/bundle.json: server-side fetch of the Google News feeds the app asks for today (IST window), same shape as /api/rss.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const tpl = readFileSync(new URL("./feeds.txt", import.meta.url), "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const ist = new Date(Date.now() + 5.5 * 3600e3), day = 864e5, f = (n) => new Date(ist.getTime() + n * day).toISOString().slice(0, 10);
const windows = [[-2, 1], [-1, 1]]; // app window: after = d-2, before = d+1 (also keep yesterday's key for late-night visitors)
const urls = []; for (const [a, b] of [[-2, 1]]) tpl.forEach(t => urls.push(t.replace("{A}", f(a)).replace("{B}", f(b))));
const prev = []; tpl.forEach(t => prev.push(t.replace("{A}", f(-3)).replace("{B}", f(0))));
const one = async (url) => { try { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) }); const body = await r.text(); return { url, ok: r.ok && body.includes("<item"), body: r.ok ? body : "" }; } catch (e) { return { url, ok: false, body: "" }; } };
const items = await Promise.all(urls.concat(prev).map(one));
const good = items.filter(i => i.ok); console.log("fetched", good.length, "/", items.length);
if (good.length < 5) { console.error("too few feeds, aborting"); process.exit(1); }
mkdirSync("out", { recursive: true });
writeFileSync("out/bundle.json", JSON.stringify({ t: Date.now(), items: good }));
