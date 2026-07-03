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

- `main`: Phase 0 (BACKLOG "Immediate" items 0–3) complete — engine core
  (first-encounter, dupes by evolution line, level caps, revive tokens, wipe
  flow, rule-change audit), dataset schema + validator, PokeAPI evolution-line
  map (`generated/species-lines.json`, 1388 slugs incl. regional forms), and
  three full datasets: Z-A (25 areas), BDSP (47 areas), LGPE (22 areas).
- `feat/web-shell` (PR open, BACKLOG item 4): `apps/web` — Vite + React + TS
  PWA scaffold. Workspace wiring: `apps/web` depends on `@nuzlocke/engine`
  (bare import, resolved via its `main` field to `src/index.ts` directly — no
  build step) and `@nuzlocke/datasets` (subpath imports via that package's
  `exports` map, e.g. `@nuzlocke/datasets/games/bdsp.json`). Event store is
  IndexedDB via `idb` (`apps/web/src/lib/db.ts`): runs and their append-only
  event logs persist across reload; `RunView` derives all displayed state
  through `deriveState()` on every render — nothing is cached or mutated
  outside the fold. `VITE_SYNC_ENABLED` (`apps/web/src/lib/env.ts`) defaults
  false; no sync implementation exists yet, this just wires the flag through
  for Phase 2. Run `npm run dev` (root) or `npm run dev --workspace=@nuzlocke/web`.
  Next: BACKLOG item 5 (`feat/web-tracker`, the five tabs) builds the actual
  tracker UI on top of this shell.

## Workflow conventions

- Feature branches off `main`, PR per BACKLOG item, conventional-commit style
  messages (`feat(engine):`, `feat(datasets):`, `chore:`, `ci+docs:`).
- New datasets/rules land with tests. Dataset PRs cite sources (Serebii URL)
  in the PR description.
- Games ship incrementally; the app must gracefully handle "dataset not yet
  supported".
