# OAuth sign-in setup (Google + Discord)

The app supports three sign-in methods: email magic link (always on), **Google**,
and **Discord**. OAuth is opt-in: the provider buttons only render when
`VITE_OAUTH_PROVIDERS` is set, so nothing half-wired ever ships. This doc covers
the parts that need your own accounts — Claude can't do these (they require your
Google Cloud / Discord Developer / Supabase logins).

The code side is already done (`apps/web/src/lib/useAuth.ts`,
`apps/web/src/screens/AuthBar.tsx`, `apps/web/src/lib/env.ts`). You only need to
register the providers and flip the env var.

## The redirect URLs you'll need

Everywhere below, the app is at **`https://nuzlocke-tracker-app.vercel.app`** and
Supabase project ref is in your dashboard URL. Two callback URLs matter:

- **Supabase callback** (given to Google/Discord):
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
- **App redirect** (already handled in code via `window.location.origin`, and must
  be in Supabase → Authentication → URL Configuration → Redirect URLs):
  `https://nuzlocke-tracker-app.vercel.app/**`

---

## 1. Google

1. Go to <https://console.cloud.google.com/> → create/select a project.
2. **APIs & Services → OAuth consent screen**: pick **External**, fill app name,
   support email, developer email. Add scopes `email`, `profile`, `openid`.
   (While in "Testing" mode only allow-listed test users can sign in; hit
   **Publish** to open it to everyone.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs**: add the **Supabase callback** URL above.
   - Create → copy the **Client ID** and **Client secret**.
4. **Supabase dashboard → Authentication → Providers → Google**: enable it, paste
   the Client ID and Client secret, Save.

## 2. Discord

1. Go to <https://discord.com/developers/applications> → **New Application**.
2. **OAuth2** tab → copy the **Client ID**; under **Client Secret** click
   **Reset Secret** and copy it.
3. **OAuth2 → Redirects**: add the **Supabase callback** URL above. Save.
4. **Supabase dashboard → Authentication → Providers → Discord**: enable it, paste
   the Client ID and Client secret, Save.
   - Discord only returns the user's email if the `email` scope is granted;
     Supabase requests it by default, so users must have a verified Discord email.

## 3. Turn the buttons on (Vercel)

1. **Vercel → project → Settings → Environment Variables** (Production):
   add `VITE_OAUTH_PROVIDERS` = `google,discord` (or just one, e.g. `google`).
2. **Redeploy** (env vars only apply to new builds).
3. Also confirm Supabase → Authentication → URL Configuration has Site URL
   `https://nuzlocke-tracker-app.vercel.app` and Redirect URL
   `https://nuzlocke-tracker-app.vercel.app/**` (same as magic-link setup).

For local dev, add the same var to `apps/web/.env.local` and put
`http://localhost:5173/**` in the Supabase Redirect URLs list.

## 4. Verify

From the deployed URL, signed out, you should see "Continue with Google" /
"Continue with Discord" above the magic-link field. Click one → provider consent
→ back to the app, signed in. If a provider isn't fully configured, the button
surfaces the Supabase error inline instead of redirecting (e.g. "provider is not
enabled") — that's the safety net, not a bug.

## Notes

- `VITE_OAUTH_PROVIDERS` accepts only `google` and `discord` today; unknown values
  are ignored (see `parseProviders` in `apps/web/src/lib/env.ts`, covered by
  `env.test.ts`). Adding another provider = add it to `SUPPORTED` + a label in
  `AuthBar.tsx` + the Supabase provider config.
- OAuth users may not have an email (rare for Discord); the signed-in label falls
  back to their provider display name, then "your account".
- Local-first invariant holds: with `VITE_SYNC_ENABLED=false` the whole auth bar
  (magic link and OAuth alike) renders nothing and the app works offline.
