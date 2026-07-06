import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  boxed,
  buildRuleset,
  deriveState,
  fallen,
  aggregateRuns,
  catchRateByArea,
  catchRateSummary,
  formatDuration,
  frontierAreas,
  party,
  runTiming,
  type EngineContext,
  type GameDataset,
  type RunEvent,
  type RunState,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/lgpe.json'), 'utf8'),
) as GameDataset;
const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;
const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

function stateWith(events: RunEvent[]) {
  return deriveState(
    [ev('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') }), ...events],
    ctx,
  );
}

describe('selectors', () => {
  it('party/boxed/fallen partition the owned Pokémon by status', () => {
    const state = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', nickname: 'A', level: 4 }),
      ev('encounter_resolved', { areaId: 'route-2', species: 'caterpie', outcome: 'caught', pokemonId: 'b', nickname: 'B', level: 4 }),
      ev('moved', { pokemonId: 'b', to: 'box' }),
      ev('encounter_resolved', { areaId: 'route-3', species: 'spearow', outcome: 'caught', pokemonId: 'c', nickname: 'C', level: 5 }),
      ev('faint', { pokemonId: 'c' }),
    ]);
    expect(party(state).map((p) => p.id)).toEqual(['a']);
    expect(boxed(state).map((p) => p.id)).toEqual(['b']);
    expect(fallen(state).map((p) => p.id)).toEqual(['c']);
    // partition is exhaustive: every owned mon is in exactly one bucket
    expect(party(state).length + boxed(state).length + fallen(state).length).toBe(
      Object.keys(state.pokemon).length,
    );
  });

  it('frontierAreas: a progression-ordered window that advances as areas resolve', () => {
    const fresh = stateWith([]);
    const first = frontierAreas(dataset.areas, fresh, dataset.milestones);
    // fresh run: the lowest-tier unresolved areas — the available-from-start
    // ones fill the window ahead of gated routes like route-3 (gym-1-brock)
    expect(first.size).toBe(4);
    expect(first.has('route-1')).toBe(true);
    expect(first.has('route-3')).toBe(false);

    // resolving the whole window advances it with NO milestone clearing — the
    // old gate rule went dark here; a gated route now surfaces as "up next"
    // (the map never hard-locks a route, so it's always resolvable)
    const resolvedWindow = stateWith(
      [...first].map((id) => ev('encounter_resolved', { areaId: id, species: 'x', outcome: 'skipped' })),
    );
    const advanced = frontierAreas(dataset.areas, resolvedWindow, dataset.milestones);
    for (const id of first) expect(advanced.has(id)).toBe(false);
    expect(advanced.size).toBe(4);
    expect(advanced.has('route-3')).toBe(true);

    // a resolved area is never frontier, even without touching its gate
    const resolvedRoute3 = stateWith([
      ev('encounter_resolved', { areaId: 'route-3', species: 'spearow', outcome: 'skipped' }),
    ]);
    expect(frontierAreas(dataset.areas, resolvedRoute3, dataset.milestones).has('route-3')).toBe(false);
  });

  it('frontierAreas skips encounter-less areas (towns must not clog the window)', () => {
    const areas = [
      { id: 'town', name: 'Town', unlockAfter: null, tags: ['town'], encounters: [] },
      ...dataset.areas,
    ];
    const fresh = stateWith([]);
    const window = frontierAreas(areas, fresh);
    expect(window.has('town')).toBe(false);
    expect(window.size).toBe(4);
  });
});

describe('aggregateRuns (cross-run stats, 33c)', () => {
  const mon = (species: string, status: 'party' | 'box' | 'dead') =>
    ({ id: species + status, species, nickname: species, level: 10, status, origin: {} });
  const run = (status: RunState['status'], pokemon: Record<string, unknown>) =>
    ({ status, pokemon } as unknown as RunState);

  it('counts statuses and excludes abandoned runs from the aggregates', () => {
    const stats = aggregateRuns([
      run('victory', { a: mon('starly', 'party'), b: mon('bidoof', 'dead') }),
      run('active', { c: mon('starly', 'dead') }),
      run('abandoned', { d: mon('starly', 'dead'), e: mon('turtwig', 'party') }),
      run('wiped-continuing', {}),
    ]);
    expect(stats.runs).toBe(4);
    expect(stats.victories).toBe(1);
    expect(stats.abandoned).toBe(1);
    expect(stats.wiped).toBe(0);
    expect(stats.active).toBe(1);
    expect(stats.wipedContinuing).toBe(1);
    expect(stats.aggregated).toBe(3); // abandoned run left out
    expect(stats.totalDeaths).toBe(2); // its starly death doesn't count
    expect(stats.deathsBySpecies).toEqual({ bidoof: 1, starly: 1 });
    expect(stats.usedSpecies).toEqual({ starly: 1 }); // abandoned turtwig excluded
  });

  it('counts wiped runs and INCLUDES them in the aggregates (real finished runs)', () => {
    const stats = aggregateRuns([
      run('wiped', { a: mon('starly', 'dead'), b: mon('shinx', 'dead') }),
      run('abandoned', { c: mon('bidoof', 'dead') }),
      run('victory', { d: mon('turtwig', 'party') }),
    ]);
    expect(stats.wiped).toBe(1);
    expect(stats.abandoned).toBe(1);
    expect(stats.aggregated).toBe(2); // wiped in, abandoned out
    expect(stats.totalDeaths).toBe(2); // both wiped deaths count, bidoof's doesn't
    expect(stats.deathsBySpecies).toEqual({ starly: 1, shinx: 1 });
  });

  it('handles an empty collection', () => {
    const stats = aggregateRuns([]);
    expect(stats.runs).toBe(0);
    expect(stats.aggregated).toBe(0);
    expect(stats.deathsBySpecies).toEqual({});
    expect(stats.catchRate).toBeNull(); // no encounters offered
  });

  it('aggregates catch rate across counted runs, excluding abandoned', () => {
    const withOutcomes = (
      status: RunState['status'],
      encounterOutcomes: Record<string, 'caught' | 'failed' | 'skipped'>,
    ) => ({ status, pokemon: {}, encounterOutcomes } as unknown as RunState);
    const stats = aggregateRuns([
      withOutcomes('victory', { a: 'caught', b: 'failed', c: 'caught' }), // 2/3
      withOutcomes('wiped', { d: 'skipped', e: 'caught' }), // 1/2, still counted
      withOutcomes('abandoned', { f: 'caught', g: 'caught' }), // excluded entirely
    ]);
    expect(stats.encountersOffered).toBe(5);
    expect(stats.encountersCaught).toBe(3);
    expect(stats.catchRate).toBeCloseTo(3 / 5);
  });
});

