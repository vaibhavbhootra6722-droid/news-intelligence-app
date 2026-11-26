import { getStore } from "@netlify/blobs";
import * as webpush from "web-push";
export const store = () => getStore("push");
export async function vapid() {
  const s = store(); let k = await s.get("vapid", { type: "json" });
  if (!k) { k = webpush.generateVAPIDKeys(); await s.setJSON("vapid", k); }
  webpush.setVapidDetails("mailto:alerts@majestic-squirrel-651c73.netlify.app", k.publicKey, k.privateKey);
  return k;
}
export const idOf = (ep) => { let h = 5381; for (let i = 0; i < ep.length; i++) h = ((h << 5) + h + ep.charCodeAt(i)) >>> 0; return h.toString(36); };
export { webpush };
