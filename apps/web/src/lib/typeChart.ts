/* Static Gen 6+ type-effectiveness chart (attacker → defender → multiplier).
 * Only non-1.0 relationships are listed; anything absent is neutral (×1).
 * Used for matchup hints (boss weaknesses) — no network, no generated data. */
const CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const ALL_TYPES = Object.keys(CHART);

/** Damage multiplier of an attacking move type against a defender's type(s). */
export function effectiveness(attackType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce((mult, def) => mult * (CHART[attackType]?.[def] ?? 1), 1);
}

/** Attacking types that are super-effective (×2 or ×4) against these defender
 * types, sorted strongest first. */
export function weaknesses(defenderTypes: string[]): { type: string; x: number }[] {
  if (defenderTypes.length === 0) return [];
  return ALL_TYPES.map((atk) => ({ type: atk, x: effectiveness(atk, defenderTypes) }))
    .filter((w) => w.x > 1)
    .sort((a, b) => b.x - a.x);
}

/** Attacking types the defender resists — half (½×) or quarter (¼×) damage,
 * excluding outright immunities (×0). Sorted strongest resistance first (¼ before ½). */
export function resistances(defenderTypes: string[]): { type: string; x: number }[] {
  if (defenderTypes.length === 0) return [];
  return ALL_TYPES.map((atk) => ({ type: atk, x: effectiveness(atk, defenderTypes) }))
    .filter((w) => w.x < 1 && w.x > 0)
    .sort((a, b) => a.x - b.x);
}

/** Attacking types the defender is immune to (×0). */
export function immunities(defenderTypes: string[]): { type: string; x: number }[] {
  if (defenderTypes.length === 0) return [];
  return ALL_TYPES.map((atk) => ({ type: atk, x: effectiveness(atk, defenderTypes) }))
    .filter((w) => w.x === 0);
}
