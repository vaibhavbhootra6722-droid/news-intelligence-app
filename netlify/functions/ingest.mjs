// Scheduled ingestion (free): every 10 minutes re-fetches the feeds visitors recently used, so the next visitor gets a ready copy.
import { feed, hotUrls } from "./_feeds.mjs";
export default async () => {
  const urls = (await hotUrls()).slice(0, 40); let n = 0;
  for (let i = 0; i < urls.length; i += 6) { const r = await Promise.all(urls.slice(i, i + 6).map(u => feed(u, 0))); n += r.filter(x => x.ok && !x.stale).length; }
  console.log("ingest refreshed", n, "of", urls.length);
};
export const config = { schedule: "*/10 * * * *" };
