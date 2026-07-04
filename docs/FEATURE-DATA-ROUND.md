# Feature + data-completeness round (Alex, 2026-07-04 late)

Alex's asks, verbatim intent: (1) end a run whenever he wants; (2) bigger
route maps — more horizontal space on desktop, bigger click boxes — and the
maps "need more visiting" (LGPE routes 13/14 show nothing); (3) theme should
default to the selected game's theme unless the user explicitly picked one
from the dropdown (first-ever view stays Dark); (4) complete per-game data —
unique Pokémon lists, move lists, TM/HM lists, all boss fights with moves +
abilities — for the 5 shipped games, then per-route trainers. Prioritized,
with parallelizable work identified.

Nothing here is implemented yet — this is the plan for the next session(s).

## F-items: app features (small, sequential, one PR each or combined)

**F1. End a run anytime.**
- Engine already supports it: `run_ended` event with `victory | abandoned`
  (Boss Fights tab already emits victory via `declareVictory`).
- Add an "End run" affordance in the run header (`RunView.tsx`, next to
  SharePopover). Inline expanding confirm — two buttons "Mark as victory" /
  "Abandon run" + cancel. **No `window.confirm`** (Alex hates prompts).
- Hide when `state.status` is already `victory`/`abandoned`. Works for
  `active` and `wiped-continuing`.
- Acceptance: end from any tab; status line updates; ended runs still open
  read-only-ish (existing behavior for non-active status is unchanged).

**F2. Bigger route maps / wider desktop layout.**
- Root cause: `#root { max-width: 720px }` (index.css) caps everything.
- Fix: desktop breakpoint — `@media (min-width: 1100px) { #root {
  max-width: 1060px } }` (exact number: judgment call at implementation).
  `.route-map` is already `width: 100%`, so the map + click boxes scale up
  automatically; card grids are `auto-fill` so they reflow fine.
- After widening, re-check node hit-box sizes on both maps at the new scale
  (live debug overlay: temporarily stroke `.route-region` rects).
- "LGPE routes 13/14 show nothing" is NOT a map bug — those routes are
  missing from the dataset entirely (see D1). The map correctly skips nodes
  whose area id doesn't exist.

**F3. Theme follows the selected game unless explicitly chosen.**
- New `VERSION_THEME` map in `theme.ts`: brilliant-diamond→bdsp-bd,
  shining-pearl→bdsp-sp, lets-go-pikachu→lgpe-pikachu,
  lets-go-eevee→lgpe-eevee, sword→swsh-sword, shield→swsh-shield,
  legends-z-a→plza, legends-arceus→pla.
- New localStorage flag `nuzlocke-theme-explicit`, set ONLY when the header
  dropdown is used (App.tsx). `applyTheme` gains an `explicit` param or a
  separate `applyThemeExplicit`.
- On run open (RunView mount) and run creation (RunPicker `handleCreate`):
  if the explicit flag is absent, apply the version's theme. First-ever
  load with no run open stays `default-dark`.
- Acceptance: fresh profile opens Dark; opening a Shield run turns the app
  Shield-magenta; picking "Dark" from the dropdown afterwards sticks
  forever (across runs) until changed again from the dropdown.

## Measured data-gap matrix (checked against the JSONs, 2026-07-04)

