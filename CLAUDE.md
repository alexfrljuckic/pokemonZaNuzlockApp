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

Everything below is on `main` unless noted. History: PRs #3–#45 merged
(#46 Kanto calibration + #47 per-game movepools open as of 2026-07-04
evening). `docs/BACKLOG.md` is the single work tracker — it opens with an
"In flight right now" section; start there when resuming.

- **Engine** (`packages/engine`): event-sourced core with first-encounter,
  dupes-by-line, level caps (rival fights excluded via `countsForLevelCap`),
  revive tokens, wipe flow, rule-change audit, `pokemon_updated` edits,
  `special_claimed`/`special_reset` (starters + gifts/fossils/statics),
  starter-conditional milestone rosters (`rosterByStarter`), version-locked
  specials (`SpecialEncounter.conditions.version`). 33 tests.
- **Datasets** (5 games): Z-A (25 areas, 35 milestones), BDSP (47/16 incl.
  per-starter Barry rosters), LGPE (22/13), SwSh (27/12, conditions.weather +
  max-raid), **PLA (7 zones, 8 milestones — Nobles + Volo/Giratina)**. Each
  declares `pokeapiVersionGroups` for per-game movepools (PR #47); Z-A has
  none in PokeAPI and falls back to the union pool. Generated:
  species-lines.json, species-data.json (types/stats/moves/movesByGame —
  regenerate via build-species-data.mjs, never hand-merge), machines-by-game.json
  (per-game TM/HM/TR tags via build-machines.mjs; bdsp/lgpe/swsh/plza, PLA has
  none). Validator enforces aceLevel=max(roster), roster-move slugs + optional
  rostersRequired, species coverage vs. generated data, referential integrity.
- **App** (`apps/web`): five tabs (Routes / Team & Box / **Boss Fights** /
  Rules / Stats), Supabase sync + magic-link auth + share links w/ realtime
  spectator (token-gated SECURITY DEFINER RPC — see migration comments
  before touching), 9 per-version themes, run-summary strip w/ active-rules
  chips, starter picked in the game-picker flow, gifts/specials shown under
  their area, dupes-emptied routes skippable, cross-game interactive route
  maps (`lib/maps/` registry — BDSP Sinnoh + LGPE Kanto; add a game = one
  map file + one registry line + backdrop in public/maps), per-game
  move pickers.
- **UX overhaul (docs/UX-OVERHAUL.md): COMPLETE and closed** — kept only for
  its standing design constraints (IP caution, no invented trainer data,
  engine purity).
- GitHub Actions secrets set + keep-alive/backup workflows verified green
  (2026-07-03).

## Workflow conventions

- Feature branches off `main`, PR per BACKLOG item, conventional-commit style
  messages (`feat(engine):`, `feat(datasets):`, `chore:`, `ci+docs:`).
- New datasets/rules land with tests. Dataset PRs cite sources (Serebii URL)
  in the PR description.
- Games ship incrementally; the app must gracefully handle "dataset not yet
  supported".
