# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`. Last reconciled with git history:
2026-07-05 session END (PRs #112–#137 merged; numbered backlog EMPTY) —
when in doubt, trust `git log --oneline --merges main` over this file.

## NEXT SESSION STARTS HERE (state as of 2026-07-06, waves 4–6 #166–#185 + evening #197–#205 merged)

**App is LIVE at https://nuzlocke-tracker-app.vercel.app.** Auth is
OAuth-only (Google + Discord, verified end-to-end; magic-link email
REMOVED — rate limit). All Supabase migrations through
**20260706000000** are APPLIED (verified live: profile-not-found fixed,
search scrape blocked). Security headers verified live. No open PRs.

**Queued for next session: GU1–GU3 (BDSP Grand Underground)** — scoped
below, research already done (`docs/BDSP-GRAND-UNDERGROUND-RESEARCH.md`).
Start with GU1 (fossil fix, small + independent), then confirm the GU3
progression-tier scope with Alex before building GU2.

## 2026-07-08 session B — verification pass + reconcile (no code shipped)

Autonomous pass while Alex was AFK. Went hunting for the next buildable
backlog item and instead found the numbered backlog is genuinely EMPTY and
most "deferred / follow-up" notes below are **stale — the work is already on
`main`**. Verified each against the code/data (not memory), evidence in hand:

- **sneasel→weavile / gligar→gliscor "at night" label — DONE.** species-data
  carries `timeOfDay:"night"` for both razor-claw/razor-fang evos and
  `requirementLabel()` in `apps/web/src/lib/speciesData.ts` appends
  `timePhrase()` in the held-item branch. The "held-item branch drops the
  night qualifier" note (repeated in several sections below) is obsolete.
- **Old Chateau Rotom static — DONE.** `old-chateau` carries `rotom` as a
  `static` slot gated `conditions.time:["night"]` (+ gastly walk 100%). The
  "ghost-event statics (unsourced)" note is obsolete.
- **Great Marsh + Trophy Garden rates — DONE.** `great-marsh` has 22 species
  on `safari` slots with rates; `trophy-garden` has 21 with rates. The
  "deferred — need two-source-agreed %s" note is obsolete.
- **Standalone `tsc -p apps/web/tsconfig.json` — PASSES clean** (exit 0). The
  "lacks engine paths (cosmetic)" note is obsolete.
- **Boss rosters are 100% move-documented in ALL six games** (bdsp 115/115,
  lgpe 64/64, swsh 77/77, sv 128/128, pla 18/18, rr 270/270 across
  roster/rosterByStarter/rosterByDifficulty/rosterByDifficultyAndStarter).
  The run-wipers are fully covered.
- **No empty/stub encounter areas** anywhere (the 5 PLA arenas are empty by
  design — noble battle stages, no wild spawns).

**The ONE real remaining substantive gap: LGPE/SwSh/SV *area-trainer*
movesets (0 of 350/177/301 documented).** These currently render via the
honest `resolveTrainerMoves` "expected moves" fallback (last-4 level-up ≤
level, level-up data present per game — verified working). Filling them with
*documented* moves is **BLOCKED on a source, not on effort**: both Serebii
and Bulbapedia list LGPE/SwSh/SV route trainers with **species + level only,
no per-Pokémon movesets** (verified live on Bulbapedia's Kanto Route 3 LGPE
table + Serebii). This is exactly why BDSP needed Hematite's datamine sheet
(memory `bdsp-trainer-datamine`). So the deferred "or I source per-route"
option is NOT viable for movesets — it needs a datamine sheet from Alex per
game (LGPE/SwSh/SV each). Trainer *presence/teams* are complete; only the
per-mon move detail is missing, and a wrong route-trainer move can't wipe a
run the way a missing trainer can, so the fallback is an acceptable interim.

Left genuinely open (need Alex's input, unchanged): trainer-moveset datamine
sheets (above); RR non-gym bosses deferred for ambiguity (Brendan @ Fuchsia,
a possible May fight, Cerulean Giovanni double — don't fabricate); ~10 Z-A
movepool SEREBII_SLUG 404 forms (network-fragile, tiny payoff).

## Shipped 2026-07-08 — BDSP data completeness + map/encounter UX (#244–#256)

Owner-driven session. A missing rival fight wiped a run, which snowballed into a
full BDSP trainer/encounter completeness pass plus a batch of map/encounter UX.
All merged on green CI; app deploys via Vercel.

Team Galactic + trainers/bosses:
- **#244** Commander Jupiter added to Eterna City (the Galactic Eterna Building
  boss was missing; grunts were there but not her).
- **#245** completed all **9** mandatory Team Galactic commander/Cyrus battles
  (Mars ×3, Jupiter ×2, Saturn ×2, Cyrus ×2 — added the 3 missing Veilstone-HQ /
  Lake-Verity fights) with full datamined movesets, and gave the villains their
  **character sprites** via a new name-based `trainerSpriteKeyFor` (Commander/
  Galactic Boss classes have no sprite).
- **#246** cross-game boss-sprite audit — PLA nobles / SV titans → mon sprites
  (via `species`), Z-A rivals (naveen/urbain) + RR Kanto E4 (agatha-gen1 etc.)
  → real trainer sprites. 20 silhouettes fixed; genuinely-spriteless ones left.
- **#247 BDSP trainer completeness (+33 trainers) + exact datamined movesets.**
  Audited all 72 non-underground areas (Serebii/Bulbapedia) → +33 missing
  trainers (396→429). Then joined **Hematite's datamined trainer sheet**
  (Kaphotics 1.1 dump — see memory `bdsp-trainer-datamine`) by exact team
  composition → **844/857 area-trainer mons got exact moves + abilities + held
  items** (98.5%; cards now show "documented" not "expected"). The join also
  VERIFIED 414 rosters against game data.
- **#248** the 2 missing **Barry** story fights (Hearthome L21 — the wipe — +
  Canalave L37) from the datamine, per-starter variants. BDSP now tracks all 5
  Barry story battles (Spear Pillar L45 = ally, postgame rematches excluded).

Map + encounter UX:
- **#249** frontier "up next" scoped to the current map's nodes (the 19 off-map
  Grand Underground areas were flooding the window and blanking the Sinnoh
  highlight) + `highlightAllNodes` so all underground nodes glow on the busy art.
- **#250** desktop side-by-side Routes layout (encounter panel beside the map,
  not below) + the open encounter section persists across tab switches
  (`openAreaId` lifted to RunView).
- **#251** map click boxes get a visible resting outline (see updated memory
  `map-clickbox-sizing`).
- **#252 → #253** time-of-day encounter display: per-species time chips, with
  time-EXCLUSIVE spawns flagged; concise icon form (🌅/☀️/🌙, words in tooltip).
- **#254** the Routes details column is height-capped to the map and scrolls
  internally (ResizeObserver in RoutesTab) so the two match in length.
