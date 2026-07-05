# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`. Last reconciled with git history: 2026-07-05
(PRs #72-#76 merged) — when in doubt, trust `git log --oneline --merges
main` over this file's checkboxes; it has drifted before.

**Where to work:** the canonical checkout is now `C:\dev\nuzlocke-app`
(moved off OneDrive — its sync locks broke `git worktree`; see the
worktree-isolation memory note). The old OneDrive copy is deletable; run
`git pull` in the new checkout first.

## In flight right now

**victory-road-swsh artifact investigation** — running in its own session
(spawned task). SwSh has no Victory Road location (Route 10 goes straight to
Wyndon) and the area's cave encounter table matches no base-game location;
that session will trace its origin and open a rename-or-remove PR. Don't
touch swsh.json's victory-road-swsh area until it lands.

## Next up (Alex's queued feedback, 2026-07-05 — items 27-30 first)

**27. Progressive next-area highlighting on maps.** As routes get resolved
(seen on BDSP), the map doesn't advance which areas glow as "up next" —
the frontier highlight should progressively update: resolving an area (or
clearing its unlockAfter milestone) promotes the next reachable areas to
the highlighted state. Audit `isFrontier` + `route-region-frontier` (they
exist but don't visibly progress) and make the progression obvious in the
map + area list. Applies to every game.

**28. Compact collapsed trainer cards.** The collapsed trainer card is too
tall — condense toward the Boss Fights collapsed treatment: one row with
sprite, name/class, and the team as a tight horizontal strip; full detail
stays behind the expand. Route panels with 10+ trainers should scan fast.

**29. Items always visible + pickup tracking.** Drop the collapsed
<details> — show the item chips directly (cap + "show all" for dungeon
piles), and make each item markable as picked up: engine event pair
item_picked / item_reset keyed `areaId#itemIndex` (same shape as
trainer_battled), checked/dimmed chip state, n/m picked in the header.

**30. Drop the "Pokémon" prefix on the game picker.** Card titles read
"Brilliant Diamond / Shining Pearl" etc. — the franchise is implied.
Display-side strip only (dataset `name` stays canonical). Tiny PR.

**31. SV real-map swap (waiting on upload).** Alex has a Paldea map image
(shared in the 2026-07-05 session — the region map with gym-leader pins)
he's OK using as the SV backdrop. Same recipe as the Lumiose swap (#87):
he uploads it to apps/web/public/maps/ (rename to paldea.jpg), then
recalibrate the 16 zone nodes onto it (pixel-luminance/crop technique)
and retire the hand-drawn paldea.svg. Blocked only on the upload.

**24. PLA sub-area encounter granularity + alpha flag.** The community
nuzlockes PLA per NAMED LOCATION, not per zone — our 7-zone dataset is
the biggest gap vs. practice (docs/CHALLENGE-MODES.md). Split pla.json
areas into named sub-locations (Serebii has per-location spawn lists) or
add a sub-area list per zone; add an `isAlpha`-style encounter flag so
guaranteed Alphas can be excluded by default with a hard-mode "alphas
count" toggle. Dataset + small engine/UI PR.
**Sub-location names transcribed from Alex's reference maps (2026-07-05
session; he can upload the map images à la pokemonZamap.jpg if we want
per-zone backdrops — that needs a one-map-per-zone registry extension):**
- Obsidian Fieldlands: Aspiration Hill, Floaro Gardens, Horseshoe Plains,
  Grueling Grove, Worn Bridge, Deertrack Path, Deertrack Heights,
  Windswept Run, Nature's Pantry, Tidewater Dam, Obsidian Falls,
  Oreburrow Tunnel, Sandgem Flats, Ramanas Island, Lake Verity, The
  Heartwood, Grandtree Arena.
- Crimson Mirelands: Brava Arena, Shrouded Ruins, Cloudpool Ridge,
  Diamond Heath, Diamond Settlement, Lake Valor, Solaceon Ruins, Golden
  Lowlands, Bolderoll Slope, Scarlet Bog, Cottonsedge Prairie, Gapejaw
  Bog, Droning Meadow, Sludge Mound, Ursa's Ring, Holm of Trials.
