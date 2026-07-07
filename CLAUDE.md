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
node packages/datasets/scripts/build-za-movepools.mjs   # scrape Z-A learnsets from Serebii → generated/za-movepools.json
node packages/datasets/scripts/build-species-data.mjs   # merges za-movepools.json into species-data.json (movesByGame.plza)
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

## Current state (2026-07-07, reconciled after PR #232)

Everything below is on `main`. PRs #3-#232 merged; the numbered backlog is
EMPTY (shipped or deliberately shelved — see docs/BACKLOG.md, still the
single work tracker). Work from `C:\dev\nuzlocke-app` (OneDrive checkout
breaks worktrees).

2026-07-07 session (#207–#232, see docs/BACKLOG.md for detail):
- **Radical Red is now data-complete** — per-tier boss rosters
  (`rosterByDifficulty`, #210), RR-accurate stats/types/movepools (#226) +
  abilities (#228) via per-game override maps parsed from the
  RadicalRedShowdown gen9rr4.0 data, and non-gym boss tracking (#229: rivals
  Terry/Brendan + Rocket Giovanni/Archer/Ariana via the new additive
  `rosterByDifficultyAndStarter` milestone field). 22 RR milestones.
- **BDSP completeness** (63→82→77 areas): 17 missing routes + 68 town/building
  trainers (#212), non-route wild areas + statics/legendaries (#216), then
  N/S+W/E route splits MERGED back to one route each (#225 — one route number
  = one first-encounter). Sinnoh map nodes calibrated (#221) + audited across
  all games (#222).
- **Engine/data**: cross-device run-sync bug fixed (`pushAllRuns` on sign-in,
  #208); `classifyEncounterPool` (dupes species shown dimmed not hidden, #217);
  edit a Pokémon's **ability** (`pokemon_updated.ability`, `hasAbilities`
  flag, #227); per-game `statsByGame`/`typesByGame`/`abilitiesByGame` +
  game-aware `typesFor`/`statsFor`/`abilitiesFor`.
- **UX**: nature stat arrows (#209), Continue save-file cards w/ team sprites
  (#211), weakness display shows resists+immunities in a readable aligned
  layout (#213/#220), item HM-access tooltips (#214), held-item sprites in the
  mon row + picker (#223/#224), encounter pool grouped by method with real
  per-method rates (#218), defeated trainers marked "✓ defeated" like bosses
  and markable from the condensed row like bosses (#230/#232), mobile map
  "double-tap" copy (#207).
The preview MCP tooling was broken early in the session (served main not the
worktree) then recovered; visual PRs were re-verified live.

- **Engine** (`packages/engine`): event-sourced core — first-encounter,
  dupes-by-line, level caps + next-boss pick (`next_boss_set`), revive
  tokens, wipe flow (proper `wiped` status), rule/house-rule change audit,
  evolution (`pokemon_evolved`/`pokemon_evolution_reverted`: nickname
  never changes, un-evolve keeps level, self-evos are fold no-ops),
  genlocke import event (dormant), cross-run `aggregateRuns`. Toggle rules
  (`dlc-content`, `alphas-count`, `za-rogue-caps`): ABSENT from a ruleset
  = legacy behavior, never "off". `frontierAreas` orders unresolved areas by
  progression (unlock-tier then dataset order) so the "up next" map highlight
  advances as areas RESOLVE, never dark between badges (#198). 103 tests.
- **Datasets** (6 games, interactive maps + towns/shops): Z-A (25),
  BDSP (63), LGPE (44), SwSh (73 — the full Wild Area sub-zone split, now
  incl. all base-game zones + 30 DLC zones `conditions.dlc`-gated; 21
  milestones / 39 specials), PLA (82 — full named-sub-location split with
  per-zone in-game maps + zone-switcher; guaranteed alphas as `alpha`-method
  slots), SV (41). Per-route trainers on BDSP/LGPE/SwSh/SV.
  Generated: species-data.json (886: types/stats/moves/movesByGame/
  levelUpMovesByGame/evolutions incl. happiness/time/knownMove detail),
  species-lines.json, machines-by-game.json — regenerate via scripts,
  NEVER hand-merge. PokeAPI gotchas: no Z-A move data (union fallback);
  default-variety slugs required, Showdown aliases in `lib/sprites.ts`.
- **App** (`apps/web`): five tabs + owner timeline w/ filters, level-cap
  headroom + deaths-by-boss panels, cross-run "Your Stats" screen;
  maps zoom/pan via SVG viewBox (pinch/drag/buttons — mobile-first;
  auto-zooms to the frontier), column-aligned + height-capped 60vh on
  desktop so the encounter panel stays in view, tight click boxes in crowded
  regions (see memory `map-clickbox-sizing`); Galar backdrop is a
  theme-transparent LANDSCAPE TRIPTYCH (base panel centred, Crown Tundra +
  Isle of Armor insets flanking, page margin flood-filled transparent);
  evolve/un-evolve UI with branch choice, level bump and per-game
  item-location hints (lib/evolutionHints.ts); move pickers ordered
  level→TM→TR→HM; columnar learnsets; reverted evolutions net out of all
  history views (`visibleEvents` — apply it to ANY new history surface);
  profiles (handle-only @address, editable in the settings cog; NO display
  name — dormant DB column) + follows + big-beats feed (#u/<handle>) +
  a dedicated #trainers discovery screen (search + feed, OFF the landing
  hero) + self-service profile delete; quiet landing footer (GitHub source +
  paypal.me/projectAF tip jar); run robustness (ErrorBoundary +
  missing-dataset guard, per-run Delete/Export, ConfirmAction on destructive
  clicks); Supabase sync/share/spectator (all migrations through
  20260706000000 APPLIED); 9 themes. 171 web tests.
- **Deploy**: LIVE at https://nuzlocke-tracker-app.vercel.app (Vercel
  project `nuzlocke-tracker`, team PokemonVibeCoder). URL is not hardcoded
  (app uses `window.location.origin`); only docs + Supabase Auth config
  carry it. Sign-in is OAuth-ONLY (Google/Discord via
  `VITE_OAUTH_PROVIDERS` — REQUIRED for sign-in; magic-link email removed;
  see docs/OAUTH-SETUP.md). Auth gotcha: a redirect to the wrong host
  means the domain isn't in Supabase → Auth → URL Configuration → Redirect
  URLs, WITH the https:// scheme (it silently falls back to Site URL);
  dev is Vite 5173, not 3000. Security posture: docs/SECURITY-AUDIT.md
  (headers in vercel.json; run_events append-only; search LIKE-escaped).
  GitHub Pages disabled.
- **Process lessons that bite**: gate merges on test output; PS5.1
  Get/Set-Content mangles UTF-8 (use the Edit tool); multi-line git/gh
  args via `-F`/`--body-file`; build test RunEvent arrays in seq order
  (run_started first — the fold sorts and it replaces the ruleset);
  merging a stacked PR's base with branch-delete auto-closes the stack;
  validate UI picks against re-derived state after events land.

## Workflow conventions

- Feature branches off `main`, PR per BACKLOG item, conventional-commit style
  messages (`feat(engine):`, `feat(datasets):`, `chore:`, `ci+docs:`).
- New datasets/rules land with tests. Dataset PRs cite sources (Serebii URL)
  in the PR description.
- Games ship incrementally; the app must gracefully handle "dataset not yet
  supported".
