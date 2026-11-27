// Builds out/markets.json — end-of-day closes for a few indices and the USD/INR rate from free keyless public endpoints.
// Nothing is invented: a series that fails is left out, and an empty file is written if every source fails.
import { mkdirSync, writeFileSync } from "node:fs";
const SERIES = [["^NSEI", "Nifty 50"], ["^BSESN", "Sensex"], ["^GSPC", "S&P 500"], ["^IXIC", "Nasdaq"], ["INR=X", "USD/INR"]];
const out = { generated: new Date().toISOString(), source: "Yahoo Finance public chart endpoint (end-of-day, unofficial)", series: {} };
async function one(sym) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`, { headers: { "user-agent": "Mozilla/5.0 (news-intelligence-bundle)" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(), res = j.chart && j.chart.result && j.chart.result[0];
  if (!res) throw new Error("no result");
  const ts = res.timestamp || [], cl = (res.indicators.quote[0] || {}).close || [];
  const pts = ts.map((t, i) => [t * 1000, cl[i]]).filter((p) => typeof p[1] === "number" && isFinite(p[1])).map((p) => [p[0], Math.round(p[1] * 100) / 100]);
  if (pts.length < 5) throw new Error("too few points");
  return pts;
}
for (const [sym, name] of SERIES) { try { out.series[sym] = { name, delay: "end-of-day", points: await one(sym) }; } catch (e) { console.error("markets", sym, e.message); } }
mkdirSync("out", { recursive: true }); writeFileSync("out/markets.json", JSON.stringify(out));
console.log("markets series:", Object.keys(out.series).join(",") || "none");