- **#255** floor-restriction badges for multi-floor caves (`conditions.floor`,
  55 slots across 7 areas: Gible→B1F, Feebas→B1F, summit-only mons, …). Sourced
  per-floor; also removed a Victory Road data error (remoraid isn't in BDSP).
- **#256** +6 missing Mt. Coronet species (cleffa/bronzor/chimecho/dratini/
  dragonair/loudred, 19→25) + corrected 4 Gen-4-typo fishing rates. Confirmed
  BDSP fishing = DP tables (no wider audit needed).

**Remaining follow-ups (deferred, flagged in PRs):** extend the trainer
completeness + datamined-moveset treatment to the **other games** (LGPE/SwSh/SV
have community datamine sheets; PLA has no route trainers; RR uses its Showdown
data; Z-A is too new) — **UPDATE 2026-07-08 B: "or I source per-route" is NOT
viable for movesets — Serebii + Bulbapedia list these route trainers with
species+level only, no per-mon moves (verified). Needs a datamine sheet from
Alex. See the "session B" section at the top.** Minor:
Chimecho's per-floor rate stored as one value; a few hand-entered BDSP fishing
rows worth a typo spot-check (not systemic).

## Shipped 2026-07-07 evening — spectator parity + Grand Underground (#239–#242)

Owner-requested batch, all merged on green CI:
- **#239 spectator view parity.** The spectator (shared read-only) view now
  reuses the owner's `TeamBoxTab` / `MilestonesTab` / `RulesTab` in read-only
  mode (`runId`/`onChange` omitted — the same pattern MonCard/MilestoneCard
  already used) instead of hand-rolled markup that had drifted. Fixes: route
  trainers no longer land in the timeline "Bosses" filter (new `trainer` tone
  + "Trainers" chip; "Bosses" = milestone_cleared only); boss-roster held
  items render as `ItemSprite` (parity with team cards); the Rules tab shows
  the full preset rules + definitions + active params read-only, not just
  house rules.
- **#240 GU1 fossils.** All 7 fossils relocated from `oreburgh-mine` (revival
  spot) to `grand-underground` (dig site); Cranidos=BD-only, Shieldon=SP-only,
  +5 both-version (omanyte/kabuto/aerodactyl/lileep/anorith).
- **#241 GU2+GU3 — 18 hideaways + progression tiers.** Replaced the 4 generic
  placeholder hideaways with the real 18 (bdsp 77→91 areas, 828 slots, +4
  species). Version splits re-sourced from **raw Bulbapedia wikitext**
  (`action=raw`, BD|SP markers read verbatim, anchored by Misdreavus=SP /
  Gastly=both) — corrected several backwards first-pass flags (ice
  Seel/Dewgong=BD vs Spheal/Sealeo=SP; volcanic Growlithe=BD vs Vulpix=SP).
  New display-only `EncounterSlot.tier` (1 base…6 National Dex) + schema field
  + `EncounterForm` badge ("Nat'l Dex"/"Icicle Badge"/…); the app can't gate
  on it (no TM/Dex tracking) so it's an honor-style label.
- **#242 Grand Underground map.** `bdspUnderground.jpg` wired as an alt-map
  toggled on top of Sinnoh ("⛏ View Grand Underground" / "← Back to Sinnoh"),
  18 hideaways as clickable nodes. Node positions APPROXIMATE (the source art
  labels items, not hideaways). Verified live end-to-end.

**GU follow-up (minor, deferred):** Fountainspring Cave's tier-6 National-Dex
roster is shorter than the other water caves and single-sourced — its
species/tiers are raw-verified, only postgame *completeness* wants a later
eyeball. Everything else high-confidence.

## Shipped 2026-07-07 session (#207–#219, all merged to main on green CI)

A parallel-agent batch (worktrees, merged only on green CI). Owner-reported
bugs + UX asks + RR1 completion + a big BDSP completeness pass:
- **#207** mobile map tooltip says "double-tap" (the touch preview→resolve
  gesture needs a quick double-tap; slow taps lose hover state to emulated
  mouseleave/blur — copy now names the working gesture). RouteMap.tsx.
- **#208** cross-device run sync — REAL BUG fixed. Sign-in only *pulled*
  remote runs; local runs pushed only when a run was reopened, so runs made
  before sign-in never left the device. Added `pushAllRuns` (mirror of
  `pullAllRuns`); sign-in now push-then-pull. Stranded runs self-heal on next
  signed-in open. Degrade-to-free preserved (no-op when sync off).
- **#209** nature stat arrows — `lib/natures.ts` (all 25 natures, HP never
  affected, neutrals blank); ▲ raised / ▼ lowered on MonCard stat bars.
- **#210** RR per-tier boss rosters (RR1 FINISHED) — `rosterByDifficulty`
  schema + validator (normal==aceLevel, hardcore aceLevel..+3) + tier-aware
  `milestoneRoster` (`difficultyForPreset` rr-normal→normal / rr-hardcore→
  hardcore; mainline untouched). Normal+Hardcore teams for 8 gyms + E4 +
  Champion from Rudo2204 RR v4.1 Showdown gists. Caught + flagged that the
  research doc's "Normal" sheet was actually Radical Rogue. Rivals/Rocket
  admins deferred (ambiguous slot; not fabricated).
- **#211** Continue screen redesign → game-tinted save-file cards w/ live
  team sprites (`lib/runCard.ts`), status pill, progress chips, empty states.
- **#212** BDSP completeness I — 17 missing route areas (incl. 219/220/221;
  N/S + W/E splits) + 68 town/building trainers (Jubilife Trainers' School +
  TV, all 8 gym interiors, Galactic buildings). bdsp 63→80 areas; +2 species
  (ledian, granbull). Serebii/Bulbapedia-sourced, low-confidence flagged
  (route-224 Lv-23 parse anomaly + Natu-swarm mis-parse OMITTED).
- **#213** weakness display now also shows Resists (½/¼) + Immune (×0) via
  `lib/typeChart.ts` `resistances()`/`immunities()`. (LAYOUT follow-up: gets
  unreadable when the resist list is long — redesign in progress, owner
  choosing between aligned-columns vs multiplier-buckets.)
- **#214** item access tooltips — optional `access` field (enum field-move
  slugs) on items + "Requires Surf" badges in ItemsHere; 27 BDSP + 15 LGPE
  items annotated (SwSh/SV are HM-free). `locationHint` field wired, unused.
- **#215** placed the 17 new BDSP routes on the Sinnoh map (sinnoh.ts).
  Coordinates are GEOMETRY-DERIVED (preview tooling was broken all session) —
  WANT a visual calibration pass.
- **#216** BDSP completeness II — non-route wild areas. Most already existed
  w/ tables; created fuego-ironworks + sendoff-spring, added heatran +
  giratina-altered statics + 3 Ramanas legendaries (latias/latios/mewtwo).
  bdsp 80→82. Great Marsh (Safari) / Trophy Garden (rotation) rates DEFERRED
  (need deeper sourcing — don't ship fabricated %s).
- **#217** dupes-clause species now shown DIMMED, not hidden (owner request):
  new engine `classifyEncounterPool` (single source of truth;
  `filterEncounterPool` derives from it) tags each slot available vs
  excluded:'dupes-clause'. Only dupes dims; version/alpha stay hidden.
  All-dimmed area still shows species + Skip. RoutesTab + AreaList.
- **#218** encounter pool grouped BY METHOD — Walking/Surfing/Fishing/Other,
  real per-method rates (Psyduck: Walking 2% + Surfing 30%, was a misleading
  merged "walk/surf 30%"). Data was already correct (per-method slots); this
  was a display fix in EncounterForm's `uniqueSlots`. Fishing rod-tiers
  broken out; #217 dimming preserved per group.
- **#219** chore: giratina-altered sprite alias (Showdown uses plain
  `giratina` for Altered Forme) + this reconcile.

