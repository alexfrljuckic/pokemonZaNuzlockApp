# Challenge modes for unconventional games — viability & accommodations

**TL;DR for Alex: all three games stay supported.** PLA and Z-A are
"viable with accommodations", SV is fully mainstream (dedicated tracker
precedent at our exact area granularity). Nothing in the research suggests
dropping a game. Z-A's community rules are young (working draft, May 2026)
— revisit in a few months; our v1-inherited revive-token system matches a
documented generic optional rule ("1 revive per badge", Nuzlocke
University), so it's community-aligned as a labelled house accommodation.

**What this maps to in the backlog** (see BACKLOG items 24–26):
- **PLA sub-area granularity (item 24)** — the biggest gap: community uses
  named locations (Horseshoe Plains, Deertrack Heights, …), our dataset has
  7 whole zones. Also: alpha-exclusion flag on encounters.
- **SV out-of-order bosses (item 25)** — milestones already complete in any
  order; the level-cap affordance should key off a user-chosen "next boss",
  with the merged 18-boss suggested order as the default sequence.
- **Per-game honor-rule packs (item 26)** — PLA use-only-first-catch,
  no-crafted-revives, distortion/outbreak bans; SV raid/picnic-egg bans +
  symmetric-Tera clause; Z-A symmetric-Mega clause + rogue-boss cap toggle.
  All display-only honor rules gated per game via `appliesTo` — none are
  engine-enforceable, which is exactly what honor rules are for.

Everything below is the full research write-up (web-researched 2026-07-04;
sources inline). Trust its confidence notes: PLA medium-high, SV high,
Z-A low-medium.

---

# Challenge-mode research: PLA / SV / Z-A nuzlockes

Researched 2026-07-04 (web). Scope: community viability, consensus rule adaptations,
rule-breaking mechanics, and concrete tracker accommodations for three unconventional games.

---

## 1. Pokémon Legends: Arceus (PLA)

### Viability verdict: **Viable-with-accommodations**
Actively nuzlocked since launch (multiple Nuzlocke Forums rulesets, blog rulesets, YouTube
runs), but every popular ruleset is heavily modified — nobody runs classic rules unchanged.
The community explicitly says a comprehensive standardized ruleset "can't just be done
overnight" and several points (ending, distortions) remain contested.

