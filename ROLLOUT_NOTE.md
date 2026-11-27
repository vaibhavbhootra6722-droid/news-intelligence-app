# Rollout note — Stage 1–3 (27 Nov 2026)

**Tested revision:** `main` at the commit after `1739131`. Baseline: the public GitHub Pages build before this release.

## Deployment capabilities (verified from configuration, not assumed)
| Deployment | News | Photos | Events | Account / sync / AI / push |
|---|---|---|---|---|
| GitHub Pages (guest) | prebuilt bundle (Action, ~20 min) → relay fallback | prebuilt Commons photo map | `events.json` (Action, ~6 h) | **Unavailable** (no server code) |
| Netlify | functions (when credits allow) | live Commons | same file | available when env vars are set; production deploys currently paused (credits) |

## Shipped
1. **Feed hygiene** (`quarantineReason`, `hygiene`): credit/caption lines, placeholders, malformed outlet strings, implausible dates are set aside *before* clustering; original wording stays on every valid report; the count and reasons appear in About the data.
2. **Same-incident clustering**: shared distinctive place + 3 synonym-normalised shared words (house/home, blast/explosion, hurt/injured). Story IDs unchanged (synonyms are not used for IDs).
3. **Editorial ranking**: severity weight 25→20, impact 20→25; a severity floor applies only to evidenced events with consequence scope; a *local* incident (no casualties, not official, no national/global signal) is capped; unconfirmed single reports get a low floor; opening briefing takes at most one story per category until five are chosen.
4. **Regression fixtures** (`tests/editorial.test.js`, 19 checks): "Army explosion. Scott Olson…" excluded; Owatonna reports → one cluster; local accident not the lead and ranked below RBI/Cabinet/UNSC items; a 120-fatality earthquake stays top-3; lone unconfirmed blast not the lead; opening briefing diverse.
5. **Landing**: "Understand what changed today." + live preview of the actual top story + Explore CTA on the first phone screen; Google CTA only when sign-in is functional; gentle image motion with a Pause control; static for reduced motion; welcome can be revisited from About the data.
6. **Status**: build checklist → one compact line + disclosure; "all caught up" is suppressed while sections are missing ("Some sources are delayed · last verified …").
7. **Live**: *Events* (default) and *Breaking coverage* (previous timeline, verification cues, deep link `#p=live&m=breaking`). Events: Happening now / This weekend / Upcoming / Saved, city + category filters, venue-local time with zone label and "my time zone" toggle, statuses (scheduled, in progress, completed, postponed, canceled, rescheduled, date TBA), Save with snapshot (canceled/rescheduled kept), Follow, `.ics` export (UTC, status, source), official link, OSM map link when coordinates exist, explicit loading / unavailable / degraded / empty-coverage states.
8. **Pipeline**: `scripts/events.mjs` (canonical schema: id, name, category, performer, series, organizer, venue, city, country, IANA tz, start/end, precision, status, provenance, checked, url, media credit). Sources: **Ticketmaster Discovery** (activates when repo secret `TICKETMASTER_KEY` exists — free key) and **Nager.Date** public holidays (date-only; India is *not* covered by it).
9. Layout: no horizontal overflow from 320 to 2560 px; phone menu tap fix; image cache in the service worker.

## Evidence
`node tests/engine.test.js` 76/76 · `classify` 184/184 · `editorial` 19/19 · `v3` 79/79 (UI) · `v11` 10/10 · `v12` 17/17 · layout audit (9 widths × 5 pages: scrollWidth = viewport). Screenshots: `tests/shot-v11-landing.png`, `shot-v12-events-390.png`, `shot-v12-events-1440.png`. Lab runs only; no field Web Vitals exist yet.

## Not done / limitations (honest)
- **No concerts or tours are listed today**: they need `TICKETMASTER_KEY` (free). Until then Events shows only national holidays for 5 countries and says so.
- Not built in this release: shared story detail rebuilt into What happened / Why it matters / What changed / Sources; Explore search workspace changes; evidence-linked regulator records and deadlines with previous/new rule; market charts (no licensed free feed); quiz; subscriptions and checkout; two-device sync tests (no server on Pages); regional/language editions; real-device checks.
- Migration: no existing storage key was renamed or removed; new keys (`news:livemode`, `news:evsaved`, `news:evfollow`, `news:evtz`, `news:landpause`, `news:events`) are additive. Idempotence run with pre-upgrade data was **not** executed.

## Rollback
`git revert` the release commit(s); the service worker version (`ni-shell-6`) changes so clients refetch. The `data` branch is rebuilt every 20 min and can be ignored by clients (relay fallback).