- Cobalt Coastlands: Islespy Shore, Molten Arena, Firespit Island, Spring
  Path, Seagrass Haven, Windbreak Stand, Veilstone Cape, Castaway Shore,
  Lunker's Lair, Tranquility Cove, Ginkgo Landing, Crossing Slope, Sand's
  Reach, Aipom Hill, Deadwood Haunt, Bathers' Lagoon, Tombolo Walk,
  Hideaway Bay.
- Coronet Highlands: Temple of Sinnoh, Cloudcap Pass, Moonview Arena,
  Celestica Ruins, Sacred Plaza, Clamberclaw Cliffs, Stonetooth Rows,
  Primeval Grotto, Celestica Trail, Lonely Spring, Bolderoll Ravine,
  Sonorous Path, Ancient Quarry, Fabled Spring, Wayward Wood, Heavenward
  Lookout.
- Alabaster Icelands: Lake Acuity, Glacier Terrace, Snowfall Hot Spring,
  Pearl Settlement, Heart's Crag, Icepeak Arena, Avalugg's Legacy,
  Arena's Approach, Bonechill Wastes, Avalanche Slopes, Whiteout Valley,
  Icebound Falls.
- (Jubilife Village is the hub — items/vendors, no wild sub-areas.)

**25. SV next-boss level cap affordance.** Milestones already complete in
any order; add the "which boss am I doing next" pick so the displayed
level cap keys off the user's chosen next milestone instead of dataset
order (docs/CHALLENGE-MODES.md, SV section). Small engine selector + Boss
Fights UI. Ship the merged 18-boss suggested order as the default sort.

**26. Per-game honor-rule packs.** PLA: use-only-first-catch wording,
no-crafted-revives, distortion + outbreak-shiny bans, noble two-attempt
clause; SV: raid/picnic-egg bans (default-on), symmetric-Tera clause;
Z-A: symmetric-Mega clause, rogue-battle cap toggle. All honor rules
gated via `appliesTo` — data + rules-tab display, no enforcement.

**23. SwSh DLC specials + boss milestones.** The DLC areas shipped with
encounters only. Candidates deliberately excluded from wild tables and
parked in the research files' `_meta` (scratchpad session notes + PR body):
IoA — Kubfu/Urshifu (gift/story), tower battles vs Klara/Avery + Mustard
(boss-style, would be milestones); CT — Galarian bird roamers, the Regis
(incl. Regieleki/Regidrago split-decision), Calyrex + steed choice,
Swords of Justice, Peony story fights. Needs a decision on whether DLC
bosses join the Boss Fights tab (they're optional content — maybe a
`conditions.dlc` gate) before authoring. Also skipped: universal fog
Chansey/Blissey adds (IoA) and daily strong-wanderer spawns (both DLCs) —
re-add as encounters if a runner wants them.