### Community consensus rules (sourced)
- **"Use-only" first catch, not "catch-only".** The single most agreed-on PLA adaptation:
  you may only *use* the first catch in an area, but you may keep catching other Pokémon
  freely — catching is the game's income source and Grit items (the EV system) come from
  catches/releases. Banning extra catches would make the run economically unplayable.
  Source: Nuzlocke Forums "Legends: Arceus Nuzlocke Rules and Clauses"
  (https://nuzlockeforums.com/forum/threads/unmarked-spoilers-legends-arceus-nuzlocke-rules-and-clauses.20683/).
- **Area = named location (sub-area), not the whole zone.** Popular rulesets take the
  first Pokémon in each *named location* you visit (e.g. Horseshoe Plains, Deertrack
  Heights), not one per giant zone — the 5–6 zones would give absurdly few encounters.
  Some looser variants gate new encounters on progression beats instead (new camp
  unlocked, new ride Pokémon, after major battles).
  Sources: PlayerAuctions PLA ruleset (https://blog.playerauctions.com/pokemon/pokemon-legends-arceus-nuzlocke-rules/),
  win.gg per-game rules roundup (https://win.gg/pokemon-the-best-nuzlocke-rules-for-every-single-game/).
- **Death = faint**, exactly as classic. Universally kept.
- **Player blackout is its own loss condition.** Because the player can be attacked
  directly by wilds/fall damage, many rulesets treat a *player character* blackout
  (all Pokémon defeated → returned to camp) as a failed run or a wipe; player fainting
  to a wild without a full party KO usually has no penalty.
- **Alphas:** guaranteed (fixed-spawn) Alphas are commonly banned/excluded as encounters
  because they're massively over-leveled for when you first reach them; an *optional
  hard-mode clause* is "first Pokémon counts even if it's an Alpha".
- **Space-time distortions:** most rulesets simply don't count them (not a legal
  encounter source); noted explicitly as a gap in standardization. Fainting despawns an
  active distortion, which adds risk. No consensus that they're a *separate* encounter.
- **Mass Outbreak shiny clause:** outbreak shinies do NOT get the usual shiny-clause
  exemption (base ~1/158 and infinitely repeatable — allowing them means you can never
  run out of Pokémon).
- **Survey Corps intro clause:** the 3 forced tutorial catches may be disregarded;
  first Aspiration Hill catch is the real encounter.
- **Noble fights:** frequently given a "two attempts" rule — first loss is free (leave
  or retry with no deaths), second attempt makes deaths permanent. Nobles are the boss
  milestones; there are no trainer-gym level caps, so caps (if used) are pegged to
  noble/story battle levels.
- **Revives/crafting:** the classic "no Revives" rule is kept and extended to *crafting*
  revives (craftable from common materials, so unrestricted crafting trivializes deaths).
  Max Revives from shops also banned. (Widely stated in rulesets; low controversy.)
- **Ending point debate:** some end runs at Mission 27 (Dialga/Palkia, "the credits
  fight") rather than the true Arceus fight, partly because the final battle forces
  using a legendary. No consensus.

### Mechanics that break classic rules
- No trainer battles / no gyms → no natural level-cap ladder; loss condition shifts to
  player blackout + noble fights.
- Catching = economy → one-catch-per-area is economically punitive (hence use-only rule).
- No held items, no abilities → several classic hardcore clauses (item clause etc.) are moot.
- Agile/Strong style: no community rules restricting it (it's symmetric; bosses use it too).
- Craftable revives break the no-revive assumption unless explicitly banned.
- Space-time distortions and mass outbreaks are repeatable high-value encounter fountains.

### Tracker accommodations recommended
| Need | Mapping in our architecture |
|---|---|
| Use-only first catch (extra catches for income allowed) | **Honor rule** (engine can't see off-run catches); display text explaining the PLA variant of first-encounter |
| Sub-area ("named location") encounter granularity | **Dataset field**: our PLA dataset has 7 zones — either split areas into named sub-locations, or add `encountersPerArea > 1` / sub-area list per zone. This is the biggest PLA gap vs. community practice |
| Guaranteed-Alpha exclusion | **Dataset field** on encounters (`isAlpha` / excluded-by-default flag) + optional enforced toggle "alphas count" |
| Space-time distortion ban | **Honor rule**, default-on for PLA via `appliesTo` |
| Mass-outbreak-shiny no-exemption | **Honor rule** note attached to shiny clause for PLA |
| Player blackout as loss | Already covered: **wipe event** — just label it "blackout" in PLA UI copy |
| Noble two-attempt rule | **Honor rule** + our existing milestone/boss structure (Nobles already in dataset). Optionally a `boss_attempted` event later |
| No-crafted-revives | **Honor rule** (engine can't observe crafting); pairs naturally with our revive-token system as the *sanctioned* alternative |
| Ending point choice | **Dataset**: keep both Mission 27 and Arceus milestones (we already have Volo/Giratina); let users mark their own end |

### Confidence: **Medium-high.** Multiple independent sources agree on the core adaptations
(use-only rule, named-location areas, alpha bans, blackout loss). Nuzlocke Forums thread
(the best single source) is 403-blocked to fetchers, so details came via search excerpts +
secondary writeups. Distortion/ending rules are genuinely unsettled in the community, not
just under-sourced.

---

## 2. Pokémon Scarlet/Violet (SV)

### Viability verdict: **Viable** (fully mainstream)
The most-nuzlocked Switch-era game after SwSh. Dedicated tracker support exists at
nuzlocke.app / nuzlocketracker.org / nuzlockeredux with **32 encounter locations**
(province sub-areas: South Province Area One … North Province, caves, lakes), and
Nuzlocke University publishes hardcore level caps for it. No viability concerns.

### Community consensus rules (sourced)
- **Area = province sub-area** (South Province Area One, Area Two, …), exactly the
  granularity our tracker already uses. ~32 locations / 319 species in Scarlet.
  Source: https://nuzlocke.app/guides/scarlet, https://nuzlocketracker.org/guides/scarlet.
- **First encounter in an overworld game:** since all spawns are visible, runners use
  house methods ("first Pokémon that touches you / that you lock onto", the joke
  "eyes-closed 30 seconds" method, or tracker randomize features). The practical
  consensus: first Pokémon you *interact with* in a new area is the encounter.
  Source: dualshockers 9 Essential Rules (https://www.dualshockers.com/pokemon-scarlet-violet-nuzlock-rules/).
- **Level caps use the three-path tables**: Victory Road gyms (15→48, Champion 62),
  Titans (16→55, Arven 63), Team Star (21→56, Big Boss 63) — cap = boss's highest-level
  Pokémon (hardcore standard). Sources: Nuzlocke University
  (https://nuzlockeuniversity.ca/2022/01/18/hardcore-nuzlocke-level-caps-by-generation/),
  Dexerto level-cap table (https://www.dexerto.com/pokemon/pokemon-scarlet-violet-level-caps-all-gym-leaders-titans-team-star-rival-battles-2215139/).
- **Suggested order exists and is near-universal** (game has an implicit intended order):
  Cortondo Gym L15 → Stony Cliff Titan L16 → Artazon Gym L17 → Open Sky Titan L19 →
  Star Dark L21 → Levincia Gym L24 → Star Fire L27 → Steel Titan L28 → Cascarrafa Gym L30 →
  Star Poison L33 → Medali Gym L36 → Montenevera Gym L42 → Quaking Earth Titan L44 →
  Alfornada Gym L45 → Glaseado Gym L48 → Star Fairy L51 → False Dragon Titan L55 →
  Star Fighting L56 → (Nemona/E4/Champion 58–63 → Arven L63 → Cassiopeia/Penny).
  Sources: gamerant/screenrant/RPG Site order guides (converge on the same list).
  Nuzlocke University deliberately does NOT prescribe an interleaved order — "any
  sequence due to the open-world structure" — so trackers should treat order as
  *suggested, not enforced*.
- **Tera raids as encounters:** optional/house rule. Some runners use "first raid den in
  an area" as an alternate encounter method; hardcore runners commonly ban raids as
  encounter or item sources (repeatable, high-BST, XP candy). No single consensus — it's
  a documented toggle, not a rule.
- **Picnic eggs:** banned as encounter sources in standard runs (infinitely repeatable
  breeding = never run out of Pokémon); allowed only in egglocke variants.
- **Terastallization:** common hardcore convention is symmetric use — you may Tera only
  in fights where the opponent Teras (gyms/E4/rivals), or ban it entirely; another
  variant restricts to one Tera per boss. House-rule territory, but "no free Tera on
  trash fights" is the norm among hardcore streamers.
- **Sandwiches:** encounter-power/shiny-power sandwiches manipulate spawns, so purists
  avoid them pre-encounter; XP/raid-power food generally allowed. Weakly documented.
- **Let's Go auto-battle:** auto-battling Pokémon can't die (they auto-return on low HP),
  but Let's Go can KO a wild Pokémon before you've registered your first encounter in an
  area — the common house rule is "no Let's Go in a new area until the encounter is
  secured" (and hardcore runs often ban auto-battle XP entirely).
- **Hardcore standard stack applies cleanly:** Set mode, no in-battle items (held items
  fine), level caps, species/dupes clause — the standard hardcore doc rules transfer to
  SV with no structural changes.

### Mechanics that break classic rules
- No forced order → caps must be a *suggested sequence*, and a runner may fight bosses
  in a different order than the dataset's milestone list.
- Three parallel storylines → three interleaved cap ladders (we need all 18+ bosses as
  milestones, which the level-cap community already treats as one merged list).
- Overworld spawns → "first encounter" is honor-system by nature.
- Repeatable encounter fountains: raids, picnic eggs, outbreaks.
- Tera can flip type matchups both ways (boss caps alone understate difficulty).

### Tracker accommodations recommended
| Need | Mapping |
|---|---|
| Interleaved suggested boss order with per-boss caps | **Dataset**: milestones already support `aceLevel`; ship the merged 18-boss order above as the default milestone sequence, but do NOT enforce completion order (level cap should key off "next uncleared milestone the user chooses", or simply the max of uncleared) |
| Out-of-order boss completion | **Engine consideration**: allow milestones to be completed in any order; level cap = the cap of whichever milestone the user marks as "next" (a small engine/UI affordance; classic games assume linear order) |
| Tera raid encounter toggle | **Rule (data)**: honor rule "raid encounters banned" default-on, with an alternate enforced variant "raids allowed as area encounter" — plus dataset `conditions` tag for raid-only species (we already did `max-raid` for SwSh; same pattern) |
| Picnic-egg ban | **Honor rule**, default-on (engine can't see breeding) |
| Tera-usage clause (only when boss Teras / once per boss) | **Honor rule** with config options |
| Let's Go encounter-spoiling | UI copy/warning on new areas, or **honor rule** "no auto-battle before securing encounter" — not enforceable |
| Sandwich restrictions | **Honor rule**, off by default (weak consensus) |

### Confidence: **High.** SV nuzlocking is mature, tracker-supported, and the level-cap /
order material converges across 4+ independent sources. Weakest areas: sandwich and
Tera-usage conventions (genuinely house-rule-level variance).

---

## 3. Pokémon Legends: Z-A

### Viability verdict: **Viable-with-accommodations**, community rules still young
Nuzlocke content exists (YouTube "How to Nuzlocke Legends Z-A", TheGamer nuzlocke team
guides, a community working-draft ruleset circulating since ~May 2026, and Nuzlocke
University already publishes Z-A level caps), but there is no settled forum-canonical
ruleset yet. Report what follows as early consensus, not settled law.

### Community consensus rules (sourced, with freshness caveats)
- **Area = Wild Zone; one encounter per zone.** The working draft and every guide found
  agree: each of the 20 Wild Zones (unlocked in order via Main Missions) is one
  encounter area. Sources: PokemonGOHub wild-zone guide
  (https://pokemongohub.net/post/guide/all-wild-zones-pokemon-legends-z-a/),
  Fextralife wild-zone guide, pokedexgenerator.com nuzlocke guide (community draft).
- **Level caps: Z-A Royale promotion matches are the badge-equivalents.** Nuzlocke
  University lists Promotion Match caps Lv 9, 15, 21, 24, 32, 39, 47, 52, 59, 63, 64;
  optional Rogue (mega boss) Battle caps 34, 41, 48, 53, 59; postgame 72/80/84. It
  explicitly notes some players count only promotion matches and treat rogue battles as
  optional caps. Source: https://nuzlockeuniversity.ca/2022/01/18/hardcore-nuzlocke-level-caps-by-generation/.
  This directly validates our design of Royale ranks + rogue fights as milestones.
- **Mission/story battles don't burn encounters** (working draft).
- **Mega Stones:** story-given stones = free gift items; stones found via optional/
  roaming content count toward the zone's encounter budget (working draft — the most
  Z-A-specific rule found).
- **Real-time battle compensations:** because switching is instant and dodging lets the
  *player* skill out of damage, some runners add a Set-mode analog (no mid-battle
  switching) — dodging itself is NOT banned in anything found (it's the game's core
  mechanic and bosses are balanced around it).
- **Day/night exclusives:** zones have day/night-exclusive spawns and Alpha spawns;
  guides note this affects what your "first available Pokémon" is, but no rule found
  that locks encounter timing — treat first interaction as the encounter regardless of
  time of day.
- **Encounter scarcity / second chances:** **no Z-A-specific revive-token convention was
  found in the community.** However, the *generic* optional rule "a small number of
  second chances/revives, typically one revive per badge" is documented at Nuzlocke
  University's optional-rules page (https://nuzlockeuniversity.ca/optional-rules/), and
  "gift Pokémon are free encounters" is likewise a documented generic optional rule.
  Verdict on our v1 design: the revive-token system is a *recognized community pattern*
  (per-badge second chances) applied sensibly to a low-encounter game — it is defensible
  and roughly community-aligned, but it is *our* adaptation, not an emerged Z-A standard.
  Keep it, label it clearly as a house accommodation, keep it configurable.
- **Gift/static Pokémon as free extras** is the natural scarcity offset the community
  does use in low-encounter games; Z-A has a meaningful gift list
  (https://www.serebii.net/legendsz-a/giftpokemon.shtml) — our specials system already
  models this.

### Mechanics that break classic rules
- Only ~20 small zones + gifts → total encounter budget far below a classic game;
  attrition math is brutal (this is the scarcity our revive tokens offset).
- No routes, no wild areas outside the city; zone respawns and day/night rotation blur
  "first encounter".
- Real-time combat: player skill (dodging) substitutes for team resources; deaths can
  happen to overworld aggression outside "battles".
- Rogue mega bosses are raid-like solo fights with dodge phases (TheGamer guide:
  https://www.thegamer.com/pokemon-legends-z-a-mega-dimension-rogue-mega-evolutions-how-to-beat-guide/)
  — closer to PLA nobles than to trainer fights; a two-attempt-style clause may migrate
  here but none is documented yet.
- Mega Evolution is a per-battle power spike → symmetric-use house rules (like SV Tera)
  are the likely equilibrium; only the Mega Stone acquisition rule is documented so far.
- No breeding → egg-based variants impossible; smaller pool → dupes clause bites harder.

### Tracker accommodations recommended
| Need | Mapping |
|---|---|
| One encounter per Wild Zone | Already covered (our 25-area Z-A dataset ≈ zones) |
| Encounter scarcity offset | **Already-covered-by-revive-tokens** — keep; validated as a recognized generic pattern ("1 revive per badge"), surface it as configurable |
| Gift Pokémon as free encounters | Already covered (`special_claimed` / specials under areas) |
| Promotion matches + rogue battles as milestone caps | Already covered (35 milestones); ensure rogue-battle caps are flagged *optional* (a `countsForLevelCap`-style toggle — we already have that mechanism for rivals) |
| Mega Stone rule (story = free, found = costs encounter) | **Honor rule** (engine can't see item pickups); optionally a dataset note on specials |
| Mega usage clause (only when boss megas, etc.) | **Honor rule** with config, mirroring the SV Tera clause |
| No-mid-battle-switch (real-time Set mode) | **Honor rule**, off by default |
| Day/night exclusive spawns | **Dataset field** (`conditions.timeOfDay`, same pattern as SwSh `conditions.weather`) |
| Alphas in zones | **Dataset flag** + same alpha honor-toggle as PLA |

### Confidence: **Low-medium.** The zone=area rule and level caps are solidly sourced;
everything else rests on one community working draft (surfaced via pokedexgenerator.com,
dated May 2026) plus generic optional-rule precedent. Expect churn; re-check in 3–6
months. Nothing found suggests the community considers Z-A un-nuzlockeable — the
opposite: guides assume it and publish team recommendations.

---

## 4. Variant rules × these three games (brief)

- **Soul Link** (paired 2-player, linked deaths): needs *matching encounter counts and
  comparable pacing* between the two games. SV↔SV works and is played
  (https://community.pokemon.com/en-us/discussion/21090/started-a-pokemon-scarlet-violet-soul-link);
  PLA and Z-A are poor soul-link citizens (odd area structures, PLA's use-only rule,
  Z-A's tiny encounter budget). Tracker: soul link would need a cross-run linking
  event — out of scope for now; don't design around PLA/Z-A for it.
- **Wedlocke** (gendered pairs): fine in SV; awkward in Z-A/PLA where small pools + dupes
  clause may leave unpairable teams. No accommodation needed beyond honor tracking.
- **Egglocke**: SV-only among these (picnic breeding); **impossible in PLA and Z-A** (no
  breeding). If we ever add an egglocke mode, gate it per-game via `appliesTo`.
- **Monolocke** (single type): viability depends on pool size — SV easily, PLA mostly,
  Z-A marginal for many types (20 zones). A per-game type-coverage check would be a nice
  dataset-derived warning, not a rule.
- **Gen-locke** (survivors carry across games): requires HOME transfers; PLA/Z-A dex
  gaps break chains. Not tracker-relevant now.

Net: variants reinforce the same conclusion — SV behaves like a classic game; PLA and
Z-A need per-game `appliesTo` gating on any variant rules we ever add.

---

## Source quality notes
- Best sources: Nuzlocke University (level caps + optional rules; actively maintained,
  now covers Z-A), nuzlocke.app / nuzlocketracker.org (SV area lists — direct
  competitor-tracker precedent), Nuzlocke Forums PLA threads (canonical but 403-blocked
  to automated fetch; content obtained via search snippets and secondary coverage).
- Weakest: Z-A "community working draft" (single aggregator source, May 2026);
  SV sandwich/Tera-usage conventions (house-rule variance, thinly documented).
- Bulbapedia's Nuzlocke article documents the generic rules/variants but nothing
  game-specific for these three (https://bulbapedia.bulbagarden.net/wiki/Nuzlocke_Challenge).