**Shipped 2026-07-07 session, continued (#220–#232, all merged on green CI):**
- **#220** weakness/resist layout redesign — Option A (aligned label column +
  count + per-chip multiplier, hairline between groups). Fixed #213's
  unreadable long-list stacking. WeaknessRow.tsx + index.css.
- **#221** calibrated the 17 new BDSP route nodes on the Sinnoh map
  (geometry-anchored to neighbour cities; backdrop PNG is 806×688 = viewBox,
  1:1 pixels). #222 map-node audit: all other games already calibrated;
  added fuego-ironworks/sendoff-spring nodes + RR route-21a/forest-expansion/
  diglett-cave (RR floor-splits + Sevii stay list-only by design).
- **#223 + #224** held-item sprites in the condensed mon row + picker list
  (Showdown itemicons; text fallback on 404), bumped to 28px.
- **#225** BDSP route de-split — merged 204/205/210/211/212 N/S + W/E halves
  back into one route each (one route number = one first-encounter). bdsp
  82→77 areas; method grouping shows the combined pool. Engine untouched.
- **#226 RR2 — RR-accurate species data.** New per-game override layer parsed
  from the RadicalRedShowdown gen9rr4.0 `pokedex.ts`/`learnsets.ts` (inherit
  deltas): `statsByGame`/`typesByGame`/`movesByGame`/`levelUpMovesByGame`
  ['radical-red'] + game-aware `typesFor`/`statsFor`. 196 stat / 29 type /
  981 movepool overrides; mainline byte-for-byte unchanged.
- **#227 edit a Pokémon's Ability** — engine `ability` on PokemonInstance +
  `pokemon_updated`; per-species `abilities` in species-data (PokeAPI);
  `abilitiesFor(species, gameId?)`; MonCard Ability picker gated by a
  `hasAbilities` GameAppConfig flag (off for LGPE). **#228** added RR-accurate
  ability overrides (`abilitiesByGame['radical-red']`, 337 species).
- **#229 RR non-gym bosses** — 9 milestones (rival Terry ×3 + Brendan ×2,
  Giovanni ×3-ish, Archer/Ariana), `countsForLevelCap:false`. New additive
  engine field `rosterByDifficultyAndStarter` (difficulty→starter→team,
  checked first in `milestoneRoster`) since RR rivals are starter-dependent
  per tier. RR now 22 milestones. Teams from the Rudo2204 v4.1 gists.
- **#230** defeated trainers show "✓ defeated" + dim the row like a cleared
  boss card; **#232** adds an always-visible "Defeated" mark button on the
  trainer condensed row (no need to expand), matching the boss cards.
- **#219 + #231** chore reconciles (this file, earlier in the session).

