// Per-game evolution-target overrides.
//
// PokeAPI evolution chains are SPECIES-level: a chain node is `decidueye`,
// `typhlosion`, `lilligant`, ... never the regional variety. Which VARIETY a
// mon actually evolves into is a property of the GAME being played — in
// Legends: Arceus a Dartrix becomes Hisuian Decidueye, but the same species
// chain resolves to Kanto Decidueye everywhere the game data derives from
// PokeAPI. `resolveEvolutionTarget` only fixes lines whose PARENT already
// carries a regional suffix (growlithe-hisui → arcanine-hisui); it can't help
// a suffix-less parent (dartrix, petilil, koffing) that evolves into a
// regional variety, nor can it inject an evolution the generated data lacks
// entirely (the PLA starter mid-stages aren't in any encounter pool, so they
// have no PokeAPI-derived evolution row at all).
//
// This layer is a small hand-authored map keyed by `[gameId][parentSlug]`.
// When an entry exists it REPLACES the PokeAPI-derived options for that species
// in that game with the correct per-game varieties. Entries are plain
// `Evolution`-shaped data (same requirement-label pipeline as derived rows), so
// adding a game/line is data, not plumbing. The engine preserves nicknames on
// evolve and un-evolve independent of species-data, so injecting a target slug
// that isn't in species-data.json is safe (the sprite CDN is keyed by slug too).
//
// Regional-evolution facts curated 2026-07-06 from Bulbapedia:
//   Hisuian Decidueye:  https://bulbapedia.bulbagarden.net/wiki/Decidueye_(Pok%C3%A9mon)#Hisuian_Decidueye
//   Hisuian Typhlosion: https://bulbapedia.bulbagarden.net/wiki/Typhlosion_(Pok%C3%A9mon)#Hisuian_Typhlosion
//   Hisuian Samurott:   https://bulbapedia.bulbagarden.net/wiki/Samurott_(Pok%C3%A9mon)#Hisuian_Samurott
//   Hisuian Lilligant:  https://bulbapedia.bulbagarden.net/wiki/Lilligant_(Pok%C3%A9mon)#Hisuian_Lilligant
//   Hisuian Braviary:   https://bulbapedia.bulbagarden.net/wiki/Braviary_(Pok%C3%A9mon)#Hisuian_Braviary
//   Hisuian Sliggoo/Goodra: https://bulbapedia.bulbagarden.net/wiki/Sliggoo_(Pok%C3%A9mon)#Hisuian_Sliggoo
//   Hisuian Avalugg:    https://bulbapedia.bulbagarden.net/wiki/Avalugg_(Pok%C3%A9mon)#Hisuian_Avalugg
//   Galarian Weezing:   https://bulbapedia.bulbagarden.net/wiki/Weezing_(Pok%C3%A9mon)#Galarian_Weezing
//   Galarian Darmanitan: https://bulbapedia.bulbagarden.net/wiki/Darmanitan_(Pok%C3%A9mon)#Galarian_Darmanitan
//
// Z-A "hyperspace" regional forms (PR #155). These forms exist in Z-A but their
// cross-gen evolutions come from a SPECIES-level PokeAPI chain that carries the
// WRONG BRANCH or the wrong METHOD for the regional parent (the target slug is
// often right, but an extra Kanto/Unova branch or a base-form method leaks in).
// Facts curated 2026-07-06 from Bulbapedia:
//   Galarian Meowth → Perrserker ONLY (Lv 28) — the derived `persian` branch is
//     the Kanto line and must be dropped for the Galarian form:
//     https://bulbapedia.bulbagarden.net/wiki/Meowth_(Pok%C3%A9mon)#Evolution
//   Alolan Meowth → Alolan Persian ONLY (high friendship) — the derived
//     `perrserker` branch is spurious and the Lv-28 method is wrong here:
//     https://bulbapedia.bulbagarden.net/wiki/Meowth_(Pok%C3%A9mon)#Evolution
//   Galarian Yamask → Runerigus ONLY — the derived `cofagrigus` (Lv 34) branch
//     is the Unova line and must be dropped for the Galarian form:
//     https://bulbapedia.bulbagarden.net/wiki/Yamask_(Pok%C3%A9mon)#Evolution
//   Galarian Slowpoke → Galarian Slowbro (Galarica Cuff) / Galarian Slowking
//     (Galarica Wreath) — the derived Lv-37 / trade-King's-Rock methods are the
//     KANTO methods; only the items differ for the Galarian form:
//     https://bulbapedia.bulbagarden.net/wiki/Slowpoke_(Pok%C3%A9mon)#Evolution
// Verified ALREADY-CORRECT in Z-A (deliberately NO override — the chain, with
// evolutionConditions.ts for the label, is right):
//   Galarian Mr. Mime → Mr. Rime (Lv 42); Galarian Farfetch'd → Sirfetch'd
//   (3 crits, curated); Hisuian Qwilfish → Overqwil (Strong-Style Barb Barrage
//   ×20, curated); Hisuian Sliggoo → Hisuian Goodra (Lv 50 rain/fog, curated).
//
// Cases where the PokeAPI chain ALREADY yields the right variety are
// deliberately NOT listed here (they need no override): parents that carry a
// regional suffix and whose target's regional variety exists in our data get
// fixed by `resolveEvolutionTarget`; brand-new Hisui species (Kleavor,
// Wyrdeer, Ursaluna, Overqwil, Sneasler, Basculegion) and the Galar cross-gen
// evolutions (Perrserker, Runerigus, Sirfetch'd, Cursola, Mr. Rime, Obstagoon,
// Galarian Slowbro/Slowking) are their OWN species/variety slug in the chain,
// so PokeAPI already returns the correct target.

