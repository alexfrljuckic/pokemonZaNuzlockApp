// Pure RunState selectors — derived reads shared by the app's views so the
// same question is never re-implemented per screen. Engine stays pure TS.
import type { Area, PokemonInstance, RunState } from './types.js';

/** Current party members. */
export function party(state: RunState): PokemonInstance[] {
  return Object.values(state.pokemon).filter((p) => p.status === 'party');
}

/** Boxed (alive, benched) Pokémon. */
export function boxed(state: RunState): PokemonInstance[] {
  return Object.values(state.pokemon).filter((p) => p.status === 'box');
}

/** The graveyard. */
export function fallen(state: RunState): PokemonInstance[] {
  return Object.values(state.pokemon).filter((p) => p.status === 'dead');
}

/** Areas that just opened up per the story's `unlockAfter` gating — a light
 * "next approximate routes" hint, not an enforced lock. An area counts as
 * frontier if it's unresolved and either has no gate (and nothing's been
 * cleared yet) or its gate is the most recently cleared milestone. */
export function isFrontier(area: Area, state: RunState): boolean {
  if (state.encounterOutcomes[area.id]) return false;
  const cleared = state.milestonesCleared;
  if (cleared.length === 0) return area.unlockAfter == null;
  return area.unlockAfter === cleared[cleared.length - 1];
}
