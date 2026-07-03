# Multi-Game Nuzlocke Tracker — Product & Technical Plan

*Prepared July 2026 · Successor to [pokemonZaNuzlockApp](https://github.com/alexfrljuckic/pokemonZaNuzlockApp)*

---

## 1. What you already have, and what changes

The Z-A app is a genuinely solid v1: zone-based encounter rolling with dupes clause, party/box/graveyard management, boss list with level-cap modes, revive tokens, toggleable optional rules, and read-only sharing via JSONBin. Almost every concept in it survives into the new app — but each one gets generalized:

| Z-A app concept | Multi-game generalization |
|---|---|
| Hardcoded `ZD` zone table | Per-game **area dataset** (routes, wild zones, biomes) loaded by game ID |
| Hardcoded `BD` boss table | Per-game **milestone dataset** (gyms, nobles, promotion matches, titans...) |
| `capMode: strict/loose/none` | A **rule parameter** on the level-cap rule, driven by each game's milestone data |
| Revive tokens (Z-A specific) | A **conditional rule** that only activates for games/rulesets that define it |
| One implicit run per browser | **Run** entity — many runs per user, across games, linkable into a genlocke campaign |
| JSONBin BYO-key sync | Real backend with **accounts**, sync, and first-class share links |
| `?view={binId}` read-only mode | **Share token** with server-enforced read-only access and live updates |

The single most important architectural lesson from v1 to carry forward: game content is data, not code. The new app takes that further — *rules* also become data, so a new game or clause is a dataset change, not a rewrite.

## 2. Scope: the games

Mainline games available on Switch / Switch 2, which is six titles (nine counting versions) plus DLC:

| Game | Year | Structure | Nuzlocke quirks the app must handle |
|---|---|---|---|
| Let's Go Pikachu / Eevee | 2018 | Classic Kanto routes | No wild battles (catch-only encounters), no held items/abilities, candy system; "first encounter" means first *catch opportunity*; partner Pokémon can't die by convention |
| Sword / Shield (+ Isle of Armor, Crown Tundra) | 2019 | Routes + open Wild Area | Weather-dependent spawns; Wild Area sub-zones (one encounter per zone vs. per whole Wild Area is a rule choice); raid dens as optional encounter source; version exclusives |
| Brilliant Diamond / Shining Pearl | 2021 | Classic Sinnoh routes | The most "standard" nuzlocke on Switch; Grand Underground needs its own clause (one encounter total, per room type, or banned); Poké Radar, swarms, time-of-day |
| Legends: Arceus | 2022 | Five open zones | No gyms — level caps keyed to Noble/Frenzy fights; overworld aggression means the *trainer* can black out; alphas, space-time distortions, mass outbreaks as encounter modifiers |
| Scarlet / Violet (+ Teal Mask, Indigo Disk) | 2022 | Fully open world | No route boundaries — areas are province sub-regions with biome-based pools; three intertwined paths (gyms/titans/Team Star) means level caps depend on a chosen order; picnics/eggs and Tera raids need clauses |
| Legends: Z-A (+ Mega Dimension) | 2025 | Wild Zones in Lumiose | Already modeled in v1: promotion matches, rogue megas, revive-token economy, Hyperspace DLC zones |

Gen 10 (*Winds and Waves*, announced for 2027 on Switch 2) is out of scope for building but **in scope for design**: everything below is structured so adding it later is "author a dataset," not "refactor the app."

## 3. The hard problem: encounter data

This is the make-or-break finding from research. **PokéAPI's encounter/location data stops at Gen 7.** Species, types, sprites, evolution chains, and moves are all available and reliable — but *where Pokémon appear* in LGPE, SwSh, BDSP, PLA, SV, and Z-A is simply not in the API. There is community work in progress to contribute Gen 8+ encounter data to PokéAPI, but you cannot depend on it shipping.

So the plan is a hybrid data strategy:

**From PokéAPI (fetched at build time, cached locally):** species list, national dex numbers, types, sprites, and — critically for the dupes clause — evolution chains, so "already own a member of this evolutionary line" is computable for any species in any game.

**Curated per-game datasets (your own JSON, versioned in the repo):** areas, encounter pools per area with conditions (version, weather, time, biome, method), gift/static/trade encounters, milestone lists with level caps, and badge/progress ordering. Sources: Serebii and Bulbapedia, which document all six games thoroughly. Your Z-A `data.js` already *is* this dataset for one game — it just needs converting to the shared schema.

A recommended dataset schema (one file per game):

```jsonc
{
  "gameId": "bdsp",
  "versions": ["brilliant-diamond", "shining-pearl"],
  "areas": [
    {
      "id": "route-218",
      "name": "Route 218",
      "unlockAfter": null,          // milestone id gating availability, if any
      "tags": ["route"],
      "encounters": [
        {
          "species": "mr-mime",
          "methods": ["walk"],
          "conditions": { "version": ["brilliant-diamond"] },
          "rate": 15
        }
        // ...
      ]
    }
  ],
  "specials": [
    { "id": "gift-eevee", "type": "gift", "species": "eevee", "area": "hearthome-city" }
  ],
  "milestones": [
    {
      "id": "gym-1-roark", "name": "Roark (Oreburgh Gym)",
      "type": "gym", "order": 1,
      "aceLevel": 14,               // level cap derives from this + rule params
      "grants": []                  // e.g. revive tokens in Z-A
    }
  ],
  "mechanics": {                     // flags rules can condition on
    "heldItems": true, "wildBattles": true, "setModeOption": true,
    "raids": false, "overworldAggro": false
  }
}
```

Build order for datasets, easiest to hardest (mirroring the community's own assessment): **Z-A** (port from v1) → **LGPE** (small dex, simple structure) → **BDSP** (classic routes, well documented) → **SwSh** (weather + Wild Area) → **SV** (biomes, open world) → **PLA** (most exotic encounter methods). Ship games incrementally; the app should gracefully list which games are supported.

Two data-authoring rules to adopt from day one: every dataset gets a `schemaVersion`, and every dataset gets validated in CI against a JSON Schema so a typo in an encounter table can't crash the app.

## 4. The rules engine

The centerpiece. Rules are declarative objects the engine interprets, with a small number of code-level hook points. A rule looks like:

```jsonc
{
  "id": "dupes-clause",
  "name": "Dupes Clause",
  "category": "encounter",
  "default": true,
  "params": { "scope": "evolution-line" },   // or "species"
  "appliesTo": "all",                         // or list of gameIds
  "conflictsWith": [],
  "hooks": ["filterEncounterPool"]
}
```

The engine exposes a fixed set of hooks that game state flows through: `filterEncounterPool` (what's legal to roll/claim in an area), `onEncounterResolved` (caught / failed / skipped), `onCatch` (where does it go, does it consume a token), `onFaint` (death, revive-token offer, soul-link propagation), `validateTeam` (level caps, party size, type restrictions before a boss), `onMilestone` (grant revives, raise caps), and `onRunEnd`. Every rule is a pure function over `(state, event, params)` — which keeps them testable and keeps the UI dumb.

**Rule presets** bundle rules into recognizable configurations, editable before and during a run (with an audit note when changed mid-run, for honesty in shared views):

- **Standard** — first encounter per area, faint = permanent death, nickname clause, dupes clause on.
- **Hardcore** — standard + no bag items in battle, strict level caps (next boss's ace), Set mode.
- **Casual** — standard + shiny clause, gift clause, second-chance revives per badge.
- **Custom** — any combination, plus free-text house rules that render in the rules tab and shared view even if the engine can't enforce them. This matters: the engine should *track* everything but only *enforce* what it can know. A "no TMs" rule can't be verified by the app — it's displayed as an honor rule with a checkbox, not silently dropped.

**The clause library** (all toggleable, parameterized): dupes (species vs. line scope), shiny, gift/static ("free" encounters or not), level cap (ace−1 / ace / +n offset / none), Set mode, no items in battle, no X-items only, item limit per battle, party-size matching, no repels, Pokémon Center limits, second-chance/revive economy (per badge, per milestone type, or token grants like Z-A), boxing-vs-release for the fallen, and slow-start (rules activate only once Poké Balls are obtainable).

**Game-conditional rules** attach via `appliesTo` and the `mechanics` flags: Grand Underground clause (BDSP), Wild Area granularity and raid-den clause (SwSh), Tera raid / picnic-egg clauses and gym-order-based caps (SV), trainer-blackout-counts-as-death and alpha clause (PLA), revive tokens and rogue-mega caps (Z-A), catch-combo clause (LGPE). When a rule doesn't apply to the selected game it simply doesn't render — the Z-A app's rules tab already does a version of this.

**Variant scaffolding** (later phases, but the hook design anticipates them): monolocke (type filter on `filterEncounterPool` + the token/Dusty clause for empty areas), wedlocke (pair constraint on switching), soul link (two runs subscribed to each other's `onFaint`/`onCatch` events — this falls out almost free once the backend has realtime), egglocke/wonderlocke (encounter replacement sources).

## 5. Runs, campaigns, and the genlocke

The core entities:

**Run** — one playthrough: game, version, ruleset (preset + overrides, changeable mid-run with every change recorded as a `rule_changed` event), status (active / victory / wiped-continuing / abandoned / complete), and its event log. A full wipe is an *event, not an ending*: when the last living team member falls, the app records a `wipe` event, displays the wipe prominently (in the owner's view and the shared view), and asks the player whether to reset the run or keep playing for fun. A continued run is honestly badged as "continuing after wipe" everywhere it's displayed, with the wipe pinned in the timeline — open-ended play without muddying what counts as a nuzlocke victory. Everything that happens in a run is an append-only **event** (`encounter_resolved`, `catch`, `faint`, `milestone_cleared`, `rule_changed`, `note`). State (party, box, graveyard, caps) is derived from the event log. This is the single biggest structural upgrade over v1's mutable state object: it gives you undo, an activity timeline for spectators, honest mid-run rule-change history, and every metric in §7 for free.

**Campaign (genlocke)** — an ordered sequence of runs across games. The canonical generationlocke rule: survivors of one game's champion team carry into the next game as your starters, and death remains permanent across the whole campaign. Model it as:

- Campaign holds an ordered list of run slots (you choose the game sequence — for Switch-only that's typically LGPE → SwSh → BDSP → PLA → SV → Z-A, but it's user-defined).
- On completing a run, the app presents the surviving party and lets you **export champions** into the campaign roster.
- The next run starts with an **import step**: campaign roster members enter the new game as pre-filled team members (flagged `imported`, exempt from that game's encounter rules), with a species-availability check against the new game's dex and a configurable fallback rule (substitute closest evolution-line member, or the Pokémon "sits out" that generation).
- Campaign-level rules layer on top of per-run rules: carryover count limits, whether items/nicknames persist, whether a fully-wiped run ends the campaign or burns one campaign life.

Because a genlocke is just "runs + a roster + linking rules," building solid single-run foundations first means the genlocke phase is mostly UI.

## 6. Architecture

### Recommendation

**Frontend:** React + TypeScript, built with Vite, structured as a PWA. React over staying vanilla because the UI is about to grow a lot (multi-run dashboards, rule editors, campaign views), the ecosystem answers every problem you'll hit, and it's the most transferable skill. TypeScript specifically because the rules engine and dataset schemas are exactly the kind of code where types catch entire bug classes. The PWA route covers "desktop and mobile" with one codebase: installable to a phone home screen, offline-capable, no app-store friction. (Native apps via React Native/Capacitor remain possible later since the engine will be a plain TS package.)

**Backend:** Supabase — Postgres, auth (email + OAuth), row-level security, and realtime subscriptions in one free-tier-friendly service. It replaces JSONBin's role while adding the two things JSONBin can't do: real per-user accounts and *enforced* read-only sharing (v1's view-mode lock is client-side only; anyone with the bin ID and the API shape could write to a public bin). RLS policies make "owner can write, share-token holders can read" a database guarantee.

**Local-first sync:** the app writes every event to IndexedDB immediately and syncs to Supabase in the background — v1's localStorage + debounced push pattern, upgraded. You're often tracking on a phone while the Switch is in your hands; the app must never lose a death because the Wi-Fi hiccuped. Append-only events make sync conflict-resolution nearly trivial (union of events, ordered by timestamp).

**Hosting:** static frontend on Vercel/Netlify/GitHub Pages (you keep the push-and-refresh workflow), Supabase hosted.

### Data model (Postgres)

```
users            (from Supabase auth)
runs             id, user_id, game_id, version, ruleset jsonb, status, created_at
run_events       id, run_id, seq, type, payload jsonb, created_at   -- append-only
campaigns        id, user_id, name, rules jsonb
campaign_runs    campaign_id, run_id, slot_order
campaign_roster  campaign_id, species, nickname, origin_run_id, status
share_tokens     token, run_id | campaign_id, created_at, revoked
profiles         user_id, handle, display_name, is_public
follows          follower_id, followed_id, created_at
```

Game datasets (areas, encounters, milestones) ship as static JSON with the frontend — they're content, not user data, and keeping them out of the database means no migration when a dataset gets corrected.

### Repo shape

```
packages/
  engine/      # pure TS: rule definitions, hooks, state derivation. Zero DOM. Fully unit-tested.
  datasets/    # per-game JSON + JSON Schema + validation script (CI)
apps/
  web/         # React PWA consuming engine + datasets
supabase/      # migrations, RLS policies
```

The engine-as-pure-package split is what makes the rules engine trustworthy: hundreds of small tests like "hardcore preset + BDSP + Roark ace 14 → level 15 Pokémon fails validateTeam" run in milliseconds with no browser.

## 7. Metrics & stats

Because state derives from an event log, all of these are queries, not extra bookkeeping. Per run: encounter outcomes by area (caught/failed/skipped map — v1's Stats tab, richer), deaths with cause/location/killer, survival rate by species and by evolution line, kills and boss participation per team member (MVP tracking), close calls (faints where revive tokens were spent), time between milestones, and a full scrollable timeline. Per user: runs by game, win rate, most-lost species, longest-surviving Pokémon ever. Per campaign: the genlocke hall of fame — which Pokémon crossed how many generations, cumulative graveyard, per-generation attrition. These stats are also the beating heart of the shared view — spectators care about the graveyard and the timeline more than the box.

## 8. Sharing

Each run or campaign can mint a share link (`app.example.com/r/{token}`). Read-only is enforced server-side by RLS keyed on the token, not by disabling buttons. The shared view gets: live updates via Supabase realtime (replacing v1's 60-second poll), the timeline, team/graveyard/stats, and the active ruleset so viewers know what challenge is actually being run. Tokens are revocable, and an Open Graph card (current badges + team sprites) makes links unfurl nicely in Discord — where these links will actually live.

**Profiles and following (no leaderboards).** Each user gets an optional public profile (`/u/{handle}`) listing the runs and campaigns they've chosen to share — sharing stays opt-in per run; a public profile never exposes private runs. A lightweight follow system (a single `follows` table) powers a "Following" feed: open the app and see the latest events from your friends' shared runs — new badges, new catches, and deaths, which are frankly the main attraction. No rankings, no competition mechanics; this is a spectator feature, not a leaderboard.

## 9. Roadmap

**Phase 0 — Foundations (1–2 weeks of evenings).** Repo scaffold, dataset JSON Schema, engine package skeleton with hook interfaces, port the Z-A dataset from `data.js` into the new schema. Exit criterion: engine unit tests replay a synthetic Z-A run correctly.

**Phase 1 — Single-run tracker, local only (3–5 weeks).** React PWA with the five-tab structure you already validated (Areas / Team & Box / Milestones / Rules / Stats), rules engine wired to UI, rule presets + toggles, Z-A and one classic-structure game (BDSP or LGPE) supported, everything in IndexedDB. This is the moment the new app replaces the old one for your own use, including an importer for the v1 localStorage/JSONBin state.

**Phase 2 — Accounts, sync, sharing (2–3 weeks).** Supabase auth, event sync, share tokens with RLS, realtime spectator view. Exit criterion: a friend on their phone watches your run update live and provably cannot modify it.

**Phase 3 — Full game coverage (ongoing, parallelizable).** Author SwSh, SV, PLA datasets and their conditional rules; DLC areas as toggleable dataset segments (your DLC clause, generalized). Each game ships independently.

**Phase 4 — Metrics & timeline (1–2 weeks).** Stats dashboard and spectator timeline from the event log.

**Phase 5 — Genlocke (2–3 weeks).** Campaigns, champion export/import, availability fallbacks, campaign stats.

**Phase 6 — Variants & polish.** Soul link (realtime makes it feasible), monolocke, wedlocke; PWA install prompts, keyboard shortcuts, localization of species names (free via PokéAPI).

## 10. Risks & open questions

**Dataset accuracy and maintenance is the long-term cost center.** Encounter tables are large, sources occasionally disagree, and DLC patches change spawns. Mitigations: JSON Schema validation in CI, a per-area "report an error" link in the UI, and datasets versioned separately from app code so fixes ship instantly.

**"Area" is a judgment call in open-world games.** Where one Wild Area zone ends, or how SV provinces subdivide, has no canonical answer — the community itself disagrees. Decide a sensible default per game, but expose granularity as a rule parameter (e.g., "Wild Area: whole-area / per-zone") rather than pretending there's one truth.

**Enforcement vs. honor.** The app can't see the actual game. Frame every rule as either *enforced* (the app can gate it: encounter legality, level caps at team-validation time) or *tracked* (honor system with visible acknowledgment: no TMs, Set mode). Being explicit about this distinction in the UI builds trust in shared runs.

**IP caution.** This stays a free fan project: no official artwork beyond community-standard PokéAPI sprites, no monetization, clear "not affiliated with Nintendo/The Pokémon Company" footer.

**Scope discipline.** The phase gates exist so each stage is independently useful. The strongest version of this plan is the one where Phase 1 actually ships; everything after that is compounding on a working core.

## 11. Decisions (July 2026)

Game order after the Z-A port: **BDSP first, then LGPE**, then SwSh → SV → PLA. Mid-run rule changes: **allowed, always audited** — every change is a `rule_changed` event visible in the timeline and shared view. Wipes: **non-terminal** — the app records and displays the wipe, and the player chooses to reset or continue for fun, with continued runs badged accordingly. No leaderboards. **Public profiles + following are in**, as a spectator feature for keeping up with multiple friends' runs.

## 12. Free-tier feasibility

The whole architecture fits free tiers with real headroom, because the heavy content (game datasets, sprites) never touches the paid-metered backend.

**Frontend + datasets:** Vercel, Netlify, or GitHub Pages host the static PWA and the per-game JSON for free; sprites come from PokéAPI's CDN. Zero backend cost for any of it.

**Supabase free tier (as of mid-2026):** 500 MB database, 50,000 monthly active users, 5 GB egress/month, 200 concurrent realtime connections, 2 million realtime messages/month, 2 free projects. Run the math against this app: a complete nuzlocke run is roughly 300–600 events at a few hundred bytes each — call it ~250 KB per run. The 500 MB database holds on the order of a couple thousand full runs, i.e., years of you-plus-friends usage. Egress is the metric to respect: keep API responses paginated, serve spectators a compact derived snapshot plus recent events rather than the full log on every load, and cache aggressively client-side. The 200-concurrent-realtime ceiling only matters if a shared run goes unexpectedly viral, which is a good problem and a $25/month solution.

Three free-tier gotchas to design around from day one. First, **free projects pause after 7 days of inactivity** — mitigated with a scheduled GitHub Actions ping (GitHub integration is available on Supabase's free plan as of April 2026). Second, **no automatic backups** — run a nightly `pg_dump` via GitHub Actions to a free storage target; the event-log design also means users can export their runs as JSON locally. Third, on the free tier, **hitting a hard cap (like egress) returns errors until the cycle resets** rather than billing overage — another reason the app must stay local-first: even if the backend is briefly unreachable, tracking continues in IndexedDB and syncs later. One more housekeeping note: Supabase projects created after May 30, 2026 require explicit Postgres grants for the auto-generated Data API — new-project setup docs cover it, just don't be surprised when the REST layer needs grants added.

Total running cost at launch: **$0**, with the first real upgrade trigger being either sustained realtime spectator load or wanting managed backups — both solved by Supabase Pro at $25/month if the app ever earns it.
