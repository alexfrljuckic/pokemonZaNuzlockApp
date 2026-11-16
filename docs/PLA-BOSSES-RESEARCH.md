# Legends: Arceus — what counts as a "boss" (research, 2026-11-16)

PLA has no gyms, and its structure is much closer to Legends: Z-A than to BDSP.
Before this change `pla.json` tracked 9 milestones (5 Nobles, Volo ×2, Kamado,
Giratina) on the assumption that "PLA has no route trainers". That's true for
*route* trainers, but the story still forces about 30 battles, and several of
them are run-wipers (a missed Barry fight is what wiped the BDSP run).

## How the community caps PLA

There's no canonical list like Nuzlocke University's gym tables. Its cap page
covers Z-A (promotion matches, with rogue battles listed as optional) but has
no PLA section. The two published PLA cap lists we found treat the
mandatory *story* battles as bosses, not only the Nobles:

- nuzlockeforums "Legends: Arceus with Extra Sauce": Kricketune 12,
  Kleavor 18, Ursaluna 26, Lilligant 30, Arcanine 36, Skuntank 40,
  Electrode 46, Snowpoint Temple (Sabi) 50, Avalugg 56, then Volo/Giratina
  70 as the final boss.
- nuzlockeforums "This Ancient Land…": Alpha Kricketune, Kleavor,
  Ursaluna, Lilligant, Arcanine, Ingo, Electrode, Sabi, Avalugg, Kamado,
  Dialga/Palkia, Volo.

Other conventions that differ from classic games (several already shipped as
honor rules):

- **Player knockout**: getting knocked out by wild Pokémon in the overworld
  costs a party Pokémon (win.gg ruleset, GameFAQs threads). New rule
  `pla-player-ko`, on by default.
- **Encounters** are per named location, catching extra Pokémon for dex rank
  is allowed if they're never used (already `pla-use-only-first-catch`).
  Distortions are excluded (`pla-no-distortions`), and so are fixed alphas
  (`alphas-count`, off by default).

## What the dataset now does

- **34 milestones in mission order** (M5 → M27), each with team, levels and
  documented moves. Sources: Serebii mission pages, dittobase PLA trainer
  pages, thonky mission walkthroughs, game8's trainer list, and gamerguides
  M17 for Origin Dialga/Palkia.
- **Milestone types**: `noble`, `legendary` (Origin Dialga/Palkia, Giratina,
  Arceus), `warden`, `clan-leader`, `rival` (Rei/Akari, early Volo), `bandit`
  (Miss Fortune sisters), `story-pokemon` (alpha Kricketune, Ursaluna,
  Sabi's Braviary), and `story` (Beni, Kamado, final Volo).
- **New rule `pla-story-caps`** (enforced, default on). This is the same
  pattern as Z-A's `za-rogue-caps`. When it's on, every story battle gates
  the cap, matching the community lists. When it's off, only `noble` and
  `legendary` milestones gate the cap. That's the gym-like spine, the PLA
  equivalent of "promotion matches only".
- Existing milestone ids are unchanged, so in-progress runs keep their
  cleared state.

## Known gaps (flagged, not invented)

- **Melli outside the Ancient Quarry**: sources disagree. Thonky and the
  community list say Skuntank Lv 40, game8 says Lv 44, and Bulbapedia says
  Zubat + Skorupi Lv 22. It's tracked with `countsForLevelCap: false`, so
  Ingo (42) sets the cap.
- **No documented movesets** for the alpha Kricketune, Ursaluna, Sabi's
  Braviary, Origin Palkia, or the disputed Melli fight. Milestone cards now use
  the same "expected moves" fallback as route trainers. These are listed in
  `UNDOCUMENTED_MOVES` in `pla-dataset.test.ts`.
- **Origin Dialga or Palkia** (M17) depends on which clan you sided with.
  There's no `rosterByChoice` field, so the roster lists both and the name
  says so.
- **Not tracked**: Volo's Lv 5 Togepi in Jubilife (unclear trigger, trivial),
  and the M18 counterpart, which is frenzy-only with no Pokémon battle.
  Post-game and Daybreak content (Ingo's battles, Path of Tenacity/Solitude,
  Ginkgo Landing rematches) is also left out.
- `species-data.json` gained `magmortar`, `sneasler` and `dire-claw`. They
  were merged surgically from the PokeAPI api-data mirror because pokeapi.co
  wasn't reachable. A normal `build-species-data.mjs` run should produce the
  same entries.