2026-07-05 challenge/UX round (PRs #89-#93): **level-up learnsets (#89)** —
levelUpMovesByGame generated data, learn-level badges in the move picker,
collapsible per-mon learnset section; **trainer battle tracking (#90)** —
trainer_battled/trainer_reset events, boss-fight-scale trainer cards with
documented-or-expected movesets (last four level-up moves at level, never
invented, labelled); **back button into run header (#91)**; **route items
(#92)** — items schema field + Items here panel + 1,033 sourced pickups
(BDSP 339 / LGPE 230 / SwSh base 193 / SV 271 TM-checklist-flavored);
**challenge-modes research (#93)** — docs/CHALLENGE-MODES.md: all three
unconventional games stay supported; spawned items 24-26.

Otherwise items 0-22 are all shipped (see below and git log). What's left
lives in "Deferred / low priority" (deliberate skips), "Later phases"
(needs a scoping conversation with Alex), and the in-flight PR #77. If any
region's original-SVG backdrop (Paldea/Hisui) ever gets replaced with
uploaded art (as Lumiose was in #87), keep the node ids and recalibrate
coordinates against the new image.

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

2026-07-04/05 sweep (PRs #46-#68): Kanto calibration (#46); per-game
movepools (#47); docs reorg (#48); phantom-species audit (#49); consolidation
plan + hosting docs (#50); **Wave-1 data (#52-#56)** — LGPE 10 missing routes
+ Victory Road + map nodes, LGPE rosters (rosterByStarter champion), PLA
movesets + Kamado, SwSh roster moves+abilities, Z-A rosters (13/35
well-sourced); **F1-F3 app features (#57)** — end-run-anytime, 1060px desktop,
theme-follows-game; **validator guards (#58)** — roster-move slugs +
rostersRequired; **machinesByGame (#59)** — per-game TM/HM/TR tags;
**consolidation C1-C8 (#60, #63-#67)** — games/<id>.ts config modules,
spectator parity via shared read-only components, RoutesTab split + atoms,
engine selectors, web vitest harness (20 tests), data-driven trainerSprite;
**Scarlet/Violet (#61-#62)** — 6th game, 16 areas / 29 milestones, teraType,
version-split finale/titan via milestonesFor; **Wave-3 trainers foundation
(#68)**. Repo moved off OneDrive to C:\dev\nuzlocke-app (worktree locks).

2026-07-05 sweep (PRs #72-#76): **trainer-card UI (#72)** — TrainersHere
rows are expandable cards with Showdown class sprites (trainerKeyFromClass)
+ per-mon detail (weaknesses, per-game move tags, stat bars via shared
StatBars); **BDSP missing areas, was item 20 (#73)** — routes 207/208,
Ravaged Path, Wayward Cave with encounters + 23 trainers (Austin-Chimchar
confirmed); **Wave-3 trainer passes, was item 19 (#74-#76)** — LGPE 204/28,
SwSh 93/18 (version-gated gym missions), SV 208/15 (Dalizapa folded into
glaseado-mountain); species-data.json regenerated at each merge (835
species). Research provenance + parked Route 8 trainers:
docs/SWSH-TRAINER-NOTES.md. GitHub Pages disabled same day (v1 leftover
serving raw source with flaky deploys; Vercel is the host — see DEPLOY.md).

2026-07-05 late sweep (PRs #79-#84): **Galar map (#79)**, **Kanto
calibration (#80)**, **darmanitan sprite alias, was item 22 (#81)**,
**Paldea map w/ original SVG backdrop (#82)**, **SwSh missing areas, was
item 21 (#83)** — route-8 (31 slots incl. Steamdrift, + the 5 parked
trainers) and galar-mine-no-2 (12 slots, 5 trainers) with map nodes;
route-7 unlockAfter corrected gym-4 → gym-5-opal (reached after Ballonlea
per progression); **Hisui + Lumiose maps (#84)** — item 18 COMPLETE, all
six games have interactive maps. Original-SVG backdrop pattern for regions
without IP-safe art: hand-authored flat-color schematic in
public/maps/<region>.svg (paldea/hisui/lumiose); Lumiose is deliberately
schematic (zones ringed by number, hyperspace zones off-map on purpose);
**Sinnoh nodes for the #73 areas (#85)** — the last 18-leftover crumb;
**Lumiose real map (#87)** — Alex's uploaded city map replaced the
schematic SVG, 20 nodes recalibrated to actual badge positions via
pixel-luminance search; **SwSh DLC (#88)** — Isle of Armor (16 zones/317
slots) + Crown Tundra (14 zones/350 slots) with wild-area-convention
encounter tables (weather + version splits verified against official
exclusives lists), Galar map nodes on both insets, 859 species after
regen, five PokeAPI default-variety slug fixes (frillish-male etc.) + a
sprite-alias sweep for form-suffixed slugs.

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources; lower-confidence data is flagged in the PR
  body, never silently shipped as fully-sourced.
- Generated files (`species-data.json`, `species-lines.json`) are never
  hand-merged — resolve conflicts by regenerating against the merged
  dataset state.
