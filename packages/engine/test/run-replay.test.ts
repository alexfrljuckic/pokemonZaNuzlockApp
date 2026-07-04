import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  deriveState,
  filterEncounterPool,
  pendingWipeDecision,
  validateTeam,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'bdsp',
  name: 'Brilliant Diamond / Shining Pearl',
  versions: ['brilliant-diamond', 'shining-pearl'],
  areas: [
    {
      id: 'route-201',
      name: 'Route 201',
      unlockAfter: null,
      tags: ['route'],
      encounters: [
        { species: 'starly', methods: ['walk'], rate: 50 },
        { species: 'bidoof', methods: ['walk'], rate: 50 },
      ],
    },
    {
      id: 'route-202',
      name: 'Route 202',
      unlockAfter: null,
      tags: ['route'],
      encounters: [
        { species: 'starly', methods: ['walk'], rate: 40 },
        { species: 'shinx', methods: ['walk'], rate: 40 },
        { species: 'kricketot', methods: ['walk'], rate: 20 },
      ],
    },
    {
      id: 'route-218',
      name: 'Route 218',
      unlockAfter: null,
      tags: ['route'],
      encounters: [
        { species: 'mr-mime', methods: ['walk'], rate: 15, conditions: { version: ['brilliant-diamond'] } },
        { species: 'floatzel', methods: ['walk'], rate: 30 },
      ],
    },
  ],
  specials: [],
  milestones: [
    { id: 'gym-1-roark', name: 'Roark', type: 'gym', order: 1, aceLevel: 14 },
    { id: 'gym-2-gardenia', name: 'Gardenia', type: 'gym', order: 2, aceLevel: 22 },
  ],
  mechanics: { heldItems: true, wildBattles: true, setModeOption: true, raids: false, overworldAggro: false },
};

const here = dirname(fileURLToPath(import.meta.url));
const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;

