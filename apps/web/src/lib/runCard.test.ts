import { describe, expect, it } from 'vitest';
import { buildRuleset, deriveState, type GameDataset, type RunEvent } from '@nuzlocke/engine';
import svJson from '@nuzlocke/datasets/games/sv.json';
import { relativeTime, statusLabel, summarizeRun, summarizeRunState } from './runCard';

const sv = svJson as unknown as GameDataset;

/** A minimal SV run: started, one caught mon, one boss cleared, one faint. */
function svEvents(): RunEvent[] {
  const ruleset = buildRuleset('hardcore', 'sv');
  const at = '2026-07-01T10:00:00.000Z';
  return [
    { seq: 1, at, type: 'run_started', payload: { gameId: 'sv', version: 'scarlet', ruleset } },
    {
      seq: 2,
      at: '2026-07-01T10:05:00.000Z',
      type: 'encounter_resolved',
      payload: { areaId: sv.areas[0].id, species: 'fuecoco', outcome: 'caught', pokemonId: 'p1', level: 7 },
    },
    {
      seq: 3,
      at: '2026-07-01T10:06:00.000Z',
      type: 'encounter_resolved',
      payload: { areaId: sv.areas[1].id, species: 'lechonk', outcome: 'caught', pokemonId: 'p2', level: 5 },
    },
    { seq: 4, at: '2026-07-01T10:20:00.000Z', type: 'faint', payload: { pokemonId: 'p2' } },
  ];
}

describe('summarizeRun', () => {
  it('surfaces the live party as sprites, ordered by descending level', () => {
    const s = summarizeRun(svEvents(), sv);
    expect(s.team.map((m) => m.species)).toEqual(['fuecoco']); // p2 fainted → not in party
    expect(s.team[0].level).toBe(7);
    expect(s.partyCount).toBe(1);
    expect(s.deathCount).toBe(1);
    expect(s.boxedCount).toBe(0);
  });

  it('reports badge progress against the level-cap gating milestones', () => {
    const s = summarizeRun(svEvents(), sv);
    expect(s.badgesTotal).toBeGreaterThan(0);
    expect(s.badgesEarned).toBe(0); // no milestone_cleared yet
    expect(s.badgesEarned).toBeLessThanOrEqual(s.badgesTotal);
  });

  it('computes a level cap from the next boss when the rule is on', () => {
    const s = summarizeRun(svEvents(), sv); // hardcore ⇒ level-cap enabled
    expect(s.levelCap).not.toBeNull();
    expect(s.nextBossName).toBeTruthy();
  });

  it('carries a lastPlayed timestamp from the newest event', () => {
    const s = summarizeRun(svEvents(), sv);
    expect(s.lastPlayedAt).toBe('2026-07-01T10:20:00.000Z');
  });

  it('caps the team at six and orders by level', () => {
    const ruleset = buildRuleset('standard', 'sv');
    const events: RunEvent[] = [
      { seq: 1, at: '2026-07-01T10:00:00.000Z', type: 'run_started', payload: { gameId: 'sv', version: 'scarlet', ruleset } },
    ];
    for (let i = 0; i < 8; i++) {
      events.push({
        seq: 2 + i,
        at: '2026-07-01T10:05:00.000Z',
        type: 'encounter_resolved',
        payload: { areaId: sv.areas[i].id, species: 'lechonk', outcome: 'caught', pokemonId: `p${i}`, level: i + 1 },
      });
    }
    const state = deriveState(events, {
      dataset: sv,
      // dupes clause off in 'standard'? still fine — same species allowed here since we only test capping/order
      speciesToLine: {},
    });
    const s = summarizeRunState(state, events, sv);
    // party caps at 6 in the engine; we additionally cap the card at 6 and sort desc
    expect(s.team.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < s.team.length; i++) {
      expect(s.team[i - 1].level).toBeGreaterThanOrEqual(s.team[i].level);
    }
  });
});

describe('statusLabel', () => {
  it('maps every status to a human label', () => {
    expect(statusLabel('active')).toBe('Active');
    expect(statusLabel('wiped-continuing')).toBe('Wiped — continuing');
    expect(statusLabel('victory')).toBe('Won');
    expect(statusLabel('abandoned')).toBe('Abandoned');
  });
});

describe('relativeTime', () => {
  const now = Date.parse('2026-07-07T12:00:00.000Z');
  it('returns null for missing/unparseable timestamps', () => {
    expect(relativeTime(null, now)).toBeNull();
    expect(relativeTime('not-a-date', now)).toBeNull();
  });
  it('formats recent times compactly', () => {
    expect(relativeTime('2026-07-07T11:59:40.000Z', now)).toBe('just now');
    expect(relativeTime('2026-07-07T11:30:00.000Z', now)).toBe('30m ago');
    expect(relativeTime('2026-07-07T09:00:00.000Z', now)).toBe('3h ago');
    expect(relativeTime('2026-07-04T12:00:00.000Z', now)).toBe('3d ago');
  });
});
