# BDSP Grand Underground — Research Findings

Synthesized from a multi-agent research pass (several sub-agents fetched/verified
independently; sources cited inline). BDSP-2021 specific throughout — the
Grand Underground is a full rework of the DP-era Underground, not the same mechanic.

**Bottom line up front:** the app currently models **4 hideaways** with flat
species lists and no progression tiers. The real game has **18 hideaways**
(not the ~16 originally guessed) built from ~12 underlying shared encounter
tables, each gated through a 6-step unlock progression. This is a real,
substantial content gap — not just missing polish.

---

## 1. Full hideaway inventory (18 total)

**Count: HIGH confidence** — independently cross-confirmed by Bulbapedia's
Grand Underground + Hideaway articles, Serebii's Pokémon Hideaways page, and
two data-mined technical sources (which describe the underlying game files
directly, not just guide-site prose).

**Large hideaways ("Caverns") — 7:**
Big Bluff Cavern, Bogsunk Cavern, Glacial Cavern, Stargleam Cavern,
Still-Water Cavern, Sunlit Cavern, Typhlo Cavern

**Small hideaways ("Caves") — 11:**
Dazzling Cave, Fountainspring Cave, Grassland Cave, Icy Cave, Riverbank Cave,
Rocky Cave, Sandsear Cave, Spacious Cave, Swampy Cave, Volcanic Cave,
Whiteout Cave

Sources: https://bulbapedia.bulbagarden.net/wiki/Grand_Underground ,
https://bulbapedia.bulbagarden.net/wiki/Hideaway ,
https://www.serebii.net/brilliantdiamondshiningpearl/pokemonhideaways.shtml ,
https://game8.co/games/Pokemon-Brilliant-Diamond-Shining-Pearl/archives/341893

### Shared-table structure (important for implementation)

