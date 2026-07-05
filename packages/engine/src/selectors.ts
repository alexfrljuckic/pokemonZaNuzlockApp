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

/** The "up next" areas — a sliding window that progresses as routes get
 * resolved, not just when milestones clear (the old most-recent-milestone
 * rule went dark between badges). Frontier = the first `windowSize`
 * unresolved areas, in dataset (story) order, whose gate is satisfied
 * (no `unlockAfter`, or any cleared milestone). A hint, not a lock. */
export function frontierAreas(areas: Area[], state: RunState, windowSize = 4): Set<string> {
  const cleared = new Set(state.milestonesCleared);
  const next = new Set<string>();
  for (const area of areas) {
    if (next.size >= windowSize) break;
    // towns and other encounter-less areas have nothing to resolve — they
    // must not clog the window forever
    if (area.encounters.length === 0) continue;
    if (state.encounterOutcomes[area.id]) continue;
    if (area.unlockAfter != null && !cleared.has(area.unlockAfter)) continue;
    next.add(area.id);
  }
  return next;
}

/** Back-compat single-area check; prefer frontierAreas for whole views. */
export function isFrontier(area: Area, state: RunState, allAreas?: Area[]): boolean {
  if (allAreas) return frontierAreas(allAreas, state).has(area.id);
  // Without ordering context, fall back to "unresolved and reachable".
  if (state.encounterOutcomes[area.id]) return false;
  const cleared = new Set(state.milestonesCleared);
  return area.unlockAfter == null || cleared.has(area.unlockAfter);
}
