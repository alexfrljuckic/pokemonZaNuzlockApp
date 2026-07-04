# Deploying the web app (give your friends a URL)

`apps/web` is a static Vite PWA — no server of our own. It runs fully
offline (IndexedDB) with `VITE_SYNC_ENABLED=false`; Supabase sync/auth/share
is an opt-in layer. Cost policy: `docs/COSTS.md` (everything below fits the
free tiers).

Host: **Vercel** (config in `vercel.json` at the repo root — build command,
output dir, and Vite framework are already wired for the monorepo). Netlify
or Cloudflare Pages work equally well; only the build settings at the bottom
differ.

## Quickstart: shareable URL in ~10 minutes

1. **Import the repo** at vercel.com → Add New → Project → pick the GitHub
   repo. `vercel.json` handles the monorepo build — accept the defaults.
2. **Set the env vars** (Project → Settings → Environment Variables) *before*
   the first real deploy — Vite inlines them at build time:
   - `VITE_SYNC_ENABLED=true`
   - `VITE_SUPABASE_URL=https://<ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<anon/publishable key>`

   Same values as `apps/web/.env.local`. The anon key is safe to expose
   (everything is RLS-gated); never set the `service_role` key here.
3. **Allow the production URL in Supabase** (dashboard → Authentication →
   URL Configuration): set **Site URL** to `https://<app>.vercel.app` and add
   it (plus any preview URLs) to **Redirect URLs**. Without this, magic-link
   login emails bounce or redirect to localhost.
4. **Deploy.** Vercel gives you `https://<app>.vercel.app` — that's the URL
   to send around. HTTPS is automatic (required for the PWA service worker).

Skipping steps 2-3 still works — the app deploys local-only: all tracking
works per-browser, just no accounts, cross-device sync, or share links.

## How friends actually use it

- **Everyone tracks their own runs at the same URL.** Runs are local-first
  (IndexedDB in each person's browser) — no account needed to play. With
  sync enabled, anyone *can* sign in with their own email (magic link) to
  back up runs and continue on another device; Supabase RLS keeps each
  user's runs private to them.
- **Watching each other's runs**: the run owner clicks **Share** in the run
  header → creates a read-only link (`…/#share/<token>`). Spectators see the
  run live (realtime updates) without an account. Revoking the link in the
  same popover kills access.
- **Install as an app**: the site is a PWA — on mobile, "Add to Home Screen"
  gives an app icon and offline support.
- Caveat: one browser profile = one run store when signed out. A friend
  clearing site data loses signed-out runs — signing in is the backup story.

## Ops notes (already set up)

- GitHub Actions keep-alive + nightly `pg_dump` backups run on schedule
  (secrets configured 2026-07-03; see `supabase/README.md`).
- Supabase free tier pauses after ~1 week of no traffic — the keep-alive
  workflow exists precisely to prevent that.
- Route-map backdrops (`apps/web/public/maps/sinnoh.png`, `kanto.png`) are
  committed and deploy with the app; games without a backdrop fall back to
  the drawn schematic automatically.

## Other hosts (build settings)

- **Install command**: `npm install --workspaces --include-workspace-root`
- **Build command**: `npm run build --workspace=@nuzlocke/web`
- **Output directory**: `apps/web/dist`
- Share links are hash-based (`#share/<token>`), so no SPA rewrite rules are
  needed.