describe('catchRateByArea (metrics panel)', () => {
  it('records the resolved outcome per area, in dataset order', () => {
    const state = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', level: 4 }),
      ev('encounter_resolved', { areaId: 'route-2', species: 'caterpie', outcome: 'failed' }),
    ]);
    const rows = catchRateByArea(state, ctx);
    // only resolved areas appear; dataset (story) order preserved
    expect(rows.map((r) => r.areaId)).toEqual(['route-1', 'route-2']);
    expect(rows[0]).toMatchObject({ name: expect.any(String), caught: 1, failed: 0, skipped: 0, offered: 1, catchRate: 1 });
    expect(rows[1]).toMatchObject({ caught: 0, failed: 1, skipped: 0, offered: 1, catchRate: 0 });
  });

  it('a skipped encounter counts as offered but never caught', () => {
    const state = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'skipped' }),
    ]);
    const rows = catchRateByArea(state, ctx);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ skipped: 1, offered: 1, caught: 0, catchRate: 0 });
  });

  it('a reset encounter drops back out (reads derived encounterOutcomes)', () => {
    const state = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', level: 4 }),
      ev('encounter_reset', { areaId: 'route-1' }),
    ]);
    expect(catchRateByArea(state, ctx)).toEqual([]);
  });

  it('summary rolls the per-area rows into whole-run totals + catch rate', () => {
    const state = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', level: 4 }),
      ev('encounter_resolved', { areaId: 'route-2', species: 'caterpie', outcome: 'failed' }),
    ]);
    const summary = catchRateSummary(catchRateByArea(state, ctx));
    expect(summary).toMatchObject({ caught: 1, failed: 1, skipped: 0, offered: 2, catchRate: 0.5 });
  });

  it('summary of zero offered encounters yields a null catch rate (no spurious 0%)', () => {
    expect(catchRateSummary([])).toMatchObject({ offered: 0, catchRate: null });
  });
});

describe('runTiming (time-in-run panel)', () => {
  it('computes total duration and time-to-each-boss from timestamps', () => {
    // seq*60000 ms spacing (1 minute per event) via the shared `ev` helper
    const events = [
      ev('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') }),
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', level: 4 }),
      ev('milestone_cleared', { milestoneId: 'gym-1-brock' }),
    ];
    const timing = runTiming(events, ctx);
    // 3 events, 1 min apart → 2 minutes end-to-end
    expect(timing.totalMs).toBe(2 * 60000);
    expect(timing.timestampedEvents).toBe(3);
    expect(timing.bossTimings).toHaveLength(1);
    expect(timing.bossTimings[0].milestoneId).toBe('gym-1-brock');
    expect(timing.bossTimings[0].elapsedMs).toBe(2 * 60000); // brock cleared on the last event
    expect(timing.bossTimings[0].name).toEqual(expect.any(String));
  });

  it('degrades gracefully when timestamps are missing (null, not a crash)', () => {
    const noTs = (type: RunEvent['type'], payload: unknown): RunEvent =>
      ({ seq: ++seq, at: '', type, payload } as RunEvent);
    const events = [
      noTs('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') }),
      noTs('milestone_cleared', { milestoneId: 'gym-1-brock' }),
    ];
    const timing = runTiming(events, ctx);
    expect(timing.totalMs).toBeNull();
    expect(timing.startedAt).toBeNull();
    expect(timing.timestampedEvents).toBe(0);
    expect(timing.bossTimings[0].elapsedMs).toBeNull();
  });

  it('an empty log yields null totals and no boss timings', () => {
    const timing = runTiming([], ctx);
    expect(timing.totalMs).toBeNull();
    expect(timing.bossTimings).toEqual([]);
    expect(timing.timestampedEvents).toBe(0);
  });

  it('formatDuration renders compact spans and "—" for null', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('<1m');
    expect(formatDuration(5 * 60000)).toBe('5m');
    expect(formatDuration(2 * 3600000 + 14 * 60000)).toBe('2h 14m');
    expect(formatDuration(3 * 86400000 + 4 * 3600000)).toBe('3d 4h');
  });
});
