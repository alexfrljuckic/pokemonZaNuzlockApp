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
  readFileSync(join(here, '../../datasets/games/lgpe.json'), 'utf8'),
) as GameDataset;

const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;

const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('LGPE dataset', () => {
  it('validates against the schema shape used by the engine (areas, milestones present)', () => {
    expect(dataset.gameId).toBe('lgpe');
    expect(dataset.versions).toEqual(['lets-go-pikachu', 'lets-go-eevee']);
    expect(dataset.areas.length).toBeGreaterThan(15);
    expect(dataset.milestones).toHaveLength(13);
  });

  it('has no wild battles and no held items, since LGPE encounters are catch-or-flee only', () => {
    expect(dataset.mechanics.wildBattles).toBe(false);
    expect(dataset.mechanics.heldItems).toBe(false);
  });

  it('respects version-exclusive encounters: Route 1 has Oddish in Pikachu, Bellsprout in Eevee', () => {
    const pikaEvents: RunEvent[] = [
      ev('run_started', {
        gameId: 'lgpe',
        version: 'lets-go-pikachu',
        ruleset: buildRuleset('standard', 'lgpe'),
      }),
    ];
    const pikaState = deriveState(pikaEvents, ctx);
    const route1 = dataset.areas.find((a) => a.id === 'route-1')!;
    const pikaPool = filterEncounterPool(pikaState, route1, ctx);
    expect(pikaPool.map((s) => s.species)).toContain('oddish');
    expect(pikaPool.map((s) => s.species)).not.toContain('bellsprout');

    const eeveeEvents: RunEvent[] = [
      ev('run_started', {
        gameId: 'lgpe',
        version: 'lets-go-eevee',
        ruleset: buildRuleset('standard', 'lgpe'),
      }),
    ];
    const eeveeState = deriveState(eeveeEvents, ctx);
    const eeveePool = filterEncounterPool(eeveeState, route1, ctx);
    expect(eeveePool.map((s) => s.species)).toContain('bellsprout');
    expect(eeveePool.map((s) => s.species)).not.toContain('oddish');

    // species common to both versions (no conditions.version) still show up in both pools
    expect(pikaPool.map((s) => s.species)).toContain('pidgey');
    expect(eeveePool.map((s) => s.species)).toContain('pidgey');
  });
});
