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

// ---- Cross-run aggregates (backlog 33c) ----

export interface CrossRunStats {
  runs: number;
  victories: number;
  abandoned: number;
  /** runs ended by a wipe with the 'reset' decision — real finished runs */
  wiped: number;
  wipedContinuing: number;
  active: number;
  /** runs included in the aggregates below — abandoned runs are counted
   * above but EXCLUDED here (decided 2026-07-05, see METRICS-DASHBOARD.md).
   * Wiped runs ARE included: a wipe is a real finished run, not a discard. */
  aggregated: number;
  totalDeaths: number;
  deathsBySpecies: Record<string, number>;
  /** party appearances per species across aggregated runs (final party) */
  usedSpecies: Record<string, number>;
}

/** Fold a collection of derived run states into cross-run stats. Pure —
 * callers derive each run's state from its own event log first. */
export function aggregateRuns(states: RunState[]): CrossRunStats {
  const stats: CrossRunStats = {
    runs: states.length,
    victories: 0,
    abandoned: 0,
    wiped: 0,
    wipedContinuing: 0,
    active: 0,
    aggregated: 0,
    totalDeaths: 0,
    deathsBySpecies: {},
    usedSpecies: {},
  };
  for (const s of states) {
    if (s.status === 'victory') stats.victories++;
    else if (s.status === 'abandoned') stats.abandoned++;
    else if (s.status === 'wiped') stats.wiped++;
    else if (s.status === 'wiped-continuing') stats.wipedContinuing++;
    else stats.active++;

    if (s.status === 'abandoned') continue;
    stats.aggregated++;
    for (const p of Object.values(s.pokemon)) {
      if (p.status === 'dead') {
        stats.totalDeaths++;
        stats.deathsBySpecies[p.species] = (stats.deathsBySpecies[p.species] ?? 0) + 1;
      }
      if (p.status === 'party') {
        stats.usedSpecies[p.species] = (stats.usedSpecies[p.species] ?? 0) + 1;
      }
    }
  }
  return stats;
}
