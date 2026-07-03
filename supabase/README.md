# Supabase setup

## Apply the schema

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough — see `docs/COSTS.md`).
2. Open **SQL Editor** in the dashboard, paste the contents of
   `migrations/20260703120000_init_runs_and_events.sql`, and run it.
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

This migration covers `runs` + `run_events` only — enough to sync the
single-run tracker built in `feat/web-tracker`. `campaigns` /
`campaign_roster` (genlocke) and `share_tokens` (read-only share links) are
separate BACKLOG items and will ship as their own migrations when those
features are built, so the schema doesn't get ahead of what the app
actually does.

Row Level Security is owner-only right now: a user can only read/write their
own `runs` and the `run_events` that belong to them. No anonymous or public
access exists yet.