import type { Evolution } from './speciesData';

// `[gameId][parentSlug] -> Evolution[]` (replaces the derived options for that
// species in that game).
export const EVOLUTION_OVERRIDES: Record<string, Record<string, Evolution[]>> = {
  // Legends: Arceus — every Hisuian regional-variety evolution.
  pla: {
    // Starter final stages: not in any encounter pool, so PokeAPI-derived data
    // has no row for these mid-stages at all — inject them (Lv 36 in PLA).
    dartrix: [{ to: 'decidueye-hisui', trigger: 'level-up', minLevel: 36, item: null }],
    quilava: [{ to: 'typhlosion-hisui', trigger: 'level-up', minLevel: 36, item: null }],
    dewott: [{ to: 'samurott-hisui', trigger: 'level-up', minLevel: 36, item: null }],
    // Suffix-less parents that evolve into a Hisuian variety in PLA.
    petilil: [{ to: 'lilligant-hisui', trigger: 'use-item', minLevel: null, item: 'sun-stone' }],
    rufflet: [{ to: 'braviary-hisui', trigger: 'level-up', minLevel: 54, item: null }],
    goomy: [{ to: 'sliggoo-hisui', trigger: 'level-up', minLevel: 40, item: null }],
    bergmite: [{ to: 'avalugg-hisui', trigger: 'level-up', minLevel: 37, item: null }],
  },
  // Sword/Shield — the two Galarian-only regional evolutions PokeAPI resolves
  // to the Kanto/Unova variety.
  swsh: {
    // Galarian Koffing line: in SwSh, Koffing evolves into GALARIAN Weezing.
    koffing: [{ to: 'weezing-galar', trigger: 'level-up', minLevel: 35, item: null }],
    // Galarian Darumaka evolves into Galarian Darmanitan (Standard mode).
    'darumaka-galar': [
      { to: 'darmanitan-galar-standard', trigger: 'use-item', minLevel: null, item: 'ice-stone' },
    ],
  },
  // Legends Z-A — "hyperspace" regional forms whose derived chain carries an
  // extra base-form branch or the base-form method. Each row REPLACES the
  // derived options with only the branch/method the regional form actually uses.
  plza: {
    // Galarian Meowth evolves ONLY into Perrserker (Lv 28); drop the spurious
    // Kanto `persian` branch that the shared chain includes.
    'meowth-galar': [{ to: 'perrserker', trigger: 'level-up', minLevel: 28, item: null }],
    // Alolan Meowth evolves ONLY into Alolan Persian, by high friendship — not
    // the Lv-28 Perrserker path the shared chain lists.
    'meowth-alola': [
      { to: 'persian-alola', trigger: 'level-up', minLevel: null, item: null, minHappiness: 220 },
    ],
    // Galarian Yamask evolves ONLY into Runerigus (take 49+ damage, then pass
    // under the arch); drop the Unova `cofagrigus` (Lv 34) branch. The curated
    // label for yamask-galar → runerigus supplies the human method text.
    'yamask-galar': [{ to: 'runerigus', trigger: 'take-damage', minLevel: null, item: null }],
    // Galarian Slowpoke: same targets as Kanto but item-driven — Galarica Cuff
    // for Galarian Slowbro, Galarica Wreath for Galarian Slowking.
    'slowpoke-galar': [
      { to: 'slowbro-galar', trigger: 'use-item', minLevel: null, item: 'galarica-cuff' },
      { to: 'slowking-galar', trigger: 'use-item', minLevel: null, item: 'galarica-wreath' },
    ],
  },
};

/** Per-game evolution override rows for a parent species, or null when this
 * game plays the line the same way PokeAPI's species-level chain describes. */
export function evolutionOverrideFor(species: string, gameId: string | undefined): Evolution[] | null {
  if (!gameId) return null;
  return EVOLUTION_OVERRIDES[gameId]?.[species] ?? null;
}
