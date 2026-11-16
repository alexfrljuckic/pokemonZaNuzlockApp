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

Every mandatory story battle is tracked, split by how much it matters.

**16 bosses** (the Bosses tab, these set the level cap), in mission order:
alpha Kricketune 12, Kleavor 18, Ursaluna 26, Lilligant 30, Arcanine 36,
Ingo 42, Electrode 46, Sabi 50, Sabi's Braviary 54, Avalugg 56, Kamado 62,
Origin Dialga/Palkia 65, Kamado 66, Volo 68, Giratina 70, Arceus 75.
Selection rule: everything both community cap lists agree on, plus the
fights that are the strongest thing in their stretch of the story (Braviary
right after Sabi, Kamado's Prelude Beach rematch) and the post-game finale.

**18 smaller trainer battles** live on the map in the area where they happen
(display-only area trainers, the same as BDSP route trainers). They never gate
the cap.
- Jubilife Village: Rei/Akari ×3, Adaman
- Aspiration Hill (Fieldlands Camp): Mai
- Grandtree Arena: Lian, Irida
- Solaceon Ruins: Volo
- Golden Lowlands: Coin
- Crossing Slope (Beachside Camp): Irida
- Firespit Island: Clover, Coin, Charm
- Ancient Quarry: Melli (level disputed)
- Moonview Arena: Melli
- Whiteout Valley (Snowfields Camp): Gaeric
- Temple of Sinnoh: Beni (Stone Portal)
- Primeval Grotto: Charm

There's no Stone Portal or Training Grounds area in the dataset, so those
fights sit in the nearest area, and their names say where they actually happen.

**Rule `pla-story-caps`** (enforced, default on): the non-Noble bosses (Kricketune,
Ursaluna, Ingo, Sabi, Braviary, Kamado, Volo) gate the cap. Turn it off and only
`noble` and `legendary` gate it. Same pattern as Z-A's `za-rogue-caps`.

**Rule `pla-player-ko`** (honor, default on): an overworld knockout costs a
party Pokémon.

`volo-solaceon-ruins` used to be a boss. Old runs that marked it cleared keep
that event, and the engine ignores ids it no longer finds.

## Known gaps (flagged, not invented)

- **Melli outside the Ancient Quarry**: sources disagree. Thonky and the
  community list say Skuntank Lv 40, game8 says Lv 44, and Bulbapedia says
  Zubat + Skorupi Lv 22. It's an area trainer, so it never sets the cap.
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
