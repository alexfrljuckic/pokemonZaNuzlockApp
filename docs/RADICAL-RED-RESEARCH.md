# Radical Red — support research & implementation plan

Status: **research / not started** (2026-07-06). This is a scoping doc, not a
commitment. Tracks what supporting the **Pokémon Radical Red** romhack would
take. The single work tracker is still `docs/BACKLOG.md`; this doc is the
provenance + design detail behind that entry.

## What Radical Red is

A **FireRed (Gen 3 / GBA) difficulty romhack** — Kanto map, but heavily
modernized. Current release **v4.1** (Gen 9 DLC mons + character
customization). Relevant mechanics:

- Physical/Special split + **Fairy type**; abilities & moves through Gen 8–9.
- **Soft level cap tied to the *next boss*** — you cannot meaningfully
  overlevel past the upcoming gym/boss. This is *exactly* our engine's
  `next_boss_set` + level-cap model. Best possible fit.
- **Hardcore vs Normal** difficulty modes (Hardcore = max-IV/EV bosses,
  optimized sets); **forced Set battle style** and **no bag in boss fights**.
- Expanded/reusable TMs, extra tutors, Mega Evolution, raid dens.
- ~46 major boss battles (12 gyms, E4, ~10 rivals, others), ~54 encounter
  locations, ~600+ obtainable species as wild encounters.
- Rebalanced base stats / reassigned abilities / **custom movepools** for a
  large fraction of the dex, plus custom evolution methods.

Radical Red is one of the most-nuzlocked games that exists → real demand.

## Why this is different from every game we support today

This is the **first candidate that is not Switch-era, not mainline**, and the
first where our **PokeAPI-generated species data is actively *wrong*** rather
than merely incomplete:

1. **Species data divergence.** `packages/datasets/generated/species-data.json`
   (stats/types/abilities/movepools/evolutions) is generated from PokeAPI,
   which describes *mainline* species. Radical Red rebalances stats, reassigns
   abilities, and gives **custom learnsets**. A RR player checking "what can X
   learn / what are its stats" needs **RR's** data, not PokeAPI's.
2. **No PokeAPI version group.** Every current game keys move/learnset
   generation off a `pokeapiVersionGroups` slug (e.g. `legends-za`). Radical
   Red has none — PokeAPI knows nothing about it. The generation pipeline
   (`build-species-data.mjs`, movepools, machines) has **no upstream source**;
   RR data must come from RR-specific documentation.
3. **Version identifiers are romhack versions** (`v4.1`), not PokeAPI slugs —
   minor validator/type accommodation for a game with no
   `pokeapiVersionGroups` / no PokeAPI `versions`.

Everything else — event-sourced engine, rules-as-data, `areas`/`milestones`
schema, level-cap derivation — is game-agnostic and needs **no** change.

## Canonical data source

Target is **base Radical Red v4.x** (Kanto + Sevii post-game, 8 Kanto
leaders). Two Google Sheets are in play; public sheets export per tab as CSV
via `.../export?format=csv&gid=<gid>` so the generator can pull directly.

**PRIMARY — Encounter / obtainability sheet (base Radical Red).** This is the
wild-encounter source → `areas[].encounters[]`.
id `15mUFUcN8250hRL7iUOJPX0s1rMcgVuJPuHANioL4o2o`. 12 tabs, one per *method*:
`Grass & Caves` (gid 0), `Fishing & Surfing` (955089917), `Fossils`
(1177205447), `Safari Zone` (2109178889), `Statics & Special Pokémon`
(241244610), `Raid Dens` (841196022), `Egg Vendor & Game Corner` (806620788),
`Trades` (952974556), `Gifts` (1585451773), `Mystery Gifts` (1403913857),
`Unobtainables` (962831839), `Main` (index). Each method tab is a **wide
matrix**: row 0 = location names (Route 1, Viridian Forest, Mt Moon 1F, … +
Sevii: Kindle Road, Treasure Beach, Berry Forest, Three Island…), row 1 =
repeating `Rarity | Pokémon | Level` sub-headers, then data rows (verified:
real species + `20%`/`5%` rarities + `3-5` level ranges). Parser: key off the
header row to find each location's `Pokémon` column (there is a spacer column
between blocks — don't assume fixed stride), read `col-1/col/col+1` down.
Method comes from which tab. Comprehensive and clean.

