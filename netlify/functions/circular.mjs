// /api/circular?u=<RBI or SEBI official page> — reads the page text and extracts a structured, text-only summary with free Gemini. Cached 24h.
import { getStore } from "@netlify/blobs";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const ALLOW = ["www.rbi.org.in", "rbi.org.in", "www.sebi.gov.in", "pib.gov.in"];
const MODEL = "gemini-3.5-flash-lite";
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
export default async (req) => {
  const key = (globalThis.Netlify && Netlify.env.get("GEMINI_API_KEY")) || process.env.GEMINI_API_KEY; if (!key) return J({ error: "AI not configured" }, 503);
  let u; try { u = new URL(new URL(req.url).searchParams.get("u")); } catch (e) { return J({ error: "bad url" }, 400); }
  if (u.protocol !== "https:" || !ALLOW.includes(u.hostname)) return J({ error: "Only RBI, SEBI and PIB pages are supported." }, 400);
  let s = null; try { s = getStore("circ"); } catch (e) {} const ck = "c" + hash(u.href);
  try { const hit = s && await s.get(ck, { type: "json" }); if (hit && Date.now() - hit.t < 24 * 3600e3) return J({ ...hit.v, cached: true }); } catch (e) {}
  let html; try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 7000); const r = await fetch(u.href, { headers: { "User-Agent": "Mozilla/5.0" }, signal: c.signal }); clearTimeout(t); if (!r.ok) throw 0; html = await r.text(); } catch (e) { return J({ error: "Could not open the official page." }, 502); }
  const txt = strip(html).slice(0, 9000); if (txt.length < 200) return J({ error: "The page has too little text to read (it may be a PDF or need a login)." }, 422);
  const prompt = "Official regulatory page text (India):\n\"\"\"\n" + txt + "\n\"\"\"\n\nExtract ONLY what the text states. Reply as strict JSON with string fields: title, issued_by, reference, date_issued, applies_to, what_changed, previous_requirement, revised_requirement, effective_date, action_required. Use exactly \"Not stated in the text\" for anything the text does not state. Never infer or add outside knowledge. Keep each field under 45 words.";
  let out; try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 12000);
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: "POST", signal: c.signal, headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 700, responseMimeType: "application/json" } }) }); clearTimeout(t);
    if (!r.ok) throw 0; const j = await r.json(); out = JSON.parse((j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("")); } catch (e) { return J({ error: "The AI service is busy. Try again in a moment." }, 502); }
  const F = ["title", "issued_by", "reference", "date_issued", "applies_to", "what_changed", "previous_requirement", "revised_requirement", "effective_date", "action_required"]; const v = {}; F.forEach(k => { v[k] = String(out[k] || "Not stated in the text").slice(0, 400); });
  try { s && await s.setJSON(ck, { t: Date.now(), v }); } catch (e) {} return J(v);
};
export const config = { path: "/api/circular" };
