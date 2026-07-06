# Security audit — 2026-07-05

Read-only audit of the full app (frontend `apps/web`, backend = the SQL
migrations in `supabase/migrations/`, deployment at
nuzlocke-tracker-app.vercel.app). Scope: SQL injection / RPC safety, RLS
coverage, share-token handling, XSS sinks, auth/session handling, secrets,
`npm audit`, platform config. Findings below; fixes for M1, M2 and L3 shipped
in the same PR as this document (migration `20260706000000_security_hardening.sql`
+ `vercel.json` headers).

## Verdict

**No exploitable path to another user's private data was found.** All SECURITY
DEFINER functions are parameterized (zero dynamic SQL in the codebase) and pin
`search_path = public`; every table has owner-scoped RLS; share tokens are
122-bit `gen_random_uuid()` values whose revocation is honored in every read
path; the React client has no HTML-injection sinks. The findings are hardening
gaps, not breaches.

## Findings

### M1 (medium) — `search_profiles` ILIKE metacharacters allowed anonymous profile scraping — **FIXED**
`p_query` was concatenated into an ILIKE pattern unescaped, so the two-character
query `"%%"` passed the length guard and matched **every** profile; `a%`, `b%`…
paginated the rest — an anonymous "list everyone" surface the migration's own
comment says shouldn't exist. Impact limited to already-public (handle,
display_name) pairs, so scraping/enumeration rather than a privacy breach.
**Fix (shipped):** `\`, `%`, `_` are escaped and matched with an explicit
`ESCAPE` clause in migration `20260706000000`.

### M2 (medium) — no security headers on the deployment — **FIXED**
`vercel.json` shipped no `headers` block: no CSP, no `X-Frame-Options`, no
HSTS. Main risk: clickjacking a signed-in user into "Delete profile"/"Revoke"
via a transparent iframe (CSRF proper is mitigated by Supabase's
Bearer-token-in-header model), and no CSP as a second line of defense against
future XSS. **Fix (shipped):** CSP (`default-src 'self'`, images from self +
the Showdown sprite CDN, connect to Supabase https/wss, `frame-ancestors
'none'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, HSTS,
`Permissions-Policy`. Note: the CSP will block Vercel's preview-deploy
feedback toolbar (vercel.live) on preview URLs — cosmetic, previews only.

### L3 (low) — event log wasn't append-only at the database layer — **FIXED**
The `run_events` policy was `FOR ALL`, silently granting the owner UPDATE and
DELETE — contradicting the init migration's stated append-only design. A run
owner (via raw supabase-js, never the app UI) could rewrite the history that
spectators and followers are shown as a faithful log ("a wipe is an event, not
an ending"). Own-runs only — no cross-user impact; an integrity-guarantee gap,
not confidentiality. **Fix (shipped):** policy split into SELECT + INSERT only
in migration `20260706000000`. Sync is unaffected (event pushes are
`ON CONFLICT DO NOTHING`; run deletion cascades from `runs`, and FK cascades
are not blocked by the absence of a DELETE policy). `runs` deliberately keeps
`FOR ALL` — its summary row is genuinely upserted and run deletion needs it.

### L4 (low) — realtime broadcast channel isn't token-gated — **OPEN, accepted for now**
`broadcastRunChanged` publishes to channel `run:<runId>` and anyone who knows
the run UUID (e.g. a spectator whose share token was later revoked — the id is
returned by `get_shared_run`) can still subscribe and receive contentless
"changed" pings — a when-is-the-owner-playing oracle. No run data leaks
(payload is `{}`), and `get_shared_run` correctly returns nothing after
revocation. Proper fix is Supabase Realtime Authorization / private channels;
deferred as low value-for-effort. Documented here as a known limitation.

## Checked and clean

- **No dynamic SQL anywhere** — no `EXECUTE`/`format()`/string-built queries in
  any migration; all DEFINER functions take typed parameters used as bound
  values. SQL injection is not reachable.
- **All DEFINER functions pin `search_path = public`** (no search-path
  privilege escalation).
- **RLS on every table, owner-scoped** (`runs`, `run_events`, `share_tokens`,
  `profiles`, `follows`); no `USING(true)`; `anon` reaches data only through
  the three anon-granted RPCs; `get_feed` is authenticated-only, sees only
  followed users' shared-run big-beats, and clamps its limit server-side.
- **Share tokens:** `gen_random_uuid()` (122-bit CSPRNG); invalid/revoked
  tokens return empty (no oracle); revocation honored in `get_shared_run`,
  `get_profile`, and `get_feed`.
- **XSS:** no `dangerouslySetInnerHTML`/`innerHTML`/`eval` anywhere; all
  user-controlled strings render as React text children; URL sinks are
  server-minted UUIDs or regex-constrained handles (`#u/` route rejects
  anything outside `[a-z0-9-]`); sprite URLs are fixed-CDN + slug.
- **Auth:** supabase-js default localStorage sessions (acceptable with an
  XSS-clean codebase); `redirectTo: window.location.origin` is browser-derived
  and allowlist-validated — not an open redirect.
- **Sync ownership:** cross-user event injection is impossible — `run_events`
  insert policy checks run ownership; the documented seq-collision case is a
  local offline-merge concern only.
- **Secrets:** no service_role key / OAuth secret / API token anywhere in the
  working tree; `.env*` gitignored (only `.env.example` tracked).
- **`npm audit`:** 7 vulns, **all devDependencies** (happy-dom, the
  vite/vitest dev-server chain) — nothing shipped to users. Worth a bump pass
  eventually; not urgent.
- **PWA/service worker:** precaches app shell + public game data only; no API
  responses or tokens cached.

## Standing follow-ups

- L4 realtime gating if/when Supabase private channels are adopted.
- Dev-dependency major-bump pass to clear `npm audit` noise.
- Migration `20260706000000_security_hardening.sql` must be applied in
  Supabase for M1/L3 fixes to take effect (headers apply on next deploy
  automatically).