**RR is now data-complete**: accurate stats/types/movepools/abilities +
gyms/E4/Champion/rivals/Rocket boss tracking. Preview MCP tooling recovered
mid-session — the visual PRs (#211/#213/#218/#220/#223) were re-verified live.

**Remaining follow-ups (all minor / deferred-by-design):**
- ~~**Great Marsh + Trophy Garden** precise Safari/daily-rotation rates~~ +
  ~~**Old Chateau** ghost-event statics~~ — **DONE (verified 2026-07-08 B):**
  both Marsh (22 spp) + Trophy Garden (21 spp) carry full rate tables and
  Old Chateau carries the night-gated Rotom static. See "session B" at top.
- **RR non-gym bosses deferred** (from #229): Brendan @ Fuchsia (low-
  confidence mandatory), a possible "May" fight (unsourced in base Kanto),
  the Cerulean Cave Giovanni double. RR3 tier-conditioned honor-rule display
  + raid dens.
- ~10 Z-A movepool `SEREBII_SLUG` overrides (form 404s fall back to the union).
- PLA `icepeak-cavern` + `wayward-cave` are correctly list-only (the in-game
  zone map doesn't label those caves — not a gap).
- ~~Standalone `tsc -p apps/web/tsconfig.json` lacks engine `paths`~~ — **DONE
  (verified 2026-07-08 B): runs clean, exit 0.**

## GU1–GU3: BDSP Grand Underground — SHIPPED (#240–#242, 2026-07-07 evening)

**All three shipped** — fossil fix (#240), 18 hideaways + progression tiers
(#241, full fidelity per Alex's call), interactive underground map with
clickable hideaway nodes (#242). Owner chose full fidelity + clickable nodes.
See the "Shipped 2026-07-07 evening" section at the top for detail. Section
below kept as the original scoping notes / provenance.

Full research: `docs/BDSP-GRAND-UNDERGROUND-RESEARCH.md` (moved from scratchpad
after a 2026-07-07 multi-agent research pass — cite it, don't re-derive).
**Alex uploaded `apps/web/public/maps/bdspUnderground.jpg` directly to main
the same day** (commit `12b524f`, "Add files via upload") — likely backdrop
art for this work. Not yet wired into any `GameMap`/`ZONE_MAPS` entry; check
its dimensions/labels before assuming it matches the 18-hideaway layout
above, and confirm with Alex what it's for before building a map around it.
**The gap is real and bigger than the 4 hideaways we model.** BDSP's Grand
Underground has **18 hideaways** (7 "Caverns" + 11 "Caves"), not ~16 as
guessed going in — full names, unlock progression, and per-hideaway
encounter tables are all in the research doc, HIGH confidence on the count
and name list, medium-high on 13/18 tables (5 need direct sourcing: Fountainspring,
Riverbank, Sandsear, Spacious, Whiteout Cave — NOT fetched yet, don't guess
their tables). Good news: the 18 aren't 18 independent tables — they collapse
into ~12 shared encounter-list families (e.g. Rocky Cave / Big Bluff Cavern /
Typhlo Cavern all share one base table), so it's less new data than the
headline count implies.

**GU1 — fossil fix (small, independent, do this first).** `bdsp.json`'s
top-level `specials` has only 2 of the real 7 fossils (`fossil-cranidos`,
`fossil-shieldon`) and both are **mis-located** at `area: "oreburgh-mine"` —
that's where fossils are *revived* (Oreburgh Mining Museum), not where
they're found. All 7 are dug up in the **Grand Underground** itself. Fix:
relocate the 2 existing entries + add the missing 5 (Helix/omanyte,
Dome/kabuto, Old Amber/aerodactyl, Root/lileep, Claw/anorith — all
both-version, unlock post-Dialga(BD)/Palkia(SP); Cranidos=BD-only,
Shieldon=SP-only, both available from the start of Underground access). No
schema change needed — reuses the existing `type: "fossil"` special shape.

**GU2 — add the missing hideaways.** Source the 5 unfetched tables (Serebii
`pokemonhideaways.shtml` + the individual Bulbapedia hideaway pages the
research doc cites), confirm Volcanic Cave's family pairing, then add all 14
missing `grand-underground-<name>-hideaway` areas (matching the existing id
convention) with real species/BD-SP splits. Correct the 4 existing hideaways'
species lists against the real tables (ours are genuine partial subsets, not
fabricated, but missing progression-tier species and the BD/SP split —
Stargleam alone has 9 BD-exclusive + 2 SP-exclusive species). None of these
get Sinnoh map nodes — Grand Underground isn't tied to one overworld spot;
they stay in the supplemental list the way the current 4 already do.

**GU3 — progression-tier decision (needs Alex's call before building).**
Real species availability per hideaway gates through 6 steps (Explorer Kit
base → TM96 Strength → TM97 Defog → Icicle Badge → TM99 Waterfall →
National Dex) — same 6 steps uniformly across every hideaway, not
per-hideaway-unique gating. Full 6-tier fidelity is a real schema shape
decision (some `conditions` field expressing tier, vs. today's flat list);
a simplified 2–3 tier approximation (e.g. "early" / "postgame" bucketing,
or just flagging National-Dex-only species) is the lower-effort alternative.
**Do not default to full fidelity without asking** — this is exactly the
kind of scope call that changes the data shape, so confirm before building
either GU2 or GU3's granularity.

**Ruled out / not modeling:** Statues (bias spawn RATE by type, don't add
species to the pool — not encounter-table-relevant); no static/guaranteed
encounters live inside the Underground itself (Regis are Ramanas Park /
Snowpoint Temple, Spiritomb's real fixed encounter is Route 209's Hallowed
Tower, already correctly placed there if modeled — Underground is only a
32-NPC-talk gate for it, not the encounter site).

**Nuzlocke community convention — no consensus found**, despite a real
search effort (guide sites, GameFAQs threads, NuzlockeForums). Every source
frames it as a house-rule call: some players treat each hideaway as its own
route-equivalent first-encounter area, others treat the whole Underground as
one catch. One community (a Communitylocke) used "one per unique area" —
sample size of one, not a standard. Recommendation in the research doc:
model hideaways like any other area under the existing dupes-clause/
first-encounter rules and let the player's own house-rule choice do the
rest (skip machinery already supports "treat it as one catch"); an honor-rule
note in the Rules tab copy is optional polish, not required — no new engine
rule needed.

## RR1–RR3: Radical Red (romhack) support — first out-of-scope game

Full research + design: `docs/RADICAL-RED-RESEARCH.md`. Radical Red is a
FireRed romhack: Kanto map, modern mechanics (Phys/Special split, Fairy,
Gen 8–9 mons/moves), **soft level cap tied to the next boss** (a glove fit
for our `next_boss_set` + cap engine). ~54 encounter areas, ~46 boss
battles. First game that is **not Switch-era, not mainline**, and the first
where **PokeAPI-generated species data is actively wrong** (RR rebalances
stats/abilities and gives custom movepools). Target = **base Radical Red
v4.x** (Kanto + Sevii, 8 Kanto leaders). Data sources (both public Google
Sheets, CSV-exportable per tab — see research doc for ids/gids): **wild
encounters** from the base-RR obtainability sheet (method-per-tab matrices:
grass/caves, fishing/surfing, fossils, safari, statics, raids, trades,
gifts); **boss rosters + caps** from Showdown-format trainer gists (per
version + Hardcore/Normal). NOT PokeAPI. A second sheet documents the
"Radical Rogue" variant (different game — parked). Engine/schema need NO
change except accommodating a game with no `pokeapiVersionGroups`.

**RR1 status — MOSTLY SHIPPED (PR: `feat/radical-red-encounters`).** Landed:
- **Encounters + game registration.** `radical-red.json` (83 areas, 631 wild
  species, 185 specials) generated by `build-radical-red.mjs` + `rr-species-map.mjs`
  from the base-RR obtainability sheet; species-data.json regenerated (all RR
  species resolve). Game config + registry entry + `radical-red` theme.
  `pokeapiVersionGroups: []` (no PokeAPI data; move-levels degrade to "unknown").
- **Level caps.** 8 gym milestones with authoritative caps (14/27/34/44/59/68/76/81,
  from nuzlocketracker guide — Clair is RR's Dragon 8th gym).
- **Map.** Reuses the LGPE Kanto map (RR is Kanto); floor-splits/Sevii/Safari
  fall to the "Other areas" list. Also recalibrated 8 misaligned Kanto nodes
  (benefits LGPE) and gated the frontier auto-zoom to Galar only.
- **Difficulty modes.** RR's preset selector replaced with its real tiers —
  **Normal / Hardcore** ("Difficulty mode"). `buildRuleset` RR branch: soft
  level cap is inherent to EVERY RR mode (always on, unlike other games);
  Hardcore adds forced Set + no-bag-vs-boss + Minimal Grinding. New RR honor
  rules `rr-min-grinding` (auto-paired w/ Hardcore) + `rr-restricted` (opt-in).

**RR1 remaining — per-tier boss rosters (`rosterByDifficulty`).** The tiers
differ in RULES but not yet in boss TEAMS. To finish:
1. Schema: add `rosterByDifficulty` to milestones (analog of `rosterByStarter`)
   + validator (each variant's max level == aceLevel); teach
   `build-species-data.mjs` + `validate.mjs` to traverse it (species/moves).
2. Engine: extend `milestoneRoster(m, starter)` to also pick by the run's tier
   (map presetId `rr-normal`/`rr-hardcore` → difficulty key); thread tier from
   `state.ruleset.presetId` in MilestonesTab.
3. Data — **Normal** teams: parse the base-RR boss sheet
   (`1QrgIxwUDfWU5cbdTiPJZVGr…`, VERIFIED base RR Normal — Surge/Erika match the
   gist) → scrape the per-boss pokepaste URLs → `https://pokepast.es/<id>/raw`
   → Showdown parse → `roster[]`; pick the boss team per tab by max-level==cap.
   **Hardcore** teams: the Hardcore gist (relative "Max Level −N" → resolve
   against the cap). Also add the non-gym bosses (E4, rivals, Rocket admins)
   as milestones. Decision made: Normal + Hardcore only (no Easy for now).
- **RR2 — RR-accurate species data.** New per-game species-override layer
  (schema + generator + `EngineContext`-injection like `speciesToLine`;
  falls back to global dex on miss). **Source is SOLVED**: the RR Showdown
  fork `RadicalRedShowdown/pokemon-showdown` `data/mods/gen9rr4.0/` (and
  `gen9rr` latest) carries RR's stats/types/abilities/learnsets/moves/evos
  in canonical Showdown TS with `inherit:true` deltas (authenticity verified
  — Kleavor buff/ability/evo overrides present). Generator parses those TS
  data files → per-game override JSON, never hand-merged. Needs a
  Showdown-ID → PokeAPI-slug map (reuse `lib/sprites.ts` aliases). AC: RR
  stats/abilities/learnsets match the mod for a sampled set; mainline
  games unaffected.
- **RR3 — polish.** Honor `RuleDef`s conditioned on tier (forced Set,
  no-bag-vs-boss, Minimal Grinding, Restricted), optional Easy-tier rosters,
  Kanto interactive map, raid-den encounters.

**Decisions locked:** Normal + Hardcore only (no Easy). Gym caps sourced from
the nuzlocketracker base-RR guide. Species-data pin (v4.0 vs v4.1) only matters
for RR2 (the Showdown-mod override layer) — decide then.

**Shipped 2026-07-06 evening — Galar map overhaul + map/route UX + social
polish (#197–#204, all merged):**
- **#197 Galar map overhaul + missing Wild Area zones.** Combined base +
  DLC into ONE theme-transparent backdrop and added the 10 Wild Area
  sub-zones the dataset lacked but Serebii/the official map depict
  (dappled-grove, watchtower-ruins, west/east-lake-axewell,
  south/north-lake-miloch, giants-seat, axews-eye, stony-wilderness,
  motostoke-outskirts). swsh 63→73 areas, ~300 weather/version-conditioned
  encounters; +3 species (pidove/unfezant/charjabug) via build-species-data.
  Backdrop is a LANDSCAPE TRIPTYCH (`galar-combined.png` 1218×976): base panel
  centred, Crown Tundra + Isle of Armor insets flanking it, page margin
  flood-filled transparent so `--bg-inset` shows through (matches theme).
  Every area on-map on its official numbered point. Meetup Spot dropped (hub,
  not a route). Serebii Pokéarth is now WebFetch-blocked mid-session → curl +
  parse the HTML (weather is icon-only, so single-table areas can't
  auto-extract weather).
- **#198 frontier "up next" advances by progression order.** frontierAreas
  now orders unresolved encounter areas by unlock-tier (milestone `order`) then
  dataset order and takes the first N — so the highlight advances as areas
  RESOLVE and never goes dark between badges (the map never hard-locks a route).
  Threaded `milestones` through RouteMap/AreaList. Affects all games.
- **#199 + #200 tighter click boxes (all games).** Principle: the frontier
  highlight guides discovery, so click boxes stay small in crowded areas.
  Galar routes 3/4/6/7/8/9 + North Wild Area recalibrated onto their banners
  at ~28–34px; Paldea/Sinnoh/Kanto oversized/overlapping boxes capped toward
  centre. See memory `map-clickbox-sizing`.
- **#201 Find Trainers screen + map layout.** Trainer search + follow feed
  moved off the landing hero into a dedicated `#trainers` screen (button below
  Your Stats) so the landing is scroll-free. Dropped the routes-stage full-bleed
  breakout (`--stage-w`) so the map aligns to the page column; capped the
  desktop map at 60vh so the encounter panel stays in view.
- **#202 search tolerates leading `@`** (handles stored w/o it).
- **#203 → #204 profile is handle-only.** Added editable handle (updateProfile,
  RLS already allowed owner update) + decluttered the account bar (dropped the
  redundant "Sign in to sync" badge). Then REMOVED display name entirely — the
  distinction wasn't worth it; profiles/search/feed identify by @handle. DB
  `display_name` column left DORMANT (client omits it; RPCs still return it,
  ignored) — droppable in a follow-up migration.

- **Landing footer: GitHub + donation links — SHIPPED.** A quiet, muted
  footer on the title screen: "Source on GitHub" → the repo, and "Buy me a
  coffee" → https://paypal.me/projectAF (Alex's PayPal.Me). The coffee link
  renders only when `COFFEE_URL` is set in TitleScreen, so it can be toggled
  off by clearing it. Warm accent on hover; both open in a new tab.

### Tomorrow's work queue (from Alex, 2026-07-06 night) — items 1 & 2 SHIPPED

1. **Regional-form evolution paths per game — SHIPPED (#167).** Per-game
   evolution-target override layer (`apps/web/src/lib/evolutionOverrides.ts`;
   `evolutionOptionsFor(species, level, gameId)`). PLA starters
   dartrix→decidueye-hisui / quilava→typhlosion-hisui / dewott→samurott-hisui
   are INJECTED — the mid-stages aren't in any encounter pool so they had NO
   evolution row at all (that's why the panel showed nothing, not Kanto
   Decidueye). Plus petilil/rufflet/goomy/bergmite Hisui lines; SwSh
   koffing→weezing-galar + darumaka-galar. Every other regional line
   (new-species Hisui evos, Galar cross-gen, LGPE/SV/BDSP/Z-A) was verified to
   already resolve correctly — no bogus overrides added. Tests pin PLA
   starters + koffing. (The "still broken in prod" report was a stale cached
   bundle — a hard refresh shows the fix; verified the live bundle carries it.)
2. **Giant's Mirror "0 available" dead area — SHIPPED (#166).** Chose to HIDE
   version-dead areas over adding a skip button. New engine
   `isVersionDeadArea` / `areasForVersion`: an area that DOCUMENTS encounters
   but has every slot locked to the OTHER version is dropped for the run's
   version (Sword no longer sees the Shield-only Giant's Mirror; Shield still
   does). Towns/item-stops (zero documented encounters) and fully-resolved
   areas stay visible. Engine tests pin both directions. giants-mirror's table
   left minimal (still just corsola-galar) — optional to flesh out.
3. Then the standing pool below (audit judgment calls, optional pool).

**Shipped 2026-07-06 fourth wave (#166–#175, all merged + deployed):** a
10-PR parallel-agent batch — each built in its own git worktree, merged only
on green CI (tests + validate:datasets).
- **#166 Giant's Mirror** version-dead-area hide (item 2 above).
- **#167 per-game evolution targets** (item 1 above).
- **#168 bundle code-splitting**: `vite.config` manualChunks splits vendors
  (react; supabase, gated on sync-on) and generated data (species-data /
  game-data / dataset-meta) out of the app chunk — main app code 2,794 kB →
  147 kB (gzip 460 → 43 kB). species-data.json is one 2 MB JSON module so it
  still trips the 500 kB warning ALONE; fully clearing it needs a dynamic
  import of `speciesData.ts`'s static import (deferred, owned-file at the time).
- **#169 trainer movesets**: centralized `resolveTrainerMoves(mon, gameId)` →
  confirmed | expected (last-4 level-up ≤ level, labelled) | unknown (Z-A has
  no PokeAPI move data → "not documented", never invented). Hardened the
  `?? []` empty-array trap. No phantom bug — normal-trainer fallback was
  already wired; every mon in the 4 games with trainers resolves.
- **#170 Stats panels**: catch-rate-by-area (per-area outcome bars + run
  roll-up + cross-run aggregate) and time-in-run (total duration + per-boss
  bars, timestamp-null-tolerant). New engine selectors in `selectors.ts`.
- **#171 trainer sprites**: generic inline-SVG silhouette fallback (local,
  themeable, offline/CSP-safe, no error loop) so every trainer shows SOMETHING;
  audited all 85 dataset trainer classes, aliased ~15 more to real Showdown
  sprites (Coach/Gym Trainer→acetrainer, grunts, Fisher→fisherman, …).
- **#172 special-condition evolution labels**: real conditions instead of
  "(special condition)" — data-derived (friendship/time/knownMove/location/
  held-item) + curated `evolutionConditions.ts` (Bulbapedia-cited): feebas
  (per-game), sylveon, inkay, pancham, tyrogue 3-way, mantyke, sliggoo(-hisui),
  toxel, milcery, applin, clamperl, karrablast/shelmet, white-striped basculin,
  + more. Left on fallback: sneasel→weavile / gligar→gliscor show just "holding
  Razor Claw" (item right; night qualifier not appended in the held-item branch).
- **#173 Team/Box full-width rows**: reflowed the wrapping grid (which
  mis-spaced on expand) into vertically-stacked full-width rows like the boss
  cards; expanding grows in place. Team/Box/Graveyard stay SEPARATE stacked
  sections (never side-by-side — Alex's standing preference).
- **#174 URL routing** (Alex request): extended the hand-rolled hash router
  (no dependency) — `#run/<runId>/<tab>`, `#share/<token>/<tab>`, `#u/<handle>`;
  tab slugs routes/team/bosses/rules/stats are a STABLE contract (`lib/route.ts`,
  pure + tested). Browser back/forward across tabs, refresh-stays-on-tab,
  spectator tab deep-links, missing-run guard (no white-screen), OAuth hash
  untouched. Deferred: cross-run "Your Stats" + New Game picker left as
  non-URL local state (could add `#stats`/`#new` later).
- **#175 Team/Box card tweaks** (Alex feedback on #173): condensed row shows
  MOVES (type-dotted chips) instead of the stat spark; the WHOLE row toggles
  expand (head stays the keyboard button; action buttons stopPropagation);
  expanded StatBars put the numeric value BEFORE the bar and colour-grade the
  fill by value — <60 red, 60–99 yellow, 100+ green (Alex OK'd the range).

**Shipped 2026-07-06 sixth wave (#183–#185, all merged + deployed):**
- **#183** run-header level-cap chip is now a button that jumps to the Boss
  Fights tab (same navigate path, keeps the `#run/<id>/bosses` hash in sync).
- **#184** graveyard consolidated into Team & Box (Alex's call): dead cards
  surface "Fell to <cause> — <killer>" at a glance; the duplicate Stats
  graveyard list is removed (Stats keeps deaths-by-boss / over-time /
  survival-by-species).
- **#185** SwSh Giant's Mirror wild table fleshed out (weather + version
  splits, Serebii/Marriland-sourced; species-data 880→883). Correction found
  mid-task: it's a BASE-game Galar Wild Area, NOT Crown Tundra DLC — so no DLC
  gate was added. The #166 version-dead-area engine test was updated (Giant's
  Mirror is no longer a Sword dead end now it has cross-version spawns);
  lesson: run ENGINE tests too, not just web, when changing datasets.

**Shipped 2026-07-06 fifth wave (#176–#181, all merged + deployed):**
- **#176** backlog reconcile (fourth wave).
- **#177** whole-card hover on Team/Box (matches boss rows) + next-boss
  picker gated to open-order games via new `openBossOrder` GameAppConfig
  flag (SV only; BDSP/LGPE/SwSh/PLA/Z-A follow dataset order) + restyled the
  button into an accent pill.
- **#178** Z-A hyperspace cross-gen evolutions (meowth-galar→perrserker
  etc., no spurious Kanto options) + "at night" qualifier on Sneasel/Gligar
  Razor-Claw/Fang labels.
- **#179** `#stats` / `#new` hash routes (cross-run Stats + New Game picker
  now deep-linkable; finishes the #174 routing).
- **#180** web workspace fully `tsc --noEmit` clean (MonCard.test fixture
  `origin`; speciesData JSON cast via `unknown`).
- **#181** route map legend (Up next · Available · Caught · Fled/fainted ·
  Skipped), inside RouteMap for spectator parity — UX-audit item done.

**Shipped 2026-07-06 third wave (#160, #162, #163):** #160 Vercel Speed
Insights (bot PR, evaluated + merged — correct Vite/React integration,
CSP additions are dev-script-only, prod script is same-origin; free
Hobby tier per COSTS policy); #163 compact sign-in card (desktop = one
~195px horizontal band, phones = buttons + "Why sign in?" details
collapse — Alex: never push the app down the page); #162 backlog
reconcile.

**Shipped 2026-07-06 second wave (#153–#159, #161, all merged + deployed):**
- **#153** PLA picker tile mascot kleavor → arceus.
- **#154 portrait maps**: Galar (h/w > 1.15) renders a two-column stage
  on ≥1100px — sticky map left, resolve panel + area list right.
- **#155 regional-variant dataset audit** (4 research agents, all 6
  games, every entry Serebii/Bulbapedia-sourced): LGPE all 10 Alolan
  Pokémon-Center trades (type "trade" specials, version-locked pairs);
  SV Paldean Tauros Blaze/Aqua in West Province Two + wooper-paldea ×9
  areas + Galarian Meowth gift + Cascarrafa Johto-Wooper trade; PLA
  icepeak-cavern (zorua/zoroark-hisui — only real gap; outbreak-only
  species stay excluded by design); SwSh slug FIXES (wild zigzagoon +
  route-5 farfetchd are Galarian) + rapidash-galar/weezing-galar/
  darmanitan-galar wilds + NEW giants-mirror area (corsola-galar,
  Shield's only non-raid source; area ships minimal); Z-A 13 hyperspace
  regional forms + SM39/SM108 trade specials; BDSP verified complete
  (none exist). species-data regenerated → 880.
- **#156 wipe flow**: "End this run" now offers "Start a fresh run
  (same game & rules)" — append-only log means restart = new run.
- **#157 boss fights**: full-width horizontal rows (fixed 240px head
  column), "Clear"→"Defeated" everywhere visible, Defeated button on
  the condensed row.
- **#158 sign-in card**: value-prop card (sync/share/follow benefit
  rows) + branded Google/Discord buttons; verified via component test
  with mocked providers (env-gated lesson).
- **#159 run import**: "Import run from file" on Continue; strict
  validation (format marker, version, slug ids, 20k/5MB caps,
  run_started first, seqs renumbered, fresh id ALWAYS minted).
- **#161 UX-audit P2 polish**: reduced-motion animation:none for loops,
  status glyphs (●★⚠✕–), muted-contrast bumps, level-input validation
  (shared clampLevel; "150" no longer passes), SharePopover focus trap/
  restore + aria-modal, Un-evolve confirm-gated, Combobox visualViewport
  reposition, empty-Team CTA → Routes.

**Shipped 2026-07-06 (#148–#151, the full UX-audit P1 stack, merged in
order + deployed):**
- **#148 mobile stylesheet**: sticky bottom tab bar ≤520px (compact
  labels), touch-first map preview (first tap = species/rate tip, second
  tap resolves; mouse/keyboard unchanged), route-tip clamped to the map,
  44px zoom controls under pointer:coarse, minmax(min(100%,280px)) fixes
  320px overflow.
- **#149 desktop layout**: stats 2×3 chart grid (+ cross-run screen),
  Rules 2-col, expanded-card span caps (milestone→2, mon→3), 820px
  tablet breakpoint (#root 960 + map cap lifted), active-tab ring +
  per-tab counts (Team & Box · n, Boss Fights c/t). Team/Box
  side-by-side was built then REVERTED — **Alex prefers those sections
  stacked vertically**; don't reintroduce.
- **#150 onboarding/copy**: title-screen "New to nuzlockes?" explainer
  (details/summary), Rules copy in plain English + enforced/honor
  legend (no backticks/event names), set-mode + dupes + headroom
  glosses. "frontier" is visual-only — map legend left for P2.
- **#151 keyboard a11y**: AreaList headers are real buttons w/
  aria-expanded; ProfileScreen run rows are real links; tabs are a full
  tablist (roving tabIndex + arrow keys, aria-selected); ONE global
  :focus-visible outline rule (outline so box-shadow:none overrides
  can't suppress it; out-specifies outline:none on map regions/boss
  cards); Combobox input ARIA (role/expanded/controls/activedescendant).

**Shipped 2026-07-05 late session (#139–#146, all merged + deployed):**
- **#139/#141/#142 auth**: Google+Discord OAuth (opt-in via
  `VITE_OAUTH_PROVIDERS`, REQUIRED for sign-in now); #141 hotfixed a
  TDZ prod crash (lesson: test env-gated code paths in their ENABLED
  state); #142 removed magic-link email.
- **#143 profiles**: get_profile not-found fix, landing-page trainer
  search (search_profiles RPC), self-service profile delete, back button
  on read-only routes. Account linking by verified email = intentional.
- **#140 + #144 UX**: docs/UX-AUDIT.md (4-dimension audit + follow-up
  assessment of the in-flight PRs) and fixes for every NF-* finding.
- **#145 security**: full-app audit CLEAN (report docs/SECURITY-AUDIT.md);
  hardened: LIKE-escape on search (M1), CSP/XFO/HSTS headers (M2),
  run_events now truly append-only (L3). L4 (realtime pings after share
  revocation) accepted + documented.
- **#146 P0 run robustness** (background-agent built, worktree recipe):
  ErrorBoundary + missing-dataset guard (the white-screen crash is FIXED),
  per-run Delete/Export on Continue (rows are real buttons w/ friendly
  names), confirm-on-destructive (Fainted / Reset route / Reset special)
  via shared ConfirmAction atom. Engine 90 / web 71 tests.

**Still on Alex (low priority):** custom SMTP if email ever returns;
review the landing-page social layout in person.

**CLI tooling:** Vercel CLI installed globally. Supabase CLI = `npx
supabase` (global npm install disabled on Windows).

## UX audit follow-ups remaining (docs/UX-AUDIT.md — P0/NF-*/P1/P2 mechanical: ALL DONE)

- **Frontier map legend — SHIPPED (#181).** The route map now carries a
  legend (Up next · Available · ✓ Caught · ✕ Fled/fainted · – Skipped),
  inside RouteMap so spectator view gets it too; verified live.
- **Next-boss pin discoverability — partly addressed.** #177 gated the
  "fight this next" pin to open-order games only (SV) and restyled it; the
  level cap + next boss already surface in RunSummaryStrip. No further work
  unless Alex wants the pin more prominent for SV.

UX-audit judgment calls — RESOLVED:
- **Graveyard has two homes — DONE (#184).** Alex chose to consolidate into
  Team & Box; dead cards now show the cause at a glance and the duplicate
  Stats graveyard list is gone (Stats keeps the analytical death views:
  deaths-by-boss, deaths-over-time, survival-by-species).
Plus one manual check for Alex: SharePopover's new focus trap needs
sync + a session, which local previews lack — one click on prod.

Security follow-ups (docs/SECURITY-AUDIT.md): L4 realtime private
channels if ever adopted; dev-dependency major-bump pass (npm audit is
all dev-only).

Also still in the optional pool (catch-rate-by-zone + time-in-run SHIPPED
#170; bundle code-splitting SHIPPED #168 — but species-data.json alone
still trips the 500 kB warning; Z-A hyperspace standalone evolutions
SHIPPED #178; giants-mirror table fleshed out #185; **Z-A movepools SHIPPED**
— Serebii-scraped via build-za-movepools.mjs, 420/485 species, gaps fall
back to the union; the first agent hung on a timeout-less fetch and was
recovered): sync seq-collision (out of MVP), and giants-mirror's
Underground + strong-symbol "special encounters" (omitted from #185 for
lack of two-source-agreed per-weather rates — candidate follow-up).
Fourth-wave follow-ups: dynamic-import species-data.json to clear the chunk
warning is the ONLY one still open (a real refactor — speciesData.ts is
imported synchronously in 9 files, so it needs async threading + a load
state; deferred, not cosmetic). The other two are DONE (verified
2026-07-08 B): `#stats`/`#new` URL routes shipped in #179; the
sneasel→weavile / gligar→gliscor night qualifier IS appended in the
held-item branch (`requirementLabel` in speciesData.ts) and the data
carries `timeOfDay:"night"`.

## Shipped 2026-07-05 session, wave 2 (#121–#137)

Metrics item 33 complete (#128 timeline w/ filters, #129 headroom +
deaths-by-boss panels, #130 Your Stats cross-run screen); genlocke
designed then SHELVED (#123/#131/#132 — too few games; engine event
dormant); profiles + follows shipped (#134, design #123, migration
applied); engine warts fixed (#133 — house_rules_changed + 'wiped'
status, built by a parallel background agent); evolution feature
(#125–#127: branch choice, level bump, item-location hints, un-evolve;
nickname never changes; self-evos no-op); move pickers ordered
level→TM→TR→HM + columnar learnsets + un-evolve nets out of history
(#136); PLA per-zone maps from Alex's uploads (#124); docs #121/#122/
#135/#137.

## Shipped 2026-07-05 session, wave 1 (merge authorized mid-session)

- **#112 mobile map fix** — Alex reported the route map unusable on phones.
  RouteMap now fits the whole map to the screen and zooms/pans through the
  SVG viewBox (pinch, drag, +/−/reset). Mobile audit of all five tabs
  found no other overflow. Future nice-to-have: sticky mobile tab bar.
- **#113 item 25** — next-boss pick: `next_boss_set` event +
  `state.nextBossId`; `nextBoss()` prefers the pinned uncleared gating
  milestone, falls back to dataset order. "◎ next (your pick)" badge.
- **#116 item 26** (supersedes auto-closed #114) — per-game honor packs:
  PLA (use-only first catch, no crafted revives, no distortions,
  outbreak-shiny non-exemption on; noble two-attempt off), SV (raid +
  picnic-egg bans on; symmetric Tera off, hardcore enables it), Z-A
  (symmetric Mega off; `za-rogue-caps` enforced cap toggle).
- **#117 + #119 item 32 CLOSED** — LGPE X Defense rename; SwSh Ball Guy
  stadium gifts (8 — Spikemuth has no stadium lobby, Champion Cup rewards
  random/excluded); BDSP specialty-ball marts at ramanas-park + a new
  pokemon-league area.
- **#118 item 23 CLOSED** — `dlc-content` rule (swsh, default off; absent
  = legacy-visible): gates areas/milestones/specials + level cap;
  "Playing the DLC" checkbox at run creation. 9 IoA/CT milestones
  (post-champion tier; Klara=Sword/Avery=Shield; Mustard final G-Max
  Urshifu 75; Peony 70; Star Tournament excluded) + 31 specials
  (Kubfu, Diglett gifts, CT legendaries; Regigigas excluded —
  trade-locked raid). species-data 887.
- **#120 item 24 CLOSED** — PLA split into 81 areas / 942 slots (80 named
  sub-locations from Bulbapedia+Serebii per-location research, incl.
  Wayward Cave; arenas empty; distortion/outbreak-only species excluded;
  83 guaranteed alphas as `alpha`-method slots; statics re-anchored).
  New `alphas-count` rule (pla+plza, default off = alphas excluded).
  Hisui map zone nodes are now ZONE SELECTORS + chip row (the interim
  zone-switcher; per-zone backdrops still awaiting Alex's re-uploaded
  zone images). KNOWN BREAK: pre-split PLA runs reference dead zone ids.

**Where to work:** the canonical checkout is `C:\dev\nuzlocke-app` (moved
off OneDrive — its sync locks broke `git worktree`). Run `git pull` first.

## Alex's decisions on file (2026-07-06) — no need to re-ask

- **DLC: include everything** (bosses as milestones, legendaries as
  specials), gated per-run behind a "playing the DLC" toggle → item 23.
- **PLA: full 79-sub-location split** ("keep how people actually play it")
  → item 24. His five zone-map images from the 2026-07-05 session need
  RE-UPLOADING to apps/web/public/maps/ (chat images can't be saved by the
  assistant) before per-zone backdrops work; the dataset split can start
  from Serebii per-location spawn lists without them.
- **Z-A shops: skip for now.**
- **paldea.png: keep as-is.** Upscaling/SVG-converting can't add detail a
  678px source doesn't have (the browser already interpolates identically);
  a higher-res export is welcome whenever, drop-in, no recalibration.
- **Later phases: metrics dashboard + timeline, genlocke campaigns,
  profiles + follows are ALL wanted** (items 33-35). Variant modes
  (soul link etc.) are OUT OF SCOPE for now.

## Next up

**33. Metrics dashboard + timeline — SHIPPED 2026-07-05 (#128–#130).**
33a shared RunTimeline + tone filter chips (owner Stats section +
spectator parity); 33b Stats panels: level-cap headroom step-line
(headroomSeries prefix replay) + deaths-by-boss bars; 33c "Your Stats"
title-screen entry with cross-run aggregates via engine aggregateRuns
(abandoned runs counted but excluded, per Alex). Remaining design-doc
candidates (catch rate by zone, time-in-run) deliberately unshipped —
revisit on demand. Evolution feature (#125–#127, Alex's live request)
also landed this session: evolve/un-evolve with branch choice, level
bump, per-game item-location hints.

**34. Genlocke campaigns — SHELVED (Alex, 2026-07-05 late).** With only
six same-era games the champion-chain format doesn't have enough room;
revisit if/when the game roster grows. What exists stays: the design
(`docs/GENLOCKE.md`) and the merged `pokemon_imported` engine event
(#131 — harmless without UI, and useful for any future import feature).
Campaign store / import screen / campaign page: NOT built, on purpose.

**35. Profiles + follows — SHIPPED 2026-07-05 (#134).** Per PROFILES.md:
migration 20260705220000 (profiles + follows, owner-only RLS,
get_profile/get_feed SECURITY DEFINER RPCs — profile shows ONLY runs
with a live share token; revoke = vanish), #u/<handle> route, profile
setup chip, follow/unfollow, polled big-beats feed on the continue
screen. Migration APPLIED by Alex 2026-07-05 — profiles are live once the next web deploy ships.
Shipped in parallel with #133 (engine warts, background-agent built):
mid-run house-rules editing (`house_rules_changed`, audited) + proper
`wiped` status for wipe-reset (legacy logs still derive to abandoned).

**36. PLA per-zone map backdrops — SHIPPED 2026-07-05 (same session).**
Alex uploaded his six zone images (arc1–arc6) mid-session → renamed to
hisui-<zone>.webp/png, `zoneMaps` on GameAppConfig + ZONE_MAPS registry,
RoutesTab swaps the zone map in while a zone is active ("← All zones" to
return), 79 nodes calibrated to the printed in-game labels across the
five maps (wayward-cave stays list-only — the in-game map doesn't label
it; hisui-jubilife-village.png parked unused, the hub resolves from the
overview). Integrity test pins node ids ⊆ zone areas.

(Variant modes — soul link, wedlocke, monolocke — OUT OF SCOPE per Alex.)

**Sub-location names (now shipped as pla.json area ids in #120; kept here
only as the transcription of Alex's reference maps):**
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

2026-07-05/06 feedback round (PRs #97-#98): **victory-road-swsh removed
(#97, supersedes #77)** — 58 SwSh areas; **items 27-30 (#98)** —
frontierAreas sliding-window selector (up-next highlighting advances on
every resolve; glow strengthened with fill pulse + halo), compact one-row
trainer cards, always-visible item chips with item_picked/item_reset
pickup tracking, picker titles drop the Pokémon prefix.

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

## Deferred / low priority

- **Z-A movepools — SHIPPED.** PokeAPI has no `legends-za`/`mega-dimension`
  learnsets, so they're scraped from Serebii's SV Pokédex (Z-A section) by
  `build-za-movepools.mjs` → `generated/za-movepools.json`, merged into
  `species-data.json` as `movesByGame.plza` / `levelUpMovesByGame.plza` by
  `build-species-data.mjs`. Coverage 420/485 species (every emitted move slug
  validated against the known set — 2 dropped: "Nihil Light" not in PokeAPI,
  "Water Shuriken" not in our move universe). Gaps: species outside the Z-A dex
  + ~10 Serebii form/slug 404s (Galarian Corsola/Obstagoon, Togepi line) fall
  back to the union pool. Follow-up if wanted: SEREBII_SLUG overrides for those
  ~10 forms to lift coverage.
- **Sync seq-collision edge case**: two devices appending to the same run
  while both offline and never-synced can collide on `seq` (documented in
  `apps/web/src/lib/db.ts`). Full CRDT-style resolution deliberately out of
  MVP scope.
- Small nice-to-haves: sticky mobile tab bar; remaining 33b panels
  (catch-rate-by-zone, time-in-run).
- (The old "engine event-schema gaps" entry SHIPPED in #133:
  house_rules_changed + the 'wiped' status.)

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
