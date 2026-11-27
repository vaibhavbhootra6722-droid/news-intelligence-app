# Audit register (evidence-based; only reproduced or source-level findings)

| ID | Sev | Area | Finding | Root cause | Fix | Regression test | Status |
|---|---|---|---|---|---|---|---|
| A1 | P1 | Loading | News took many seconds via browser-side proxies | N parallel public relays | Action-built `bundle.json` on `data` branch, 1.5 s netFirst | v3 speed checks | Fixed |
| A2 | P1 | Images | Slow / duplicate / unrelated photos | Per-card live Commons search | Prebuilt `photos.json`, non-repeating topic pools, `szu()` thumbnails | v3 photo checks | Fixed (topic illustration, not event photos) |
| A3 | P1 | Mobile menu | Drawer taps dead | Scrim z-index above drawer | `body.navopen .side{z-index:70}` | v3 menu check | Fixed |
| A4 | P2 | Layout | 12 px overflow at 360 px | Top-bar icons | Shrink <=420 px, `overflow-x:clip` | layout3 (9 widths x 5 pages) | Fixed |
| A5 | P0 | Editorial | Photo credit line ranked as top news; one incident split in 3 | No hygiene, strict clustering | `hygiene()`, anchor rule, scope rules | editorial 19 checks | Fixed |
| A6 | P1 | Sync | Saved items duplicated on merge; deletions resurrected | `uniq()` on objects, no tombstones | key-based merge + tombstones | v14 | Fixed |
| A7 | P1 | Deep link | `&s=` hash hung page when hash empty | invalid replaceState URL | `hashS()` full URL | v13 | Fixed |
| A8 | P2 | Static host | Server features (AI, sync, push) silently absent | GitHub Pages has no /api | Capability discovery shows state | v14 | Mitigated (needs backend) |
Not audited here: real-device behaviour, Safari/Firefox/Edge engines (Chromium only), field Web Vitals.