The 18 named hideaways are **not** 18 independent encounter tables — BDSP
reuses ~10–12 underlying encounter lists across them in themed families,
confirmed by two data-mining sources ("20 tables distinguished in code, but
only 12 unique encounter lists exist" — heystacks.com) as well as by directly
fetching multiple Bulbapedia hideaway pages and finding matching rosters:

| Family (base species) | Hideaways sharing it |
|---|---|
| Rocky (Geodude/Onix/Skorupi → ground/fire evo line) | Rocky Cave, Big Bluff Cavern, Typhlo Cavern |
| Grassland (Zubat/Machop/Wurmple/Roselia → bug/grass line) | Grassland Cave, Sunlit Cavern |
| Ghost/Psychic (Gastly/Nidoran/Grimer/Drowzee) | Dazzling Cave, Stargleam Cavern |
| Swamp (Zubat/Roselia/Skorupi/Croagunk → poison/water line) | Swampy Cave, Bogsunk Cavern |
| Ice (Buneary/Sneasel/Snover → ice/water line) | Icy Cave, Glacial Cavern |
| Water (Psyduck/Murkrow/Buizel) | Still-Water Cavern (Volcanic Cave's pairing not fully confirmed — needs sourcing) |

**Confidence: medium-high.** 13 of 18 hideaway pages were directly fetched
and cross-checked; **Fountainspring Cave, Riverbank Cave, Sandsear Cave,
Spacious Cave, Whiteout Cave** were NOT directly fetched this session and
their exact tables + family membership need sourcing before treating as final.

### Sample verified table — Stargleam Cavern (highest-fidelity fetch, real wikitable with BD/SP columns)

Both versions: gastly, nidoran-f/nidoran-m + evos, grimer, drowzee, krabby,
voltorb, cubone, ditto, togepi, natu, wobbuffet, snubbull, houndoom,
smoochum, poochyena/mightyena, ralts/kirlia, volbeat, illumise, baltoy,
banette, duskull/dusclops, absol.
**BD-only:** misdreavus, slowpoke, elekid, sableye, mawile, zangoose,
lunatone, bagon, shelgon.
**SP-only:** seviper, solrock.
Progression additions: meditite/chingling/bronzor (after TM96 Strength),
kadabra/girafarig (after TM97 Defog), mr-mime (after Icicle Badge).

Rare-spawn percentages were extracted via automated page summarization and
are internally consistent but **not visually cross-checked against raw
wikitable markup — treat exact %s as medium confidence**; species
presence/absence and BD/SP splits are high confidence.

Source: https://bulbapedia.bulbagarden.net/wiki/Stargleam_Cavern

---

## 2. Unlock progression (HIGH confidence)

The Underground itself unlocks via the **Explorer Kit**, given by the
Underground Man in Eterna City — no badge required, available early-game.
But each hideaway's **species roster** then grows through the SAME six-step
progression, confirmed independently by Bulbapedia's per-hideaway pages, a
data-mined technical doc (altissimo1.github.io), and heystacks.com:

1. **Base** — available as soon as the hideaway itself is reachable
2. **+ TM96 (Strength)** — small batch added
3. **+ TM97 (Defog)** — another small batch added
4. **+ Icicle Badge** (7th Gym, Candice/Snowpoint) — mid-tier species added
5. **+ TM99 (Waterfall)** — late species added
6. **+ National Pokédex** (post-Elite-Four) — bulk of non-Sinnoh species unlocks

**Wild-encounter levels** (not species presence) separately scale with badge
count: roughly 16–20 with 1 badge up to 58–63 post-Elite-Four.

This directly answers "how are hideaways unlocked" — it's not per-hideaway
gating, it's a **per-species-tier** gate that applies uniformly across every
hideaway. Modeling this precisely (6 tiers × 18 hideaways) would be a lot of
dataset granularity; a simpler approximation (e.g. "early/mid/postgame"
3-tier split, or just flagging National-Dex-only species) may be more
practical — implementation judgment call, not something to over-engineer.

Sources: https://altissimo1.github.io/Main-Series/BDSP/grand-underground-documentation.html ,
https://heystacks.com/doc/1041/grand-underground-encounters

---

## 3. Our existing 4 hideaways — correction/mapping notes

Current dataset (`packages/datasets/games/bdsp.json`):

| Our id | Our species | Likely real-game match |
|---|---|---|
| `grand-underground-cave-hideaway` | zubat, geodude, onix, makuhita, nosepass, meditite, aron, cubone | **Rocky Cave** family (Geodude/Onix base matches) — but our list mixes in species from later tiers with no progression gating |
| `grand-underground-swamp-hideaway` | psyduck, poliwag, wooper, swinub, shellos, hippopotas, skorupi, croagunk | **Swampy Cave** family (skorupi/croagunk base matches) |
| `grand-underground-volcanic-hideaway` | slugma, numel, houndour, torkoal, ponyta | **Volcanic Cave** — pairing/family not fully confirmed this session |
| `grand-underground-dazzling-hideaway` | clefairy, chansey, togepi, sunkern, drowzee, lunatone, solrock | **Dazzling Cave / Stargleam Cavern** family — real table (above) is far larger; ours looks like a partial/early-tier subset (togepi, drowzee, lunatone, solrock all genuinely appear in the real table) |

**Verdict:** our 4 aren't fabricated — they're recognizable partial subsets
of the real families — but they're (a) missing 14 whole hideaway locations,
(b) missing the progression-tier species within each family, and (c) not
distinguishing BD/SP splits (Stargleam alone has 9 BD-exclusive + 2
SP-exclusive species).

---

## 4. Other Grand Underground content

### Fossils — fully sourced, all 7 confirmed
All 7 gen-appropriate fossils are obtained by digging in the Grand
Underground (glittering "treasure" spots, a mining minigame), then revived
by the scientist at the Oreburgh Mining Museum:

| Fossil | Revives into | Version | Unlock |
|---|---|---|---|
| Skull Fossil | Cranidos | **BD only** | available from the start of Underground access |
| Armor Fossil | Shieldon | **SP only** | available from the start of Underground access |
| Helix Fossil | Omanyte | both | after defeating/capturing Dialga (BD) / Palkia (SP) |
| Dome Fossil | Kabuto | both | same as above |
| Old Amber | Aerodactyl | both | same as above |
| Root Fossil | Lileep | both | same as above |
| Claw Fossil | Anorith | both | same as above |

**Checked — fossils ARE partially modeled, and incorrectly located.** The
dataset's top-level `specials` has exactly 2 fossil entries:
```
{ id: "fossil-cranidos", type: "fossil", species: "cranidos", area: "oreburgh-mine" }
{ id: "fossil-shieldon", type: "fossil", species: "shieldon", area: "oreburgh-mine" }
```
Two problems: (1) **the other 5 fossils are entirely missing** (Helix/Omanyte,
Dome/Kabuto, Old Amber/Aerodactyl, Root/Lileep, Claw/Anorith — all available
in both versions post-Dialga/Palkia); (2) **the `area` is wrong** —
Oreburgh Mine is where fossils are *revived* (at the Mining Museum), not
where they're *found*. All 7 fossils are dug up in the **Grand Underground**
itself, not any fixed overworld area. This should be corrected regardless of
whether the fuller hideaway work happens.

Sources: https://bulbapedia.bulbagarden.net/wiki/Fossil ,
https://bulbapedia.bulbagarden.net/wiki/Oreburgh_Mining_Museum ,
per-fossil Bulbapedia pages (Skull/Armor/Helix/Dome/Old_Amber/Root/Claw Fossil).

### Mysterious Shards — confirms existing Ramanas Park modeling
Mysterious Shard S/L spawn in the Grand Underground's glittering walls, but
**only after completing the Sinnoh Pokédex** (post v1.1.0 update). Traded at
Ramanas Park (3× Shard S or 1× Shard L per Slate) for legendary statics —
Ramanas Park itself is already modeled in the dataset; this just confirms
the shard SOURCE is the Underground, gated behind Sinnoh-Dex completion,
which is worth noting as a prerequisite if the app ever surfaces "how to get
this" hints for Ramanas legendaries.
Source: https://bulbapedia.bulbagarden.net/wiki/Grand_Underground

### Statues — NOT a new-species mechanic, skip modeling
Secret Base statues bias which TYPE is more likely to spawn in a player's own
Hideaways (up to 18 placeable, larger/shinier = stronger effect). This is a
probability-weighting layer on top of the existing table, not a table-
membership mechanic — it doesn't add species that couldn't otherwise appear.
**Not worth modeling** in an encounter tracker; the pool is what matters, not
the odds skew.
Sources: https://bulbapedia.bulbagarden.net/wiki/Grand_Underground ,
https://game8.co/games/Pokemon-Brilliant-Diamond-Shining-Pearl/archives/349092

### No static/guaranteed encounters live inside the Underground itself
Checked and ruled out: Regirock/Regice/Registeel are in Ramanas Park's
Discovery Room (separate area, already modeled); Regigigas is at Snowpoint
Temple (overworld, separate area). **Spiritomb** uses the Underground only
as a "talk to 32 trainers" gate — the actual fixed encounter happens at the
Hallowed Tower on **Route 209** (already the correct place for it, if it's
modeled there). No NPC inside the Underground itself gifts or triggers a
fixed species encounter.
Sources: https://bulbapedia.bulbagarden.net/wiki/Grand_Underground ,
https://bulbapedia.bulbagarden.net/wiki/Hallowed_Tower

---

## 5. Nuzlocke community conventions

**Bottom line: no real consensus exists.** Discussion is genuinely sparse;
every source that addresses it frames the Underground as a player/house-rule
decision, not a settled standard the way "dupes clause" or "first encounter"
are.

**What was found:**
- The two most-repeated guide sources (ScreenRant, Game8 — near-identical
  phrasing, likely one framing propagating through SEO content rather than
  two independent data points) both present it as **"up to the player"**:
  either treat each Hideaway as its own separate catchable area (like a
  route), or treat the whole Grand Underground as a single area good for
  one catch total. Game8's exact wording: *"it is up to the player how they
  would like to count areas in the Grand Underground."*
- Multiple GameFAQs threads exist specifically asking "how do you rule the
  Underground in a nuzlocke" — confirming it's a recurring, unresolved
  question, not something with a settled answer (thread content itself
  wasn't accessible — 403s — only titles/existence confirmed).
- **One concrete documented example**: a NuzlockeForums "Communitylocke"
  used a **"one per unique area"** rule — i.e. each distinct hideaway counts
  as its own first-encounter-eligible area, same as an overworld route. This
  is the only specific gating pattern found in the wild, and it's a sample
  size of one community, not a broad standard.
- No evidence found for more elaborate gating (per-badge limits, per-day
  limits, etc.) — those were searched for specifically and turned up nothing.
- No evidence found for "ban it entirely" as an explicit common stance,
  though guide-site framing ("could make the challenge significantly
  easier") implies some difficulty-conscious players lean toward
  restricting it — this is inference, not a directly sourced claim.

**Recommendation for this app** (light touch, not a mandate): given there's
no real consensus, the safest move is probably to model the Underground
areas like any other dataset area (subject to the existing dupes-clause and
first-encounter-only rules exactly as routes are) and let players' own
house-rule choice do the rest — e.g. a player who wants "whole Underground =
one encounter" can simply choose to only ever resolve one hideaway and skip
the rest, which the existing skip/dupes machinery already supports. No new
engine rule appears to be needed; if anything, a `honor` rule note ("Grand
Underground hideaways: house-rule how many count") in the Rules tab copy
would set expectations without forcing a specific interpretation — the
existing honor-rule pattern (displayed, never enforced) fits this case well,
since the community itself hasn't standardized on one answer.

Sources: https://screenrant.com/pokemon-bdsp-nuzlocke-challenge-run-rules-tips-guide/ ,
https://game8.co/games/Pokemon-Brilliant-Diamond-Shining-Pearl/archives/338326 ,
https://nuzlockeforums.com/forum/threads/bdsp-communitylocke.20516/ (title/summary only, not fetched)

---

## 6. Open items before implementation

- **Fountainspring Cave, Riverbank Cave, Sandsear Cave, Spacious Cave,
  Whiteout Cave** — need their encounter tables sourced (not fetched this
  session).
- **Volcanic Cave's full family pairing** — only partially confirmed.
- **Exact rare-spawn percentages** across all hideaways — extracted via
  automated summarization, worth a direct wikitable read before shipping
  precise numbers (species presence/BD-SP splits are solid; %s are not).
- ~~Whether fossils are currently modeled~~ — CONFIRMED: 2 of 7 exist
  (`fossil-cranidos`, `fossil-shieldon`), both mis-located at `oreburgh-mine`
  instead of the Grand Underground. Needs a fix (relocate + add the other 5)
  independent of the broader hideaway work — this one's a quick, clean win.
- **Progression-tier granularity is an implementation judgment call** — full
  6-tier fidelity vs. a simplified 2-3 tier approximation. Recommend
  discussing with the owner before choosing, since it changes the schema
  shape (conditions.something vs. just bucketing into "early"/"postgame").
