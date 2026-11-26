// /api/events — upcoming India festivals/holidays (Google public holiday calendar) + sports fixtures (TheSportsDB free tier). Cached 12h in Netlify Blobs.
import { getStore } from "@netlify/blobs";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600", "Netlify-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=43200" } });
const ICS = "https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics";
const LEAGUES = [["4460", "IPL"], ["4328", "Premier League"], ["4480", "Champions League"], ["4424", "MLB"], ["4387", "NBA"]];
const unf = (t) => t.replace(/\r?\n[ \t]/g, "");
const esc = (s) => s.replace(/\\,/g, ",").replace(/\\n/g, " ").replace(/\;/g, ";").trim();
export const parseIcs = (txt, from, to) => unf(txt).split("BEGIN:VEVENT").slice(1).map(b => { const d = (b.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/) || [])[1], t = (b.match(/\nSUMMARY:(.*)/) || [])[1]; if (!d || !t) return null;
  return { date: d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8), title: esc(t) }; }).filter(x => x && x.date >= from && x.date <= to).sort((a, b) => a.date.localeCompare(b.date));
async function get(u) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000); try { const r = await fetch(u, { signal: c.signal, headers: { "User-Agent": "Mozilla/5.0" } }); return r.ok ? await r.text() : null; } catch (e) { return null; } finally { clearTimeout(t); } }
export default async (req) => {
  if (new URL(req.url).searchParams.get("probe")) { const o = {}; for (const q of ["Indian Premier League", "English Premier League", "Indian Super League", "Pro Kabaddi"]) { const x = await get("https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=" + encodeURIComponent(q.split(" ")[0])); o[q] = x ? x.slice(0, 160) : null; } for (const id of ["4460", "4328", "4391"]) { const x = await get("https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=" + id); o["next" + id] = x ? x.slice(0, 200) : null; const y = await get("https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=" + id); o["past" + id] = y ? y.slice(0, 120) : null; } return J(o); }
  let s = null; try { s = getStore("events"); } catch (e) {}
  try { const hit = s && await s.get("v1", { type: "json" }); if (hit && Date.now() - hit.t < 12 * 3600e3) return J(hit.data); } catch (e) {}
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10), to = new Date(Date.now() + 5.5 * 3600e3 + 120 * 864e5).toISOString().slice(0, 10);
  const ics = await get(ICS); const holidays = ics ? parseIcs(ics, today, to).slice(0, 30) : [];
  const sports = []; await Promise.all(LEAGUES.map(async ([id, name]) => { const x = await get("https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=" + id); if (!x) return; try { (JSON.parse(x).events || []).slice(0, 6).forEach(e => { if (e.dateEvent >= today) sports.push({ league: name, date: e.dateEvent, time: e.strTime || "", title: e.strEvent }); }); } catch (e) {} }));
  sports.sort((a, b) => a.date.localeCompare(b.date));
  const data = { holidays, sports: sports.slice(0, 20), at: Date.now(), sources: { holidays: "Google Calendar — Holidays in India", sports: "TheSportsDB" } };
  if (holidays.length || sports.length) { try { s && await s.setJSON("v1", { t: Date.now(), data }); } catch (e) {} }
  return J(data);
};
export const config = { path: "/api/events" };
