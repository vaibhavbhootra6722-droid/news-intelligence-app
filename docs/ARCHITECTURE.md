# Architecture
- **Frontend**: single-file vanilla JS app assembled by `build/build.py` from `engine.js` + `build/v3..v17.js` + CSS parts (later declarations override earlier). Source lives in the build workspace; the repo ships the built `index.html`.
- **Data (free)**: GitHub Action every 20 min -> `bundle.json` (news), `photos.json` (Commons photo map), `events.json` (6 h), `markets.json` (end-of-day) -> force-pushed to branch `data`, served via raw.githubusercontent.com (CORS). Previous files carried over if a source fails; empty bundles never overwrite good ones.
- **Service worker**: shell netFirst (1.5 s), data stale-while-revalidate, Commons images cache-first (cap 250), `/api` never cached.
- **State**: localStorage keys `news:*` (additive migrations), tombstones `news:tomb` for sync merge.
- **Server features (not on Pages)**: `/api/ask|sync|push|circular` need Netlify/Vercel/Cloudflare functions; the app probes `?config=1` and degrades honestly.
- **Recommended backend when ready**: one managed platform (Supabase: auth + Postgres + edge functions + cron). See `schema.sql`.
