// Prebuilds licensed topic photos from Wikimedia Commons (same filters as the app) -> out/photos.json keyed by search query.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const Q = Object.values(JSON.parse(readFileSync(new URL("./photo-queries.json", import.meta.url), "utf8")));
const OK = /^(cc0|public domain|pd[- ]|cc[- ]by(?![- ]?(nc|nd))(?:[- ]sa)?)/i;
const BAD = /logo|flag|map of|\bmap\b|diagram|coat of arms|emblem|stamp|signature|poster|screenshot|banner|icon|chart|graph|seal of|wordmark|\.svg|\.gif|\.pdf|\.tif|\.ogg|\.webm/i;
const nrm = s => String(s || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const strip = s => String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
async function one(q) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=" + encodeURIComponent(q + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=900&iiextmetadatafilter=LicenseShortName|Artist|ImageDescription|ObjectName|Categories|DateTimeOriginal";
  try {
    const r = await fetch(u, { headers: { "User-Agent": "NewsIntelligenceApp/1.0 (github pages; contact via repo)" }, signal: AbortSignal.timeout(20000) });
    const j = await r.json(), pages = j.query?.pages ? Object.values(j.query.pages).sort((a, b) => (a.index || 0) - (b.index || 0)) : [];
    const need = nrm(q).split(" ").filter(w => w.length > 2), res = [];
    for (const p of pages) {
      const ii = p.imageinfo?.[0]; if (!ii || !/^image\/jpeg$/.test(ii.mime || "") || (ii.width || 0) < 640 || (ii.height || 0) < 360) continue;
      const md = ii.extmetadata || {}, lic = strip(md.LicenseShortName?.value);
      if (!OK.test(lic) || BAD.test(p.title || "")) continue;
      const hay = nrm((p.title || "") + " " + (md.ObjectName?.value || "") + " " + (md.ImageDescription?.value || "") + " " + (md.Categories?.value || ""));
      if (!need.every(w => hay.includes(w))) continue;
      res.push({ url: ii.thumburl || ii.url, w: ii.thumbwidth || 900, h: ii.thumbheight || 600, page: ii.descriptionshorturl || ii.descriptionurl, lic, by: strip(md.Artist?.value).slice(0, 60) || "Wikimedia Commons contributor", alt: strip(md.ObjectName?.value || (p.title || "").replace(/^File:/, "").replace(/\.[a-z]+$/i, "")).slice(0, 140), subject: q, hay });
      if (res.length >= 3) break;
    }
    return [q, res];
  } catch (e) { return [q, []]; }
}
const out = Object.fromEntries(await Promise.all(Q.map(one)));
const n = Object.values(out).filter(a => a.length).length; console.log("photo queries with results", n, "/", Q.length);
if (n < 5) process.exit(1);
mkdirSync("out", { recursive: true }); writeFileSync("out/photos.json", JSON.stringify(out));
