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

10. **Story detail** (v13): What happened / Why it matters / What changed / Sources, each only when evidence supports it; syndicated copies flagged; figure changes (e.g. 12 → 31) from timestamps; methodology behind a control; shareable `#s=` link, Back closes, scroll restored.
11. **Reading mode**: full-screen cards from the edition (progress, Back/Next, keyboard, Save, Coverage, Listen); narration stops on card or edition change. **Quiz** "Check what you learned": at most 3 questions computed from loaded facts, explanation + evidence link, dated history.
12. **Saved library**: Stories / Events / Deadlines; stories reopen in-app by stored id, or as a snapshot with the original link; cancelled/rescheduled events and amended deadlines are kept with status.
13. **Explore workspace**: one search box, operator help, removable filter chips, date scope, keyboard navigation, query kept when a story closes, distinct "no stories collected" vs "no matches", regional/language boundary stated.
14. **My Desk**: evidence records (authority, type, reference, issue date, applicability, effective date, status); Previous/New rule shown only with a linked official document; media coverage as supporting list. **Deadlines**: baseline vs verified exception (you record date + https notice link; checked-at and history kept), .ics export; reminders honestly marked not enabled.
15. **Markets**: `scripts/markets.mjs` (Yahoo public chart endpoint, end-of-day, keyless) -> `markets.json`; SVG line chart with range buttons, accessible table, stale/error/no-data states, "not real-time".
16. **Account/data**: capability discovery in About (probes `/api/*?config=1`; shows enabled/unavailable/degraded), export (JSON), delete (explicit confirmation, also asks the server when signed in), tombstones so a deletion is not resurrected by sync, Plus/Pro copy with checkout unavailable.

## Evidence
`engine` 76/76 · `classify` 184/184 · `editorial` 19/19 · `v3` 79/79 · `v11` 10/10 · `v12` 17/17 · `v13` all · `v14` (reading mode, quiz, saved, explore, desk, deadlines, markets, capabilities, export/delete, tombstones, migration run twice, SW never caches /api) all passed · layout audit 320-2560 px: no page-level horizontal overflow (strips scroll by design).

## Not done / limitations (honest)
- **Concerts/tours** need the free `TICKETMASTER_KEY` secret; until then Events lists national holidays for 5 countries only.
- **Markets**: the Yahoo endpoint is unofficial and was not reachable from the build sandbox, so the Action step is untested live; if it fails the chart shows its error state and headlines are unaffected.
- **AI, sync, push, Google sign-in, payments**: need a server; GitHub Pages is static. The app detects this and says so. Checkout is not built; nothing is locked.
- **Deadline exceptions** are recorded by you (no free machine-readable official source exists); reminders need push + sign-in.
- Not testable here: real devices, two-device sync, field Web Vitals.
- Migration: no key renamed or removed; new keys (`news:tomb`, `news:dlx`, `news:quiz`, `news:livemode`, `news:evsaved`, `news:evfollow`, `news:evtz`) are additive; pre-upgrade data run twice is unchanged.

## Rollback
`git revert` the release commit(s); the service worker version (`ni-shell-7`) changes so clients refetch. The `data` branch is rebuilt every 20 min and can be ignored by clients (relay fallback).
