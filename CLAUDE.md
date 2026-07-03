# CLAUDE.md

Multi-game Pokémon nuzlocke tracker for Switch-era mainline games. Successor to
[pokemonZaNuzlockApp](https://github.com/alexfrljuckic/pokemonZaNuzlockApp) (v1, Z-A only).
Full product plan: `docs/nuzlocke-tracker-plan.md`. Backlog: `docs/BACKLOG.md`.
Cost policy: `docs/COSTS.md`.

## Commands

```bash
npm install --workspaces --include-workspace-root   # setup
npm test                                            # engine tests (vitest)
npm run validate:datasets                           # schema + referential integrity, must pass in CI
npm run dev                                         # apps/web dev server (Vite), http://localhost:5173
node packages/datasets/scripts/port-za.mjs <path>   # regenerate plza.json from v1 data.js
node packages/datasets/scripts/build-species-lines.mjs  # regenerate generated/species-lines.json from PokeAPI
```

CI (`.github/workflows/ci.yml`) runs tests + dataset validation on every push/PR.
Never merge with either failing.

## Architecture — the three load-bearing ideas

1. **Event sourcing.** A run is an append-only `RunEvent[]` log. All state
   (`RunState`) is derived by `deriveState()` in `packages/engine/src/state.ts` —
   a pure fold, order-independent (tested). Never store derived state as truth;
   never mutate state outside the fold. This gives undo, timelines, stats,
   audit of mid-run rule changes, and trivial offline sync merges.

2. **Rules are data.** `packages/engine/src/rules/index.ts` defines `RuleDef`
   objects interpreted through fixed hooks (`filterEncounterPool`,
   `validateTeam`, ...). Every rule is `enforced` (engine can gate it) or
   `honor` (tracked + displayed, never silently enforced or dropped). Rules
   condition on games via `appliesTo`. Adding a clause = adding data + a hook
   case, not new UI plumbing.

3. **Game content is JSON, not code.** `packages/datasets/games/*.json`
   validated against `packages/datasets/schema/game.schema.json` plus
   referential-integrity checks in `scripts/validate.mjs`. Fixing an encounter
   table must never require touching app code.

## Domain invariants (do not violate)

- A **wipe is an event, not an ending**: it pends a decision (`reset` or
  `continue`); continuing sets status `wiped-continuing` and the wipe stays in
  history and shared views. Never hide or erase it.
- **Mid-run rule changes are legal but always audited** as `rule_changed`
  events with the before/after config.
- **Species are PokeAPI slugs** (`mr-mime`, `floette-eternal`, `stunfisk-galar`).
  The dupes clause needs `speciesToLine` (evolution-line map) injected via
  `EngineContext` — to be generated from PokeAPI evolution chains at build time
  (see BACKLOG). PokeAPI has NO encounter data past Gen 7; encounter tables are
  hand-curated from Serebii/Bulbapedia.
- **Local-first, degrade-to-free**: the app must fully work with
  `VITE_SYNC_ENABLED=false` (IndexedDB only). No feature may ship that breaks
  when the paid/metered switch is off. See `docs/COSTS.md`.
- Engine package stays pure TypeScript: no DOM, no network, no Supabase imports.

## Current state (July 2026)

- `main`: Phase 0 + Phase 1 core loop complete. Engine core (first-encounter,
  dupes by evolution line, level caps, revive tokens, wipe flow, rule-change
  audit), dataset schema + validator, PokeAPI evolution-line map
  (`generated/species-lines.json`, 1388 slugs), three full datasets (Z-A 25
  areas, BDSP 47 areas, LGPE 22 areas), the `apps/web` Vite + React + TS PWA
  shell, and the five-tab tracker (Areas/Team & Box/Milestones/Rules/Stats +
  wipe screen) — a full Z-A or BDSP run is trackable end to end offline.
  Run `npm run dev` (root) or `npm run dev --workspace=@nuzlocke/web`.
  BACKLOG item 6 (v1 save importer) was dropped — not needed.
- `main`: `feat/supabase` (PR #11, BACKLOG item 7) merged — accounts +
  background sync, scoped to just `runs` + `run_events`. Email magic-link
  auth (`useAuth.ts`, `AuthBar.tsx`). Push-then-pull sync fires after every
  run mutation and on sign-in (`lib/sync.ts`) — best-effort, swallows
  network errors, IndexedDB stays authoritative regardless. `appendEvent`'s
  seq allocation is max+1 (not count+1) so it stays correct after a pull
  merges in events this device hadn't seen; true concurrent-offline-multi-
  device seq collision is still a known unsolved edge case. Verified live
  against a real Supabase project: RLS, push, and pull/merge all confirmed
  with real data, not mocks. Fixed a real bug found during that testing:
  `AuthBar` never checked `signInWithOtp`'s `error` field, so a failed
  request (e.g. rate limiting) silently claimed success.
- `main`: `feat/share-links` (PR #12, BACKLOG item 8) merged — read-only
  share links + a realtime spectator view. **Security design, read before
  touching `supabase/migrations/20260703140000_share_links.sql`**: `runs`/
  `run_events` keep their existing owner-only RLS completely unchanged —
  there is deliberately no RLS policy of the form "readable if a share
  token exists for this run", because that checks whether a run is shared
  at all, not whether the caller actually knows the token, and would leak
  every shared run to everyone. The only public read path is
  `get_shared_run(token)`, a `SECURITY DEFINER` Postgres function that
  takes the token as a parameter and only returns data for a valid,
  non-revoked match — the base tables have zero anon-reachable read
  policies. Live updates use Supabase Realtime **Broadcast** (not
  `postgres_changes`), specifically because `postgres_changes` subscriptions
  are gated by the same RLS as regular queries and an anon spectator
  couldn't subscribe to owner-only tables — Broadcast pings carry no data
  (just "something changed, refetch"), so they can safely be public without
  touching the RLS story at all. `apps/web/src/lib/shareLinks.ts` has the
  client helpers; `screens/tabs/ShareTab.tsx` (owner: create/list/revoke)
  and `screens/SpectatorView.tsx` (read-only, hash-routed via `#share/
  <token>` in `App.tsx`, no sign-in required to view). Verified against the
  real project as a genuinely anonymous caller (plain curl, no session):
  valid token returns real data, bogus token returns `[]`, direct anon
  reads of `runs`/`run_events`/`share_tokens` all still return `[]`, and
  revoking a token immediately makes it return `[]` too. Broadcast verified
  live: a spectator tab picked up 8 separate updates in real time as new
  events were logged, with zero manual reloads.
- `main`: `feat/keep-alive-backups` (PR #13, BACKLOG item 9) merged — two
  GitHub Actions workflows per `docs/COSTS.md` "Standing safeguards" —
  `.github/workflows/supabase-keep-alive.yml` (weekly REST ping so the free
  project never hits the 7-day inactivity pause) and
  `supabase-nightly-backup.yml` (nightly `pg_dump`, uploaded as a 30-day
  workflow artifact, so Level 3 of the cost kill switch — downgrade/delete
  the project — is never a data-loss risk). Both need repo secrets
  (`SUPABASE_URL`/`SUPABASE_ANON_KEY` for keep-alive, `SUPABASE_DB_URL` —
  the full Postgres connection string, genuinely sensitive — for backups)
  added manually at GitHub repo → Settings → Secrets and variables →
  Actions; see `supabase/README.md` for exactly where to find each value.
  **Not live-tested at merge time** — adding a secret to a repo isn't
  something to do without the owner present. Both workflows have
  `workflow_dispatch` enabled specifically so they can be manually run once
  from the Actions tab to confirm they work, without waiting for the cron
  schedule.
- `feat/trainer-rosters` (PR pending open, BACKLOG item 10): `Milestone`
  gained an optional `roster` field (schema + `packages/engine/src/types.ts`)
  — full team (species/level, optionally moves/ability/heldItem),
  informational only, rendered in `MilestonesTab.tsx`. BDSP's 13 existing
  milestones got full Serebii-sourced rosters, plus 3 new rival (Barry)
  battle milestones with their own rosters (`rival-1-barry` etc. — orders
  renumbered ×10 across the existing 13 to leave integer room, since the
  schema requires `order` to be an integer).
  **Known side effect worth deciding on, not yet resolved**: `nextBoss()`/
  `validateTeam()` in `packages/engine/src/rules/index.ts` treat *any*
  milestone with a non-null `aceLevel` as a level-cap checkpoint — there is
  no field to mark an `aceLevel` as display-only. Adding the rival battles'
  ace levels means the hardcore preset's enforced level cap now silently
  checkpoints on them too: verified live that `nextBoss()` on a fresh BDSP
  run now returns Barry's first fight (ace Lv 9) instead of Roark (ace Lv
  14), meaningfully tightening the early-game cap versus before this PR.
  Flagged for a deliberate decision (spawned as a follow-up task) rather
  than silently shipped: either this is the desired behavior, or the engine
  needs a `countsForLevelCap` (or similar) flag to decouple "has a
  displayable ace level" from "gates the enforced cap."

## Workflow conventions

- Feature branches off `main`, PR per BACKLOG item, conventional-commit style
  messages (`feat(engine):`, `feat(datasets):`, `chore:`, `ci+docs:`).
- New datasets/rules land with tests. Dataset PRs cite sources (Serebii URL)
  in the PR description.
- Games ship incrementally; the app must gracefully handle "dataset not yet
  supported".
