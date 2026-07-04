/* Generated PokeAPI-derived data (packages/datasets/generated/species-data.json):
   per-species movepools + base stats + evolutions, and the global holdable-item
   list. Powers the move/held-item pickers, evolution previews and milestone
   base-stats. Species without an entry (a few form slugs PokeAPI didn't resolve)
   degrade gracefully — the pickers stay free-text, previews just render nothing. */
import raw from '@nuzlocke/datasets/generated/species-data.json';
import machinesRaw from '@nuzlocke/datasets/generated/bdsp-machines.json';

export interface Evolution {
  to: string;
  trigger: string | null;
  minLevel: number | null;
  item: string | null;
}

interface SpeciesData {
  stats: Record<string, Record<string, number>>;
  moves: Record<string, string[]>;
  evolutions: Record<string, Evolution[]>;
  heldItems: string[];
}

const data = raw as SpeciesData;

export const HELD_ITEMS: string[] = data.heldItems;

// move slug -> "TM" | "HM" for BDSP (mirrors the Diamond/Pearl machine list).
// BDSP-oriented; used as a general reference for other games too.
const machines = machinesRaw as Record<string, 'TM' | 'HM'>;
export const machineType = (move: string): 'TM' | 'HM' | null => machines[move] ?? null;

export const movesFor = (species: string): string[] => data.moves[species] ?? [];
export const statsFor = (species: string): Record<string, number> | null => data.stats[species] ?? null;
export const evolutionsFor = (species: string): Evolution[] => data.evolutions[species] ?? [];

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
