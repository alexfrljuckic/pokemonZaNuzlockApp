import { describe, expect, it } from 'vitest';
import { buildRuleset, type RunEvent } from '@nuzlocke/engine';
import { buildRunExport } from './exportRun';
import { MAX_IMPORT_EVENTS, parseRunExport } from './importRun';

const run = { id: 'orig-id', gameId: 'bdsp', version: 'brilliant-diamond', createdAt: '2026-07-01T10:00:00.000Z' };
const events: RunEvent[] = [
  {
    seq: 1,
    at: '2026-07-01T10:00:00.000Z',
    type: 'run_started',
    payload: { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') },
  },
  {
    seq: 2,
    at: '2026-07-01T10:05:00.000Z',
    type: 'encounter_resolved',
    payload: { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p1', nickname: 'Bird' },
  } as RunEvent,
];

const validText = () => JSON.stringify(buildRunExport(run, events));

describe('parseRunExport', () => {
  it('round-trips a real export (and never trusts the file run id)', () => {
    const parsed = parseRunExport(validText());
    expect(parsed.gameId).toBe('bdsp');
    expect(parsed.version).toBe('brilliant-diamond');
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0].type).toBe('run_started');
    expect('id' in parsed).toBe(false); // fresh id is minted at store time
  });

  it('renumbers seqs 1..n after sorting, killing gaps and weird numbering', () => {
    const exp = buildRunExport(run, [
      { ...events[1], seq: 900 }, // out of order + a huge gap
      { ...events[0], seq: 5 },
    ] as RunEvent[]);
    const parsed = parseRunExport(JSON.stringify(exp));
    expect(parsed.events.map((e) => e.seq)).toEqual([1, 2]);
    expect(parsed.events[0].type).toBe('run_started');
  });

  it.each([
    ['not JSON', 'nope{', /JSON/],
    ['wrong format marker', JSON.stringify({ format: 'other', formatVersion: 1 }), /format/],
    ['future version', JSON.stringify({ format: 'nuzlocke-tracker-run', formatVersion: 2 }), /version/],
    ['array root', '[]', /export file/],
  ])('rejects %s', (_name, text, msg) => {
    expect(() => parseRunExport(text)).toThrow(msg);
  });

  it('rejects a bad game id (path/injection-shaped strings never reach storage)', () => {
    const exp = buildRunExport({ ...run, gameId: '../../etc' as never }, events);
    expect(() => parseRunExport(JSON.stringify(exp))).toThrow(/game id/);
  });

  it('rejects malformed events (missing payload, bad seq, absurd type)', () => {
    const bad = (patch: object) => {
      const exp = buildRunExport(run, [events[0], { ...events[1], ...patch }] as RunEvent[]);
      return JSON.stringify(exp);
    };
    expect(() => parseRunExport(bad({ payload: 'boom' }))).toThrow(/payload/);
    expect(() => parseRunExport(bad({ seq: 'NaN' }))).toThrow(/sequence/);
    expect(() => parseRunExport(bad({ type: 'x'.repeat(65) }))).toThrow(/type/);
  });

  it('rejects logs that do not start with run_started', () => {
    const exp = buildRunExport(run, [events[1]] as RunEvent[]);
    expect(() => parseRunExport(JSON.stringify(exp))).toThrow(/run_started/);
  });

  it('caps the event count (derive-perf DoS guard)', () => {
    // tiny filler events so the count cap fires before the byte cap
    const filler = Array.from({ length: MAX_IMPORT_EVENTS }, (_, i) => ({
      seq: i + 2,
      at: 't',
      type: 'x',
      payload: {},
    }));
    const exp = buildRunExport(run, [events[0], ...filler] as unknown as RunEvent[]);
    expect(() => parseRunExport(JSON.stringify(exp))).toThrow(/implausible/);
  });
});
