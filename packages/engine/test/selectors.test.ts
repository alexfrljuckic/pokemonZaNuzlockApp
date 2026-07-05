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
  frontierAreas,
  isFrontier,
  party,
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

  it('frontierAreas: a sliding window over unresolved reachable areas that advances on resolves', () => {
    const fresh = stateWith([]);
    const first = frontierAreas(dataset.areas, fresh);
    // fresh run: the first 4 reachable areas in dataset order
    expect(first.size).toBe(4);
    expect(first.has('route-1')).toBe(true);
    expect(first.has('route-3')).toBe(false); // gated on gym-1-brock

    // resolving an area advances the window WITHOUT any milestone clearing —
    // the old rule went dark here
    const oneResolved = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'skipped' }),
    ]);
    const advanced = frontierAreas(dataset.areas, oneResolved);
    expect(advanced.has('route-1')).toBe(false);
    expect(advanced.size).toBe(4); // a new area was promoted into the window
    expect([...advanced].some((id) => !first.has(id))).toBe(true);

    // clearing a gate lets its areas enter the window once reached
    const afterBrock = stateWith([ev('milestone_cleared', { milestoneId: 'gym-1-brock' })]);
    const route3 = dataset.areas.find((a) => a.id === 'route-3')!;
    expect(isFrontier(route3, afterBrock, dataset.areas)).toBe(
      frontierAreas(dataset.areas, afterBrock).has('route-3'),
    );

    // a resolved area is never frontier
    const resolved = stateWith([
      ev('milestone_cleared', { milestoneId: 'gym-1-brock' }),
      ev('encounter_resolved', { areaId: 'route-3', species: 'spearow', outcome: 'skipped' }),
    ]);
    expect(frontierAreas(dataset.areas, resolved).has('route-3')).toBe(false);
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
  });
});
