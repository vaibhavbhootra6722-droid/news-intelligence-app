// Builds out/events.json — scheduled public events on the canonical schema. Nothing is invented: a field a source does not give stays null.
// Sources: Ticketmaster Discovery API (only when the TICKETMASTER_KEY secret exists), Nager.Date public holidays (date-only observances, no key).
import { mkdirSync, writeFileSync } from "node:fs";
const KEY = process.env.TICKETMASTER_KEY || "", NOW = new Date(), iso = (d) => d.toISOString().replace(/\.\d+Z$/, "Z");
const horizon = new Date(NOW.getTime() + 120 * 864e5), from = new Date(NOW.getTime() - 864e5);
const out = [], coverage = { sources: [], countries: [], note: "" };
const get = async (u, ms = 20000) => { const r = await fetch(u, { headers: { "User-Agent": "NewsIntelligenceApp/1.0" }, signal: AbortSignal.timeout(ms) }); if (!r.ok) throw new Error(r.status + " " + u.slice(0, 80)); return r.json(); };
const CAT = { Music: "concert", Sports: "sports", "Arts & Theatre": "performance", Film: "performance", Miscellaneous: "community" };
const STATUS = { onsale: "scheduled", offsale: "scheduled", cancelled: "canceled", canceled: "canceled", postponed: "postponed", rescheduled: "rescheduled" };

async function ticketmaster() {
  if (!KEY) { coverage.note += "Ticketmaster is not connected (no TICKETMASTER_KEY), so concerts, tours and ticketed sports are not listed. "; return; }
  const countries = ["IN", "US", "GB", "CA", "AU", "AE", "SG", "DE", "FR", "ES", "IE", "NZ", "MX", "BR", "ZA"], got = new Set();
  for (const cc of countries) {
    let n = 0;
    for (let page = 0; page < 5; page++) {
      try {
        const u = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${KEY}&countryCode=${cc}&size=100&page=${page}&sort=date,asc&startDateTime=${iso(from).replace(/\.\d+/, "")}&endDateTime=${iso(horizon)}`;
        const j = await get(u); const ev = j._embedded?.events || []; if (!ev.length) break;
        for (const e of ev) {
          const v = e._embedded?.venues?.[0] || {}, a = e._embedded?.attractions || [], s = e.dates?.start || {}, st = (e.dates?.status?.code || "").toLowerCase();
          const cls = e.classifications?.[0]?.segment?.name, tz = e.dates?.timezone || v.timezone || null;
          const precise = !!s.dateTime && !s.noSpecificTime && !s.timeTBA, dateOnly = !!s.localDate && !precise;
          out.push({ id: "tm:" + e.id, name: e.name, category: CAT[cls] || "other", performer: a[0]?.name || null, series: a.length === 1 && /tour/i.test(e.name) ? e.name.replace(/\s*[-–|:].*$/, "") : null,
            organizer: e.promoter?.name || null, venue: v.name || null, city: v.city?.name || null, country: v.country?.countryCode || cc, tz,
            start: s.dateTime || null, localDate: s.localDate || null, localTime: s.localTime || null, doors: e.doorsTimes?.localTime || null, end: e.dates?.end?.dateTime || null,
            precision: precise ? "time" : dateOnly ? "date" : "unknown", status: s.dateTBD || s.dateTBA ? "date_tbd" : (STATUS[st] || "scheduled"),
            lat: v.location?.latitude ? +v.location.latitude : null, lon: v.location?.longitude ? +v.location.longitude : null,
            url: e.url || null, verified: true, provenance: "Ticketmaster Discovery API", checked: iso(NOW), image: e.images?.find(i => i.ratio === "16_9" && i.width >= 640)?.url || null, imageCredit: "Ticketmaster" });
          n++;
        }
        if (page + 1 >= (j.page?.totalPages || 1)) break;
      } catch (err) { console.error("tm", cc, err.message); break; }
    }
    if (n) got.add(cc);
  }
  if (got.size) { coverage.sources.push("Ticketmaster Discovery API"); got.forEach(c => coverage.countries.push(c)); }
}
async function holidays() {
  const yrs = [...new Set([NOW.getUTCFullYear(), horizon.getUTCFullYear()])], ccs = ["IN", "US", "GB", "AU", "CA", "SG", "AE"], ok = new Set();
  for (const cc of ccs) for (const y of yrs) {
    try { const j = await get(`https://date.nager.at/api/v3/PublicHolidays/${y}/${cc}`);
      for (const h of j) { const d = new Date(h.date + "T00:00:00Z"); if (d < from || d > horizon) continue;
        out.push({ id: `nager:${cc}:${h.date}:${(h.name || "").toLowerCase().replace(/\W+/g, "-")}`, name: h.localName && h.localName !== h.name ? `${h.name} (${h.localName})` : h.name, category: "festival", performer: null, series: null, organizer: null, venue: null, city: null, country: cc, tz: null,
          start: null, localDate: h.date, localTime: null, doors: null, end: null, precision: "date", status: "scheduled", lat: null, lon: null, url: null, verified: true, provenance: "Nager.Date public holidays (observance, date only)", checked: iso(NOW), image: null }); ok.add(cc); }
    } catch (err) { console.error("nager", cc, y, err.message); }
  }
  if (ok.size) { coverage.sources.push("Nager.Date public holidays"); coverage.note += "Holidays and festivals are national observances with a date only; regional festival dates can differ. "; }
}
await Promise.all([ticketmaster(), holidays()]);
// de-duplicate: same performer + venue + local date from different sources keeps the first (Ticketmaster before holidays)
const seen = new Set(), events = out.filter(e => { const k = [e.performer || e.name, e.venue || e.country, e.localDate || e.start?.slice(0, 10)].join("|").toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
  .sort((a, b) => (a.start || a.localDate || "").localeCompare(b.start || b.localDate || ""));
console.log("events", events.length, "sources", coverage.sources.join(", ") || "none");
if (!events.length) { console.error("no events; leaving previous file"); process.exit(1); }
mkdirSync("out", { recursive: true });
writeFileSync("out/events.json", JSON.stringify({ schema: 1, generated: iso(NOW), horizonDays: 120, coverage, events }));
