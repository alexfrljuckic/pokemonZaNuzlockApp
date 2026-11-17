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

## What the app now does

Every mandatory story battle is tracked. Alex chose to split them like this
(2026-11-16):

**8 bosses** (Boss Fights tab, these set the level cap): the five Nobles
(Kleavor 18, Lilligant 30, Arcanine 36, Electrode 46, Avalugg 56), Origin
Dialga/Palkia 65, Giratina 70, Arceus 75.

**26 trainer battles** in a new **Trainers tab** (right after Routes, then Boss Fights, then Team & Box), grouped
by area. They use the same card format as Boss Fights and never set the cap.
Clicking a trainer in a Routes area opens it in the Trainers tab.
- Jubilife Village: Rei/Akari ×3, Adaman, Kamado (Prelude Beach)
- Aspiration Hill (Fieldlands Camp): Mai
- Deertrack Heights: Alpha Kricketune
- Grandtree Arena: Lian, Irida
- Solaceon Ruins: Volo
- Golden Lowlands: Coin
- Sludge Mound: Ursaluna
- Crossing Slope (Beachside Camp): Irida
- Firespit Island: Clover, Coin, Charm
- Ancient Quarry: Melli (level disputed)
- Wayward Cave: Ingo
- Moonview Arena: Melli
- Whiteout Valley (Snowfields Camp): Gaeric
- Pearl Settlement: Sabi, plus her Braviary (Snowpoint Temple is above the
  settlement)
- Temple of Sinnoh: Beni (Stone Portal), Kamado, Volo
- Primeval Grotto: Charm

The dataset has no Stone Portal, Training Grounds, Snowpoint Temple or Prelude
Beach area, so those fights sit in the nearest area, and their names say where
they actually happen.

The Trainers tab only appears for games that have documented trainer battles:
BDSP (431), Let's Go (204), SV (208), SwSh (103) and PLA (26). Z-A and Radical
Red have none, so they don't get the tab.

**Rule `random-encounter-roll`** (enforced, default on for PLA and Z-A,
1 reroll per area, adjustable 0-3 in Rules): in open-world games you see
many Pokémon at once, so there's no natural "first encounter". This brings
back the original Z-A app's roll. In each area the app picks one species
uniformly from what you can still legally catch there (dupes excluded),
and only that species stays selectable. The roll is stored as an
`encounter_rolled` event, so replay stays deterministic. Resetting the area
clears the roll. If the rolled species becomes a dupe before you resolve the
area, the roll is void and you roll again.

**Rule `pla-player-ko`** (honor, default on): an overworld knockout costs a
party Pokémon.

`kamado`, `volo-solaceon-ruins` and `volo-temple-of-sinnoh` used to be boss
ids. Old runs that marked them cleared keep that event, and the engine ignores
ids it no longer finds.

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

## Side requests (Quests tab), 2026-11-16

`pla.json` now has `quests`: all 122 requests (94 base game + 28 from the
Daybreak update, marked `group: "daybreak"`). Each has giver, place, unlock
condition and rewards, from Bulbapedia's "Task (Legends: Arceus)" table.
Each quest sits in the area where you pick it up. 95 of them start in
Jubilife Village (Galaxy Hall and the village); camps map to the area
Bulbapedia places them in.

Requests that give Pokémon: #20 Chimchar, #22 Spiritomb, #66 Manaphy (plus
Phione ×3, as Bulbapedia lists it), #91 Giratina, #92 Shaymin (needs
Sword/Shield save data), #93 Darkrai (needs BDSP save data). All six start in
Jubilife Village.

**Rule `quest-reward-pokemon`** (enforced, PLA, default "area encounter"):
- area encounter: claiming a reward uses up the encounter of the quest's
  area (`special_claimed` with `areaId`). Resetting the claim gives it back.
- free: always claimable, no encounter used.
- banned: listed but can't be claimed.

Note: because every reward is in Jubilife, "area encounter" means at most one
reward Pokémon per run, and only if Jubilife's own encounter is unused.
