/* Generated PokeAPI-derived data (packages/datasets/generated/species-data.json):
   per-species movepools + base stats + evolutions, and the global holdable-item
   list. Powers the move/held-item pickers, evolution previews and milestone
   base-stats. Species without an entry (a few form slugs PokeAPI didn't resolve)
   degrade gracefully — the pickers stay free-text, previews just render nothing. */
import raw from '@nuzlocke/datasets/generated/species-data.json';
import machinesByGameRaw from '@nuzlocke/datasets/generated/machines-by-game.json';

export interface Evolution {
  to: string;
  trigger: string | null;
  minLevel: number | null;
  item: string | null;
  minHappiness?: number;
  timeOfDay?: string;
  knownMove?: string;
  location?: string;
}

interface SpeciesData {
  stats: Record<string, Record<string, number>>;
  types: Record<string, string[]>;
  moves: Record<string, string[]>;
  movesByGame: Record<string, Record<string, string[]>>;
  levelUpMovesByGame: Record<string, Record<string, [string, number][]>>;
  moveTypes: Record<string, string>;
  evolutions: Record<string, Evolution[]>;
  heldItems: string[];
}

const data = raw as SpeciesData;

export const HELD_ITEMS: string[] = data.heldItems;

export const typesFor = (species: string): string[] => data.types[species] ?? [];
export const moveType = (move: string): string | null => data.moveTypes[move] ?? null;

// Per-game machine tags: move slug -> "TM" | "HM" | "TR" for each game that has
// a machine system (bdsp/lgpe/swsh/plza; SwSh also uses TRs). Legends Arceus has
// no machines (move shop) and gets no tags. Games without an entry return null.
export type MachineTag = 'TM' | 'HM' | 'TR';
const machinesByGame = machinesByGameRaw as Record<string, Record<string, MachineTag>>;
export const machineType = (move: string, gameId: string): MachineTag | null =>
  machinesByGame[gameId]?.[move] ?? null;

/** A species' movepool, scoped to the given game where PokeAPI documents it.
 * Each game learns different moves (Pikachu knows 31 moves in LGPE, 50 in
 * BDSP, 8 in Legends Arceus) — the per-game pool comes from the game's
 * `pokeapiVersionGroups`. Falls back to the all-games union when there's no
 * per-game data: Legends Z-A (PokeAPI has no move data for it at all) and
 * the handful of species with per-game coverage gaps. */
export const movesFor = (species: string, gameId?: string): string[] =>
  (gameId ? data.movesByGame[gameId]?.[species] : undefined) ?? data.moves[species] ?? [];

/** Level-up learnset for a species in a game, sorted by learn level.
 * Empty for games without PokeAPI move data (Z-A) — callers should treat an
 * empty list as "unknown", not "learns nothing". */
export const levelUpMovesFor = (species: string, gameId?: string): { move: string; level: number }[] =>
  (gameId ? data.levelUpMovesByGame[gameId]?.[species] : undefined)?.map(([move, level]) => ({ move, level })) ??
  [];

/** A species' movepool ordered for the move pickers: level-up moves first
 * (by learn level), then TMs, TRs, HMs, then everything else (tutor/egg)
 * alphabetically — the learnable-by-playing moves surface before the
 * machine shopping list. */
export function orderedMovesFor(species: string, gameId?: string): string[] {
  const pool = movesFor(species, gameId);
  const RANK: Record<string, number> = { TM: 1, TR: 2, HM: 3 };
  const rank = (m: string): number => {
    if (learnLevel(m, species, gameId) != null) return 0;
    const tag = gameId ? machineType(m, gameId) : null;
    return tag ? RANK[tag] : 4;
  };
  return [...pool].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) {
      const la = learnLevel(a, species, gameId)!;
      const lb = learnLevel(b, species, gameId)!;
      if (la !== lb) return la - lb;
    }
    return a.localeCompare(b);
  });
}

/** The level a species learns a move at in a game, or null when it isn't a
 * level-up move there (TM/tutor/egg — or Z-A's missing data). */
export function learnLevel(move: string, species: string, gameId?: string): number | null {
  if (!gameId) return null;
  const entry = data.levelUpMovesByGame[gameId]?.[species]?.find(([m]) => m === move);
  return entry ? entry[1] : null;
}

/** What the game actually gives an undocumented trainer mon: its last four
 * level-up moves at the given level (the mainline-games default). Null when
 * the learnset is unknown for this game, so callers can distinguish
 * "expected moveset" from "no data". */
export function expectedMovesAt(species: string, level: number, gameId?: string): string[] | null {
  const learnset = levelUpMovesFor(species, gameId);
  if (learnset.length === 0) return null;
  const known = learnset.filter((e) => e.level <= level);
  return known.slice(-4).map((e) => e.move);
}

