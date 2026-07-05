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

## Current state (July 2026, reconciled after PR #110)

Everything below is on `main`. PRs #3-#110 merged. `docs/BACKLOG.md` is the
single work tracker — it opens with Alex's standing decisions and the
"Next up" items; start there when resuming. Work from `C:\dev\nuzlocke-app`
(OneDrive checkout breaks worktrees).

- **Engine** (`packages/engine`): event-sourced core — first-encounter,
  dupes-by-line, level caps, revive tokens, wipe flow, rule-change audit,
  `pokemon_updated`, specials, starter-conditional rosters, version-locked
  specials, `trainer_battled`/`trainer_reset` + `item_picked`/`item_reset`
  tracking, `frontierAreas` sliding "up next" window (skips encounter-less
  towns). 57 tests.
- **Datasets** (6 games, all with interactive maps + towns/shops):
  Z-A (25), BDSP (62 areas incl. 17 towns), LGPE (44 incl. 11 towns),
  SwSh (62 incl. 11 towns + full IoA/CT DLC wilds), PLA (7 + Jubilife
  shops), SV (41 after the Serebii audit: 29 wild locations + 12 towns).
  Per-route trainers (species+levels, sourced) on BDSP/LGPE/SwSh/SV;
  ~2k fixed items + ~1.4k shop entries (`items` with `hidden`/`shop`/
  `quantity` flags). Generated: species-data.json (863 species: types,
  stats, moves, movesByGame, levelUpMovesByGame w/ learn levels),
  species-lines.json, machines-by-game.json — regenerate via scripts,
  NEVER hand-merge. PokeAPI gotchas: no Z-A move data (union fallback);
  default-variety slugs required (frillish-male, darmanitan-galar-standard,
  mimikyu-disguised…) with Showdown sprite aliases in `lib/sprites.ts`.
- **App** (`apps/web`): five tabs; interactive maps for all six games
  (desktop full-bleed to 94vw/1500px + 86vh height-fit, mobile 600px
  min-width horizontal pan; backdrops raster-in-SVG, higher-res same-aspect
  uploads are drop-in); progressive "up next" glow; trainer cards
  (boss-style, expected movesets = last four level-up moves, mark-battled);
  items/shops chips with pickup tracking; move picker with learn-level
  badges + collapsible learnsets; event feed with named faints + trainer
  sprites; original per-game SVG logos; global back icon top-left;
  Supabase sync/share/spectator; 9 themes.
- **Research/docs**: docs/CHALLENGE-MODES.md (PLA/SV/Z-A all viable —
  accommodations mapped to backlog), docs/SWSH-TRAINER-NOTES.md.
  GitHub Pages disabled (v1 leftover; Vercel is the host — DEPLOY.md).
- **Process lessons that bite**: gate merges on test output (never chain
  `gh pr merge` behind tests in one command); PS5.1 Get/Set-Content
  mangles UTF-8 (use the Edit tool or [IO.File] with UTF8Encoding);
  multi-line git/gh args via `-F`/`--body-file` files, never here-strings;
  verify map-node fixes against native-res crops before shipping.

## Workflow conventions

- Feature branches off `main`, PR per BACKLOG item, conventional-commit style
  messages (`feat(engine):`, `feat(datasets):`, `chore:`, `ci+docs:`).
- New datasets/rules land with tests. Dataset PRs cite sources (Serebii URL)
  in the PR description.
- Games ship incrementally; the app must gracefully handle "dataset not yet
  supported".
