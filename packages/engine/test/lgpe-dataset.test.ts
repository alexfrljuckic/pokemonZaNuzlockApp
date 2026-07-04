import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  deriveState,
  filterEncounterPool,
  milestoneRoster,
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

  it('models the routes that were previously missing, plus Victory Road', () => {
    const ids = new Set(dataset.areas.map((a) => a.id));
    for (const id of [
      'route-7',
      'route-8',
      'route-13',
      'route-14',
      'route-15',
      'route-19',
      'route-21',
      'route-23',
      'route-24',
      'route-25',
      'victory-road',
    ]) {
      expect(ids, `expected area "${id}" to be present`).toContain(id);
    }
    // every unlockAfter must reference a real milestone (referential integrity)
    const milestoneIds = new Set(dataset.milestones.map((m) => m.id));
    for (const a of dataset.areas) {
      if (a.unlockAfter) expect(milestoneIds).toContain(a.unlockAfter);
    }
  });

  it('places the Moltres static in Victory Road, its real LGPE location', () => {
    const moltres = dataset.specials.find((s) => s.id === 'moltres')!;
    expect(moltres.area).toBe('victory-road');
    expect(dataset.areas.some((a) => a.id === 'victory-road')).toBe(true);
  });

  it('applies version exclusives on the new routes (Route 14: Scyther Pikachu-only, Pinsir Eevee-only)', () => {
    const route14 = dataset.areas.find((a) => a.id === 'route-14')!;
    const pool = (version: 'lets-go-pikachu' | 'lets-go-eevee') =>
      filterEncounterPool(
        deriveState([ev('run_started', { gameId: 'lgpe', version, ruleset: buildRuleset('standard', 'lgpe') })], ctx),
        route14,
        ctx,
      ).map((s) => s.species);

    const pika = pool('lets-go-pikachu');
    expect(pika).toContain('scyther');
    expect(pika).not.toContain('pinsir');

    const eevee = pool('lets-go-eevee');
    expect(eevee).toContain('pinsir');
    expect(eevee).not.toContain('scyther');
  });

  it('gives every milestone a roster whose ace matches aceLevel', () => {
    expect(dataset.milestones).toHaveLength(13);
    for (const m of dataset.milestones) {
      expect(m.roster, `milestone "${m.id}" should have a roster`).toBeTruthy();
      const maxLevel = Math.max(...m.roster!.map((p) => p.level));
      expect(maxLevel, `milestone "${m.id}" ace mismatch`).toBe(m.aceLevel);
    }
  });

  it("resolves the Champion's version-dependent ace via rosterByStarter (Jolteon vs Raichu)", () => {
    const champ = dataset.milestones.find((m) => m.id === 'champion-rival')!;
    const ace = (starter: string) => {
      const roster = milestoneRoster(champ, starter)!;
      return roster.reduce((a, b) => (b.level > a.level ? b : a)).species;
    };
    // Player with Pikachu faces an Eevee-line rival ace (Jolteon); vice-versa for Eevee → Raichu
    expect(ace('pikachu')).toBe('jolteon');
    expect(ace('eevee')).toBe('raichu');
    // the two variants and the default roster all cap at aceLevel 57
    expect(champ.aceLevel).toBe(57);
    for (const variant of Object.values(champ.rosterByStarter!)) {
      expect(Math.max(...variant.map((p) => p.level))).toBe(57);
    }
  });
});