/** How a trainer mon's moves should be shown:
 *  - `confirmed`  — the dataset documents this exact moveset (render as-is);
 *  - `expected`   — undocumented, so we surface the last four level-up moves at
 *                   the mon's level (what the games actually assign), labelled
 *                   as expected/not-confirmed — never presented as truth;
 *  - `unknown`    — undocumented AND no level-up data (Z-A), so we invent
 *                   nothing and render no chips and no "expected" note.
 * `moves` is null only for `unknown`. An empty explicit `moves` array counts as
 * undocumented (falls through to expected/unknown) — a note never renders
 * without chips. */
export type TrainerMoveSource = 'confirmed' | 'expected' | 'unknown';
export function resolveTrainerMoves(
  mon: { species: string; level: number; moves?: string[] },
  gameId?: string,
): { source: TrainerMoveSource; moves: string[] | null } {
  if (mon.moves && mon.moves.length > 0) return { source: 'confirmed', moves: mon.moves };
  const expected = expectedMovesAt(mon.species, mon.level, gameId);
  if (expected && expected.length > 0) return { source: 'expected', moves: expected };
  return { source: 'unknown', moves: null };
}
export const statsFor = (species: string): Record<string, number> | null => data.stats[species] ?? null;
export const evolutionsFor = (species: string): Evolution[] => data.evolutions[species] ?? [];

// ---- Interactive evolution support (MonCard "Evolve" panel) ----

const FORM_SUFFIXES = ['hisui', 'galar', 'alola', 'paldea'];

/** PokeAPI evolution chains are keyed by base species, so a regional form's
 * target comes back suffix-less (growlithe-hisui → "arcanine"). When the
 * evolving mon carries a regional suffix and the suffixed target exists in
 * our data, prefer it — regional lines evolve within their region. */
export function resolveEvolutionTarget(from: string, to: string): string {
  const suffix = FORM_SUFFIXES.find((s) => from.endsWith(`-${s}`));
  if (suffix && data.stats[`${to}-${suffix}`]) return `${to}-${suffix}`;
  return to;
}

export interface EvolutionOption {
  to: string; // resolved (form-aware) target slug
  trigger: string | null;
  minLevel: number | null;
  item: string | null;
  /** short requirement label, e.g. "Lv 36", "Use Thunder Stone", "Trade holding Metal Coat" */
  requirement: string;
  /** false only when a level-up requirement is documented and unmet */
  ready: boolean;
}

const pretty = (slug: string) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function requirementLabel(e: Evolution): string {
  if (e.trigger === 'use-item' && e.item) return `Use ${pretty(e.item)}`;
  if (e.trigger === 'trade') return e.item ? `Trade holding ${pretty(e.item)}` : 'Trade';
  if (e.trigger === 'level-up' || e.trigger == null) {
    if (e.minLevel) return `Lv ${e.minLevel}`;
    if (e.minHappiness != null) return `High friendship${e.timeOfDay ? ` (${e.timeOfDay})` : ''}`;
    if (e.knownMove) return `Level up knowing ${pretty(e.knownMove)}`;
    if (e.location) return 'Level up at a special location';
    if (e.timeOfDay) return `Level up (${e.timeOfDay})`;
    return e.item ? `Level up holding ${pretty(e.item)}` : 'Level up (special condition)';
  }
  return pretty(e.trigger);
}

/** The actionable evolution choices for a mon at a given level. Branching
 * species (Eevee, Applin, Galarian Meowth's chain…) return several — the
 * player picks the branch that matches what they did in-game. */
export function evolutionOptionsFor(species: string, level: number): EvolutionOption[] {
  return evolutionsFor(species).map((e) => ({
    to: resolveEvolutionTarget(species, e.to),
    trigger: e.trigger,
    minLevel: e.minLevel,
    item: e.item,
    requirement: requirementLabel(e),
    ready: !(e.trigger === 'level-up' && e.minLevel != null && level < e.minLevel),
  }));
}

/** Plain-language "evolves into X at Lv N / with item" summary, or null. */
export function evolutionSummary(species: string): string | null {
  const evos = evolutionsFor(species);
  if (evos.length === 0) return null;
  return evos
    .map((e) => {
      if (e.minLevel) return `${e.to} at Lv ${e.minLevel}`;
      if (e.item) return `${e.to} w/ ${e.item.replace(/-/g, ' ')}`;
      if (e.trigger === 'trade') return `${e.to} by trade`;
      return e.to;
    })
    .join(', ');
}

const STAT_LABEL: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};
export const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
export const statLabel = (k: string): string => STAT_LABEL[k] ?? k;
