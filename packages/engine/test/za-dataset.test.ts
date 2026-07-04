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

const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;

const ctx: EngineContext = { dataset, speciesToLine };

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

  it('populates the reliably-sourced boss rosters with ace == aceLevel, leaving undocumented ones empty', () => {
    const populated = dataset.milestones.filter((m) => m.roster && m.roster.length > 0);
    const populatedIds = populated.map((m) => m.id).sort();
    // The 13 promotion/rival battles with reliable Serebii/Bulbapedia sourcing
    expect(populatedIds).toEqual(
      [
        'canari', 'corbeau', 'grisham', 'ivor', 'jacinthe', 'naveen1', 'naveen2',
        'rintaro', 'urbain1', 'vinnie', 'xavi', 'yvon', 'zach',
      ].sort(),
    );
    for (const m of populated) {
      expect(Math.max(...m.roster!.map((p) => p.level)), `${m.id} ace`).toBe(m.aceLevel);
    }
    // Rogue-mega and undocumented story battles are intentionally left empty
    // (level tables unresolved / not documented) — never invented.
    expect(dataset.milestones.find((m) => m.id === 'rogue-absol')!.roster ?? []).toHaveLength(0);
    expect(dataset.milestones.find((m) => m.id === 'gauntlet')!.roster ?? []).toHaveLength(0);
  });

  it('encodes Urbain as starter-conditional (rosterByStarter variants all cap at aceLevel)', () => {
    const urbain = dataset.milestones.find((m) => m.id === 'urbain1')!;
    expect(urbain.rosterByStarter).toBeTruthy();
    expect(Object.keys(urbain.rosterByStarter!).sort()).toEqual(['chikorita', 'tepig', 'totodile']);
    for (const variant of Object.values(urbain.rosterByStarter!)) {
      expect(Math.max(...variant.map((p) => p.level))).toBe(urbain.aceLevel);
      expect(variant.map((p) => p.species)).toContain('manectric'); // Manectric is the fixed ace
    }
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
