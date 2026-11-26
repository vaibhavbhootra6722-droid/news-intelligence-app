// /api/sync — optional Google sign-in + preference sync (free: Google Identity Services + Netlify Blobs).
// Needs one env var in Netlify: GOOGLE_CLIENT_ID. Without it the app shows no sign-in button.
import { getStore } from "@netlify/blobs";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const KEYS = /^news:(saved|follow|followev|profile|mode|obl|watch|times|tz|away|onboard)$/;
export default async (req) => {
  const cid = (globalThis.Netlify && Netlify.env.get("GOOGLE_CLIENT_ID")) || process.env.GOOGLE_CLIENT_ID || "";
  const url = new URL(req.url);
  if (url.searchParams.get("config")) return J({ clientId: cid || null });
  if (!cid) return J({ error: "sign-in not configured" }, 503);
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!tok) return J({ error: "unauthorised" }, 401);
  let who;
  try { const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(tok)); who = await r.json(); if (!r.ok) throw 0; } catch (e) { return J({ error: "invalid token" }, 401); }
  if (who.aud !== cid || !who.sub || (who.email_verified !== "true" && who.email_verified !== true) || Number(who.exp) * 1000 < Date.now()) return J({ error: "invalid token" }, 401);
  const s = getStore("users");
  if (req.method === "GET") return J({ email: who.email, name: who.name || "", data: (await s.get("u" + who.sub, { type: "json" })) || {} });
  if (req.method === "PUT") {
    const raw = await req.text(); if (raw.length > 60000) return J({ error: "too large" }, 413);
    let b; try { b = JSON.parse(raw); } catch (e) { return J({ error: "bad json" }, 400); }
    const clean = {}; Object.keys(b || {}).forEach(k => { if (KEYS.test(k)) clean[k] = b[k]; });
    await s.setJSON("u" + who.sub, clean); return J({ ok: true });
  }
  if (req.method === "DELETE") { await s.delete("u" + who.sub); return J({ ok: true }); }
  return J({ error: "method" }, 405);
};
export const config = { path: "/api/sync" };
