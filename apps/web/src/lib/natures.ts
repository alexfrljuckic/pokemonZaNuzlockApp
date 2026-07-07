// Nature → stat-modifier table. Each of the 25 natures raises one stat by 10%
// and lowers another by 10%; HP is never affected. The 5 neutral natures
// (Hardy, Docile, Serious, Bashful, Quirky) raise and lower the same stat, so
// they have no net effect and surface no arrows. Chart per Bulbapedia:
// https://bulbapedia.bulbagarden.net/wiki/Nature

/** The five stats a nature can modify — matches the species-data stat keys used
 * by STAT_ORDER (HP is deliberately excluded; natures never touch it). */
export type NatureStat = 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

export interface NatureEffect {
  /** Stat raised by 10%, if any (absent for neutral natures). */
  raised?: NatureStat;
  /** Stat lowered by 10%, if any (absent for neutral natures). */
  lowered?: NatureStat;
}

// Full 25-nature chart. Neutral natures map to {} (no net effect). Keys are the
// lowercase nature slugs the app stores; lookups are case-insensitive.
const NATURE_EFFECTS: Record<string, NatureEffect> = {
  // neutral — raise and lower the same stat, so no arrows
  hardy: {},
  docile: {},
  serious: {},
  bashful: {},
  quirky: {},
  // +Attack
  lonely: { raised: 'attack', lowered: 'defense' },
  brave: { raised: 'attack', lowered: 'speed' },
  adamant: { raised: 'attack', lowered: 'special-attack' },
  naughty: { raised: 'attack', lowered: 'special-defense' },
  // +Defense
  bold: { raised: 'defense', lowered: 'attack' },
  relaxed: { raised: 'defense', lowered: 'speed' },
  impish: { raised: 'defense', lowered: 'special-attack' },
  lax: { raised: 'defense', lowered: 'special-defense' },
  // +Speed
  timid: { raised: 'speed', lowered: 'attack' },
  hasty: { raised: 'speed', lowered: 'defense' },
  jolly: { raised: 'speed', lowered: 'special-attack' },
  naive: { raised: 'speed', lowered: 'special-defense' },
  // +Sp. Atk
  modest: { raised: 'special-attack', lowered: 'attack' },
  mild: { raised: 'special-attack', lowered: 'defense' },
  quiet: { raised: 'special-attack', lowered: 'speed' },
  rash: { raised: 'special-attack', lowered: 'special-defense' },
  // +Sp. Def
  calm: { raised: 'special-defense', lowered: 'attack' },
  gentle: { raised: 'special-defense', lowered: 'defense' },
  sassy: { raised: 'special-defense', lowered: 'speed' },
  careful: { raised: 'special-defense', lowered: 'special-attack' },
};

/** Which stats a nature raises/lowers. Returns an empty object for a missing,
 * unknown, or neutral nature (no arrows). Case-insensitive. */
export function natureEffect(nature?: string | null): NatureEffect {
  if (!nature) return {};
  return NATURE_EFFECTS[nature.toLowerCase()] ?? {};
}
