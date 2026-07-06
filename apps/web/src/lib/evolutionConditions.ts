// Curated human-readable requirement labels for evolutions whose real
// condition CANNOT be reconstructed from the fields our generated
// species-data.json carries per evolution (only: trigger, minLevel, item,
// minHappiness, timeOfDay, knownMove, location). PokeAPI's richer detail
// (known_move_type, held_item+trade combos, relative_physical_stats, gender,
// party_species, party_type, trade_species, needs_overworld_rain,
// turn_upside_down, min_beauty …) is dropped in our build, so these species
// would otherwise collapse to a generic "(special condition)" or an ugly
// slug-cased trigger name ("Three Defeated Bisharp", "Tower Of Darkness").
//
// DISPLAY-ONLY flavor text, same tone as evolutionHints.ts. Keyed by PARENT
// species slug, then by target slug (for branching families like Tyrogue)
// and/or by gameId (for methods that differ per game, like Feebas). Only
// correct entries — where a condition genuinely can't be pinned down the
// generic fallback is left in place.
//
// Sourced 2026-07-06 from Bulbapedia (bulbapedia.bulbagarden.net), evolution
// pages for each species (high confidence):
//   Feebas, Sylveon (Eevee), Inkay, Pancham, Tyrogue, Mantyke, Sliggoo,
//   Toxel, Milcery, Applin, Clamperl, Karrablast, Shelmet, Basculin
//   (White-Striped), Bramblin, Rellor, Bisharp, Farfetch'd, Kubfu, Nincada,
//   Primeape, Qwilfish, Stantler, Tandemaus, Galarian Yamask.

/** Per-target override: a fixed label, or a small map of gameId → label when
 * the method differs between our six games (default under the '*' key). */
type Cond = string | Record<string, string>;

// gameId → label picker for game-variant conditions.
function pick(cond: Cond, gameId?: string): string {
  if (typeof cond === 'string') return cond;
  return (gameId && cond[gameId]) || cond['*'];
}

// parent slug → (target slug → condition). Use '*' target for single-branch
// families where the parent alone identifies the evolution.
const CONDITIONS: Record<string, Record<string, Cond>> = {
  // Feebas: raised via max Beauty in games with contest Beauty (BDSP), and
  // via a held Prism Scale everywhere else. SwSh/SV/PLA/Z-A use the item.
  feebas: {
    milotic: {
      '*': 'Level up holding a Prism Scale',
      bdsp: 'Level up with maxed Beauty (or hold a Prism Scale)',
      lgpe: 'Level up holding a Prism Scale',
    },
  },
  // Sylveon: level up knowing a Fairy-type move with high friendship.
  eevee: { sylveon: 'Level up with high friendship & a Fairy-type move' },
  // Inkay: level 30 with the console/system held upside down.
  inkay: { malamar: 'Lv 30 with the system held upside down' },
  // Pancham: level 32 with a Dark-type Pokémon in the party.
  pancham: { pangoro: 'Lv 32 with a Dark-type in the party' },
  // Tyrogue: level 20, branch by Attack vs Defense.
  tyrogue: {
    hitmonlee: 'Lv 20 with Attack > Defense',
    hitmonchan: 'Lv 20 with Attack < Defense',
    hitmontop: 'Lv 20 with Attack = Defense',
  },
  // Mantyke: level up with a Remoraid anywhere in the party.
  mantyke: { mantine: 'Level up with a Remoraid in the party' },
  // Sliggoo (and Hisuian): level 50 while it is raining/foggy in the overworld.
  sliggoo: { goodra: 'Lv 50 in rain or fog' },
  // Hisuian Sliggoo → Hisuian Goodra (resolveEvolutionTarget re-suffixes the
  // target because goodra-hisui exists in our data).
  'sliggoo-hisui': { 'goodra-hisui': 'Lv 50 in rain or fog' },
  // Toxel: level 30; form (Amped/Low Key) decided by nature.
  toxel: { toxtricity: 'Lv 30 (form set by nature)' },
  // Milcery: spin the left stick while holding a Sweet.
  milcery: { alcremie: 'Spin holding a Sweet' },
  // Applin: give it the matching Apple. (Our data already knows the item, but
  // spell the branches out plainly.)
  applin: {
    flapple: 'Use a Tart Apple',
    appletun: 'Use a Sweet Apple',
    dipplin: 'Use a Syrupy Apple',
  },
  // Clamperl: trade holding Deep Sea Tooth (Huntail) / Deep Sea Scale (Gorebyss).
  clamperl: {
    huntail: 'Trade holding a Deep Sea Tooth',
    gorebyss: 'Trade holding a Deep Sea Scale',
  },
  // Karrablast ⇄ Shelmet: trade one for the other.
  karrablast: { escavalier: 'Trade for a Shelmet' },
  shelmet: { accelgor: 'Trade for a Karrablast' },
  // Basculin (White-Striped): lose ≥294 HP to recoil in one battle (PLA).
  'basculin-white-striped': { basculegion: 'Take 294+ recoil damage in one battle' },
  // Bramblin / Rellor: walk 1000 steps in Let's Go mode, then level up (SV).
  bramblin: { brambleghast: 'Walk 1000 steps in Let’s Go mode, then level up' },
  rellor: { rabsca: 'Walk 1000 steps in Let’s Go mode, then level up' },
  // Bisharp: level up after defeating 3 Bisharp that lead Pawniard packs (SV).
  bisharp: { kingambit: 'Defeat 3 pack-leader Bisharp, then level up' },
  // Farfetch'd (Galarian): land 3 critical hits in a single battle (SwSh).
  farfetchd: { sirfetchd: 'Land 3 critical hits in one battle' },
  'farfetchd-galar': { sirfetchd: 'Land 3 critical hits in one battle' },
  // Kubfu: clear the Tower of Darkness / Tower of Waters (SwSh Isle of Armor).
  kubfu: { urshifu: 'Clear the Tower of Darkness or Waters' },
  // Nincada: level 20 — evolves to Ninjask, and Shedinja appears with a spare
  // Poké Ball & party slot.
  nincada: { shedinja: 'Lv 20 with a spare Poke Ball & party slot' },
  // Primeape: use Rage Fist 20 times, then level up (SV).
  primeape: { annihilape: 'Use Rage Fist 20 times, then level up' },
  // Qwilfish (Hisuian): use Barb Barrage in Strong Style 20 times (PLA).
  qwilfish: { overqwil: 'Use Barb Barrage (Strong Style) 20 times' },
  'qwilfish-hisui': { overqwil: 'Use Barb Barrage (Strong Style) 20 times' },
  // Stantler: use Psyshield Bash in Agile Style 20 times (PLA).
  stantler: { wyrdeer: 'Use Psyshield Bash (Agile Style) 20 times' },
  // Tandemaus: level 25 (the extra family member appears on evolution).
  tandemaus: { maushold: 'Lv 25' },
  // Galarian Yamask: take 49+ damage in one hit then pass the stone arch in
  // the Wild Area's Dusty Bowl, then level up (SwSh).
  'yamask-galar': { runerigus: 'Take 49+ damage, pass under the Dusty Bowl arch, then level up' },
};

/** A curated requirement label for this evolution, or null when we have no
 * special-cased text (caller falls back to the data-derived label). */
export function curatedEvolutionCondition(from: string, to: string, gameId?: string): string | null {
  const byTarget = CONDITIONS[from];
  if (!byTarget) return null;
  const cond = byTarget[to] ?? byTarget['*'];
  return cond ? pick(cond, gameId) : null;
}
