# Supabase setup

## Apply the schema

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough — see `docs/COSTS.md`).
2. Open **SQL Editor** in the dashboard, paste the contents of each file in
   `migrations/` **in filename order** (they're timestamp-prefixed), and run
   each one:
   - `20260703120000_init_runs_and_events.sql`
   - `20260703140000_share_links.sql`
3. If your project was created after May 30, 2026, Supabase requires an
   explicit Postgres grant for the auto-generated Data API before REST calls
   will work — follow the grant step in Supabase's own new-project setup
   docs (the exact statement is Supabase's to keep current, not duplicated
   here).
4. In **Project Settings → API**, copy the **Project URL** and the
   **anon / public** key. Never copy or share the `service_role` key — it
   bypasses Row Level Security entirely.
5. In `apps/web/`, copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SYNC_ENABLED=true
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   `.env.local` is gitignored — never commit real credentials.

## Scope

`runs` + `run_events` (sync) and `share_tokens` + `get_shared_run` (read-only
share links) are live. `campaigns` / `campaign_roster` (genlocke) will ship
as their own migration when that feature is built, so the schema doesn't get
ahead of what the app actually does.

Row Level Security: `runs`/`run_events` are owner-only, full stop — there is
no RLS policy anywhere that grants anonymous or cross-user read access to
them. The *only* public read path is the `get_shared_run(token)` function, a
`SECURITY DEFINER` RPC that validates the token itself before returning
anything. See the security comment at the top of
`migrations/20260703140000_share_links.sql` for why this matters — the
obvious-looking alternative (an RLS policy keyed on "a share token exists
for this run") is a real trap that would leak every shared run to everyone.

## GitHub Actions secrets (keep-alive + nightly backup)

Two workflows in `.github/workflows/` need repo secrets to run — add them at
**GitHub repo → Settings → Secrets and variables → Actions → New repository
secret**:

| Secret | Used by | Where to find it |
|---|---|---|
| `SUPABASE_URL` | `supabase-keep-alive.yml` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | `supabase-keep-alive.yml` | Project Settings → API → anon/public key |
| `SUPABASE_DB_URL` | `supabase-nightly-backup.yml` | Project Settings → Database → Connection string (URI tab). **This one contains your DB password — genuinely sensitive**, unlike the anon key. Never commit it, never paste it anywhere but the GitHub secret field. |

Both workflows have `workflow_dispatch` enabled, so once the secrets are set
you can trigger a manual run from the **Actions** tab to confirm they work
without waiting for the schedule (keep-alive: weekly Monday noon UTC;
backup: nightly 09:00 UTC). Backup artifacts land on the workflow run page
and are retained 30 days.
