// /api/ask — free-tier Gemini, grounded ONLY on headlines the app sends. Needs env GEMINI_API_KEY (free from Google AI Studio).
// modes: "why" (cached per story) and "ask" (question over today's headlines). Daily cap protects the free quota.
import { getStore } from "@netlify/blobs";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const MODEL = "gemini-3.5-flash-lite", CAP = 1200;
const SYS = "You are a careful news analyst for Indian readers. Use ONLY the headlines provided. Never invent facts, numbers, names or dates. If the headlines do not support an answer, say so plainly. Be concise and plain-spoken. Do not give investment, tax or legal advice.";
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
async function gem(prompt) {
  const key = (globalThis.Netlify && Netlify.env.get("GEMINI_API_KEY")) || process.env.GEMINI_API_KEY;
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 9000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: "POST", signal: c.signal, headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 400 } }) });
    if (!r.ok) { let m = ""; try { m = ((await r.json()).error || {}).message || ""; } catch (e) {} console.log("gemini", r.status, m.slice(0, 200)); return { err: r.status + " " + m.slice(0, 160) }; } const j = await r.json(); return (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim() || null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}
export default async (req) => {
  const on = !!((globalThis.Netlify && Netlify.env.get("GEMINI_API_KEY")) || process.env.GEMINI_API_KEY);
  if (new URL(req.url).searchParams.get("config")) return J({ enabled: on });
  if (!on) return J({ error: "AI not configured" }, 503);
  if (req.method !== "POST") return J({ error: "method" }, 405);
  let b; try { const raw = await req.text(); if (raw.length > 12000) return J({ error: "too large" }, 413); b = JSON.parse(raw); } catch (e) { return J({ error: "bad json" }, 400); }
  const hl = (Array.isArray(b.headlines) ? b.headlines : []).map(x => String(x).slice(0, 220)).slice(0, 30);
  if (!hl.length || !["why","ask","brief","desk"].includes(b.mode)) return J({ error: "bad request" }, 400);
  const q = String(b.q || "").slice(0, 300);
  if (b.mode === "ask" && q.length < 3) return J({ error: "bad request" }, 400);
  let s = null; try { s = getStore("ai"); } catch (e) {}
  const ck = "w" + hash(b.mode + "|" + hl.join("|") + "|" + q.toLowerCase());
  try { const hit = s && await s.get(ck, { type: "json" }); if (hit && Date.now() - hit.t < 6 * 3600e3) return J({ text: hit.text, cached: true }); } catch (e) {}
  const day = new Date().toISOString().slice(0, 10);
  try { const n = (s && await s.get("n" + day, { type: "json" })) || 0; if (n >= CAP) return J({ error: "Daily free limit reached. Try again tomorrow." }, 429); s && await s.setJSON("n" + day, n + 1); } catch (e) {}
  const list = hl.map((x, i) => (i + 1) + ". " + x).join("\n");
  const prompt = b.mode === "brief"
    ? "Today's top headlines:\n" + list + "\n\nWrite 'The big picture today' as exactly 3 bullets starting with '- '. Each bullet is one plain sentence (max 22 words) that groups related headlines into a theme, ending with the headline numbers in brackets like [2][5]. Use only what the headlines state."
    : b.mode === "desk"
    ? "Regulatory / professional headline(s) from India:\n" + list + "\n\nFor a chartered accountant or banker, write: 'What it is:' one sentence using only the headline. 'Who may be affected:' one line, hedged if the headline does not say. 'Check:' one line naming what to verify in the original circular (previous vs revised requirement, effective date, applicability). Do not state any rule, number or date that is not in the headline."
    : b.mode === "why"
    ? "These headlines are reports of one story from different outlets:\n" + list + "\n\nWrite exactly two short parts. 'What happened:' one sentence using only what the headlines state. 'Why it matters:' one or two sentences on likely relevance to an Indian reader or to finance and compliance professionals, clearly worded as context, not fact. If the headlines are too thin, say 'Not enough in the headlines to say more.'"
    : "Today's headlines:\n" + list + "\n\nQuestion: " + q + "\n\nAnswer in at most 120 words using only these headlines. Cite headline numbers like [3]. If they do not answer it, say so.";
  const text = await gem(prompt);
  if (text && text.err) return J({ error: "AI error: " + text.err }, 502);
  if (!text) return J({ error: "The AI service is busy. Try again in a moment." }, 502);
  try { s && await s.setJSON(ck, { t: Date.now(), text }); } catch (e) {}
  return J({ text });
};
export const config = { path: "/api/ask" };