| game | encounters | rosters | roster moves | roster abilities | TM/HM list |
|------|-----------|---------|--------------|------------------|------------|
| bdsp | complete (audited PR #32) | 16/16 | **88/88** | **88/88** | yes (bdsp-machines.json) |
| lgpe | **10 routes missing**: 7, 8, 13, 14, 15, 19, 21, 23, 24, 25 (+ no victory-road area) | **0/13** | — | n/a (LGPE has no abilities) | no (LGPE has 60 TMs) |
| swsh | 27 areas (Giant's Cap rebuilt #43) | 12/12 | **0/49** | **0/49** | no |
| pla  | 7 zones | 8/8 | **0/14** | n/a (PLA has no abilities) | n/a (PLA uses the move shop, no TMs) |
| plza | 25 areas | **0/35** | — | — | no PokeAPI data at all |

BDSP is the gold standard — every other game is being brought to its bar.
Note the n/a cells: LGPE and PLA genuinely have no ability mechanic, and PLA
has no TMs — "complete" for them means moves only. Verify both facts against
Serebii before authoring (don't trust this table's memory blindly).

## D-items: data work, in waves

### Wave 1 — five independent agents, fully parallel (different files)

Each touches only its own game JSON (+ map file for D1), so they can run
simultaneously. Every one: cite Serebii per the standing rules, regenerate
`species-data.json`, `validate:datasets` + `npm test` green, own branch off
fresh `origin/main`, own PR. **Conflict rule:** all five will touch the
generated `species-data.json` — merge PRs one at a time and let each next
branch regenerate on top (standing rule: never hand-merge generated files).

- **D1. LGPE missing routes** (`lgpe.json` + `lib/maps/kanto.ts`): add
  routes 7, 8, 13, 14, 15, 19, 21, 23, 24, 25 and Victory Road with
  encounter tables from Serebii's LGPE Pokéarth; add map nodes for each
  (backdrop banners for all of them already exist on kanto.png). Fixes
  Alex's "13/14 have nothing".
- **D2. LGPE milestone rosters** (`lgpe.json`): full teams w/ levels +
  moves for all 13 milestones (8 gyms, rival fights, E4, Champion) from
  Serebii LGPE gym/E4 pages. No abilities/held items (not in LGPE).
  Remember `aceLevel === max(roster level)` — the validator enforces it.
- **D3. SwSh roster moves + abilities** (`swsh.json`): backfill moves +
  abilities for the 49 existing roster mons from serebii.net/swordshield
  (gyms/hop/championcup pages — same sources as the roster backfill #27).
- **D4. PLA roster moves** (`pla.json`): movesets for the 14 roster mons
  (5 Nobles, Volo's 6, Giratina, early-Volo) from Serebii/Bulbapedia PLA
  pages. No abilities (not in PLA). Also fold in BACKLOG item 17 here
  (Kamado milestone — roster already researched: Hisuian Braviary / Golem /
  Clefable / Snorlax, Lv 61-62).
- **D5. Z-A milestone rosters** (`plza.json`): the biggest lift — 35
  milestones with zero rosters today. Author rosters (+ moves where
  Serebii documents them) from Serebii's Z-A section. PokeAPI has nothing
  for Z-A, so every move here is hand-curated; flag low-confidence entries
  in the PR body.

Agent lessons that apply (from memory / this session): instruct agents to
research inline (no sub-agent fan-out — causes stalls + zombie tasks);
branch each off fresh `origin/main` (no stacking); worktrees under the
OneDrive repo path need `npm install --workspaces` inside them, or use
space-free `C:\wt-*` paths for anything needing a dev server.

### Wave 2 — after (or alongside, different files) Wave 1

- **D6. Per-game TM/HM lists** (`machinesByGame`): extend
  `build-species-data.mjs` to emit machine lists per version group from
  PokeAPI's per-version-group machine data (same pattern as `movesByGame`,
  PR #47); `machineType(move, gameId)` in the UI; delete the
  BDSP-list-shown-everywhere behavior (consolidation item C6 merges into
  this). PLA correctly gets none.
- **D7. Validator guards for the new data**: (a) every roster move must be
  in that species' per-game movepool when one exists (catches typos/wrong-
  gen moves); (b) optional per-game "rosters required" flag so a future
  dataset can't ship 0/N rosters unnoticed like Z-A did.

### Wave 3 — per-route trainers (Alex's "after that")

Schema addition: optional `trainers` array on areas (name, class, team:
species/levels + moves/items where documented — never invented; this was
originally scoped in UX-OVERHAUL section E but never built). Validator +
route-panel UI (trainer list under the encounter picker). Then per-game data
passes, BDSP first (Serebii documents its trainers fully), one game per PR.
This is the largest data effort in the plan — do it after Waves 1-2 prove
the roster-quality bar, and consider whether consolidation C1/C2 should land
first so the UI work slots into the config-module structure.

## Recommended overall sequence

1. **F1 + F2 + F3** — one small session, app code only. (F3 before
   consolidation C1, which rewrites the same files.)
2. **Wave 1 (D1-D5)** — five parallel background agents, merged one at a
   time with regen-on-conflict.
3. **D6 + D7** — one session.
4. **Consolidation C1-C5** (docs/CONSOLIDATION.md) — the app refactors,
   now safe since F3 landed first.
5. **Wave 3 trainers**, then **SV dataset** (BACKLOG item 16) enters with
   every pattern established: config module, per-game moves + machines,
   roster bar, trainers schema.