**NOT this target — "Radical Rogue" gauntlet sheet.** id
`1QrgIxwUDfWU5cbdTiPJZVGr-FK6lTi66gqEbgcLgkaw`. This documents a *different*
variant (Radical **Rogue**: remixed Johto+Kanto boss gauntlet, loot-box/rogue
mechanics), NOT base Radical Red — parked as a possible future separate game.
Its useful trick: every trainer team links a **pokepaste** whose `/raw` is
clean Showdown format, and it has an 18-entry level-caps tab. See "gauntlet
sheet" note below.

**Boss rosters + level caps for base RR** are NOT in the encounter sheet →
source them from the community **Showdown-format trainer gists** (per version
+ Hardcore/Normal mode; e.g. `Rudo2204/*` for v4.0/v4.1) plus the documented
base-RR caps (Brock 16 → Misty 28 → Surge 36 → … → E4 85).

### PRIMARY — RR-accurate species data (SOLVES RR2), verified 2026-07-06

The hardest piece — RR's rebalanced **stats / types / abilities / movepools /
moves / evolutions** — exists in **canonical Pokémon Showdown data format**,
versioned per RR release, in the RR Showdown fork:
**`github.com/RadicalRedShowdown/pokemon-showdown`**, dir
**`data/mods/gen9rr4.0/`** (v4.0) and **`data/mods/gen9rr/`** (latest;
also `gen8rr3.1`, `gen8rr2.3` for older). Repo is actively maintained
(pushed 2026-07). Each mod folder has `pokedex.ts`, `learnsets.ts`,
`moves.ts`, `abilities.ts`, `items.ts` — RR entries use `inherit: true` and
override ONLY the changed fields (clean deltas over vanilla).

Authenticity **verified**: `gen9rr4.0` Kleavor = `baseStats hp85/atk135/def95/
spa30/spd70/spe85` (vanilla is hp70/spa45), `abilities {Sheer Force, Technician,
H: Sharpness}`, custom `evoType: useItem / evoItem: King's Rock` — all
RR-specific, absent from vanilla Showdown. This is the RR2 source of truth;
the Google-Sheet route for species data is unnecessary.

Caveat: Showdown uses squashed IDs (`kleavor`, `mrmime`, `landorustherian`)
vs our PokeAPI slugs (`kleavor`, `mr-mime`, `landorus-therian`). RR2's
generator needs a Showdown-ID → PokeAPI-slug map — we already maintain
Showdown aliases in `apps/web/src/lib/sprites.ts`; extend/reuse that.

### Cross-check UIs (not primary sources, for spot-verifying)

`romhackdex.net/radical-red/` (full dex incl. learnsets/evos),
`dex.radicalred.net` (official, rebuilding), `funnotbun.github.io` (repo
`funnotbun/funnotbun.github.io` has a scraped dex under `data/`),
`calc.radicalred.net` + `apescasio.fr/apecio/docs/` (official calc + buffs/
nerfs docs). Also `RadicalRedShowdown/damage-calc` and `.../randbats` for
sanity-checking sets.

### SECONDARY — base-RR boss teams sheet (Normal mode), verified 2026-07-06

