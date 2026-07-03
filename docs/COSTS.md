# Costs & Kill Switches

Guiding principle: **the app must degrade to free, never break to paid.** Every paid or
quota-limited service sits behind a switch, and flipping the switch off leaves a working
local-first app. You can go from "paying" to "$0" in under five minutes without losing data.

## What can ever cost money

| Service | Free tier | What would trigger paying | Kill switch |
|---|---|---|---|
| Supabase (DB, auth, realtime) | 500 MB DB, 5 GB egress/mo, 200 realtime conns | Sustained spectator traffic, wanting backups | See below — three levels |
| Vercel/Netlify (static hosting) | Generous free static hosting | Practically never for a static PWA | Move to GitHub Pages (also free) |
| PokéAPI / sprites | Free, fair-use | Never (cache locally, don't hammer it) | n/a — datasets are baked at build time |
| Domain name | — | ~$10–15/yr, optional | Use the free `*.vercel.app` / `*.pages.dev` URL |

## The Supabase kill switch (three levels)

**Level 1 — never leave free accidentally.** Stay on the Free plan; it cannot bill you
(it errors at caps rather than charging). If you ever upgrade to Pro, turn ON the
**spend cap** in Billing settings — it's enabled by default on Pro and hard-stops usage
at the included quota instead of billing overages. Check this before anything else.

**Level 2 — turn cloud sync off in the app.** The frontend reads one env var:

```
VITE_SYNC_ENABLED=false
```

Redeploy (one click / one push) and the app runs **local-only**: all tracking continues in
IndexedDB, share links show a "sharing paused" notice, and users can export/import runs as
JSON files. Nothing is lost; sync resumes when the flag flips back. This works because the
event log in IndexedDB is the source of truth and Supabase is a mirror — by design.

**Level 3 — downgrade or delete the Supabase project.**
1. Export data first: `supabase db dump` (or the nightly GitHub Actions backup already has it).
2. Downgrade Pro → Free in the dashboard (Billing → change plan). Data stays, quotas shrink.
3. Nuclear option: pause or delete the project entirely. With `VITE_SYNC_ENABLED=false`
   already set, users never see an error — the app was already running local-only.

## Standing safeguards (set up once in Phase 2)

- **Nightly backup**: GitHub Actions cron runs `pg_dump` and stores the artifact — free,
  and it makes Level 3 painless.
- **Keep-alive ping**: GitHub Actions cron hits the project weekly so the free tier's
  7-day inactivity pause never fires. Disabling this workflow is itself a soft off-switch.
- **Usage alerts**: check the Supabase usage dashboard when you check the run — egress is
  the only number that moves. The app-side mitigations (snapshot + recent-events payloads,
  pagination, client caching) keep it low by construction.
- **No card on file** while on the Free plan = it is impossible to be charged.

## The rule for every future feature

Before adding anything that talks to a metered service, answer: *what happens when the
switch is off?* If the answer isn't "the app still works locally," redesign the feature.
