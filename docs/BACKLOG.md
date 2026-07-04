# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`. Last reconciled with git history: 2026-07-04
(evening) — when in doubt, trust `git log --oneline --merges main` over this
file's checkboxes; it has drifted before.

## In flight right now (2026-07-04)

- **PR #46 — Kanto map calibration touch-up** (awaiting Alex's merge).
  Cerulean Cave / Power Plant / Rock Tunnel node nudges; the fix commit
  originally landed on #45's branch after that PR was already merged, so it
  was cherry-picked out.
- **PR #47 — per-game movepools** (awaiting Alex's merge). Move pickers now
  scoped to each game's generation via the new `pokeapiVersionGroups`
  dataset field + `movesByGame` in generated species data. Z-A falls back to
  the all-games union (PokeAPI has zero move data for it).
- **Impossible-species audit** (running in its own session; will open a PR).
  The per-game movepool slicing surfaced likely-hallucinated encounter
  entries: Gen 5/6 species (roggenrola, fletchling, munna, spritzee, swirlix)
  in BDSP's Grand Underground hideaways despite BDSP's Sinnoh-only dex, and
  graveler in SwSh (Geodude line isn't in the Galar dex). Verify against
  Serebii, remove/replace. Also confirms the 23 PLA species with no
  legends-arceus move data in PokeAPI are dataset-correct (most are really in
  PLA — that's a PokeAPI coverage gap, fallback already handles it).

## Next up (no decision needed — pick one and go)

**15a. Feature + data-completeness round (Alex, 2026-07-04 late — PLANNED,
start here next session).** Full plan with the measured gap matrix, priority
order, and what can run in parallel: **`docs/FEATURE-DATA-ROUND.md`**. Start
with the F-items (small app features) and launch the Wave-1 data agents in
parallel. Sequencing note: F3 (theme-follows-game) touches `theme.ts` +
`RunPicker.tsx`, which consolidation item C1 also rewrites — do F3 before or
with C1, not after.

**15b. Consolidation round — BEFORE item 16 (Alex, 2026-07-04): do this
first.** Full assessment in `docs/CONSOLIDATION.md`: 8 PR-sized items (C1-C8)
to consolidate per-game plumbing and share components across games before
another game lands. Priority order there — headline items: C1 single
per-game app-config module (game registration currently touches 6 scattered
files), C2 spectator-view parity via component reuse (it's a parallel
implementation that's fallen behind every feature since UX section B).
Hosting for friends is documented in `docs/DEPLOY.md` (refreshed same day).

**16. `feat/sv-dataset` — Scarlet/Violet.** The last unbuilt game. Biggest
remaining dataset lift: Paldea areas/encounters from Serebii/Bulbapedia,
milestones for all three story paths (8 gyms w/ Victory Road, 5 Titans, 5
Team Star bases, plus finale battles), starters (Sprigatito/Fuecoco/Quaxly)
as `starter-*` specials, `pokeapiVersionGroups: ["scarlet-violet", "the-teal-mask",
"the-indigo-disk"]`. Acceptance: same bar as the PLA dataset PR (#44) —
validator green, sources cited per area, lower-confidence areas flagged
explicitly, registered in datasets.ts + version mascots + theme.

**17. PLA follow-ups from PR #44** (small, independent):
  - Add the Kamado battle (Hisuian Braviary/Golem/Clefable/Snorlax, Lv 61-62,
    before the Volo finale) as a milestone — researched and cross-checked in
    the #44 session but intentionally left out of that pass. Decide
    `countsForLevelCap` (probably true — it's a real story gate).
  - Verify the sub-location pins flagged lower-confidence in the PR body
    (some Hisuian-form spawn locations came from secondary guides).

**18. Route maps for the remaining games.** The map system is now cross-game
(`apps/web/src/lib/maps/` registry — adding a game = one map file + one
registry line + a backdrop image in `public/maps/`; see the README there).
BDSP (Sinnoh) and LGPE (Kanto) are done. Remaining, each its own small PR
once an IP-safe backdrop exists: **PLA (Hisui)**, **SwSh (Galar)**,
**Z-A (Lumiose)**. Node calibration lesson from Kanto: do a live pass with
the debug overlay (temporarily stroke the `.route-region` rects) before
opening the PR.

## Deferred / low priority (unchanged)

- **Z-A movepools**: PokeAPI has no move-learn data for `legends-za` /
  `mega-dimension` at all, so Z-A uses the union-fallback pool (documented in
  `speciesData.ts`). Only fixable by hand-curating movepools — skip unless it
  actually bothers someone mid-run.
- **Engine event-schema gaps**: no event type for editing `houseRules`
  mid-run (locked at run creation); wipe "reset" has no dedicated status
  transition (UI emits `run_ended(abandoned)` alongside
  `wipe_decision(reset)` as a workaround — documented in WipeScreen.tsx).
- **Sync seq-collision edge case**: two devices appending to the same run
  while both offline and never-synced can collide on `seq` (documented in
  `apps/web/src/lib/db.ts`). Full CRDT-style resolution deliberately out of
  MVP scope.

## Later phases (need a scoping conversation with Alex first)

Metrics dashboard + timeline; genlocke campaigns (champion export/import,
availability fallbacks); profiles + follows; variants (soul link, monolocke,
wedlocke).

## Shipped — one line each, see git log for detail

Items 0-15 (species-lines #4, BDSP #5, LGPE #6, web shell/tracker #7-8,
Supabase/share/keep-alive #11-13/#21, trainer rosters #14, SwSh #16,
level-cap-flag + aceLevel fixes #24-25, UX overhaul A-E #18-31, starter +
starter-conditional rivals #39-40, type-effectiveness + click-to-expand #41);
UX polish pass + species-data repair + validator guard (#42); Giant's Cap
rebuild from real Serebii data (#43); **Legends Arceus dataset (#44)**;
**cross-game route map + LGPE Kanto map + starter version-scoping (#45)**.
GitHub Actions secrets: set and verified 2026-07-03 (keep-alive/backup
workflows green). `v1-import` dropped 2026-07-03.

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources; lower-confidence data is flagged in the PR
  body, never silently shipped as fully-sourced.
- Generated files (`species-data.json`, `species-lines.json`) are never
  hand-merged — resolve conflicts by regenerating against the merged
  dataset state.