const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('synthetic BDSP run replay', () => {
  const hardcore = buildRuleset('hardcore', 'bdsp');

  const events: RunEvent[] = [
    ev('run_started', { gameId: 'bdsp', version: 'shining-pearl', ruleset: hardcore }),
    ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p1', nickname: 'Jet', level: 3 }),
  ];

  it('applies the dupes clause by evolution line', () => {
    const state = deriveState(events, ctx);
    const pool = filterEncounterPool(state, dataset.areas[1], ctx); // route-202
    const species = pool.map((s) => s.species);
    expect(species).not.toContain('starly'); // same line already owned
    expect(species).toEqual(['shinx', 'kricketot']);
  });

  it('filters version-exclusive encounters', () => {
    const state = deriveState(events, ctx);
    const pool = filterEncounterPool(state, dataset.areas[2], ctx); // route-218, playing Shining Pearl
    expect(pool.map((s) => s.species)).toEqual(['floatzel']); // mr-mime is BD-only
  });

  it('closes an area after its encounter is used (first-encounter rule)', () => {
    const state = deriveState(events, ctx);
    expect(filterEncounterPool(state, dataset.areas[0], ctx)).toEqual([]);
  });

  it('enforces the hardcore level cap against the next boss', () => {
    const over = [...events, ev('level_up', { pokemonId: 'p1', level: 15 })];
    const state = deriveState(over, ctx);
    const violations = validateTeam(state, ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('Roark');

    // Clearing Roark raises the cap to Gardenia's ace (22) — team becomes legal again.
    const cleared = [...over, ev('milestone_cleared', { milestoneId: 'gym-1-roark' })];
    expect(validateTeam(deriveState(cleared, ctx), ctx)).toEqual([]);
  });

  it('audits mid-run rule changes', () => {
    const changed = [
      ...events,
      ev('rule_changed', {
        ruleId: 'level-cap',
        before: { enabled: true, params: { mode: 'ace', offset: 0 } },
        after: { enabled: true, params: { mode: 'ace', offset: 2 } },
        note: 'Gardenia is scary',
      }),
    ];
    const state = deriveState(changed, ctx);
    expect(state.ruleset.rules['level-cap'].params.offset).toBe(2);
    expect(state.ruleChanges).toHaveLength(1);
    expect(state.ruleChanges[0].note).toBe('Gardenia is scary');
  });

  it('detects a wipe, waits for a decision, and honors "continue for fun"', () => {
    const withSecond = [
      ...events,
      ev('encounter_resolved', { areaId: 'route-202', species: 'shinx', outcome: 'caught', pokemonId: 'p2', nickname: 'Volt', level: 4 }),
      ev('faint', { pokemonId: 'p1', cause: 'crit', killer: "Roark's Cranidos" }),
    ];
    let state = deriveState(withSecond, ctx);
    expect(state.wipes).toHaveLength(0); // one still alive

    const wiped = [...withSecond, ev('faint', { pokemonId: 'p2', cause: 'headbutt', killer: "Roark's Cranidos" })];
    state = deriveState(wiped, ctx);
    expect(state.wipes).toHaveLength(1);
    expect(pendingWipeDecision(state)).toBe(true); // UI shows the wipe screen here

    const continued = [...wiped, ev('wipe_decision', { decision: 'continue' })];
    state = deriveState(continued, ctx);
    expect(state.status).toBe('wiped-continuing');
    expect(pendingWipeDecision(state)).toBe(false);
  });

  it('derives identical state regardless of event array order (sync-merge safety)', () => {
    const shuffled = [...events].reverse();
    expect(deriveState(shuffled, ctx)).toEqual(deriveState(events, ctx));
  });

  it('resets a route: clears its outcome and cascade-removes the caught Pokémon', () => {
    // Catch on 201, move it to the box, level it — then reset the route.
    const withCatch = [
      ...events,
      ev('moved', { pokemonId: 'p1', to: 'box' }),
      ev('level_up', { pokemonId: 'p1', level: 8 }),
    ];
    let state = deriveState(withCatch, ctx);
    expect(state.pokemon['p1']).toBeDefined();
    expect(state.encounterOutcomes['route-201']).toBe('caught');
    expect(filterEncounterPool(state, dataset.areas[0], ctx)).toEqual([]); // closed

    const reset = [...withCatch, ev('encounter_reset', { areaId: 'route-201' })];
    state = deriveState(reset, ctx);
    expect(state.pokemon['p1']).toBeUndefined(); // gone from box + everywhere
    expect(state.encounterOutcomes['route-201']).toBeUndefined();
    // route is selectable again, and its full pool returns (dupes cleared too)
    expect(filterEncounterPool(state, dataset.areas[0], ctx).map((s) => s.species)).toEqual(['starly', 'bidoof']);

    // re-catching after a reset works
    const recatch = [...reset, ev('encounter_resolved', { areaId: 'route-201', species: 'bidoof', outcome: 'caught', pokemonId: 'p9', level: 2 })];
    state = deriveState(recatch, ctx);
    expect(state.pokemon['p9']?.species).toBe('bidoof');
    expect(state.encounterOutcomes['route-201']).toBe('caught');
  });

  it('claims a special (starter/gift) into the party, and resets it', () => {
    const claimed = [
      ...events,
      ev('special_claimed', { specialId: 'starter-turtwig', species: 'turtwig', pokemonId: 's1', nickname: 'Shelly', level: 5, shiny: true }),
    ];
    let state = deriveState(claimed, ctx);
    expect(state.pokemon['s1']).toMatchObject({
      species: 'turtwig',
      nickname: 'Shelly',
      level: 5,
      status: 'party',
      shiny: true,
      origin: { specialId: 'starter-turtwig' },
    });

    const reset = [...claimed, ev('special_reset', { specialId: 'starter-turtwig' })];
    state = deriveState(reset, ctx);
    expect(state.pokemon['s1']).toBeUndefined();

    // can then claim a different starter
    const reclaim = [...reset, ev('special_claimed', { specialId: 'starter-piplup', species: 'piplup', pokemonId: 's2', level: 5 })];
    state = deriveState(reclaim, ctx);
    expect(state.pokemon['s2']?.species).toBe('piplup');
  });
});
