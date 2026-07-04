# Deploying the web app

`apps/web` is a static Vite PWA — no server. It runs fully offline (IndexedDB)
with `VITE_SYNC_ENABLED=false`; Supabase sync/auth/share is an opt-in layer.

Host: **Vercel** (config in `vercel.json` at the repo root — build command,
output dir, and Vite framework are already wired for the monorepo). Netlify or
Cloudflare Pages work equally well; only the build settings below differ.

## Local-only deploy (zero config)

Import the repo into Vercel and deploy. `vercel.json` handles the monorepo
build. With no env vars set, the app runs local-only: all tracking works, no
accounts, no cross-device sync. Nothing else to do.

## Full deploy (sync + accounts + share links)

1. **Build-time env vars** (Vercel → Project → Settings → Environment
   Variables — Vite inlines these at build, so they must be set before the
   build, not at runtime):
   - `VITE_SYNC_ENABLED=true`
   - `VITE_SUPABASE_URL=https://<ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<publishable/anon key>`

   Use the same values as `apps/web/.env.local`. The anon/publishable key is
   safe to expose (RLS-gated); never set the `service_role` key here.

2. **Supabase auth redirect** — magic-link login redirects to
   `window.location.origin` (set in `useAuth.ts`), but Supabase still validates
   it against an allowlist. In the Supabase dashboard →
   **Authentication → URL Configuration**:
   - Set **Site URL** to the production URL (e.g. `https://<app>.vercel.app`).
   - Add both the production URL and any preview URL to **Redirect URLs**.

   Without this, login emails bounce to localhost / are rejected.

3. **Map backdrop** — the Routes map uses `apps/web/public/maps/sinnoh.png` if
   present, else falls back to the drawn schematic. That image is a
   user-supplied asset and is intentionally not committed; commit it (or add it
   in the host) if you want the real map in production.

4. **HTTPS** is automatic on Vercel and is required for the service worker/PWA.

## Other hosts (build settings)

- **Install command**: `npm install --workspaces --include-workspace-root`
- **Build command**: `npm run build --workspace=@nuzlocke/web`
- **Output directory**: `apps/web/dist`
- Share links are hash-based (`#share/<token>`), so no SPA rewrite rules are
  needed.
