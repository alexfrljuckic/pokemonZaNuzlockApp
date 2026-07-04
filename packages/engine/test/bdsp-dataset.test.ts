import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  deriveState,
  filterEncounterPool,
  nextBoss,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/bdsp.json'), 'utf8'),
) as GameDataset;

const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;

const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('BDSP dataset', () => {
  it('validates against the schema shape used by the engine (areas, milestones present)', () => {
    expect(dataset.gameId).toBe('bdsp');
    expect(dataset.versions).toEqual(['brilliant-diamond', 'shining-pearl']);
    expect(dataset.areas.length).toBeGreaterThan(40);
    expect(dataset.milestones).toHaveLength(16);
  });

  it('respects version-exclusive encounters: Lost Tower Murkrow is BD-only, Misdreavus is SP-only', () => {
    const events: RunEvent[] = [
      ev('run_started', {
        gameId: 'bdsp',
        version: 'brilliant-diamond',
        ruleset: buildRuleset('standard', 'bdsp'),
      }),
    ];
    const bdState = deriveState(events, ctx);
    const lostTower = dataset.areas.find((a) => a.id === 'lost-tower')!;
    const bdPool = filterEncounterPool(bdState, lostTower, ctx);
    expect(bdPool.map((s) => s.species)).toContain('murkrow');
    expect(bdPool.map((s) => s.species)).not.toContain('misdreavus');

    const spEvents: RunEvent[] = [
      ev('run_started', {
        gameId: 'bdsp',
        version: 'shining-pearl',
        ruleset: buildRuleset('standard', 'bdsp'),
      }),
    ];
    const spState = deriveState(spEvents, ctx);
    const spPool = filterEncounterPool(spState, lostTower, ctx);
    expect(spPool.map((s) => s.species)).toContain('misdreavus');
    expect(spPool.map((s) => s.species)).not.toContain('murkrow');

    // species common to both versions (no conditions.version) still show up in both pools
    expect(bdPool.map((s) => s.species)).toContain('gastly');
    expect(spPool.map((s) => s.species)).toContain('gastly');
  });

  it('carries time-of-day conditions on encounter slots: Old Chateau Rotom is night-only', () => {
    const oldChateau = dataset.areas.find((a) => a.id === 'old-chateau')!;
    const rotom = oldChateau.encounters.find((e) => e.species === 'rotom');
    expect(rotom).toBeDefined();
    expect(rotom?.conditions?.time).toEqual(['night']);

    // time is authored data for the app/UI layer to use; filterEncounterPool does not
    // strip on time (only on version), so the slot is still present in the raw pool.
    const events: RunEvent[] = [
      ev('run_started', {
        gameId: 'bdsp',
        version: 'brilliant-diamond',
        ruleset: buildRuleset('standard', 'bdsp'),
      }),
    ];
    const state = deriveState(events, ctx);
    const pool = filterEncounterPool(state, oldChateau, ctx);
    expect(pool.map((s) => s.species)).toContain('rotom');
  });

  it('gates areas behind gym milestones via unlockAfter', () => {
    const eternaForest = dataset.areas.find((a) => a.id === 'eterna-forest')!;
    expect(eternaForest.unlockAfter).toBe('gym-1-roark');
    const milestoneIds = new Set(dataset.milestones.map((m) => m.id));
    for (const area of dataset.areas) {
      if (area.unlockAfter) expect(milestoneIds.has(area.unlockAfter)).toBe(true);
    }
  });

  it('does not let rival battles gate the enforced level cap (BACKLOG item 12)', () => {
    // All 3 Barry milestones are flagged countsForLevelCap: false, and still render
    // with full rosters (informational), but nextBoss() must skip past Barry (Lv 9)
    // to the first real cap-gating battle: Roark (Lv 14).
    const barryMilestones = dataset.milestones.filter((m) => m.id.startsWith('rival-') && m.id.endsWith('-barry'));
    expect(barryMilestones).toHaveLength(3);
    for (const barry of barryMilestones) {
      expect(barry.countsForLevelCap).toBe(false);
      expect(barry.roster).toBeDefined();
      expect(barry.roster!.length).toBeGreaterThan(0);
    }

    const events: RunEvent[] = [
      ev('run_started', {
        gameId: 'bdsp',
        version: 'brilliant-diamond',
        ruleset: buildRuleset('hardcore', 'bdsp'),
      }),
    ];
    const state = deriveState(events, ctx);
    const boss = nextBoss(state, ctx);
    expect(boss?.id).toBe('gym-1-roark');
    expect(boss?.name).toBe('Roark (Oreburgh Gym)');
    expect(boss?.aceLevel).toBe(14);
  });
});
