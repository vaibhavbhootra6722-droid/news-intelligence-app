// /api/push — Web Push subscribe/unsubscribe (free, no account needed). GET ?config=1 returns the public VAPID key (generated once, stored privately).
import { store, vapid, idOf } from "./_push.mjs";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export default async (req) => {
  let k; try { k = await vapid(); } catch (e) { return J({ error: "unavailable" }, 503); }
  if (new URL(req.url).searchParams.get("config")) return J({ key: k.publicKey });
  if (req.method !== "POST" && req.method !== "DELETE") return J({ error: "method" }, 405);
  let b; try { const raw = await req.text(); if (raw.length > 4000) return J({ error: "too large" }, 413); b = JSON.parse(raw); } catch (e) { return J({ error: "bad json" }, 400); }
  const ep = b && b.endpoint; if (typeof ep !== "string" || !/^https:\/\//.test(ep)) return J({ error: "bad subscription" }, 400);
  const s = store(); const subs = (await s.get("subs", { type: "json" })) || {};
  if (req.method === "DELETE") delete subs[idOf(ep)];
  else { if (!b.keys || !b.keys.p256dh || !b.keys.auth) return J({ error: "bad subscription" }, 400); if (Object.keys(subs).length >= 5000) return J({ error: "full" }, 503); subs[idOf(ep)] = { endpoint: ep, keys: { p256dh: b.keys.p256dh, auth: b.keys.auth } }; }
  await s.setJSON("subs", subs); return J({ ok: true });
};
export const config = { path: "/api/push" };