id `1QrgIxwUDfWU5cbdTiPJZVGr-FK6lTi66gqEbgcLgkaw`. 42 tabs, geographic in
progression order. **CORRECTION (was mis-tagged "Radical Rogue = different
game"):** this Sheet documents **base Radical Red, Normal-mode boss teams** —
verified against the base-RR Normal gist by exact-matching two bosses:
- Lt. Surge (gist id `0x1a0`) = Pincurchin/Vikavolt/Bellibolt/Pawmot/Manectric
  (+ Manectite) — identical in Sheet and gist.
- Erika (`0x1a1`) = Rillaboom/Meganium/Meowscarada/Electrode-Hisui/Venusaur
  @ Lv 43-44 — identical (Hardcore Erika is a different 6-mon team, so the
  Sheet is specifically **Normal** mode).

The "Radical Rogue" branding is just extra tabs (Loot Box Roulette, Rogue Home,
Save-File Rewards, Code Roulette) for a sub-mode we DON'T support — ignore
those; the location/boss tabs are base RR.

Each location tab lists the boss/trainer teams you fight there with **concrete
levels + EVs/IVs + a pokepaste URL per team** whose `/raw` is clean Showdown
format → drops straight into `roster[]`. Tabs hold MULTIPLE teams (gym trainers,
rival, the leader); the boss team is the one whose max level == that boss's cap.
This is the cleanest **Normal-mode roster** source (concrete levels, unlike the
gist's relative "Max Level −N"). It does NOT cover wild encounters (that's the
other sheet) and does NOT carry Hardcore teams (use the Hardcore gist for those).

Note its own "Level Caps & Codes" tab (gid 0) is Rogue-mode caps and does NOT
match base RR — use the base-RR gym caps (14/27/34/44/59/68/76/81, sourced
below), NOT this tab.

Parsing recipe: export each tab `.../export?format=csv&gid=<gid>`, scrape the
pokepaste URLs, fetch each `https://pokepast.es/<id>/raw` → Showdown parse →
`roster[]`; pick the boss team per tab by matching max level to the cap.

Supplementary machine-parseable sources found during research:
- **Boss/trainer teams** — GitHub gists in **Pokémon Showdown import format**
  (`Species @ Item / Ability / Level / IVs / Nature / 4 moves`), published
  **per version and per mode** (Normal/Hardcore). Regex/line-parseable.
  e.g. gist `Rudo2204/ed23cfda024998b566128318963ea7a5` (v4.1 Hardcore).
- **Encounter locations** — v4.1 location guide as spreadsheet/PDF (Scribd),
  routes × method × rarity × level range.
- **Custom dex/movesets** — community moveset database (darkbooker) capturing
  RR-specific stats/movepools.

Dataset PRs must cite these (project rule). Prefer the Google Doc as primary;
gists/guides as cross-checks.

## How it maps onto our schema

| RR concept | Our model | Notes |
|---|---|---|
| ~54 encounter locations | `areas[] → encounters[]` | Kanto is small/bounded. `methods` per slot (grass/surf/etc.). |
| ~46 boss battles + caps | `milestones[]` w/ `aceLevel`, `roster`/`rosterByStarter` | Caps: Brock 16 → Misty 28 → Surge 36 → … → E4 85. Showdown-format gists parse straight into `roster`. |
| Set forced / no bag / raids | `mechanics` flags + honor `RuleDef`s | See difficulty model below. |
| Difficulty (Normal/Hardcore/Easy) | run-level difficulty pick → `roster` variant | See difficulty model below. |
| RR-accurate stats/moves | **NEW: per-game species override layer** | The one real architectural addition — see below. |

## Difficulty model — match what RR actually ships (v4.1)

RR's difficulty is **two independent axes** chosen at game start, NOT a single
Normal/Hardcore switch. Mirror both.

**Axis 1 — difficulty tier (mutually exclusive; changes boss ROSTERS):**
- **Normal** — the standard curated difficulty (default).
- **Hardcore** — hardest. Bosses have max IVs + optimized EV spreads / movesets
  / held items; some route trainers become minibosses; the game restricts the
  *player's* weather abilities & set-up moves; **forced Set**; **no bag vs gym
  leaders / select bosses**; soft level cap on next boss. **Auto-bundles
  Minimal Grinding.**
- **Easy** — easier than Normal (boss mons carry no EVs); still harder than
  vanilla.
- **Randomizer** — a separate mode that randomizes encounters/teams per seed →
  **not curate-able, out of scope** (flag as unsupported).

**Axis 2 — combinable toggles (don't change the roster species, change
player-facing rules / stat spreads):**
- **Minimal Grinding** — perfect IVs free, NO EVs for player *or* AI, trading
  forbidden. Combinable with Normal/Easy; forced on in Hardcore.
- **Restricted** — bans broken/set-up-cheese team comps for the player.

Community boss data (the trainer gists) is published exactly along these axes:
`{Normal|Hardcore|Easy} × {Mingrind|No-Mingrind}`. For OUR tracker (we display
rosters + enforce caps, we do NOT simulate battles) this collapses to:

1. **Difficulty tier → roster variant.** Add a per-milestone
   `rosterByDifficulty` map (analogous to the existing `rosterByStarter`), or
   store the chosen tier in run config and select. Populate Normal + Hardcore
   first (the two most-tracked; nuzlocke.app itself ships only those two);
   Easy optional. Mingrind's IV/EV deltas we can ignore for tracking.
2. **Player-facing restrictions → honor `RuleDef`s** (tracked + displayed,
   never enforced — the whole point of "honor" rules): forced Set, no-bag-vs-
   boss, Minimal Grinding (no EVs / perfect IVs / no trading), Restricted
   (no set-up cheese). These condition on the chosen tier via `appliesTo`.
3. **Level caps** — shared progression across tiers (enforced `RuleDef`, already
   supported). Hardcore just enforces them in-game; we cap-gate identically.
4. **Randomizer** — unsupported; surface a clear "not supported" note.

## The one real architectural addition: per-game species overrides

To display RR-accurate stats/abilities/movepools we need a layer that overrides
the global generated dex **for this game only**, without polluting mainline
data. Options (decide at implementation time):

- **`speciesOverrides` in the game JSON** — RR-specific stat/ability/move deltas
  live in `radical-red.json` (or a sibling generated file built from the RR
  Showdown mod). Injected via `EngineContext`/app data-loading the way
  `speciesToLine` is. Keeps "game content is JSON" intact.
- **A generated `species-data.radical-red.json`** built by a new script that
  parses `data/mods/gen9rr*/{pokedex,learnsets,moves,abilities}.ts` (see the
  verified source above) — mirrors the existing generator pattern
  (`build-species-data.mjs`), never hand-merged.

Whichever: the app must **fall back to the global dex** when RR has no override
for a species (degrade-to-correct-enough), and clearly source-label RR data.

## Phasing (proposed — see BACKLOG for the live task list)

- **Phase 1 — playable tracker (encounters + caps + difficulty).**
  `radical-red.json`: areas/encounters (from the base-RR obtainability sheet) +
  milestones with the shared level-cap progression and boss rosters. Build the
  **difficulty-tier scaffold** (run-level Normal/Hardcore pick →
  `rosterByDifficulty`) and populate **Normal + Hardcore** rosters from the
  trainer gists (the two tiers nuzlocke.app itself ships). No interactive map
  yet (dataset degrades gracefully). Species data shown is still PokeAPI
  (flagged as not-yet-RR-accurate in UI).
- **Phase 2 — RR-accurate species data.** Add the species-override layer +
  generator against the RR Showdown mod (`data/mods/gen9rr*`). Correct
  stats/abilities/movepools/evolutions.
- **Phase 3 — polish.** Honor `RuleDef`s (forced Set, no-bag-vs-boss, Minimal
  Grinding, Restricted) conditioned on tier; optional Easy-tier rosters; Kanto
  interactive map (reuse/extend existing Kanto art); raid-den encounters.

## Open questions / risks

- **Easy tier** — ship it, or Normal + Hardcore only (as nuzlocke.app does)?
- **Version pin** — target v4.1 data (`gen9rr` latest) or v4.0 (`gen9rr4.0`)?
  Pin one and cite it; RR data churns across releases.
- **Hardcore vs Normal** — ship one or both? They diverge on boss rosters
  (and arguably encounters). Two datasets vs one dataset + toggle rule.
- **Version churn** — RR updates break data (v4.0→v4.1 shifted teams). Pin the
  dataset to a stated version and cite it, like any dataset PR.
- **Scope creep** — RR adds Megas/raids/custom evos; Phase 1 must stay
  encounters+caps or it never ships.
- **Sprites** — RR uses mostly standard species; existing Showdown sprite
  aliasing (`lib/sprites.ts`) should cover it, custom forms excepted.
