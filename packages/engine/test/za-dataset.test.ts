import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  deriveState,
  filterEncounterPool,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/plza.json'), 'utf8'),
) as GameDataset;

// Minimal line map for the species this test touches; the real map comes from PokeAPI at build time.
const ctx: EngineContext = {
  dataset,
  speciesToLine: { bunnelby: 'bunnelby-line', diggersby: 'bunnelby-line', mareep: 'mareep-line' },
};

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('ported Z-A dataset', () => {
  it('carries the v1 revive-token economy: promotion/rogue milestones grant tokens', () => {
    const granting = dataset.milestones.filter((m) => m.grants?.reviveTokens);
    expect(granting.length).toBeGreaterThan(20);
    expect(granting.every((m) => m.type === 'promotion' || m.type === 'rogue-mega')).toBe(true);
  });

  it('grants a token on milestone clear and spends it on revive', () => {
    const zach = dataset.milestones.find((m) => m.id === 'zach')!;
    const events: RunEvent[] = [
      ev('run_started', { gameId: 'plza', version: 'legends-z-a', ruleset: buildRuleset('standard', 'plza') }),
      ev('encounter_resolved', { areaId: 'wild-zone-1', species: 'bunnelby', outcome: 'caught', pokemonId: 'p1', nickname: 'Digs', level: 4 }),
      ev('faint', { pokemonId: 'p1', cause: 'crit' }),
      ev('milestone_cleared', { milestoneId: zach.id }),
      ev('revive', { pokemonId: 'p1' }),
    ];
    const state = deriveState(events, ctx);
    expect(state.reviveTokens).toBe(0); // granted 1, spent 1
    expect(state.pokemon['p1'].status).toBe('box'); // revived to box per v1 rules
    expect(state.wipes).toHaveLength(1); // the wipe still happened and stays in history
  });

  it('dupes clause works across zone pools (evolution-line scope)', () => {
    const events: RunEvent[] = [
      ev('run_started', { gameId: 'plza', version: 'legends-z-a', ruleset: buildRuleset('standard', 'plza') }),
      ev('encounter_resolved', { areaId: 'wild-zone-1', species: 'bunnelby', outcome: 'caught', pokemonId: 'p1', nickname: 'Digs', level: 4 }),
    ];
    const state = deriveState(events, ctx);
    const zone5 = dataset.areas.find((a) => a.id === 'wild-zone-5')!;
    const pool = filterEncounterPool(state, zone5, ctx);
    expect(pool.map((s) => s.species)).not.toContain('bunnelby');
    expect(pool.length).toBeGreaterThan(0);
  });
});
